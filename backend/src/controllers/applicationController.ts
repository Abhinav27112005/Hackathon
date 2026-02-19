import { Request, Response, NextFunction } from 'express';

import Application from '../models/application';
import Scheme from '../models/scheme';
import Activity from '../models/activity';
import FarmerProfile from '../models/farmerProfile';
import EligibilityCheck from '../models/eligibilityCheck';


const logActivity = async (userId: string, type: 'check' | 'upload' | 'profile_update' | 'application' | 'login', description: string, schemeShortName?: string): Promise<void> => {
    try {
        await Activity.create({ userId, type, description, schemeShortName });
    } catch (error) {
        console.error("Failed to log activity", error);
    }
}

// controller 1 Create Application

export const createApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { schemeId, eligibilityCheckId } = req.body;
        const userId = req.user!._id;

        if (!schemeId) {
            res.status(400).json({
                success: false,
                message: 'schemeId is required',
            });
            return;
        }

        const scheme = await Scheme.findById(schemeId);
        if (!scheme) {
            res.status(404).json({
                success: false,
                message: 'Scheme not found',
            });
            return;
        }

        const existingApp = await Application.findOne({
            userId,
            schemeId,
            status: { $in: ['draft', 'submitted', 'pending'] },
        });

        if (existingApp) {
            res.status(400).json({
                success: false,
                message: `You already have a ${existingApp.status} application for ${scheme.shortName}`,
                existingApplication: existingApp,
            });
            return;
        }

        const profile = await FarmerProfile.findOne({ userId });

        const formData: Record<string, any> = {};

        if (profile) {
            formData.name = profile.name;
            formData.age = profile.age;
            formData.gender = profile.gender;
            formData.socialCategory = profile.socialCategory;
            formData.aadhaarLast4 = profile.aadhaarLast4;
            formData.state = profile.state;
            formData.district = profile.district;
            formData.block = profile.block;
            formData.village = profile.village;
            formData.landHolding = profile.landHolding;
            formData.landHoldingHectares = profile.landHoldingHectares;
            formData.landType = profile.landType;
            formData.cropTypes = profile.cropTypes;
            formData.annualIncome = profile.annualIncome;
            formData.hasBankAccount = profile.hasBankAccount;
            formData.hasKCC = profile.hasKCC;

            // Fields that farmer needs to fill
            formData.fatherName = '';
            formData.fullAadhaarNumber = '';
            formData.bankAccountNumber = '';
            formData.ifscCode = '';
            formData.bankName = '';
            formData.mobileNumber = '';
        }

        const totalFields = Object.keys(formData).length;
        const filledFields = Object.values(formData).filter(
            (v) => v !== '' && v !== null && v !== undefined
        ).length;

        formData._meta = {
            totalFields,
            filledFields,
            completionPercentage: Math.round((filledFields / totalFields) * 100),
        };

        // ── Create application ──
        const application = await Application.create({
            userId,
            schemeId,
            eligibilityCheckId: eligibilityCheckId || undefined,
            schemeName: scheme.name,
            schemeShortName: scheme.shortName,
            status: 'draft',
            formData,
        });

        // ── Log activity ──
        await logActivity(
            userId.toString(),
            'application',
            `Started application for ${scheme.shortName}`,
            scheme.shortName
        );

        // ── Response ──
        res.status(201).json({
            success: true,
            message: `Application started for ${scheme.shortName}`,
            application,
            autoFillSummary: {
                totalFields,
                autoFilled: filledFields,
                remaining: totalFields - filledFields,
                completionPercentage: formData._meta.completionPercentage,
            },
        });

    } catch (error) {
        next(error);
    }
}


export const getMyApplications = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!._id;

        // ── Build filter ──
        const filter: any = { userId };

        const statusParam = req.query.status as string;
        if (statusParam && ['draft', 'submitted', 'pending', 'approved', 'rejected'].includes(statusParam)) {
            filter.status = statusParam;
        }

        const limit = Math.min(
            parseInt(req.query.limit as string) || 50,
            100
        );

        // ── Fetch applications ──
        const applications = await Application.find(filter)
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();

        // ── Summary ──
        const allApps = await Application.find({ userId }).lean();
        const summary = {
            total: allApps.length,
            draft: allApps.filter((a) => a.status === 'draft').length,
            submitted: allApps.filter((a) => a.status === 'submitted').length,
            pending: allApps.filter((a) => a.status === 'pending').length,
            approved: allApps.filter((a) => a.status === 'approved').length,
            rejected: allApps.filter((a) => a.status === 'rejected').length,
        };

        res.json({
            success: true,
            summary,
            total: applications.length,
            applications,
        });

    } catch (error) {
        next(error);
    }
};

//Controller 3: Update Application
export const updateApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // ── Find application ──
        const application = await Application.findOne({
            _id: id,
            userId,
        });

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found or you do not have access.',
            });
            return;
        }

        // ── Check if editable ──
        if (application.status !== 'draft') {
            res.status(400).json({
                success: false,
                message: `Cannot edit application with status "${application.status}". Only draft applications can be edited.`,
                currentStatus: application.status,
            });
            return;
        }

        // ── Update form data ──
        // Merge new form data with existing (don't overwrite everything)
        if (req.body.formData) {
            application.formData = {
                ...application.formData,
                ...req.body.formData,
            };
        }

        // ── Update status ──
        if (req.body.status) {
            const newStatus = req.body.status;

            // Validate status transition
            // draft → submitted (only valid transition for farmers)
            if (newStatus === 'submitted') {
                application.status = 'submitted';
                application.submittedAt = new Date();
            } else if (newStatus !== 'draft') {
                res.status(400).json({
                    success: false,
                    message: 'You can only change status from "draft" to "submitted"',
                });
                return;
            }
        }

        // ── Update notes ──
        if (req.body.notes !== undefined) {
            application.notes = req.body.notes;
        }

        // ── Save ──
        await application.save();

        // ── Log activity if submitted ──
        if (application.status === 'submitted') {
            await logActivity(
                userId.toString(),
                'application',
                `Submitted application for ${application.schemeShortName}`,
                application.schemeShortName
            );
        }

        res.json({
            success: true,
            message: application.status === 'submitted'
                ? `Application for ${application.schemeShortName} submitted successfully!`
                : 'Application updated',
            application,
        });

    } catch (error) {
        next(error);
    }
};


// controller 4: Get auto filled form

export const getAutoFilledForm = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // ── Find application ──
        const application = await Application.findOne({
            _id: id,
            userId,
        });

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found',
            });
            return;
        }

        // ── Get linked eligibility check for required documents ──
        let requiredDocuments: string[] = [];
        let nextSteps: string[] = [];
        let eligibilityProof: any = null;

        if (application.eligibilityCheckId) {
            const eligCheck = await EligibilityCheck.findById(
                application.eligibilityCheckId
            );

            if (eligCheck) {
                requiredDocuments = eligCheck.requiredDocuments || [];
                nextSteps = eligCheck.nextSteps || [];
                eligibilityProof = {
                    isEligible: eligCheck.isEligible,
                    confidenceScore: eligCheck.confidenceScore,
                    checkedAt: eligCheck.checkedAt,
                };
            }
        }

        // ── Analyze form completion ──
        const formData = application.formData || {};
        const fields = Object.entries(formData)
            .filter(([key]) => !key.startsWith('_'))   // Skip meta fields
            .map(([key, value]) => ({
                field: key,
                value: value,
                isFilled: value !== '' && value !== null && value !== undefined,
                isAutoFilled: value !== '' && value !== null && value !== undefined,
            }));

        const filledCount = fields.filter((f) => f.isFilled).length;
        const totalCount = fields.length;

        // ── Build document checklist ──
        const documentChecklist = requiredDocuments.map((doc) => {
            const uploaded = application.documents?.find(
                (d) => d.name.toLowerCase() === doc.toLowerCase()
            );

            return {
                document: doc,
                isUploaded: !!uploaded,
                uploadedAt: uploaded?.uploadedAt || null,
                url: uploaded?.url || null,
            };
        });

        // ── Response ──
        res.json({
            success: true,
            application: {
                _id: application._id,
                schemeName: application.schemeName,
                schemeShortName: application.schemeShortName,
                status: application.status,
            },
            formData: application.formData,
            formAnalysis: {
                totalFields: totalCount,
                filledFields: filledCount,
                emptyFields: totalCount - filledCount,
                completionPercentage: totalCount > 0
                    ? Math.round((filledCount / totalCount) * 100)
                    : 0,
                fields,
            },
            documentChecklist,
            requiredDocuments,
            nextSteps,
            eligibilityProof,
        });

    } catch (error) {
        next(error);
    }
};



