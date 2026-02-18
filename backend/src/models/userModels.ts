import mongoose, { Schema, Document } from "mongoose";
import bcryptjs from "bcryptjs";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string; //Farmer Name
    phone: string; //Login Identifier
    password?: string;  // Optional mostily through otp
    language: 'en' | 'hi' | 'mr' | 'ta';// Ui Language Preference
    role: 'farmer' | 'admin';
    isVerified: boolean;
    otp?: {
        code: string,
        expiresAt: Date
    };
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}


const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, "Name is Required"],
        trim: true,
        minlength: [2, "Name Must be atleast 2 character long"],
        maxlength: [100, "Name Cann't Exceed 100 character long"]
    },
    phone: {
        type: String,
        required: [true, "Phone Number is Required"],
        unique: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please Enter a 10 digit valid Phone Number"]
    },
    password: {
        type: String,
        required: [true, "Password is Required"],
        // Note: No min/max length validation here because:
        // - Input validation happens in validator middleware (6-20 chars)
        // - Stored value is bcrypt hash (always 60 chars)
        select: false
    },
    language: {
        type: String,
        enum: ['en', 'hi', 'mr', 'ta'],
        default: 'en'
    },
    role: {
        type: String,
        enum: ['farmer', 'admin'],
        default: 'farmer'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: {
            type: String,
            select: false
        },
        expiresAt: {
            type: Date,
            select: false
        }
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });

userSchema.pre('save', async function () {
    // Only hash if password is modified
    if (!this.isModified('password') || !this.password) return;

    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcryptjs.compare(candidatePassword, this.password);
}


userSchema.index({ role: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;