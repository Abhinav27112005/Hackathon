// RAG SERVICE - Retrieval Augmented Generation
// ═══════════════════════════════════════════
//
// This is the BRAIN of NitiSetu.
// It connects: Farmer Profile + PDF Knowledge → AI Decision
//
// FLOW:
// 1. Farmer asks: "Am I eligible for PM-KISAN?"
// 2. We search the PM-KISAN PDF chunks for relevant rules
// 3. We combine: farmer's profile data + relevant PDF rules
// 4. We ask Gemini AI to make the eligibility decision
// 5. AI returns: eligible/not eligible + proof + next steps
//
// WHY RAG? (vs just asking AI directly)
// Without RAG: AI might hallucinate eligibility rules
// With RAG:    AI references ACTUAL PDF text as proof
//              Every decision has citations from the real document
//
// ═══════════════════════════════════════════

import mongoose from 'mongoose';
import SchemeChunk from '../models/schemeChunk';
import { embeddingModel, chatModel } from '../config/Gemini';
import { IFarmerProfile } from '../models/farmerProfile';
import Scheme from '../models/scheme';

class RAGService {

    // ══════════════════════════════════════
    // FUNCTION 1: SEARCH RELEVANT CHUNKS
    //
    // Given a text query, finds the most relevant chunks
    // from a specific scheme's PDF
    //
    // HOW IT WORKS:
    // 1. Convert query text → embedding (3072 numbers with Gemini)
    // 2. Compare with all stored chunk embeddings
    // 3. Return top K chunks with highest similarity
    //
    // PARAMETERS:
    // - query: What we're searching for
    //   Example: "eligibility criteria land requirements"
    //
    // - schemeId: Which scheme to search in
    //   We only search chunks from ONE scheme at a time
    //   (don't mix PM-KISAN chunks with PM-KUSUM chunks)
    //
    // - topK: How many results to return (default 6)
    //   Too few (2-3): Might miss important rules
    //   Too many (10+): Includes irrelevant chunks, wastes tokens
    //   6 is the sweet spot for eligibility checking
    //
    // RETURNS:
    // Array of { chunkText, metadata, score }
    // Sorted by relevance (most relevant first)
    // ══════════════════════════════════════
    private async searchRelevantChunks(
        query: string,
        schemeId: string,
        topK: number = 6
    ): Promise<
        Array<{
            chunkText: string;
            metadata: {
                pageNumber: number;
                sectionTitle: string;
                paragraph?: number;
            };
            score: number;
        }>
    > {
        console.log('🔍 Searching for relevant chunks...');
        console.log(`   Query: "${query.substring(0, 60)}..."`);
        console.log(`   Scheme ID: ${schemeId}`);
        console.log(`   Top K: ${topK}`);

        // ── Step 1: Generate query embedding using Gemini ──
        // Convert our search query into the same 3072-dimension
        // vector space as the stored chunks
        //
        // IMPORTANT: The SAME model (gemini-embedding-001) must be used
        // for both storing and searching!
        // Different models produce different vector spaces!
        //
        // COMPARISON WITH OPENAI:
        // OpenAI ada-002:         1536 dimensions
        // Gemini embedding-001:   3072 dimensions (more precise!)
        const queryEmbeddingResponse = await embeddingModel.embedContent(query);
        const queryVector = queryEmbeddingResponse.embedding.values;
        // queryVector is now [0.023, -0.045, 0.078, ...] (3072 numbers)

        console.log(`   ✅ Query embedding generated (${queryVector.length} dimensions)`);

        // ── Step 2: Search for similar chunks ──
        // We try MongoDB Atlas Vector Search first (fast, built-in)
        // If it fails (no index configured), we fall back to manual search
        try {
            return await this.atlasVectorSearch(queryVector, schemeId, topK);
        } catch (atlasError: any) {
            console.log('   ⚠️ Atlas Vector Search not available, using manual search');
            console.log(`   Reason: ${atlasError.message}`);
            return await this.manualVectorSearch(queryVector, schemeId, topK);
        }
    }

    // ══════════════════════════════════════
    // FUNCTION 2: ATLAS VECTOR SEARCH
    //
    // Uses MongoDB Atlas's built-in vector search
    // This is the FAST path — Atlas does the similarity math
    //
    // REQUIRES: Vector Search Index configured in Atlas
    // (See schemeChunk.ts for setup instructions)
    //
    // HOW IT WORKS (MongoDB Aggregation Pipeline):
    // $vectorSearch stage → finds similar vectors
    // $match stage → filters by schemeId
    // $project stage → shapes the output
    // ══════════════════════════════════════
    private async atlasVectorSearch(
        queryVector: number[],
        schemeId: string,
        topK: number
    ): Promise<Array<{ chunkText: string; metadata: any; score: number }>> {
        console.log('   🔎 Attempting Atlas Vector Search...');

        const results = await SchemeChunk.aggregate([
            {
                // $vectorSearch: MongoDB Atlas's vector similarity search
                // This is a special aggregation stage only available on Atlas
                $vectorSearch: {
                    index: 'vector_index',       // Name of the search index
                    path: 'embedding',           // Field containing the vectors
                    queryVector: queryVector,     // Our query vector (3072 numbers)
                    numCandidates: topK * 10,    // Check more candidates for accuracy
                    limit: topK,                 // Return only top K results
                    filter: {
                        schemeId: new mongoose.Types.ObjectId(schemeId),
                    },
                },
            },
            {
                // $project: Choose which fields to return
                $project: {
                    chunkText: 1,
                    metadata: 1,
                    chunkIndex: 1,
                    score: { $meta: 'vectorSearchScore' }, // Similarity score (0-1)
                },
            },
        ]);

        console.log(`   ✅ Atlas Vector Search returned ${results.length} results`);
        return results;
    }

    // ══════════════════════════════════════
    // FUNCTION 3: MANUAL VECTOR SEARCH (Fallback)
    //
    // If Atlas Vector Search isn't configured, we do it manually
    // This loads ALL chunks for the scheme and calculates
    // cosine similarity in JavaScript
    //
    // SLOWER than Atlas (O(n) vs O(log n))
    // but works WITHOUT any special index setup
    //
    // COSINE SIMILARITY EXPLAINED:
    // Imagine two arrows in space:
    // - If they point the SAME direction → cos(θ) = 1.0 (identical meaning)
    // - If they're PERPENDICULAR → cos(θ) = 0.0 (unrelated)
    // - If they point OPPOSITE → cos(θ) = -1.0 (opposite meaning)
    //
    // We want chunks with cos(θ) closest to 1.0
    //
    // FORMULA:
    // cos(θ) = (A · B) / (||A|| × ||B||)
    // Where:
    //   A · B = sum of (a[i] * b[i]) for all dimensions
    //   ||A|| = sqrt(sum of a[i]²)
    // ══════════════════════════════════════
    private async manualVectorSearch(
        queryVector: number[],
        schemeId: string,
        topK: number
    ): Promise<Array<{ chunkText: string; metadata: any; score: number }>> {
        console.log('   🔎 Using manual cosine similarity search...');

        // Load ALL chunks for this scheme
        const allChunks = await SchemeChunk.find({
            schemeId: new mongoose.Types.ObjectId(schemeId),
        }).lean();

        console.log(`   📦 Loaded ${allChunks.length} chunks for comparison`);

        if (allChunks.length === 0) {
            console.warn('   ⚠️ No chunks found for this scheme!');
            return [];
        }

        // Calculate cosine similarity for each chunk
        const scored = allChunks.map((chunk) => ({
            chunkText: chunk.chunkText,
            metadata: chunk.metadata,
            chunkIndex: chunk.chunkIndex,
            score: this.cosineSimilarity(queryVector, chunk.embedding),
        }));

        // Sort by score (highest first) and take top K
        scored.sort((a, b) => b.score - a.score);
        const topResults = scored.slice(0, topK);

        console.log(`   ✅ Manual search complete. Top score: ${topResults[0]?.score.toFixed(4)}`);

        return topResults;
    }

    // ══════════════════════════════════════
    // HELPER: COSINE SIMILARITY
    //
    // Calculates how similar two vectors are
    // Returns a number between -1 and 1
    //
    // Example:
    //   vectorA = [1, 0, 0]
    //   vectorB = [1, 0, 0]
    //   similarity = 1.0 (identical!)
    //
    //   vectorA = [1, 0, 0]
    //   vectorB = [0, 1, 0]
    //   similarity = 0.0 (completely different)
    // ══════════════════════════════════════
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];   // A · B
            magnitudeA += vecA[i] * vecA[i];   // ||A||²
            magnitudeB += vecB[i] * vecB[i];   // ||B||²
        }

        magnitudeA = Math.sqrt(magnitudeA);    // ||A||
        magnitudeB = Math.sqrt(magnitudeB);    // ||B||

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }

    //Function 2: Check Eligibility (main rag function)
    //Inputs: Farmer profile from database + schemeId which scheme to check against.

    async checkEligibility(profile: IFarmerProfile, schemeId: string): Promise<{
        schemeId: string;
        schemeName: string;
        schemeShortName: string;
        isEligible: 'eligible' | 'not_eligible' | 'likely_eligible';
        confidenceScore: number;
        benefitAmount?: string;
        reasoning: string;
        citations: Array<{
            text: string;
            page: number;
            section: string;
            matchType: 'supports' | 'excludes';
        }>;
        criteriaMatched: Array<{
            criterion: string;
            farmerValue: string;
            requiredValue: string;
            isMatch: boolean;
        }>;
        exclusionsChecked: Array<{
            exclusion: string;
            isExcluded: boolean;
            reason: string;
        }>;
        requiredDocuments: string[];
        nextSteps: string[];
        responseTimeMs: number;
        llmModel: string;
        checkedAt: Date;
    }> {
        //Start timer
        const startTime = Date.now();

        //Step 1 Validate scheme
        const scheme = await Scheme.findById(schemeId);

        if (!scheme) {
            throw new Error('Scheme not found. It may have been deleted');
        }

        if (scheme.processingStatus !== 'completed') {
            throw new Error(`Scheme "${scheme.shortName}" is not ready. ` +
                `Current status: ${scheme.processingStatus}. ` +
                `Please wait for processing to complete.`)
        }
        console.log(`\n🎯 Checking eligibility: ${profile.name} → ${scheme.shortName} `);
        //Search for relevant chunks
        const searchQuery = 'eligibility criteria requirements conditions who is eligible' + 'who can apply exclusion not eligible disqualified' + 'land holding income category farmer qualification' + 'benefits amount financial support';

        const relevantChunks = await this.searchRelevantChunks(searchQuery, schemeId, 6);

        if (relevantChunks.length === 0) {
            throw new Error(`No content found in scheme ${scheme.shortName}.` + ` The PDF might not have been processed correctly..` + `Try reprocessing the pdf`);
        }

        //step 3: Build context from chunks 

        const context = relevantChunks.map((chunk, index) => {
            const page = chunk.metadata?.pageNumber || 'Unknown';
            const section = chunk.metadata?.sectionTitle || 'General';

            return (
                `[Source ${index + 1}: Page ${page}, Section ${section}]\n` + `${chunk.chunkText}`
            );
        }).join("\n\n--\n\n");


        console.log(`   📝 Context built from ${relevantChunks.length} chunks`);

        //step 4 Building the LLM prompt

        const systemMessage = `You are an expert government sceheme eligibility assessor for Indian farmers.
        
        Your job is to ACCURATELY determine if a farmer is eligible for a scheme based ONLY on the provided document excerpts.
        
        CRITICAL RULES:
        1. ONLY use information from the provided document excerpts
2. NEVER make up or assume eligibility criteria
3. If the document doesn't mention a specific criterion, say "not mentioned in document"
4. Always cite the EXACT text from the document
5. Be precise with unit conversions (1 hectare = 2.471 acres)
6. Check ALL exclusion criteria mentioned in the document
7. Respond ONLY in valid JSON format`;

        const userMessage = `
FARMER PROFILE:
═══════════════
Name: ${profile.name}
Age: ${profile.age || 'Not specified'}
Gender: ${profile.gender || 'Not specified'}
Social Category: ${profile.socialCategory}
State: ${profile.state}
District: ${profile.district}
Block: ${profile.block || 'Not specified'}
Village: ${profile.village || 'Not specified'}
Land Holding: ${profile.landHolding} acres (${profile.landHoldingHectares} hectares)
Land Type: ${profile.landType || 'Not specified'}
Crops: ${profile.cropTypes?.join(', ') || 'Not specified'}
Annual Income: ${profile.annualIncome || 'Not specified'}
Has Bank Account: ${profile.hasBankAccount ? 'Yes' : 'No'}
Has KCC (Kisan Credit Card): ${profile.hasKCC ? 'Yes' : 'No'}

SCHEME: ${scheme.name} (${scheme.shortName})
${scheme.benefitAmount ? `Stated Benefit: ${scheme.benefitAmount}` : ''}

DOCUMENT EXCERPTS FROM OFFICIAL SCHEME PDF:
═══════════════════════════════════════════
${context}
═══════════════════════════════════════════

TASK:
Analyze the farmer's profile against the scheme's eligibility criteria from the document excerpts above.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks, just pure JSON):
{
  "isEligible": "eligible" or "not_eligible" or "likely_eligible",
  "confidenceScore": <number between 0 and 100>,
  "benefitAmount": "<what the farmer will receive, from the document>",
  "reasoning": "<2-3 sentence explanation of the decision>",
  "citations": [
    {
      "text": "<EXACT quote from the document excerpts above>",
      "page": <page number from the Source tag>,
      "section": "<section name from the Source tag>",
      "matchType": "supports" or "excludes"
    }
  ],
  "criteriaMatched": [
    {
      "criterion": "<eligibility rule from the document>",
      "farmerValue": "<farmer's actual value>",
      "requiredValue": "<what the scheme requires>",
      "isMatch": true or false
    }
  ],
  "exclusionsChecked": [
    {
      "exclusion": "<exclusion rule from the document>",
      "isExcluded": false or true,
      "reason": "<why the farmer is or isn't excluded>"
    }
  ],
  "requiredDocuments": ["<document 1>", "<document 2>"],
  "nextSteps": ["<step 1 to apply>", "<step 2>"]
}

ADDITIONAL INSTRUCTIONS:
- Include at least 2 citations from the document
- Check at least 2 exclusion criteria if mentioned
- Include at least 3 criteria matches
- List all required documents mentioned in the PDF
- If land holding is mentioned in hectares in PDF, convert farmer's acres to hectares for comparison
- Be specific: "1.21 hectares < 2 hectares limit" not just "meets criteria"`;

        // ── Step 5: Call Gemini AI ──
        console.log('   🤖 Calling Gemini AI...');

        const result = await chatModel.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: systemMessage + '\n\n' + userMessage }],
                    // WHY combine system + user into one message?
                    // OpenAI has a separate 'system' role for instructions.
                    // Gemini's API uses 'user' and 'model' roles only.
                    // So we put the system instructions at the TOP of the user message.
                    // The AI still understands it as instructions vs actual query.
                },
            ],
            generationConfig: {
                temperature: 0.1,       // Low = deterministic
                maxOutputTokens: 8192,  // Increase this! Gemini supports large outputs. 2000 might be too small for full analysis + citations.
                responseMimeType: 'application/json',
            },
        });

        // ── Extract the response text ──
        // OpenAI:  completion.choices[0].message.content
        // Gemini:  result.response.text()
        // ── Handle potential safety blocks ──
        if (result.response.promptFeedback?.blockReason) {
            console.error(`   🛑 Blocked: ${result.response.promptFeedback.blockReason}`);
            throw new Error(`AI blocked request: ${result.response.promptFeedback.blockReason}`);
        }

        const responseText = result.response.text();

        // 🔍 DEBUG: Log the raw response to see what went wrong (e.g. empty string, plain text, etc.)
        // console.log('   📄 RAW RESPONSE:', responseText.substring(0, 1000)); 

        const responseTimeMs = Date.now() - startTime;
        console.log(`   ✅ Gemini responded in ${responseTimeMs}ms`);
        console.log(`   📄 Response length: ${responseText.length} chars`);

        // ── Step 6: Parse the JSON response ──
        // Even with responseMimeType: 'application/json',
        // we add safety parsing because:
        // 1. Gemini might still wrap JSON in markdown ```json blocks
        // 2. Network glitches could corrupt the response
        // 3. Edge cases in prompts might confuse the model
        //
        // Our 3-step parsing strategy:
        // Step A: Try direct JSON.parse (works 90% of the time with responseMimeType)
        // Step B: Strip markdown code fences if present
        // Step C: Regex extract the JSON object as last resort

        let parsed: any;

        try {
            // Step A: Try direct parse (should work with responseMimeType enabled)
            parsed = JSON.parse(responseText);
            console.log('   ✅ Direct JSON parse successful');
        } catch {
            console.log('   ⚠️ Direct parse failed, cleaning response...');

            // Step B: Strip markdown code fences
            // Sometimes AI returns: ```json\n{...}\n```
            // We need to remove the ``` wrapper
            let cleanedResponse = responseText
                .replace(/```json\s*/gi, '')  // Remove ```json
                .replace(/```\s*/g, '')       // Remove closing ```
                .trim();                      // Remove whitespace

            try {
                parsed = JSON.parse(cleanedResponse);
                console.log('   ✅ Parsed after removing markdown fences');
            } catch {
                // Step C: Regex extract — find the JSON object in the text
                // Sometimes AI adds text before/after: "Here's the analysis: {...} Hope this helps!"
                // This regex finds the FIRST { and the LAST } and extracts everything between
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    try {
                        parsed = JSON.parse(jsonMatch[0]);
                        console.log('   ✅ Extracted JSON from response via regex');
                    } catch {
                        throw new Error(
                            'AI response was not valid JSON. Please try again. ' +
                            'If this persists, the PDF content might be causing issues.'
                        );
                    }
                } else {
                    throw new Error('AI response did not contain valid JSON.');
                }
            }
        }

        //Step 7: Validate and normalize the response
        //
        // WHY DO THIS?
        // The AI might return slightly wrong types or missing fields:
        //   - confidenceScore: "85" (string instead of number)
        //   - citations: undefined (forgot the field entirely)
        //   - isEligible: "yes" (not our exact enum value)
        //   - matchType: "positive" (close but wrong)
        //
        // Without validation → these break your MongoDB schema or crash your app
        // With validation    → every field is guaranteed to be the right type
        //
        // HOW IT WORKS:
        // For each field, we:
        // 1. Check if it exists (fallback to default if not)
        // 2. Cast to correct type (String(), Number(), Boolean())
        // 3. Validate against allowed values (enums)
        // 4. Ensure arrays ARE arrays (not strings or objects)

        const validatedResult = {
            schemeId,
            schemeName: scheme.name,
            schemeShortName: scheme.shortName,

            // Validate enum: must be exactly one of our 3 allowed values
            isEligible: this.validateEligibilityStatus(parsed.isEligible),

            // Validate number: must be 0-100, not a string, not negative
            confidenceScore: this.validateConfidence(parsed.confidenceScore),

            // Fallback chain: AI's answer → scheme's stored value → default text
            benefitAmount: parsed.benefitAmount || scheme.benefitAmount || 'Not specified',

            reasoning: parsed.reasoning || 'No reasoning provided',

            // ── Validate arrays ──
            // Array.isArray() check prevents crash if AI returns a string instead of array
            // .map() ensures every item in the array has the right shape
            citations: Array.isArray(parsed.citations)
                ? parsed.citations.map((c: any) => ({
                    text: String(c.text || ''),
                    page: Number(c.page) || 1,
                    section: String(c.section || 'General'),
                    // Only allow 'supports' or 'excludes', default to 'supports'
                    matchType: c.matchType === 'excludes' ? 'excludes' as const : 'supports' as const,
                }))
                : [],

            criteriaMatched: Array.isArray(parsed.criteriaMatched)
                ? parsed.criteriaMatched.map((c: any) => ({
                    criterion: String(c.criterion || ''),
                    farmerValue: String(c.farmerValue || ''),
                    requiredValue: String(c.requiredValue || ''),
                    isMatch: Boolean(c.isMatch),
                }))
                : [],

            exclusionsChecked: Array.isArray(parsed.exclusionsChecked)
                ? parsed.exclusionsChecked.map((e: any) => ({
                    exclusion: String(e.exclusion || ''),
                    isExcluded: Boolean(e.isExcluded),
                    reason: String(e.reason || ''),
                }))
                : [],

            // .map(String) converts every element to a string
            // e.g., [123, "Aadhaar"] → ["123", "Aadhaar"]
            requiredDocuments: Array.isArray(parsed.requiredDocuments)
                ? parsed.requiredDocuments.map(String)
                : [],

            nextSteps: Array.isArray(parsed.nextSteps)
                ? parsed.nextSteps.map(String)
                : [],

            responseTimeMs,
            llmModel: 'gemini-2.5-flash',
            checkedAt: new Date(),
        };

        // ── Log the result ──
        const emoji = validatedResult.isEligible === 'eligible' ? '✅' :
            validatedResult.isEligible === 'likely_eligible' ? '⚠️' : '❌';

        console.log(`   ${emoji} Result: ${validatedResult.isEligible}`);
        console.log(`   📊 Confidence: ${validatedResult.confidenceScore}%`);
        console.log(`   ⏱️  Time: ${validatedResult.responseTimeMs}ms`);
        console.log(`   📄 Citations: ${validatedResult.citations.length}`);

        return validatedResult;
    }

    // Function 3 check all Schemes


    async checkAllSchemes(profile: IFarmerProfile): Promise<any[]> {
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║  Checking ALL Schemes                 ║');
        console.log('╚══════════════════════════════════════╝\n');

        //Finding all ready schemes
        const schemes = await Scheme.find({
            isActive: true,
            processingStatus: 'completed',
        }).select('_id name shortName');


        console.log(`📋 Found ${schemes.length} processed schemes to check`);

        if (schemes.length === 0) {
            console.log('⚠️  No processed schemes found. Upload and process PDFs first.');
            return [];
        }

        //Checking each scheme

        const results: any[] = [];

        for (let i = 0; i < schemes.length; i++) {
            const scheme = schemes[i];
            console.log(`\n── Checking ${i + 1}/${schemes.length}: ${scheme.shortName} ──`);

            try {
                const result = await this.checkEligibility(profile, scheme._id.toString());
                results.push(result);
            } catch (error: any) {
                //Not letting one failure stops all the checks
                console.error(`   ❌ Failed for ${scheme.shortName}: ${error.message}`);

                results.push({
                    schemeId: scheme._id,
                    schemeName: scheme.name,
                    schemeShortName: scheme.shortName,
                    isEligible: 'error' as const,
                    confidenceScore: 0,
                    reasoning: `Check failed: ${error.message}`,
                    citations: [],
                    criteriaMatched: [],
                    exclusionsChecked: [],
                    requiredDocuments: [],
                    nextSteps: [],
                    responseTimeMs: 0,
                    llmModel: 'gemini-2.5-flash',
                    checkedAt: new Date(),
                    error: error.message,
                })
            }
            //Small delay between  api calls

            if (i < schemes.length - 1) {
                await this.sleep(1000); //wait 1 seconds between checks
            }
        }
        //Sort results
        //Order -> eligible -> likely_eligible -> not_eligible -> error within each group sort by confidence (highest first)

        const sortOrder: Record<string, number> = {
            eligible: 0,
            likely_eligible: 1,
            not_eligible: 2,
            error: 3,
        };

        results.sort((a, b) => {
            const orderDiff = (sortOrder[a.isEligible] ?? 3) - (sortOrder[b.isEligible] ?? 3);
            if (orderDiff !== 0) return orderDiff;
            return (b.confidenceScore || 0) - (a.confidenceScore || 0);
        })

        //Summary
        const eligible = results.filter((r) => r.isEligible === 'eligible').length;
        const notEligible = results.filter((r) => r.isEligible === 'not_eligible').length;
        const errors = results.filter((r) => r.isEligible === 'error').length;
        console.log('\n╔══════════════════════════════════════╗');
        console.log(`║  Results: ${eligible} ✅ | ${notEligible} ❌ | ${errors} ⚠️    ║`);
        console.log('╚══════════════════════════════════════╝\n');

        return results;

    }



    // ══════════════════════════════════════
    // HELPER: Validate Eligibility Status
    //
    // AI might return: "yes", "eligible", "ELIGIBLE", "true", "Eligible"
    // We need exactly: "eligible" | "not_eligible" | "likely_eligible"
    //
    // HOW IT WORKS:
    // 1. Convert to lowercase for case-insensitive comparison
    // 2. Check against our allowed values
    // 3. Map common AI responses to our enum values
    // 4. Default to "likely_eligible" if unknown (safest option)
    // ══════════════════════════════════════
    private validateEligibilityStatus(
        status: any
    ): 'eligible' | 'not_eligible' | 'likely_eligible' {
        const s = String(status).toLowerCase().trim();

        if (s === 'eligible' || s === 'yes' || s === 'true') return 'eligible';
        if (s === 'not_eligible' || s === 'no' || s === 'false' || s === 'ineligible') return 'not_eligible';
        if (s === 'likely_eligible' || s === 'maybe' || s === 'partial') return 'likely_eligible';

        // If AI returns something unexpected, "likely_eligible" is safest
        // It doesn't make a strong claim either way
        console.warn(`   ⚠️ Unknown eligibility status: "${status}", defaulting to "likely_eligible"`);
        return 'likely_eligible';
    }

    // ══════════════════════════════════════
    // HELPER: Validate Confidence Score
    //
    // AI might return: "85", 85, 150, -10, "high", null
    // We need: a number between 0 and 100
    //
    // Math.min(100, Math.max(0, ...)) is called "clamping"
    // It ensures the value stays within [0, 100] range:
    //   -10  → max(0, -10)  → 0   → min(100, 0)   → 0
    //   85   → max(0, 85)   → 85  → min(100, 85)  → 85
    //   150  → max(0, 150)  → 150 → min(100, 150) → 100
    // ══════════════════════════════════════
    private validateConfidence(score: any): number {
        const num = Number(score);

        // isNaN = "is Not a Number"
        // Number("hello") → NaN → true
        // Number("85")    → 85  → false
        if (isNaN(num)) {
            console.warn(`   ⚠️ Invalid confidence score: "${score}", defaulting to 50`);
            return 50;
        }

        // Clamp between 0 and 100
        return Math.min(100, Math.max(0, Math.round(num)));
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default new RAGService();
