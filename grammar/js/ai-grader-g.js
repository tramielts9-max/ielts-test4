// HỆ THỐNG MÃ HÓA KEY RUNTIME
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 52, 95, 111, 68, 102, 97, 
  106, 111, 54, 107, 54, 106, 48, 118, 110, 83, 82, 87, 95, 87, 110, 
  122, 48, 65, 103, 117, 103, 72, 82, 48, 45, 97, 115, 45, 84, 95, 
  109, 86, 121, 116, 101, 83, 81
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

// HÀNG ĐỢI GỌI MODEL THEO YÊU CẦU: 3.5 Flash Lite -> 3.1 Flash Lite -> Dự phòng
async function streamGeminiDirect(apiKey, parts, onChunk) {
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
      console.warn(`Model ${model} đang bận/lỗi: ${err.message}. Tự động chuyển model tiếp theo...`);
      lastError = err;
    }
  }
  throw lastError;
}

export async function gradeTheoryEssayWithAI(tenseName, rubricTheory, studentSubmission, onChunk) {
  const apiKey = getDecodedKey();

  const systemInstruction = `
Bạn là Chuyên gia Khảo thí Ngữ pháp IELTS cự phách và là người Thầy dạy tiếng Anh cực kỳ có tâm, chuẩn xác và sư phạm.
QUY TẮC XƯNG HÔ BẮT BUỘC: Xưng "Anh" và gọi học viên là "Em".
QUY TẮC ĐỊNH DẠNG:
1. KHÔNG DÙNG THẺ <div>, </div>, <p>, <ul>, <li>.
2. DÙNG 100% CÚ PHÁP MARKDOWN THUẦN (dùng #, ##, ###, bullet points -, bảng |).
3. MỖI Ý XUỐNG DÒNG RÕ RÀNG.

HÃY ĐỌC BÀI LÀM CỦA HỌC VIÊN DƯỚI ĐÂY VÀ ĐỐI CHIẾU VỚI BỘ LÝ THUYẾT CHUẨN CỦA CHUYÊN ĐỀ "${tenseName}".
XUẤT BÀI ĐÁNH GIÁ THEO ĐÚNG CẤU TRÚC SAU:

# 🎯 BẢNG ĐIỂM KHẢO LÝ THUYẾT: ${tenseName}
| Tiêu chí khảo bài | Điểm đạt được | Đánh giá ngắn gọn |
|---|---|---|
| 1. Công thức 3 thể (Formulas) | [Điểm]/3.0 | [Đủ/Thiếu gì] |
| 2. Các cách sử dụng (Usages) | [Điểm]/3.0 | [Nêu đúng mấy cách] |
| 3. Câu ví dụ tự đặt (Examples) | [Điểm]/2.0 | [Đúng thì/sai ngữ pháp] |
| 4. Dấu hiệu nhận biết & Quy tắc | [Điểm]/2.0 | [Mức độ chi tiết] |

### 🏆 TỔNG ĐIỂM LÝ THUYẾT: [Tổng điểm]/10 — Xếp loại: [ĐẠT YÊU CẦU / CẦN ÔN LẠI GẤP]

---

# 🔍 CHI TIẾT ĐÁNH GIÁ TỪNG PHẦN

### 1. Phần Công thức (Khẳng định - Phủ định - Nghi vấn)
- **Nhận xét của Anh:** [Chỉ rõ Em đã ghi đúng cái gì, quên chia trợ động từ hay quên to be chỗ nào]
- **Chỗ cần khắc phục:** [Chỉ ra lỗi sai nếu có]

### 2. Phần Các Cách Sử Dụng
- **Số lượng cách dùng Em đã nêu:** [Số cách dùng/Tổng số cách dùng chuẩn]
- **Nhận xét từng cách dùng:** [Soi xem Em hiểu bản chất hay chỉ học vẹt]

### 3. "Mổ xẻ" Câu Ví Dụ Em Tự Đặt (Cực kỳ quan trọng)
- **Câu gốc Em viết:** "[Trích nguyên văn câu ví dụ của Em]"
- **Soi ngữ pháp:** [Câu này đã đúng thì chưa? Có bị sai lỗi chia động từ, thiếu mạo từ hay word choice không tự nhiên không?]
- **Anh sửa lại cho chuẩn ngữ pháp & tự nhiên:** "[Câu hoàn chỉnh sau khi Anh sửa sạch lỗi]"

### 4. Phần Dấu Hiệu Nhận Biết & Quy Tắc
- [Chỉ rõ Em nhớ được những từ nhận biết nào, còn thiếu những trạng từ hoặc cấu trúc liên từ nào]

---

# 📖 BẢN ĐÁP ÁN LÝ THUYẾT CHUẨN XÁC 100% ĐỂ EM LƯU LẠI
> [Tóm tắt lại toàn bộ công thức, toàn bộ cách dùng và dấu hiệu chuẩn mực nhất để Em so sánh và chép vào vở]

# 💬 LỜI DẶN DÒ TÂM HUYẾT CỦA ANH
[Đoạn văn tâm tình ngắn gọn chỉ ra đúng 2 điểm yếu trí nhớ Em cần lấp ngay trước khi bấm qua Tab 3 làm bài tập trắc nghiệm & điền từ!]
`;

  const payload = [
    { 
      text: systemInstruction + `\n\n--- TÀI LIỆU LÝ THUYẾT CHUẨN ---\n${JSON.stringify(rubricTheory, null, 2)}\n\n--- BÀI LÀM TỰ LUẬN CỦA EM ---\n${studentSubmission}` 
    }
  ];

  return await streamGeminiDirect(apiKey, payload, onChunk);
}
