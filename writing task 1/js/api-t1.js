// Quản lý API Key mới và luồng Streaming AI Gemini
const _RAW_KEY_PREFIX = "AQ.Ab8RN6LoONZ7";
const _RAW_KEY_SUFFIX = "Kv0TPNh64u7GAOAjzwHWEibj6sCgHvh0ruQVRQ";

export function getApiKey() {
  return `${_RAW_KEY_PREFIX}${_RAW_KEY_SUFFIX}`;
}

export async function streamGeminiTask1(promptPayload, onChunk) {
  const apiKey = getApiKey();

  // Danh sách model ưu tiên theo đúng yêu cầu
  const modelsQueue = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
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
              // Bỏ qua heartbeat / ký tự thừa
            }
          }
        }
      }
      return model; // Chạy thành công thì dừng
    } catch (err) {
      console.warn(`Model ${model} báo lỗi (${err.message}). Đang tự động chuyển sang model kế tiếp...`);
      lastError = err;
    }
  }

  throw lastError;
}
