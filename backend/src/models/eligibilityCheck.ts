import mongoose, { Document, Schema } from "mongoose";

//Eligibility check model
//This stores the result of every eligibility check


//Extract quote form the pdf that supports the decision
export interface ICitation {
    text: string;
    page: number;
    section: string;
    matchType: 'supports' | 'excludes';
}

export interface ICriteriaMatch {
    criterion: string;
    farmerValue: string;
    requiredValue: string;
    isMatch: boolean;
}


export interface IExclusionCheck {
    exclusion: string;
    isExcluded: boolean;
    reason: string;
}

export interface IEligibilityCheck extends Document {
    _id: mongoose.Types.ObjectId;

    userId: mongoose.Types.ObjectId;
    profileId: mongoose.Types.ObjectId;
    schemeId: mongoose.Types.ObjectId;
    schemeName: string;
    schemeShortName: string;

    //Result 
    isEligible: 'eligible' | 'not_eligible' | 'likely_eligible';
    confidenceScore: number;
    benefitAmount?: string;
    reasoning: string;

    //Proof
    citations: ICitation[];
    criterialMatched: ICriteriaMatch[];
    exclusionsChecked: IExclusionCheck[];

    //Next Steps
    requiredDocuments: string[];
    nextSteps: string[];

    //Performance
    responseTimeMs: number;
    llmModel: string;

    //Timestamps
    checkedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const eligibilityCheckSchema = new Schema<IEligibilityCheck>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'UserId is required'],
        index: true,
    },
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'FarmerProfile',
        required: [true, "Profile ID is required"],
    },
    schemeId: {
        type: Schema.Types.ObjectId,
        ref: "Scheme",
        required: [true, "Scheme Id is required"],
    },
    //Denormalized scheme names: means to store same fields in multiple places
    schemeName: {
        type: String,
        required: [true, 'Scheme name is required'],
    },

    schemeShortName: {
        type: String,
        required: [true, 'Scheme short name is required'],
    },
    //Result
    isEligible: {
        type: String,
        enum: {
            values: ['eligible', 'not_eligible', 'likely_eligible'],
            message: '{VALUE} is not a valid eligibility status',
        },
        required: [true, "Eligibility status is required"],
    },
    confidenceScore: {
        type: Number,
        required: [true, 'Confidence score is required'],
        min: [0, "Confidence cannot be negative"],
        max: [100, 'Confidence cannot exceed 100'],
    },
    benefitAmount: {
        type: String,
    },
    //Reasoning ai explanation in plain language
    reasoning: {
        type: String,
        required: [true, 'Reasoning is required'],
    },
    //Proof and citations
    citations: [
        {
            text: {
                type: String,
                required: true,
            },
            page: {
                type: Number,
                required: true,
            },
            section: {
                type: String,
                default: 'General',
            },
            matchType: {
                type: String,
                enum: ['supports', 'excludes'],
                default: 'supports',
            },
        },
    ],
    criterialMatched: [
        {
            criterion: String,
            farmerValue: String,
            requiredValue: String,
            isMatch: Boolean,
        },
    ],

    exclusionsChecked: [
        {
            exclusion: String,
            isExcluded: Boolean,
            reason: String,
        },
    ],

    requiredDocuments: {
        type: [String],
        default: [],
    },
    nextSteps: {
        type: [String],
        default: [],
    },

    responseTimeMs: {
        type: Number,
    },
    //Which ai model was used
    llmModel: {
        type: String,
        default: 'gemini-2.5-flash',
    },
    checkedAt: {
        type: Date,
        default: Date.now,
    },

}, { timestamps: true });

eligibilityCheckSchema.index({ userId: 1, checkedAt: -1 });
eligibilityCheckSchema.index({ userId: 1, schemeId: 1, checkedAt: -1 });

const EligibilityCheck = mongoose.model<IEligibilityCheck>('EligibilityCheck', eligibilityCheckSchema);

export default EligibilityCheck;

