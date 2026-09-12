/**
 * js/state.js - Quản lý trạng thái, phiên làm bài và LocalStorage
 */
import { CONFIG } from './config.js';

export class StateManager {
  constructor() {
    this.initTestKey();
    this.isReviewMode = false;
  }

  // Tự động nhận diện chính xác mã đề từ URL param "?test="
  initTestKey() {
    const params = new URLSearchParams(window.location.search);
    const testId = params.get('test');
    if (testId) {
      this.testKey = 'ielts_state_' + testId.replace(/\.json$/i, '');
    } else {
      const pageName = window.location.pathname.split('/').pop() || 'default_test';
      this.testKey = 'ielts_state_' + pageName;
    }
  }

  getUser() {
    return {
      name: localStorage.getItem(CONFIG.STORAGE_KEYS.STUDENT_NAME) || '',
      email: localStorage.getItem(CONFIG.STORAGE_KEYS.STUDENT_EMAIL) || ''
    };
  }

  saveUser(name, email) {
    if (name) localStorage.setItem(CONFIG.STORAGE_KEYS.STUDENT_NAME, name.trim());
    if (email) localStorage.setItem(CONFIG.STORAGE_KEYS.STUDENT_EMAIL, email.trim().toLowerCase());
  }

  saveTestProgress(data) {
    if (this.isReviewMode) return;
    try {
      localStorage.setItem(this.testKey, JSON.stringify(data));
    } catch (e) {
      console.warn("Không thể lưu tiến trình bài làm:", e);
    }
  }

  getSavedProgress() {
    try {
      const raw = localStorage.getItem(this.testKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  clearProgress() {
    localStorage.removeItem(this.testKey);
  }
}

export const stateManager = new StateManager();
