import { Request, Response, NextFunction } from 'express';
import Activity from '../models/activity';
import FarmerProfile from '../models/farmerProfile';
import { GoogleGenerativeAI } from '@google/generative-ai';


type Action = 'check' | 'upload' | 'profile_update' | 'application' | 'login';
//Log Activity
const logActivity = async (userId: string, type: Action, description: string, schemeShortName?: string): Promise<void> => {
    try {
        await Activity.create({
            userId, type, description, schemeShortName
        });
    } catch (error) {
        console.log("Failed to log Activity", error);
    }
}

//Get Profile
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const profile = await FarmerProfile.findOne({
            userId: req.user!._id,
        });
        if (!profile) {
            res.status(404).json({
                success: false,
                message: "Profile not found. Please create your farmer profile",
                hasProfile: false,
            });
            return;
        }
        //returning profile

        res.json({
            success: true,
            hasProfile: true,
            profile
        });
    } catch (error) {
        next(error);
    }
}

//Create Profile
export const createProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!._id;

        // Check if profile already exists
        const existingProfile = await FarmerProfile.findOne({ userId });
        if (existingProfile) {
            res.status(400).json({
                success: false,
                message: "Profile already exists. Use PUT /api/profile to update.",
                profile: existingProfile
            });
            return;
        }

        // Create profile with spread operator + explicit overrides
        const profile = await FarmerProfile.create({
            ...req.body,                                          // Spread all fields from request body
            userId,                                               // Security: always use authenticated user ID
            cropTypes: req.body.cropTypes || [],                 // Default: empty array
            hasBankAccount: req.body.hasBankAccount ?? false,    // Default: false
            hasKCC: req.body.hasKCC ?? false,                    // Default: false
            createdVia: req.body.createdVia || 'form',           // Default: 'form'
        });

        // Log activity
        await logActivity(
            userId.toString(),
            "profile_update",
            `Profile created via ${profile.createdVia} with ${profile.profileCompleteness}% completeness`
        );

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            profile
        });
    } catch (error) {
        next(error);
    }
}


export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!._id;
        const existingProfile = await FarmerProfile.findOne({ userId });
        if (!existingProfile) {
            res.status(404).json({
                success: false,
                message: "Profile not found. Please create your farmer profile",

            });
            return;
        }

        const allowedFields = [
            'name', 'age', 'gender', 'socialCategory', 'aadhaarLast4', 'state', 'district', 'block',
            'village', 'landHolding', 'landType', 'cropTypes', 'annualIncome', 'hasBankAccount', 'hasKCC'
        ];
        const updatedData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updatedData[field] = req.body[field];
            }
        }

        if (Object.keys(updatedData).length === 0) {
            res.status(400).json({
                success: false,
                message: "No valid fields are provided for update"
            });
            return;
        }

        Object.assign(existingProfile, updatedData);

        const updateProfile = await existingProfile.save();

        const changedFields = Object.keys(updatedData).join(', ');

        await logActivity(
            userId.toString(),
            'profile_update',
            `Profile updated: ${changedFields}`
        );

        res.json({
            success: true,
            message: "Profile updated Successfully",
            updatedFields: Object.keys(updatedData),
            profile: updateProfile,
        });
    } catch (error) {
        next(error);
    }
}


//Creating profile form voice

// Initialize Gemini AI with latest SDK free model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Latest SDK model name

export const createProfileFromVoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { voiceText, language } = req.body;
        const userId = req.user!._id;
        //input validation
        if (!voiceText || voiceText.trim().length < 10) {
            res.status(400).json({
                success: false,
                message: "Voice text is too short. Please speak more details."
            });
            return;
        }

        const existingProfile = await FarmerProfile.findOne({ userId });
        if (existingProfile) {
            res.status(400).json({
                success: false,
                message: "Profile already exists. Use PUT /api/profile to update.",
                profile: existingProfile
            });
            return;
        }
        const prompt = `
            You are an AI assistant helping farmers in India. Extract farmer profile information from the following  ${language === 'hi' ? 'Hindi' : 'English'} voice input and return ONLY a valid JSON object with these fields (use null if not mentioned):
            Voice Input: "${voiceText}"
            RETURN ONLY VALID JSON with these exact fields:
            {
            "name": "string",
            "age": number or null,
            "gender": "Male" | "Female" | "Other" or null,
            "socialCategory": "General" | "OBC" | "SC" | "ST" | "Minority" or null,
            "state": "string" or null,
            "district": "string" or null,
            "village": "string" or null,
            "landHolding": number (in acres) or null,
            "landType": "Irrigated" | "Rainfed" | "Both" or null,
            "cropTypes": ["crop1", "crop2"] or [],
            "annualIncome": "Below 2L" | "2L-5L" | "5L-10L" | "Above 10L" or null,
            "hasBankAccount": boolean or null,
            "hasKCC": boolean or null
            }

            IMPORTANT RULES:
                1. Convert Hindi units to standard:
                - "bigha" → multiply by 0.62 to get acres
                - "hectare" → multiply by 2.47 to get acres
                - "एकड़" = acre
                2. Translate Hindi crop names to English:
                - "गेहूं" = "Wheat"
                - "धान/चावल" = "Rice"  
                - "सोयाबीन" = "Soybean"
                - "गन्ना" = "Sugarcane"
                - "कपास" = "Cotton"
                - "मक्का" = "Maize"
                - "दाल" = "Pulses"
                - "सरसों" = "Mustard"
                3. State names in English: "मध्य प्रदेश" = "Madhya Pradesh"
                4. If information is not mentioned, set field to null
                5. Return ONLY JSON, no extra text

                EXAMPLES:
                Input: "मेरा नाम रामेश है, 3 एकड़ जमीन है सागर में"
                Output: {"name": "Ramesh", "landHolding": 3, "district": "Sagar", ...}

                Input: "I have 5 bigha land in Bihar, I grow rice"
                Output: {"landHolding": 3.1, "state": "Bihar", "cropTypes": ["Rice"], ...}
            Return ONLY the JSON object, no explanation.
            `;

        const result = await model.generateContent(prompt);
        if (!result) {
            res.status(500).json({
                success: false,
                message: "Ai Failed to extract data. Please try again after sometime"
            });
            return;
        }
        const responseText = result.response.text();

        let extractedData: Record<string, any>;
        try {
            const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            extractedData = JSON.parse(cleanJson);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.status(400).json({
                success: false,
                message: 'Invalid JSON format',
                rawResponse: responseText
            });
            return;
        }
        //Filtering out null values
        const validData: Record<string, any> = {};
        for (const [key, value] of Object.entries(extractedData)) {
            if (value !== null && value !== undefined && value !== '') {
                validData[key] = value;
            }
        }

        let profile = await FarmerProfile.findOne({ userId });
        let action: 'created' | 'updated';
        if (profile) {
            action = 'updated';
            Object.assign(profile, validData, { createdVia: 'voice' });
            profile = await profile.save();
        } else {
            //No Profile -> create new one
            profile = await FarmerProfile.create({
                userId,
                name: validData.name || req.user!.name,
                socialCategory: validData.socialCategory || "General",
                state: validData.state || "Not Specified",
                district: validData.district || "Not Specified",
                landHolding: validData.landHolding || 0,
                ...validData,
                createdVia: 'voice',
            });
            action = 'created';
        }
        //Log activity
        const extractedFieldName = Object.keys(validData).join(", ");
        await logActivity(userId.toString(), 'profile_update', `Profile ${action} via voice. Extracted: ${extractedFieldName}`);

        res.status(action === 'created' ? 201 : 200).json({
            success: true,
            message: `Profile ${action} from voice input successfully!`,
            action,
            extractedFields: Object.keys(validData),
            extractedData: validData,
            profile,
            originalVoiceText: voiceText,
        });
    } catch (error: any) {
        console.error('Error processing voice input :', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process voice input',
            error: error.message,
        });
        next(error);
    }
}


