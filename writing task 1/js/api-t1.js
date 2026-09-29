// Quản lý API Key và luồng Streaming AI Gemini kết hợp Fallback & Auto-Retry
const _RAW_KEY_PREFIX = "AQ.Ab8RN6LoONZ7";
const _RAW_KEY_SUFFIX = "Kv0TPNh64u7GAOAjzwHWEibj6sCgHvh0ruQVRQ";

export function getApiKey() {
  return `${_RAW_KEY_PREFIX}${_RAW_KEY_SUFFIX}`;
}

// Danh sách Model theo thứ tự ưu tiên
const ACTIVE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
];

export async function streamGeminiTask1(promptPayload, onChunk) {
  const apiKey = getApiKey();

  for (const model of ACTIVE_MODELS) {
    let attempts = 0;
    const maxAttempts = model.includes('lite') ? 3 : 1; // Bản lite retry 3 lần, bản thường gọi 1 lần

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Đang gọi model: ${model} (Lần thử ${attempts}/${maxAttempts})...`);

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

        // Nếu server quá tải (503) hoặc rate limit (429), ném lỗi để retry hoặc fallback
        if (response.status === 503 || response.status === 429) {
          throw new Error(`Server busy: ${response.status}`);
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`API Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let hasReceivedData = false;

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
                if (textChunk) {
                  hasReceivedData = true;
                  onChunk(textChunk);
                }
              } catch (err) {
                // Bỏ qua heartbeat / ký tự thừa
              }
            }
          }
        }

        // Nếu đã nhận và stream dữ liệu thành công
        if (hasReceivedData) {
          console.log(`Thành công với model: ${model}`);
          return model;
        } else {
          throw new Error("Không nhận được dữ liệu phản hồi từ model.");
        }

      } catch (error) {
        console.warn(`Lỗi ở model ${model} (Lần ${attempts}):`, error.message);

        // Nếu còn lượt retry, cho nghỉ 1.5s rồi thử lại cùng model
        if (attempts < maxAttempts) {
          await new Promise((res) => setTimeout(res, 1500));
        }
      }
    }

    console.warn(`Model ${model} thất bại hoàn toàn. Chuyển sang model tiếp theo trong danh sách...`);
  }

  throw new Error("Tất cả các model Gemini khả dụng đều đang bận. Vui lòng thử lại sau ít phút.");
}
