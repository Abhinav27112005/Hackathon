import cloudinary from '../config/cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

//client sends pdf -> Multer catches it -> cloudinary storage sends it to cloudinary -> cloudinary returns url -> url available in req.file.path


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: Express.Multer.File) => {
        //Generating a unique file name
        const timestamp = Date.now();
        const cleanName = file.originalname.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

        return {
            folder: 'NitiSetu/scheme-pdfs',
            resource_type: 'raw',
            allowed_formats: ['pdf'],
            public_id: `${cleanName}-${timestamp}`,
        };
    }
})

//File filter: only accept PDFs and reject all other file types

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    if (file.mimetype === 'application/pdf') {
        //If it's pdf accept it
        cb(null, true);
    } else {
        //Not a pdf reject with clear error
        cb(new Error(`Only PDF files are allowed! You uploaded: ${file.mimetype}`));
    }
};

//Creating the multer instance

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, //10MB limit
    }
})

export default upload;

//Also exporting cloudinary for deletion operation
export { cloudinary };
