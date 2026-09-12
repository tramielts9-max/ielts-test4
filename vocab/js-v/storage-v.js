export const StorageManager = {
  KEYS: {
    USER: 'sv_user_data_v',
    PROGRESS: 'sv_word_progress_v',
    LEADERBOARD: 'sv_weekly_league_v'
  },

  getUser() {
    const raw = localStorage.getItem(this.KEYS.USER);
    if (raw) return JSON.parse(raw);
    return {
      name: 'Bạn (Học viên)',
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
  }
};
