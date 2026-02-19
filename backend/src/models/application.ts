import mongoose, { Document, Schema } from 'mongoose';

//Application model: tracking farmer's application for government scheme

export interface IApplication extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    schemeId: mongoose.Types.ObjectId;
    eligibilityCheckId?: mongoose.Types.ObjectId;

    //Denormalized for quick display
    schemeName: string;
    schemeShortName: string;

    //Application status
    // Application State
    status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

    // Form Data (auto-filled from profile + user additions)
    formData: Record<string, any>;

    // Uploaded Documents
    documents: Array<{
        name: string;
        url: string;
        uploadedAt: Date;
    }>;

    // Tracking
    submittedAt?: Date;
    reviewedAt?: Date;
    rejectionReason?: string;
    notes?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },

    // ── WHICH scheme ──
    schemeId: {
        type: Schema.Types.ObjectId,
        ref: 'Scheme',
        required: [true, 'Scheme ID is required'],
    },

    // ── LINKED eligibility check (proof they're eligible) ──
    // Optional because farmer might apply without checking first
    eligibilityCheckId: {
        type: Schema.Types.ObjectId,
        ref: 'EligibilityCheck',
    },

    // ── Denormalized scheme names ──
    // Same reason as EligibilityCheck - avoids extra queries
    schemeName: {
        type: String,
        required: [true, 'Scheme name is required'],
    },
    schemeShortName: {
        type: String,
        required: [true, 'Scheme short name is required'],
    },
    status: {
        type: String,
        enum: {
            values: ['draft', 'submitted', 'pending', 'approved', 'rejected'],
            message: '{VALUE} is not a valid application status',
        },
        default: 'draft',
    },
    formData: {
        type: Schema.Types.Mixed,
        default: {},
    },

    documents: [
        {
            name: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],

    submittedAt: { type: Date },
    reviewedAt: { type: Date },

    rejectionReason: { type: String },
    notes: { type: String },
}, { timestamps: true });

applicationSchema.index({ userId: 1, createdAt: -1 });
applicationSchema.index({ userId: 1, schemeId: 1 });
applicationSchema.index({ status: 1 });

const Application = mongoose.model<IApplication>('Application', applicationSchema);

export default Application;

