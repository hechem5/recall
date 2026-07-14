export async function synthesizeAnswer(query: string, contextChunks: { sourceId: string, content: string, title?: string, url?: string, savedAt?: string, isRecent?: boolean }[]): Promise<string> {
  const contextBlock = contextChunks.map((c, i) => {
    let text = `[${i + 1}] Source: ${c.title || c.url || 'Unknown'}`;
    if (c.savedAt) text += ` (Saved: ${c.savedAt})`;
    if (c.isRecent) text += ` (RECENTLY SAVED)`;
    text += `\nContent:\n${c.content}`;
    return text;
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

  try {
    const makeRequest = async (modelName: string) => {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 1024,
        })
      });
      return response;
    };

    let response = await makeRequest("llama-3.3-70b-versatile");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Synthesis] Groq API error:", response.status, errorText);
      
      try {
        const errObj = JSON.parse(errorText);
        // Fallback if the model is decommissioned
        if (errObj?.error?.code === "model_decommissioned") {
          console.warn(`[Synthesis] Model decommissioned, falling back to secondary model...`);
          response = await makeRequest("llama-3.1-8b-instant");
          
          if (!response.ok) {
            const fallbackError = await response.text();
            console.error("[Synthesis] Fallback Groq API error:", response.status, fallbackError);
            throw new Error(`Groq API fallback returned ${response.status}`);
          }
        } else {
          throw new Error(`Groq API returned ${response.status}: ${errObj?.error?.message || 'Unknown error'}`);
        }
      } catch (parseError) {
        // If it's not JSON or another error occurred parsing/falling back
        throw new Error(`Groq API returned ${response.status}`);
      }
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("[Synthesis] Groq synthesis failed:", error);
    throw new Error("Failed to synthesize answer");
  }
}
