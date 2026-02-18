import { Request, Response, NextFunction } from 'express';
import Activity from '../models/activity';
import EligibilityCheck from '../models/eligibilityCheck';
import FarmerProfile from '../models/farmerProfile';
import Scheme from '../models/scheme';
import ragService from '../services/ragService';


//Log activity
const logActivity = async (userId: string, type: 'check' | 'upload' | 'profile_update' | 'application' | 'login', description: string, schemeShortName?: string): Promise<void> => {

    try {
        await Activity.create({ userId, type, description, schemeShortName });
    } catch (error) {
        console.log('Failed to log activity: ', error);
    }
};

//controller 1: check single scheme: checking if the current user is eligible for one specific scheme

export const checkSingleScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { schemeId } = req.body;
        const userId = req.user!._id;

        if (!schemeId) {
            res.status(400).json({
                success: false,
                message: 'SchemeId is required in request body',
                example: { schemeId: "<Your scheme_id>" }
            });
            return;
        }

        // step 1: get farmer profile

        const profile = await FarmerProfile.findOne({ userId });

        if (!profile) {
            res.status(400).json({
                success: false,
                message: "Please Complete Your farmer profile before checking eligibility." + "Go to post /api/profile to create one",
                needsProfile: true,
            })
            return;
        }
        //Step 2 validate scheme
        const scheme = await Scheme.findById(schemeId);

        if (!scheme) {
            res.status(404).json({
                success: false,
                message: "Scheme not found. It may been deleted."
            })
            return;
        }

        if (scheme.processingStatus !== 'completed') {
            res.status(400).json({
                success: false,
                message:
                    `Scheme "${scheme.shortName}" is not ready for eligibility checks. ` +
                    `Current status: ${scheme.processingStatus}. ` +
                    (scheme.processingStatus === 'processing'
                        ? 'Please wait for processing to complete.'
                        : 'Please reprocess the PDF.'),
                processingStatus: scheme.processingStatus,
            });
            return;
        }

        // ── Step 3: Run RAG eligibility check ──
        console.log(`\n🎯 Starting eligibility check for ${profile.name}`);
        const result = await ragService.checkEligibility(profile, schemeId);

        // ── Step 4: Save result to database ──
        const savedCheck = await EligibilityCheck.create({
            userId,
            profileId: profile._id,
            schemeId,
            schemeName: result.schemeName,
            schemeShortName: result.schemeShortName,
            isEligible: result.isEligible,
            confidenceScore: result.confidenceScore,
            benefitAmount: result.benefitAmount,
            reasoning: result.reasoning,
            citations: result.citations,
            criterialMatched: result.criteriaMatched,
            exclusionsChecked: result.exclusionsChecked,
            requiredDocuments: result.requiredDocuments,
            nextSteps: result.nextSteps,
            responseTimeMs: result.responseTimeMs,
            llmModel: result.llmModel,
            checkedAt: result.checkedAt,
        });

        // ── Step 5: Log activity ──
        const statusEmoji =
            result.isEligible === 'eligible' ? '✅' :
                result.isEligible === 'likely_eligible' ? '⚠️' : '❌';

        await logActivity(
            userId.toString(),
            'check',
            `${statusEmoji} Checked ${result.schemeShortName}: ${result.isEligible} (${result.confidenceScore}% confidence)`,
            result.schemeShortName
        );

        // ── Step 6: Send response ──
        res.json({
            success: true,
            message: `Eligibility check completed for ${result.schemeShortName}`,
            result: savedCheck,
        });
    } catch (error: any) {
        // ── Handle specific error types ──
        if (error?.status === 429) {
            res.status(429).json({
                success: false,
                message: 'AI service rate limit reached. Please wait a minute and try again.',
            });
            return;
        }

        if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
            res.status(503).json({
                success: false,
                message: 'AI service is temporarily unavailable. Please try again later.',
            });
            return;
        }

        next(error);
    }

}


//Controller 2 check all schemes
export const checkAllSchemes = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!._id;

        // ── Get farmer profile ──
        const profile = await FarmerProfile.findOne({ userId });

        if (!profile) {
            res.status(400).json({
                success: false,
                message: 'Please complete your farmer profile first.',
                needsProfile: true,
            });
            return;
        }

        // ── Run checks against all schemes ──
        console.log(`\n📋 Starting bulk eligibility check for ${profile.name}`);
        const results = await ragService.checkAllSchemes(profile);

        // ── Save results to database ──
        let savedCount = 0;

        for (const result of results) {
            // Skip error results (nothing to save)
            if (result.isEligible === 'error') continue;

            try {
                await EligibilityCheck.create({
                    userId,
                    profileId: profile._id,
                    schemeId: result.schemeId,
                    schemeName: result.schemeName,
                    schemeShortName: result.schemeShortName,
                    isEligible: result.isEligible,
                    confidenceScore: result.confidenceScore,
                    benefitAmount: result.benefitAmount,
                    reasoning: result.reasoning,
                    citations: result.citations || [],
                    criterialMatched: result.criteriaMatched || [],
                    exclusionsChecked: result.exclusionsChecked || [],
                    requiredDocuments: result.requiredDocuments || [],
                    nextSteps: result.nextSteps || [],
                    responseTimeMs: result.responseTimeMs,
                    llmModel: result.llmModel,
                    checkedAt: result.checkedAt,
                });
                savedCount++;
            } catch (saveError: any) {
                console.error(
                    `Failed to save result for ${result.schemeShortName}:`,
                    saveError.message
                );
            }
        }

        // ── Summary counts ──
        const eligible = results.filter((r) => r.isEligible === 'eligible');
        const notEligible = results.filter((r) => r.isEligible === 'not_eligible');
        const likely = results.filter((r) => r.isEligible === 'likely_eligible');
        const errors = results.filter((r) => r.isEligible === 'error');

        // ── Log activity ──
        await logActivity(
            userId.toString(),
            'check',
            `Bulk checked ${results.length} schemes: ${eligible.length} ✅ eligible, ${notEligible.length} ❌ not eligible`
        );

        // ── Response ──
        res.json({
            success: true,
            message: `Checked ${results.length} schemes`,
            summary: {
                total: results.length,
                eligible: eligible.length,
                notEligible: notEligible.length,
                likelyEligible: likely.length,
                errors: errors.length,
                savedToHistory: savedCount,
            },
            results,
        });

    } catch (error: any) {
        if (error?.status === 429) {
            res.status(429).json({
                success: false,
                message: 'AI rate limit reached. Try checking one scheme at a time.',
            });
            return;
        }
        next(error);
    }
};

// controller 3 get check by id
export const getCheckById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { checkId } = req.params;

        // ── Find check AND verify ownership ──
        const check = await EligibilityCheck.findOne({
            _id: checkId,
            userId: req.user!._id,   // Only allow viewing own checks
        });

        if (!check) {
            res.status(404).json({
                success: false,
                message: 'Eligibility check not found or you do not have access to it.',
            });
            return;
        }

        res.json({
            success: true,
            result: check,
        });

    } catch (error) {
        next(error);
    }
};

// Controller 4 Get eligibility history
//Returns all past eligibility checks for user
//Used by dashboard timeline and history page.

//Returns: array of checks, newest first
//Each check includes the full result

export const getHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!._id;

        // ── Build query filter ──
        const filter: any = { userId };

        // Optional: filter by scheme
        const schemeFilter = req.query.scheme as string;
        if (schemeFilter) {
            filter.schemeShortName = schemeFilter.toUpperCase();
        }

        // Optional: filter by eligibility status
        const statusFilter = req.query.status as string;
        if (statusFilter && ['eligible', 'not_eligible', 'likely_eligible'].includes(statusFilter)) {
            filter.isEligible = statusFilter;
        }

        // ── Determine limit ──
        const limit = Math.min(
            parseInt(req.query.limit as string) || 50,
            100   // Max 100 results per request
        );

        // ── Fetch checks ──
        const checks = await EligibilityCheck.find(filter)
            .sort({ checkedAt: -1 })          // Newest first
            .limit(limit)
            .lean();                           // Plain objects for speed

        // ── Calculate summary stats ──
        const allChecks = await EligibilityCheck.find({ userId }).lean();

        // Get unique latest check per scheme
        const latestByScheme = new Map<string, any>();
        for (const check of allChecks) {
            const key = check.schemeId.toString();
            if (!latestByScheme.has(key)) {
                latestByScheme.set(key, check);
            }
        }

        const latestChecks = Array.from(latestByScheme.values());

        const summary = {
            totalChecks: allChecks.length,
            uniqueSchemes: latestByScheme.size,
            eligible: latestChecks.filter((c) => c.isEligible === 'eligible').length,
            notEligible: latestChecks.filter((c) => c.isEligible === 'not_eligible').length,
            likelyEligible: latestChecks.filter((c) => c.isEligible === 'likely_eligible').length,
            averageConfidence:
                latestChecks.length > 0
                    ? Math.round(
                        latestChecks.reduce((sum, c) => sum + (c.confidenceScore || 0), 0) /
                        latestChecks.length
                    )
                    : 0,
            averageResponseTime:
                latestChecks.length > 0
                    ? Math.round(
                        latestChecks.reduce((sum, c) => sum + (c.responseTimeMs || 0), 0) /
                        latestChecks.length
                    )
                    : 0,
        };

        // ── Response ──
        res.json({
            success: true,
            summary,
            total: checks.length,
            checks,
        });

    } catch (error) {
        next(error);
    }
};


