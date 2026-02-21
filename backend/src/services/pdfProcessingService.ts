



//PDF Processing service
//Implementation of complete RAG ingestion pipeline

import axios from "axios";
import { embeddingModel } from '../config/Gemini';
import SchemeChunk from "../models/schemeChunk";
import Scheme from "../models/scheme";

// pdf-parse v2 uses a class-based ESM API.
// The package exports PDFParse as the default export.
// We use a dynamic require to avoid TypeScript/ESM interop issues on Render.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParseLib = require('pdf-parse');
// v2 exports the class as .PDFParse or as the default — handle both
const PDFParse = PDFParseLib.PDFParse ?? PDFParseLib.default?.PDFParse ?? PDFParseLib.default ?? PDFParseLib;

//PDF URL -> Fetch -> Extract Text -> Chunk -> Embed -> Store

class PDFProcessingService {
    //Fetch the PDF file from Cloudinary url
    private async fetchPDF(cloudinaryUrl: string): Promise<Buffer> {
        console.log(`📥 Step 1/5: Fetching PDF from Cloudinary...`);
        console.log(`URL: ${cloudinaryUrl.substring(0, 80)}...`);

        try {
            const response = await axios.get(cloudinaryUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 10 * 1024 * 1024, //10MB limit
            });

            const buffer = Buffer.from(response.data);
            const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
            console.log(`✅ PDF fetched successfully! Size: ${sizeMB}MB`);

            return buffer;

        } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
                throw new Error("PDF download timed out. File might be too large.");
            }
            if (error.response?.status === 404) {
                throw new Error("PDF not found on Cloudinary. It may have been deleted.");
            }
            throw new Error(`Failed to download PDF: ${error.message}`);
        }

    }

    //Extract text from pdf: Scanned pdf made from images will not work
    private async extractText(pdfBuffer: Buffer): Promise<{ text: string; totalPages: number }> {
        console.log(`📄 Step 2/5: Extracting text from PDF...`);

        try {
            let text: string;
            let totalPages: number;

            // pdf-parse v2 class-based API
            if (typeof PDFParse === 'function' && PDFParse.prototype && typeof PDFParse.prototype.getText === 'function') {
                // v2 class API: new PDFParse({ data: buffer }) → parser.getText()
                const parser = new PDFParse({ data: pdfBuffer });
                const data = await parser.getText();
                text = data.text;
                totalPages = data.total ?? data.pages?.length ?? 1;
            } else if (typeof PDFParse === 'function') {
                // v1 function API fallback: pdfParse(buffer) → { text, numpages }
                const data = await PDFParse(pdfBuffer);
                text = data.text;
                totalPages = data.numpages ?? 1;
            } else {
                throw new Error('pdf-parse library could not be loaded correctly.');
            }

            //Validate extracted text
            if (!text || text.trim().length < 100) {
                throw new Error(
                    'PDF appears to be empty or image-based (scanned). Text extraction failed. Try a text-based PDF.'
                );
            }

            const wordCount = text.split(/\s+/).length;
            console.log(`✅ Text extracted: ${wordCount} words, ${totalPages} pages`);

            return { text, totalPages };

        } catch (error: any) {
            if (error.message.includes('encrypted') || error.message.includes('password')) {
                throw new Error("PDF is password-protected. Please upload an unprotected PDF.");
            }
            throw new Error("Text extraction failed: " + error.message);
        }

    }

    //Smart Chunking: spliting the extract text into smaller chunks
    private chunkText(fullText: string): Array<{ chunkText: string, chunkIndex: number, metadata: { pageNumber: number; sectionTitle: string; paragraph: number }; }> {
        console.log(`✂️ Step 3/5: Chunking text...`);

        const chunks: Array<{
            chunkText: string;
            chunkIndex: number;
            metadata:
            {
                pageNumber: number;
                sectionTitle: string;
                paragraph: number;
            };
        }> = [];

        //Spliting text into lines and removing empty ones
        const lines = fullText.split("\n").filter((line) => line.trim().length > 0);

        let currentChunk = '';
        let chunkIndex = 0;
        let currentSection = 'General';
        let charsSoFar = 0;

        const sectionPattern = /^(Section|Chapter|CHAPTER|PART|Part|\d+\.[\d.]*\s|[A-Z][A-Z\s]{4,}:?$)/;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (sectionPattern.test(trimmedLine) && trimmedLine.length < 200) {
                currentSection = trimmedLine.substring(0, 100);
            }
            currentChunk += line + '\n';
            charsSoFar += line.length;

            if (currentChunk.length >= 1500) {
                const estimatedPage = Math.max(1, Math.ceil(charsSoFar / 3000));

                //Saving this chunk;
                chunks.push({
                    chunkText: currentChunk.trim(),
                    chunkIndex: chunkIndex,
                    metadata: {
                        pageNumber: estimatedPage,
                        sectionTitle: currentSection,
                        paragraph: chunks.length + 1,
                    }
                });
                chunkIndex++;
                //Keep last 300 characters as the start of the next chunk
                currentChunk = currentChunk.slice(-300);
            }
        }
        //After the loop there might be remaining text 
        if (currentChunk.trim().length > 50) {
            const estimatedPage = Math.max(1, Math.ceil(charsSoFar / 3000));

            chunks.push({
                chunkText: currentChunk.trim(),
                chunkIndex: chunkIndex,
                metadata: {
                    pageNumber: estimatedPage,
                    sectionTitle: currentSection,
                    paragraph: chunks.length + 1,
                }
            });
        }
        console.log(`   ✅ Created ${chunks.length} chunks`);
        console.log(
            `   📊 Avg chunk size: ${Math.round(
                fullText.length / Math.max(chunks.length, 1)
            )} chars`
        );
        return chunks;
    }

    // step 4 Generate embeddings
    private async generateEmbeddings(chunks: Array<{ chunkText: string; chunkIndex: number; metadata: any; }>): Promise<Array<{ chunkText: string; chunkIndex: number; metadata: any; embedding: number[]; }>> {
        console.log('🧠 Step 4/5: Generating embeddings (Gemini)...');
        console.log(`   Processing ${chunks.length} chunks in batches of 20...`);

        const embeddedChunks: Array<{
            chunkText: string;
            chunkIndex: number;
            metadata: any;
            embedding: number[];
        }> = [];

        // Google Gemini supports batch embedding.
        // Batch size limit is 100, but we stick to 20 for safety/rate limits.
        const BATCH_SIZE = 20;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const texts = batch.map((chunk) => chunk.chunkText);

            try {
                // Call Gemini Embedding API
                const result = await embeddingModel.batchEmbedContents({
                    requests: texts.map((text) => ({
                        content: { role: 'user', parts: [{ text }] },
                        taskType: "RETRIEVAL_DOCUMENT" as any, // Cast to any if TaskType enum isn't imported
                        title: "Document Chunk"
                    }))
                });

                // Gemini returns 'embeddings' array
                const embeddings = result.embeddings;

                // Combine chunks with embeddings
                for (let j = 0; j < batch.length; j++) {
                    if (embeddings[j] && embeddings[j].values) {
                        embeddedChunks.push({
                            chunkText: batch[j].chunkText,
                            chunkIndex: batch[j].chunkIndex,
                            metadata: batch[j].metadata,
                            embedding: embeddings[j].values,
                        });
                    }
                }

                console.log(`   📦 Embedded ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);

            } catch (error: any) {
                console.error(`   ❌ Error embedding batch ${i / BATCH_SIZE + 1}:`, error.message);

                if (error.message?.includes('429') || error.status === 429) {
                    console.log('   ⏳ Rate limited. Waiting 10s...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    i -= BATCH_SIZE; // Retry this batch
                } else {
                    throw error;
                }
            }
        }

        console.log(`   ✅ Generated ${embeddedChunks.length} embeddings using Gemini`);
        return embeddedChunks;
    }
    // step 5 storing chunks in mongodb
    private async storeChunks(schemeId: string, embeddedChunks: Array<{ chunkText: string; chunkIndex: number; metadata: any; embedding: number[]; }>): Promise<number> {
        console.log('💾 Step 5/5: Storing chunks in database...');
        //Delete old chunks (if reprocessing)
        const deleted = await SchemeChunk.deleteMany({ schemeId });

        if (deleted.deletedCount > 0) {
            console.log(`   🗑️  Deleted ${deleted.deletedCount} old chunks`);
        }

        //Preparing documents for insertion
        const documents = embeddedChunks.map((chunk) => ({
            schemeId: schemeId,
            chunkText: chunk.chunkText,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
            embedding: chunk.embedding
        }));

        //Insert all at once
        await SchemeChunk.insertMany(documents);

        console.log(`   ✅ Stored ${documents.length} chunks in MongoDB`);


        return documents.length;
    }


    //Master function: ProcessScheme
    //Orchestrates the entire pipeline called after pdf is uploaded  to the cloudinary..

    async processScheme(schemeId: string): Promise<void> {
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║  Starting PDF Processing Pipeline    ║');
        console.log('╚══════════════════════════════════════╝\n');

        const scheme = await Scheme.findById(schemeId);
        if (!scheme) {
            throw new Error("Scheme not found with Id: " + schemeId);
        }
        console.log(`📋 Scheme: ${scheme.name} (${scheme.shortName})`);

        try {
            //Update status to processing
            scheme.processingStatus = 'processing';
            scheme.processingError = undefined; //Clear any previous error
            await scheme.save();

            //step 1 fetch pdf
            const pdfBuffer = await this.fetchPDF(scheme.pdf.cloudinaryUrl);

            //step 2 Extract text
            const { text, totalPages } = await this.extractText(pdfBuffer);

            //step 3 chunk text
            const chunks = this.chunkText(text);

            //validate we got meaningful chunks
            if (chunks.length === 0) {
                throw new Error("No chunks created. PDF might be empty ro unreadable");
            }

            //Step 4: Generate embeddings 
            const embeddedChunks = await this.generateEmbeddings(chunks);

            //Step 5 Store chunks in MongoDB
            const totalChunks = await this.storeChunks(schemeId, embeddedChunks);

            //Update Scheme with results
            scheme.processingStatus = 'completed';
            scheme.totalChunks = totalChunks;
            scheme.pdf.totalPages = totalPages;

            scheme.extractedText = text.substring(0, 5000);

            await scheme.save();

            console.log('\n╔══════════════════════════════════════╗');
            console.log(`║  ✅ Processing Complete!              ║`);
            console.log(`║  Scheme: ${scheme.shortName.padEnd(25)}   ║`);
            console.log(`║  Pages:  ${String(totalPages).padEnd(25)}   ║`);
            console.log(`║  Chunks: ${String(totalChunks).padEnd(25)}   ║`);
            console.log('╚══════════════════════════════════════╝\n');

        } catch (error: any) {
            console.error(`\n❌ Processing FAILED: ${error.message}\n`);

            scheme.processingStatus = 'failed';
            scheme.processingError = error.message;
            await scheme.save();
        }
    }
    //Helper sleep function: used for rate limiting delays

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default new PDFProcessingService();