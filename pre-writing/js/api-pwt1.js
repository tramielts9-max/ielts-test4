// Quản lý kết nối AI Gemini Streaming với Fallback tự động
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 74, 86, 73, 115, 112, 77, 79, 
  86, 90, 101, 76, 50, 76, 102, 117, 73, 80, 119, 68, 104, 104, 51, 
  79, 105, 53, 119, 115, 81, 83, 121, 100, 51, 105, 90, 87, 65, 102, 
  109, 90, 109, 83, 115, 87, 65
];

export function getApiKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

export async function streamGeminiPWT1(parts, onChunk) {
  const apiKey = getApiKey();
  const modelsQueue = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;
  for (let model of modelsQueue) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: parts }] })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              onChunk(textChunk);
            } catch (e) {}
          }
        }
      }
      return model;
    } catch (err) {
      console.warn(`[PWT1] Model ${model} gặp sự cố: ${err.message}. Chuyển sang model tiếp theo...`);
      lastError = err;
    }
  }
  throw lastError;
}
