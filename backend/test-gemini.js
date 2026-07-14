require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    console.log("Pinging Gemini 1.5 Flash...");
    const result = await model.generateContent("Hello, are you online? Reply with a short sentence.");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Gemini Test Failed:", error);
  }
}

testGemini();
