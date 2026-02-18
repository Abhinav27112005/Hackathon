
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyGeminiModel() {
    console.log('🔍 Testing Gemini Model Availability...');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY is missing in .env file');
        return;
    }
    console.log('✅ API Key found');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test the specific model we found in your list
    const modelName = "gemini-3-flash-preview";
    console.log(`\n📡 Connecting to model: ${modelName}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        // Simple generation test
        const result = await model.generateContent("Hello! Are you working? Reply with 'Yes, I am alive!'");
        const response = result.response;
        const text = response.text();

        console.log('\n🎉 SUCCESS! The model is working perfectly.');
        console.log(`🤖 AI Response: "${text}"`);
        console.log('--------------------------------------------------');
        console.log(`✅ CONFIRMED: '${modelName}' is a valid, working model name for your API key.`);

    } catch (error: any) {
        console.error('\n❌ ERROR: Model test failed.');
        console.error(`Message: ${error.message}`);
    }

    try {
        // List all available models via raw API
        console.log("📋 Fetching list of available models...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }

        const data: any = await response.json();
        const models = data.models;

        console.log("\n👇 AVAILABLE FLASH/PRO MODELS FOR YOUR KEY:");
        if (models && models.length > 0) {
            let found = false;
            models.forEach((m: any) => {
                const name = m.name.replace('models/', '');
                if ((name.includes('flash') || name.includes('pro')) && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`   - ${name}`);
                    found = true;
                }
            });
            if (!found) console.log("   ❌ No flash/pro models found!");
        } else {
            console.log("   No models found.");
        }

    } catch (error: any) {
        console.error('\n❌ ERROR listing models:', error.message);
        if (error.message.includes('API_KEY')) {
            console.error('\n💡 DIAGNOSIS: Your API Key might be invalid or incorrectly configured for model listing.');
        } else {
            console.error('\n💡 DIAGNOSIS: Unknown error during model listing. Check your internet connection or API quota.');
        }
    }
}

verifyGeminiModel();
