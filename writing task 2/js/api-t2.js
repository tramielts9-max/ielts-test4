// Quản lý API Key mới và luồng Streaming AI Gemini (Ưu tiên 3.5 Flash Lite -> 3.1 Flash Lite)
const _PART_A = "AQ.Ab8RN6KWLXb1oBst";
const _PART_B = "CGKtMbk9TgRr1fFo8pVZhk6QlO3kWFkQ0w";

export function getApiKey() {
  return `${_PART_A}${_PART_B}`;
}

export async function streamGeminiTask2(promptPayload, onChunk) {
  const apiKey = getApiKey();
  // Hàng đợi model: Ưu tiên gemini-3.5-flash-lite, tiếp theo gemini-3.1-flash-lite, sau đó fallback các bản flash khác
  const modelsQueue = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ];

  let lastError = null;

  for (const model of modelsQueue) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: promptPayload }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP status ${response.status}`);
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
            const rawJson = line.replace("data: ", "").trim();
            try {
              const parsed = JSON.parse(rawJson);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              onChunk(textChunk);
            } catch (err) {
              // Bỏ qua dòng heartbeat hoặc rỗng
            }
          }
        }
      }
      return model; // Kết thúc streaming thành công
    } catch (err) {
      console.warn(`Model [${model}] gặp sự cố: ${err.message}. Đang thử model kế tiếp...`);
      lastError = err;
    }
  }

  throw lastError;
}
