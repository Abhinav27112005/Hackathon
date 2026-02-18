import mongoose, { Document, Schema } from "mongoose";

export interface IScheme extends Document {
    _id: mongoose.Types.ObjectId;

    //Basic Info
    name: string,// Pradhan Mantri Kisan Nidhi Yojana
    shortName: string,// PM-Kisan
    ministry?: string,
    description?: string,
    benefitAmount?: string,

    //PDF storage
    pdf: {
        cloudinaryUrl: string,
        cloudinaryPublicId: string,
        originalFileName: string,
        fileSize?: number,
        totalPages?: number
    };

    //Processing State
    processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
    processingError?: string;

    //Extracted Data
    extractedText?: string;
    totalChunks?: number;

    //Eligibility Summary
    eligibilitySummary?: {
        inclusions: string[];
        exclusions: string[];
    };
    //Meta
    uploadedBy: mongoose.Types.ObjectId;
    uploadType: 'admin' | 'farmer';
    isActive: boolean;

    //Timestamp
    createdAt: Date;
    updatedAt: Date;
}

const schemeSchema = new Schema<IScheme>({
    //Basic information entered by user while uploading pdf;

    name: {
        type: String,
        required: [true, "Scheme name is required"],
        trim: true,
        maxlength: [300, 'Scheme name too long'],
    },
    shortName: {
        type: String,
        required: [true, 'Short Name is required'],
        trim: true,
        maxlength: [50, 'Short name too long'],
    },
    ministry: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description too long']
    },
    benefitAmount: {
        type: String,
        trim: true,
    },
    pdf: {
        cloudinaryUrl: {
            type: String,
            required: [true, "Cloudinary URL is required"],
        },
        cloudinaryPublicId: {
            type: String,
            required: [true, "Cloudinary Public ID is required"],
        },
        originalFileName: {
            type: String,
        },
        fileSize: {
            type: Number,
        },
        totalPages: {
            type: Number,
        }
    },
    processingStatus: {
        type: String,
        enum: {
            values: ['uploaded', 'processing', 'completed', 'failed'],
            message: '{VALUE} is not a valid processing status',
        },
        default: 'uploaded',
    },
    processingError: {
        type: String,
    },
    extractedText: {
        type: String,
        select: false,
    },
    totalChunks: {
        type: Number,
        default: 0,
    },
    eligibilitySummary: {
        inclusions: {
            type: [String],
            default: [],
        },
        exclusions: {
            type: [String],
            default: []
        },
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Uploader info is required"]
    },
    uploadType: {
        type: String,
        enum: ['admin', 'farmer'],
        default: 'admin',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

schemeSchema.index({ processingStatus: 1, isActive: 1 });
schemeSchema.index({ uploadedBy: 1 });
schemeSchema.index({ shortName: 1 });

const Scheme = mongoose.model<IScheme>("Scheme", schemeSchema);

export default Scheme;