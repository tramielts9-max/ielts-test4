/**
 * js/config.js - Cấu hình tập trung toàn hệ thống
 */
export const CONFIG = {
  AI_AND_SHEET_URL: "https://script.google.com/macros/s/AKfycby7vRFXq_YhjIEq4kN-8NLRFw2sj-7VkVEmTw6IkNkPmidEPnPtxtNkSE-HKfn5mAPfbw/exec",
  DRIVE_STORAGE_URL: "https://script.google.com/macros/s/AKfycbx5HRPHr75RLlcuXvcn1QSTmsLszIhYH6cDrKiGZS4RCoxa0l3NJF4dKWplI1sVKVoCYg/exec",
  STORAGE_KEYS: {
    STUDENT_NAME: "ielts_student_name",
    STUDENT_EMAIL: "ielts_student_email",
    SYSTEM_SETTINGS: "ielts_system_settings"
  },
  // 👑 DANH SÁCH EMAIL CÓ QUYỀN ADMIN (Điền email của bạn vào đây)
  ADMIN_EMAILS: [
    "tramielts9@gmail.com",
    "dinhnguyenphuc019.2@gmail.com"
  ],
  // DANH MỤC CÁC PHÂN HỆ CÓ THỂ BẬT / TẮT BẢO TRÌ
  MODULES: {
    vocab: { name: "1. Luyện Từ Vựng Thông Minh (Vocab)" },
    grammar: { name: "2. Ngữ Pháp Trọng Tâm (Grammar)" },
    pre_listening: { name: "3. Pre-Listening (Luyện Nghe Phản Xạ)" },
    listening: { name: "4. IELTS Listening (Cam 17 - 21)" },
    pre_reading: { name: "5. Pre-Reading (Kỹ Năng Đọc Quét)" },
    reading: { name: "6. IELTS Reading (Cam 17 - 21)" },
    pre_writing_t1: { name: "7A. Pre-Writing Task 1 (Mô Tả Biểu Đồ)" },
    pre_writing_t2: { name: "7B. Pre-Writing Task 2 (Dịch Luận)" },
    writing: { name: "8. Phòng Sửa Bài IELTS Writing 2 Tầng" },
    pre_speaking: { name: "9. Pre-Speaking (Phát Âm IPA)" },
    speaking: { name: "10. Phòng Luyện Nói IELTS Speaking 2 Tầng" }
  }
};
