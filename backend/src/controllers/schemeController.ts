import Activity from "../models/activity"
import { NextFunction, Request, Response } from "express"
import Scheme from "../models/scheme";
import pdfProcessingService from "../services/pdfProcessingService";
import SchemeChunk from "../models/schemeChunk";
import { cloudinary, uploadBufferToCloudinary } from "../middleware/pdfupload";

// ── Startup check: warn immediately if Cloudinary is misconfigured ──
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ FATAL: Missing Cloudinary environment variables. PDF uploads will fail!');
    console.error('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

// Helper: log activity same as profile controller
const logActivity = async (userId: string, type: 'check' | 'upload' | 'profile_update' | 'application' | 'login', description: string, schemeShortName?: string): Promise<void> => {
    try {
        await Activity.create({
            userId, type, description, schemeShortName
        });
    } catch (error) {
        console.log("Failed to log activity", error);
    }
}

//Controller 1: UPLOAD SCHEME PDF
export const uploadScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Validate: file must be present in memory (multer memoryStorage)
        if (!req.file || !req.file.buffer) {
            res.status(400).json({
                success: false,
                message: "PDF file is required. Please attach a PDF file.",
            });
            return;
        }

        const { name, shortName, ministry, description, benefitAmount } = req.body;

        if (!name || !shortName) {
            res.status(400).json({
                success: false,
                message: "Scheme name and short name are required.",
            });
            return;
        }

        // ── Upload buffer directly to Cloudinary (no disk write) ──
        console.log(`☁️  Uploading PDF to Cloudinary: ${req.file.originalname}`);
        const { url: cloudinaryUrl, publicId: cloudinaryPublicId } = await uploadBufferToCloudinary(
            req.file.buffer,
            req.file.originalname
        );
        console.log(`✅ Cloudinary upload complete: ${cloudinaryPublicId}`);

        // ── Create Scheme document ──
        const scheme = await Scheme.create({
            name,
            shortName: shortName.toUpperCase(),
            ministry,
            description,
            benefitAmount,
            pdf: {
                cloudinaryUrl,
                cloudinaryPublicId,
                originalFileName: req.file.originalname,
                fileSize: req.file.size,
            },
            uploadedBy: req.user!._id,
            uploadType: req.user!.role === 'admin' ? 'admin' : 'farmer',
            processingStatus: 'uploaded',
        });

        // ── Start background PDF processing (fetch PDF from Cloudinary URL → chunk → embed) ──
        pdfProcessingService.processScheme(scheme._id.toString()).then(() => {
            console.log("✅ Background Processing Completed:", scheme.shortName);
        }).catch((error: any) => {
            console.error(`❌ Background processing failed: ${error.message}`);
        });

        // ── Log activity ──
        await logActivity(req.user!._id.toString(), 'upload', `Uploaded scheme PDF: ${shortName.toUpperCase()}`, shortName.toUpperCase());

        // ── Respond immediately (processing happens in background) ──
        res.status(201).json({
            success: true,
            message: "PDF uploaded successfully! Processing has started in the background.",
            scheme: {
                _id: scheme._id,
                name: scheme.name,
                shortName: scheme.shortName,
                processingStatus: scheme.processingStatus,
                pdfUrl: scheme.pdf.cloudinaryUrl,
                originalFileName: scheme.pdf.originalFileName,
            },
            note: "Use GET /api/schemes/:id/status to check processing progress",
        });
    } catch (error: any) {
        // Log full error so "undefined message" never hides the real cause
        console.error('❌ Upload error:', error?.message ?? error);
        console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        next(error);
    }
};

//Controller 2 get all schemes
//Returns list of all the active schemes
//Used by dashboard to show available schmes

export const getAllSchemes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const filter: any = { isActive: true };

        const statusParam = req.query.status as string;

        if (statusParam && statusParam !== 'all') {
            filter.processingStatus = statusParam;
        }

        const schemes = await Scheme.find(filter).select('-extractedText').sort({ createdAt: -1 }).lean();

        const statusCounts = {
            total: schemes.length,
            completed: schemes.filter((s) => s.processingStatus === 'completed').length,
            processing: schemes.filter((s) => s.processingStatus === 'processing').length,
            failed: schemes.filter((s) => s.processingStatus === 'failed').length,
            uploaded: schemes.filter((s) => s.processingStatus === 'uploaded').length,
        };

        res.json({
            success: true,
            ...statusCounts,
            schemes,
        });

    }
    catch (error) {
        next(error);
    }
};

//Controller 3 Get scheme by id
//Returns full details of the single scheme

export const getSchemeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const scheme = await Scheme.findById(req.params.id).select('-extractedText');

        if (!scheme) {
            res.status(404).json({
                success: false,
                message: 'Scheme not found',
            });
            return;
        }

        const chunkCount = await SchemeChunk.countDocuments({
            schemeId: scheme._id,
        });

        res.json({
            success: true,
            scheme,
            chunkCount,
        });
    } catch (error) {
        next(error);
    }
};

//Controller 4 : get processing status
//Return just the processing status
//Froented polls this every 3 second during processing

export const getSchemeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        //ONly select the fields we need
        const scheme = await Scheme.findById(req.params.id).select("name shortName processingStatus totalChunks processingError pdf.totalPages");

        if (!scheme) {
            res.status(404).json({
                success: false,
                message: "Scheme not found",
            });
            return;
        }
        res.json({
            success: true,
            _id: scheme._id,
            name: scheme.name,
            shortName: scheme.shortName,
            status: scheme.processingStatus,
            totalPages: scheme.pdf?.totalPages || null,
            totalChunks: scheme.totalChunks || 0,
            error: scheme.processingError || null,
            isReady: scheme.processingStatus === 'completed',
        });
    }
    catch (error) {
        next(error);
    }
};

// Controller 5 Reprocess Scheme
//Retries processing for failed schemes

export const reprocessScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        const scheme = await Scheme.findById(req.params.id);
        if (!scheme) {
            res.status(404).json({
                success: false,
                message: "Scheme not found",
            });
            return;
        }

        //Only allow reprocessing if not currently processing
        if (scheme.processingStatus === "processing") {
            res.status(400).json({
                success: false,
                message: "Scheme is already processed Please wait",
            });
            return;
        }

        scheme.processingStatus = 'uploaded';
        scheme.processingError = undefined;
        scheme.totalChunks = 0;
        await scheme.save();

        //Start processing in background
        pdfProcessingService.processScheme(scheme._id.toString()).then(() => console.log(`✅ Reprocessing complete: ${scheme.shortName}`)).catch((error: any) => console.error(`❌ Reprocessing failed: ${error.message}`));

        //Log activity
        await logActivity(req.user!._id.toString(), 'upload', `Reprocessing scheme: ${scheme.shortName}`, scheme.shortName);

        res.json({
            success: true,
            message: `Reprocessing started for ${scheme.shortName}`,
            scheme: {
                _id: scheme._id,
                shortName: scheme.shortName,
                processingStatus: 'uploaded',
            },
        });

    }
    catch (error) {
        next(error);
    }
};

//Controller 6 Delete Scheme
//Completely removes the scheme and all its data

export const deleteScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const scheme = await Scheme.findById(req.params.id);

        if (!scheme) {
            res.status(404).json({
                success: false,
                message: "Scheme not found"
            });
            return;
        }

        //Deleteing pdf form cloudinary
        if (scheme.pdf.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(
                    scheme.pdf.cloudinaryPublicId,
                    { resource_type: 'raw' }
                );
                console.log(`☁️  Deleted from Cloudinary: ${scheme.pdf.cloudinaryPublicId}`);
            }
            catch (cloudError: any) {
                console.warn(`⚠️  Cloudinary deletion warning: ${cloudError.message}`);
            }

        }
        //Delete all chunks

        const chunksDeleted = await SchemeChunk.deleteMany({
            schemeId: scheme._id,
        });
        console.log(`🗑️  Deleted ${chunksDeleted.deletedCount} chunks`);

        //Delete Scheme Document
        await Scheme.findByIdAndDelete(req.params.id);
        console.log(`🗑️  Deleted scheme: ${scheme.shortName}`);

        //Log activity
        await logActivity(req.user!._id.toString(), 'upload', `Deleted scheme: ${scheme.shortName}`, scheme.shortName);

        res.json({
            success: true,
            message: `Scheme ${scheme.shortName} deleted Successfully`,
            deleted: {
                scheme: scheme.shortName,
                chunks: chunksDeleted.deletedCount,
                cloudinaryFile: scheme.pdf.cloudinaryPublicId,
            },
        });
    }
    catch (error) {
        next(error);
    }
}

