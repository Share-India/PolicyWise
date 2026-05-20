import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const modelName = process.env.AI_MODEL || "gemini-2.0-flash";

if (!apiKey) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function diagnostic() {
    console.log(`🔍 Testing Gemini API (${modelName})...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'API ACCESS GRANTED' if you can read this.");
        console.log("✅ Basic connectivity:", result.response.text());
        
        console.log("🔍 Testing Google Search Grounding tool...");
        try {
            const searchModel = genAI.getGenerativeModel({
                model: modelName,
                tools: [{ googleSearch: {} }] as any
            });
            const searchResult = await searchModel.generateContent("Who is the CEO of L&T Technology Services?");
            console.log("✅ Search Grounding:", searchResult.response.text());
        } catch (searchErr: any) {
            console.warn("⚠️ Search Grounding failed:", searchErr.message);
        }

        console.log("🔍 Testing JSON Schema Extraction...");
        try {
            const extractionModel = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });
            const extractionResult = await extractionModel.generateContent("Return a JSON object with a 'success' field set to true.");
            console.log("✅ JSON Extraction:", extractionResult.response.text());
        } catch (jsonErr: any) {
            console.error("❌ JSON Extraction failed:", jsonErr.message);
        }

    } catch (err: any) {
        console.error("❌ CRITICAL API FAILURE:", err.message);
        if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
            console.error("🚨 QUOTA EXCEEDED: You have run out of Gemini AI credits.");
        } else if (err.message.toLocaleLowerCase().includes("key")) {
            console.error("🚨 INVALID API KEY: Double check your .env.local key.");
        }
    }
}

diagnostic();
