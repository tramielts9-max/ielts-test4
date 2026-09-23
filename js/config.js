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
  // DANH SÁCH EMAIL CÓ QUYỀN ADMIN (Thêm email của bạn vào đây)
  ADMIN_EMAILS: [
    "tramielts9@gmail.com",
    "dinhnguyenphuc019.2@gmail.com"
  ],
  // DANH MỤC CÁC MODULE CÓ THỂ BẬT / TẮT
  MODULES: {
    vocab: { name: "1. Từ Vựng Thông Minh (Vocab)", link: "vocab/index-v.html", active: true },
    grammar: { name: "2. Ngữ Pháp Trọng Tâm (Grammar)", link: "grammar/index-g.html", active: true },
    pre_listening: { name: "3. Pre-Listening (ELLLO)", link: "pre-listening/index-pl.html", active: true },
    listening: { name: "4. IELTS Listening (Cam 17-21)", link: "listening.html", active: true },
    pre_reading: { name: "5. Pre-Reading (Kỹ Năng)", link: "pre-reading/index-pr.html", active: true },
    reading: { name: "6. IELTS Reading (Cam 17-21)", link: "reading.html", active: true },
    pre_writing_t1: { name: "7A. Pre-Writing Task 1", link: "pre-writing/index-pwt1.html", active: true },
    pre_writing_t2: { name: "7B. Pre-Writing Task 2", link: "pre-writing/index-pwt2.html", active: true },
    writing: { name: "8. IELTS Writing 2 Tầng", link: "writing/index-w.html", active: true },
    speaking: { name: "9. IELTS Speaking 2 Tầng", link: "speaking/index-s.html", active: true }
  }
};
