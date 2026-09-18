import { GRAMMAR_CONFIG } from './config-g.js';

class GrammarStateManager {
  constructor() {
    this.storageKey = GRAMMAR_CONFIG.STORAGE_KEYS.USER_PROGRESS;
  }

  getProgress() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch(e) {
      return {};
    }
  }

  saveLessonScore(topicId, score, total) {
    const progress = this.getProgress();
    const percent = Math.round((score / total) * 100);
    progress[topicId] = {
      score,
      total,
      percent,
      passed: percent >= GRAMMAR_CONFIG.PASSING_SCORE_PERCENT,
      updatedAt: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem(this.storageKey, JSON.stringify(progress));
  }

  getUser() {
    return {
      name: localStorage.getItem(GRAMMAR_CONFIG.STORAGE_KEYS.STUDENT_NAME) || "Học viên",
      email: localStorage.getItem(GRAMMAR_CONFIG.STORAGE_KEYS.STUDENT_EMAIL) || ""
    };
  }
}

export const grammarState = new GrammarStateManager();
