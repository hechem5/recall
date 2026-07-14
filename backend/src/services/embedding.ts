import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // Roughly 300-500 tokens since 1 token ~ 4 characters
  chunkOverlap: 50,
});

export async function splitText(text: string): Promise<string[]> {
  const documents = await textSplitter.createDocuments([text]);
  return documents.map(doc => doc.pageContent);
}

export async function embedText(text: string): Promise<number[]> {
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] }
  });
  return result.embedding.values;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];
  
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
