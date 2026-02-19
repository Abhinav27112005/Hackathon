import express, { Request, Response, NextFunction } from 'express';
import Activity from '../models/activity';
import Application from '../models/application';
import EligibilityCheck from '../models/eligibilityCheck';
import FarmerProfile from '../models/farmerProfile';
import Scheme from '../models/scheme';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
        const userId = req.user!._id;
        const [profile, schemes, eligibilityChecks, application, activities] = await Promise.all([
            //Query 1: Farmer Profile
            FarmerProfile.findOne({ userId }).lean(),

            //Query 2: all active schemes
            Scheme.find({ isActive: true }).select('-extractedText').sort({ createdAt: -1 }).lean(),

            //Query 2: All eligibility checks for this user
            EligibilityCheck.find({ userId }).sort({ checkedAt: -1 }).lean(),

            Application.find({ userId }).sort({ updatedAt: -1 }).lean(),

            Activity.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),

        ]);
        //Process Eligibility data
        const latestChecksByScheme = new Map<string, any>();

        for (const check of eligibilityChecks) {
            const key = check.schemeId.toString();
            // Map.has() returns false for first encounter of each scheme
            // So we only store the first (newest) check for each scheme
            if (!latestChecksByScheme.has(key)) {
                latestChecksByScheme.set(key, check);
            }
        }

        const latestChecks = Array.from(latestChecksByScheme.values());

        // ── Separate eligible and not eligible ──
        const eligibleSchemes = latestChecks.filter(
            (c) => c.isEligible === 'eligible' || c.isEligible === 'likely_eligible'
        );

        const notEligibleSchemes = latestChecks.filter(
            (c) => c.isEligible === 'not_eligible'
        );

        // ══════════════════════════════════
        // CALCULATE METRICS
        // ══════════════════════════════════

        // ── Potential benefit calculation ──
        // Sum up all benefit amounts from eligible schemes
        // Parse strings like "₹6,000/year" → 6000
        let potentialBenefit = 0;
        for (const check of eligibleSchemes) {
            if (check.benefitAmount) {
                // Extract numbers from string
                // "₹6,000/year" → "6000" → 6000
                // "50% subsidy up to ₹1,00,000" → "100000" → 100000
                const numbers = check.benefitAmount.replace(/[^\d]/g, '');
                const amount = parseInt(numbers) || 0;
                potentialBenefit += amount;
            }
        }

        // ── Average response time ──
        const avgResponseTime =
            latestChecks.length > 0
                ? Math.round(
                    latestChecks.reduce((sum, c) => sum + (c.responseTimeMs || 0), 0) /
                    latestChecks.length /
                    1000  // Convert ms to seconds
                    * 10) / 10  // Round to 1 decimal
                : 0;

        // ── Build metrics object ──
        const metrics = {
            totalSchemes: schemes.length,
            eligibleCount: eligibleSchemes.length,
            notEligibleCount: notEligibleSchemes.length,
            potentialBenefit: `₹${potentialBenefit.toLocaleString('en-IN')}`,
            // toLocaleString('en-IN') formats: 142000 → "1,42,000" (Indian format)
            avgResponseTime: avgResponseTime,
            totalChecks: eligibilityChecks.length,
            pdfsUploaded: schemes.length,
        };

        // ══════════════════════════════════
        // BUILD FINAL RESPONSE
        // ══════════════════════════════════
        const dashboardData = {
            // Farmer's profile
            profile: profile || null,
            hasProfile: !!profile,

            // Stats and counts
            metrics,

            // Scheme results (for cards)
            eligibleSchemes,
            notEligibleSchemes,

            // All schemes (for PDF list)
            schemesOverview: schemes.map((s) => ({
                _id: s._id,
                name: s.name,
                shortName: s.shortName,
                processingStatus: s.processingStatus,
                totalPages: s.pdf?.totalPages,
                totalChunks: s.totalChunks,
                originalFileName: s.pdf?.originalFileName,
            })),

            // Applications
            applications: application.map((a) => ({
                _id: a._id,
                schemeName: a.schemeName,
                schemeShortName: a.schemeShortName,
                status: a.status,
                appliedOn: a.submittedAt || a.createdAt,
                updatedAt: a.updatedAt,
            })),

            // Recent activity timeline
            recentActivity: activities.map((a) => ({
                _id: a._id,
                type: a.type,
                description: a.description,
                schemeShortName: a.schemeShortName,
                timestamp: a.createdAt,
            })),
        };

        res.json({
            success: true,
            data: dashboardData,
        });

    } catch (error: any) {
        next(error);
    }
}

//Controller 2 get metrics only
export const getMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!._id;

        // Parallel count queries (very fast)
        const [totalChecks, eligibleCount, schemesCount, applicationsCount] =
            await Promise.all([
                EligibilityCheck.countDocuments({ userId }),
                EligibilityCheck.countDocuments({ userId, isEligible: 'eligible' }),
                Scheme.countDocuments({ isActive: true }),
                Application.countDocuments({ userId }),
            ]);

        res.json({
            success: true,
            metrics: {
                totalChecks,
                eligibleCount,
                notEligibleCount: totalChecks - eligibleCount,
                totalSchemes: schemesCount,
                totalApplications: applicationsCount,
            },
        });

    } catch (error) {
        next(error);
    }
};


// controller 3 get recent activity
export const getRecentActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!._id;
        const limit = Math.min(
            parseInt(req.query.limit as string) || 20,
            50
        );

        const activities = await Activity.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // ── Format for frontend ──
        const formatted = activities.map((a) => ({
            _id: a._id,
            type: a.type,
            description: a.description,
            schemeShortName: a.schemeShortName,
            timestamp: a.createdAt,
            // Add icon based on type (frontend can also do this)
            icon:
                a.type === 'check' ? '🔍' :
                    a.type === 'upload' ? '📤' :
                        a.type === 'profile_update' ? '👤' :
                            a.type === 'application' ? '📋' :
                                a.type === 'login' ? '🔑' : '📌',
        }));

        res.json({
            success: true,
            total: formatted.length,
            activities: formatted,
        });

    } catch (error) {
        next(error);
    }
};



