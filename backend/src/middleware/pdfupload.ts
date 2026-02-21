// pdfupload.ts
// Uses multer memoryStorage + manual cloudinary upload stream.
// This approach works reliably on Render (ephemeral filesystem, multer v2 compatibility).
// multer-storage-cloudinary v4 is NOT compatible with multer v2, so we avoid it entirely.

import multer from 'multer';
import { Request } from 'express';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { Readable } from 'stream';

// Re-export configured cloudinary instance for use in other files (e.g. deleteScheme)
export { cloudinaryV2 as cloudinary };

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
            .replace('.pdf', '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();

        const uploadStream = cloudinaryV2.uploader.upload_stream(
            {
                folder: 'NitiSetu/scheme-pdfs',
                resource_type: 'raw',
                public_id: `${cleanName}-${timestamp}`,
                format: 'pdf',
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error('Cloudinary upload returned no result'));
                } else {
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
