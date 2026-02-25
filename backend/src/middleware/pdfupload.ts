// pdfupload.ts
// Uses multer memoryStorage + manual cloudinary upload stream.
// This approach works reliably on Render (ephemeral filesystem, multer v2 compatibility).
// multer-storage-cloudinary v4 is NOT compatible with multer v2, so we avoid it entirely.

import multer from 'multer';
import { Request } from 'express';
import { Readable } from 'stream';

// ── Use the ALREADY CONFIGURED cloudinary singleton from config ──
// IMPORTANT: Never import { v2 as cloudinary } directly here — it would be an
// unconfigured instance. The config/cloudinary.ts module calls cloudinary.config()
// with env vars on import, so we must reuse that same instance.
import cloudinaryInstance from '../config/cloudinary';

// Re-export so schemeController can use it for deletes (replaces old ../config/cloudinary import)
export { cloudinaryInstance as cloudinary };

// ── Multer: store file in memory (never touches disk) ──
const storage = multer.memoryStorage();

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
): void => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error(`Only PDF files are allowed! Received: ${file.mimetype}`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

export default upload;

// ── Helper: upload a buffer to Cloudinary via upload_stream ──
// Called by the controller AFTER multer has stored the file in req.file.buffer
export const uploadBufferToCloudinary = (
    buffer: Buffer,
    originalName: string
): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const cleanName = originalName
            .replace(/\.pdf$/i, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();

        const uploadStream = cloudinaryInstance.uploader.upload_stream(
            {
                folder: 'NitiSetu/scheme-pdfs',
                resource_type: 'raw',
                public_id: `${cleanName}-${timestamp}`,
                format: 'pdf',
                access_mode: 'public',   // ← ensure public download (fixes 401 during processing)
                type: 'upload',          // ← explicit upload type (not authenticated)
            },
            (error, result) => {
                if (error) {
                    // Cloudinary errors have http_code, message fields — log the full object
                    console.error('❌ Cloudinary upload_stream error:', JSON.stringify(error));
                    reject(new Error(
                        error.message
                        ?? (error as any).http_code?.toString()
                        ?? JSON.stringify(error)
                    ));
                } else if (!result) {
                    reject(new Error('Cloudinary upload returned no result'));
                } else {
                    console.log(`✅ Cloudinary upload success → ${result.secure_url}`);
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );

        // Pipe the in-memory buffer into the upload stream
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};
