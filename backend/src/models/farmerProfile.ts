
import mongoose, { Document, Schema } from 'mongoose';

export interface IFarmerProfile extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    // Personal
    name: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other';
    socialCategory: 'General' | 'OBC' | 'SC' | 'ST' | 'Minority';
    aadhaarLast4?: string;
    // Location
    state: string;
    district: string;
    block?: string;
    village?: string;
    // Farm Details
    landHolding: number;
    landHoldingHectares: number;
    landType?: 'Irrigated' | 'Rainfed' | 'Both';
    cropTypes: string[];
    // Financial
    annualIncome?: 'Below 2L' | '2L-5L' | '5L-10L' | 'Above 10L';
    hasBankAccount: boolean;
    hasKCC: boolean;
    // Meta
    profileCompleteness: number;
    createdVia: 'voice' | 'form';

    //Time stamps
    createdAt: Date;
    updatedAt: Date;
}

// ──────────────────────────────────────
// SCHEMA
// ──────────────────────────────────────
const farmerProfileSchema = new Schema<IFarmerProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "User Id is required"],
            unique: true,
            index: true,
        },

        // ── Personal Details ──
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        age: {
            type: Number,
            min: [18, 'Age must be at least 18'],
            max: [120, 'Age cannot exceed 120'],
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
        },
        socialCategory: {
            type: String,
            enum: {
                values: ['General', 'OBC', 'SC', 'ST', 'Minority'],
                message: '{VALUE} is not a valid social category. Choose from: General OBC SC ST MINORITY',
            },
            required: [true, 'Social category is required for scheme matching'],
        },
        aadhaarLast4: {
            type: String,
            match: [/^\d{4}$/, 'Must be exactly 4 digits'],
        },

        // ── Location ──
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true,
        },
        district: {
            type: String,
            required: [true, 'District is required'],
            trim: true,
        },
        block: {
            type: String,
            trim: true,
        },
        village: {
            type: String,
            trim: true,
        },

        // ── Farm Details ──
        landHolding: {
            type: Number,
            required: [true, 'Land holding is required'],
            min: [0, 'Land holding cannot be negative'],
        },
        landHoldingHectares: {
            type: Number,
            min: 0,
        },
        landType: {
            type: String,
            enum: ['Irrigated', 'Rainfed', 'Both'],
        },
        cropTypes: {
            type: [String],
            default: [],
        },

        // ── Financial ──
        annualIncome: {
            type: String,
            enum: ['Below 2L', '2L-5L', '5L-10L', 'Above 10L'],
        },
        hasBankAccount: {
            type: Boolean,
            default: false,
        },
        hasKCC: {
            type: Boolean,
            default: false,
        },

        // ── Meta ──
        profileCompleteness: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        createdVia: {
            type: String,
            enum: ['voice', 'form'],
            default: 'form',
        },
    },
    {
        timestamps: true,
    }
);

// ──────────────────────────────────────
// PRE-SAVE: Auto-calculate fields
// ──────────────────────────────────────
farmerProfileSchema.pre('save', function () {
    // Convert acres to hectares (1 acre = 0.4047 hectares)
    if (this.isModified('landHolding') && this.landHolding !== undefined) {
        this.landHoldingHectares = parseFloat((this.landHolding * 0.4047).toFixed(4));
    }

    // Calculate profile completeness total fields 14
    const fields = [
        this.name, this.age, this.gender, this.socialCategory,
        this.state, this.district, this.block, this.village,
        this.landHolding !== undefined, this.landType,
        this.cropTypes?.length > 0, this.annualIncome,
        this.hasBankAccount !== undefined, this.hasKCC !== undefined,
    ];
    const filled = fields.filter(Boolean).length;
    this.profileCompleteness = Math.round((filled / fields.length) * 100);
});
const FarmerProfile = mongoose.model<IFarmerProfile>("FarmerProfile", farmerProfileSchema);



export default FarmerProfile;