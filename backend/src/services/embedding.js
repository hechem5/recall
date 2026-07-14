"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitText = splitText;
exports.embedText = embedText;
exports.embedTexts = embedTexts;
const generative_ai_1 = require("@google/generative-ai");
const textsplitters_1 = require("@langchain/textsplitters");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const textSplitter = new textsplitters_1.RecursiveCharacterTextSplitter({
    chunkSize: 500, // Roughly 300-500 tokens since 1 token ~ 4 characters
    chunkOverlap: 50,
});
async function splitText(text) {
    const documents = await textSplitter.createDocuments([text]);
    return documents.map(doc => doc.pageContent);
}
async function embedText(text) {
    const result = await model.embedContent({
        content: { role: "user", parts: [{ text }] }
    });
    return result.embedding.values;
}
async function embedTexts(texts) {
    const allEmbeddings = [];
    // Gemini batch limit is 100
    for (let i = 0; i < texts.length; i += 100) {
        const batchTexts = texts.slice(i, i + 100);
        const requests = batchTexts.map(t => ({
            content: { role: "user", parts: [{ text: t }] },
            outputDimensionality: 768
        }));
        const result = await model.batchEmbedContents({ requests });
        allEmbeddings.push(...result.embeddings.map(e => e.values));
    }
    return allEmbeddings;
}
//# sourceMappingURL=embedding.js.map