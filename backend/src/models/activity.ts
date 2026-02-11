import mongoose, { Document, Schema } from "mongoose";

//It will like a diary that records everything the user does every action gets logged here...

export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'check' | 'upload' | 'profile_update' | 'application' | 'login';
    description: string;
    schemeShortName?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const activitySchema = new Schema<IActivity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User Id is required'],
        index: true,
    },
    type: {
        type: String,
        enum: {
            values: [
                'check',
                'upload',
                'profile_update',
                'application',
                'login'
            ],
            message: '{VALUE} is not a valid activity type',
        },
        required: [true, 'Activity type is required'],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        maxlength: [500, 'Description is too long'],
    },
    schemeShortName: {
        type: String,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
}, { timestamps: true });

activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;

