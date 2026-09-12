export const StorageManager = {
  // 👇 DÁN ĐƯỜNG LINK GOOGLE APPS SCRIPT BẠN VỪA COPY VÀO ĐÂY 👇
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbz_dien_link_cua_ban_vao_day/exec",

  KEYS: {
    USER: 'sv_user_data_v',
    PROGRESS: 'sv_word_progress_v',
    LEADERBOARD: 'sv_weekly_league_v',
    SESSION_COUNT: 'sv_total_sessions_count_v'
  },

  getUser() {
    const raw = localStorage.getItem(this.KEYS.USER);
    // Tự động lấy tên & email học viên từ hệ thống làm bài IELTS ngoài trang chủ nếu có
    const studentName = localStorage.getItem('ielts_student_name') || 'Học viên';
    const studentEmail = localStorage.getItem('ielts_student_email') || '';

    if (raw) {
      const u = JSON.parse(raw);
      if (!u.email && studentEmail) u.email = studentEmail;
      if (u.name === 'Bạn (Học viên)' && studentName) u.name = studentName;
      return u;
    }

    return {
      name: studentName,
      email: studentEmail,
      xp: 0,
      streak: 1,
      freezeCards: 1,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      currentLeague: 'Bạc'
    };
  },

  saveUser(user) {
    localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
  },

  getSessionCount() {
    return parseInt(localStorage.getItem(this.KEYS.SESSION_COUNT) || '0', 10);
  },

  incrementSessionCount() {
    const count = this.getSessionCount() + 1;
    localStorage.setItem(this.KEYS.SESSION_COUNT, count.toString());
    return count;
  },

  getWordProgress() {
    const raw = localStorage.getItem(this.KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  },

  saveWordProgress(progress) {
    localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progress));
  },

  getLeaderboard() {
    const raw = localStorage.getItem(this.KEYS.LEADERBOARD);
    return raw ? JSON.parse(raw) : null;
  },

  saveLeaderboard(data) {
    localStorage.setItem(this.KEYS.LEADERBOARD, JSON.stringify(data));
  },

  async sendSessionToCloud(payload) {
    if (!this.GOOGLE_SCRIPT_URL || this.GOOGLE_SCRIPT_URL.includes("dien_link_cua_ban")) {
      console.warn("Chưa cấu hình Google Script URL, dữ liệu chỉ lưu tại máy.");
      return;
    }
    try {
      fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "save_vocab_session",
          ...payload
        })
      });
    } catch (e) {
      console.warn("Lỗi gửi dữ liệu lên Google Drive:", e);
    }
  }
};
