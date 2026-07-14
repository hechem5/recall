"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeAnswer = synthesizeAnswer;
async function synthesizeAnswer(query, sources) {
    // Build context from unified sources
    const contextBlock = sources.map((c, i) => {
        const meta = [
            c.title ? `Title: ${c.title}` : '',
            c.url ? `URL: ${c.url}` : '',
            c.type ? `Type: ${c.type}` : '',
            c.savedAt ? `Saved: ${c.savedAt}` : '',
            c.isRecent ? `(RECENTLY SAVED)` : ''
        ].filter(Boolean).join(' | ');
        return `[Source ${i + 1}]${meta ? ` (${meta})` : ''}\n${c.content}`;
    }).join('\n\n---\n\n');
    const systemPrompt = `You are Recall — a private, personal memory assistant. Your ONLY job is to answer questions using the user's saved memory items shown below.

STRICT RULES — you MUST follow all of these without exception:
1. ONLY answer using information from the provided memories. NEVER use outside knowledge.
2. If the memories contain the answer, provide it IMMEDIATELY. DO NOT start your response with "I don't have that saved" and then correct yourself. DO NOT use conversational fillers.
3. If, and ONLY if, the memories completely lack the answer, reply with exactly: "I don't have that saved in your memory."
4. DO NOT provide unsolicited information. If the user asks for ONE specific thing (e.g. "the last YouTube video"), DO NOT mention other unrelated items (e.g. PDFs or other links).
5. For "last saved" or "most recent" questions, pay close attention to sources marked as (RECENTLY SAVED).
6. Always cite the exact source you used with [1], [2], etc. (Do not write [Source 1], just write [1]).
7. If you mention a website or a URL in your answer, YOU MUST format it as a clickable markdown link (e.g., [Website Name](https://example.com)).`;
    const userPrompt = `User's question: "${query}"

--- BEGIN MEMORIES ---
${contextBlock}
--- END MEMORIES ---

Answer the question using ONLY the memories above. Remember: If you find the answer, state it directly without any preamble. If it's missing entirely, say exactly: "I don't have that saved in your memory."`;
    const modelsToTry = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemini-2.0-pro-exp-02-05:free",
        "deepseek/deepseek-chat:free",
        "openrouter/auto"
    ];
    let lastError = null;
    for (const model of modelsToTry) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Recall Semantic Search",
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0,
                    max_tokens: 800,
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`[Synthesis] Model ${model} failed with ${response.status}:`, errorText);
                lastError = new Error(`OpenRouter API failed with status: ${response.status}`);
                // Try the next model for ANY API error (429, 500, 502, 404, etc)
                continue;
            }
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            }
            return "Could not synthesize an answer.";
        }
        catch (error) {
            lastError = error;
            // If it's a fetch error (network), try the next model. 
            // If it's a thrown error (like a 500), the loop will continue.
            console.warn(`[Synthesis] Network error on model ${model}:`, error);
        }
    }
    console.error("Synthesis error: All fallback models failed. Last error:", lastError);
    throw lastError;
}
//# sourceMappingURL=synthesis.js.map