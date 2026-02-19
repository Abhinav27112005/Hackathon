import { Request, Response, NextFunction } from 'express';
import { chatModel } from '../config/Gemini';

// ══════════════════════════════════════
// CONTROLLER 1: PARSE PROFILE FROM VOICE
// POST /api/voice/parse-profile
//
// WHAT IT DOES:
// Takes raw voice text (speech-to-text output)
// Uses AI to extract structured farmer profile data
//
// This is the SAME logic as profileController.createProfileFromVoice
// but as a standalone endpoint that ONLY parses (doesn't save)
//
// WHY SEPARATE?
// 1. Frontend can show extracted data for user to CONFIRM
// 2. User can edit before saving
// 3. Reusable - can be called from different pages
//
// FLOW:
// Farmer speaks → Browser STT → text sent here → AI extracts → 
// Frontend shows "Is this correct?" → User confirms → Save to profile
//
// REQUEST BODY:
// {
//   "voiceText": "Mera naam Ramesh hai, 3 acre zameen hai Sagar mein",
//   "language": "hi"
// }
//
// RESPONSE:
// {
//   "extractedData": {
//     "name": "Ramesh",
//     "landHolding": 3,
//     "district": "Sagar",
//     ...
//   }
// }
// ══════════════════════════════════════
export const parseProfileFromVoice = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { voiceText, language } = req.body;

        // ── Validate input ──
        if (!voiceText || voiceText.trim().length < 5) {
            res.status(400).json({
                success: false,
                message: 'Voice text is required and must be at least 5 characters.',
            });
            return;
        }

        // ── Call Gemini to extract structured data ──
        const prompt = `
      You are a data extraction assistant for Indian farmer profiles.
      
      Extract farmer information from the following ${language === 'hi' ? 'Hindi' : 'English'} text:
      "${voiceText}"

      RETURN ONLY VALID JSON with these fields:
      {
        "name": "string or null",
        "age": "number or null",
        "gender": "Male or Female or Other or null",
        "state": "full state name in English or null",
        "district": "district name in English or null",
        "village": "village name or null",
        "landHolding": "number in ACRES or null",
        "landType": "Irrigated or Rainfed or Both or null",
        "cropTypes": ["array of crop names in English"] or [],
        "socialCategory": "General or OBC or SC or ST or Minority or null",
        "annualIncome": "Below 2L or 2L-5L or 5L-10L or Above 10L or null",
        "hasBankAccount": "true or false or null",
        "hasKCC": "true or false or null"
      }

      CONVERSION RULES:
      - "bigha" → multiply by 0.62 for acres
      - "hectare" → multiply by 2.47 for acres
      - Hindi crop names → English (गेहूं=Wheat, धान=Rice, सोयाबीन=Soybean, कपास=Cotton, गन्ना=Sugarcane)
      - Hindi state names → English (मध्य प्रदेश=Madhya Pradesh, उत्तर प्रदेश=Uttar Pradesh)
      - If not mentioned, set to null
      - Return ONLY JSON, no extra text
    `;

        const result = await chatModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
            }
        });

        const response = result.response;
        // ── Parse response ──
        const rawResponse = response.text();

        if (!rawResponse) {
            res.status(500).json({
                success: false,
                message: 'AI returned empty response. Please try again.',
            });
            return;
        }

        const cleaned = rawResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        let extractedData: Record<string, any>;

        try {
            extractedData = JSON.parse(cleaned);
        } catch {
            res.status(500).json({
                success: false,
                message: 'Failed to parse AI response. Please speak more clearly.',
            });
            return;
        }

        // ── Remove null values ──
        const validData: Record<string, any> = {};
        for (const [key, value] of Object.entries(extractedData)) {
            if (value !== null && value !== undefined && value !== '') {
                validData[key] = value;
            }
        }

        // ── Response ──
        res.json({
            success: true,
            message: 'Voice text parsed successfully',
            extractedData: validData,
            extractedFields: Object.keys(validData),
            totalFieldsExtracted: Object.keys(validData).length,
            originalVoiceText: voiceText,
            language: language || 'auto-detected',
        });

    } catch (error: any) {
        if (error?.status === 429) {
            res.status(429).json({
                success: false,
                message: 'AI rate limit reached. Please wait a minute.',
            });
            return;
        }
        next(error);
    }
};


// ══════════════════════════════════════
// CONTROLLER 2: PARSE QUERY FROM VOICE
// POST /api/voice/parse-query
//
// WHAT IT DOES:
// Takes raw voice text and determines what the user WANTS TO DO
//
// EXAMPLE INPUTS → OUTPUTS:
//
// "PM KISAN ke liye eligible hoon kya?"
// → { intent: "check_eligibility", schemeName: "PM-KISAN" }
//
// "Saari schemes check karo"
// → { intent: "check_all", schemeName: null }
//
// "Solar pump scheme ke baare mein batao"
// → { intent: "scheme_info", schemeName: "PM-KUSUM" }
//
// "Mera profile update karo"
// → { intent: "update_profile", schemeName: null }
//
// The frontend uses this parsed intent to:
// - Navigate to the correct page
// - Auto-trigger the right API call
// - Pre-fill search fields
//
// REQUEST BODY:
// { "voiceText": "PM KISAN ke liye eligible hoon?" }
//
// RESPONSE:
// {
//   "parsed": {
//     "intent": "check_eligibility",
//     "schemeName": "PM-KISAN",
//     "question": "Am I eligible for PM-KISAN?"
//   }
// }
// ══════════════════════════════════════
export const parseQueryFromVoice = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { voiceText } = req.body;

        if (!voiceText || voiceText.trim().length < 3) {
            res.status(400).json({
                success: false,
                message: 'Voice text is required.',
            });
            return;
        }

        // ── Call Gemini to parse intent ──
        const prompt = `
      You are a voice command parser for a farmer scheme eligibility app.

      Extract the user's INTENT and any SCHEME NAME from their voice query:
      "${voiceText}"

      Known scheme names and aliases:
      - PM-KISAN (aliases: "pm kisan", "kisan samman", "kisan nidhi", "6000 wali scheme")
      - PM-KUSUM (aliases: "kusum", "solar pump", "solar wali scheme")  
      - AIF (aliases: "agriculture infrastructure", "agri infra", "infrastructure fund")
      - PMFBY (aliases: "fasal bima", "crop insurance", "bima yojana")

      Return ONLY valid JSON:
      {
        "intent": "check_eligibility" | "check_all" | "scheme_info" | "update_profile" | "help" | "unknown",
        "schemeName": "SCHEME-SHORT-NAME or null",
        "question": "cleaned up question in English",
        "confidence": <0-100 how sure you are about the intent>
      }

      Examples:
      "PM KISAN ke liye eligible hoon?" → {"intent":"check_eligibility","schemeName":"PM-KISAN","question":"Am I eligible for PM-KISAN?","confidence":95}
      "saari scheme dikhaao" → {"intent":"check_all","schemeName":null,"question":"Show all schemes","confidence":90}
      "kya kya documents chahiye" → {"intent":"help","schemeName":null,"question":"What documents are needed?","confidence":80}
    `;

        const result = await chatModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 200,
                responseMimeType: 'application/json',
            }
        });

        // ── Parse response ──
        const rawResponse = result.response.text();

        if (!rawResponse) {
            res.status(500).json({
                success: false,
                message: 'AI returned empty response.',
            });
            return;
        }

        const cleaned = rawResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        let parsed: any;

        try {
            parsed = JSON.parse(cleaned);
        } catch {
            // If parsing fails, return a safe default
            parsed = {
                intent: 'unknown',
                schemeName: null,
                question: voiceText,
                confidence: 30,
            };
        }

        // ── Validate and normalize ──
        const validIntents = [
            'check_eligibility',
            'check_all',
            'scheme_info',
            'update_profile',
            'help',
            'unknown',
        ];

        if (!validIntents.includes(parsed.intent)) {
            parsed.intent = 'unknown';
        }

        // ── Response ──
        res.json({
            success: true,
            parsed: {
                intent: parsed.intent,
                schemeName: parsed.schemeName || null,
                question: parsed.question || voiceText,
                confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
            },
            originalVoiceText: voiceText,
            // Suggest what frontend should do
            suggestedAction:
                parsed.intent === 'check_eligibility' && parsed.schemeName
                    ? {
                        action: 'NAVIGATE',
                        path: '/check-eligibility',
                        params: { scheme: parsed.schemeName },
                    }
                    : parsed.intent === 'check_all'
                        ? {
                            action: 'NAVIGATE',
                            path: '/check-eligibility',
                            params: { mode: 'all' },
                        }
                        : parsed.intent === 'scheme_info' && parsed.schemeName
                            ? {
                                action: 'NAVIGATE',
                                path: `/scheme/${parsed.schemeName}`,
                            }
                            : parsed.intent === 'update_profile'
                                ? {
                                    action: 'NAVIGATE',
                                    path: '/profile-setup',
                                }
                                : {
                                    action: 'SHOW_HELP',
                                    message: 'How can I help you? Try saying "Check PM-KISAN eligibility"',
                                },
        });

    } catch (error: any) {
        if (error?.status === 429) {
            res.status(429).json({
                success: false,
                message: 'AI rate limit reached. Please wait.',
            });
            return;
        }
        next(error);
    }
};
