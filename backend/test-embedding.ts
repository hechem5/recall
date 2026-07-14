import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No GEMINI_API_KEY found!");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  try {
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text: "Hello, world!" }] },
      outputDimensionality: 768
    });
    console.log("Success! Dimension:", result.embedding.values.length);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
