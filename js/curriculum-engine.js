/**
 * js/curriculum-engine.js
 * BỘ MÁY ĐIỀU PHỐI: GỌT ĐỐT, TÍNH THỜI LƯỢNG & TỰ ĐỘNG SINH LỊCH HỌC
 */

import { CURRICULUM_NODES } from './curriculum-manifest.js';

export class CurriculumEngine {
  constructor() {
    this.allNodes = [...CURRICULUM_NODES];
  }

  /**
   * 1. GỌT ĐỐT (PRUNING): Loại bỏ các đốt học sinh đã thành thạo
   * @param {Array<string>} masteredTags - Danh sách tag học sinh làm đúng trong bài Test đầu vào
   * @returns {Array} Danh sách các đốt giữ lại cho học sinh
   */
  pruneCurriculum(masteredTags = []) {
    if (!masteredTags || masteredTags.length === 0) {
      return this.allNodes; // Không gọt nếu mất gốc hoàn toàn
    }

    return this.allNodes.filter(node => {
      // Nếu tất cả tags của bài này đều nằm trong danh sách đã giỏi -> CẮT BỎ
      const isMastered = node.tags.every(tag => masteredTags.includes(tag));
      return !isMastered;
    });
  }

  /**
   * 2. PHÂN LOẠI TỐC ĐỘ (SPEED PROFILER) DỰA TRÊN BÀI TEST
   * @param {number} actualSecondsSpent - Thời gian học sinh hoàn thành bài test
   * @param {number} benchmarkSeconds - Thời gian chuẩn của đề
   * @returns {string} 'fast' | 'normal' | 'slow'
   */
  determineSpeedProfile(actualSecondsSpent, benchmarkSeconds) {
    const ratio = actualSecondsSpent / (benchmarkSeconds || 1);
    if (ratio <= 0.8) return 'fast';
    if (ratio <= 1.25) return 'normal';
    return 'slow';
  }

  /**
   * 3. TÍNH TOÁN TỔNG THỜI LƯỢNG & GIỜ GIÁO VIÊN
   * @param {Array} retainedNodes - Danh sách đốt giữ lại sau khi gọt
   * @param {string} speedProfile - 'fast' | 'normal' | 'slow'
   */
  calculateTotals(retainedNodes, speedProfile = 'normal') {
    let totalMinutes = 0;
    let totalCoachHours = 0;

    retainedNodes.forEach(node => {
      const dur = node.duration[speedProfile] || node.duration.normal;
      totalMinutes += dur;
      totalCoachHours += (node.coachHours || 0);
    });

    return {
      totalSelfStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalCoachHours: Math.round(totalCoachHours * 10) / 10,
      nodeCount: retainedNodes.length
    };
  }

  /**
   * 4. BỘ MÁY TỰ ĐỘNG SINH LỊCH HỌC MỖI NGÀY (DAILY CALENDAR GENERATOR)
   * @param {Array} retainedNodes - Các đốt cần học
   * @param {string} speedProfile - Tốc độ học
   * @param {number} dailyHoursCommitment - Số giờ học sinh cam kết học mỗi ngày (ví dụ: 1.5 tiếng)
   */
  generateDailyCalendar(retainedNodes, speedProfile = 'normal', dailyHoursCommitment = 1) {
    const dailyTargetMinutes = dailyHoursCommitment * 60;
    const calendarDays = [];
    
    let currentDayIndex = 1;
    let currentDayNodes = [];
    let currentDayMinutes = 0;

    retainedNodes.forEach(node => {
      const nodeMinutes = node.duration[speedProfile] || node.duration.normal;

      // Nếu thêm bài này mà vượt quá chỉ tiêu trong ngày và ngày đó đã có ít nhất 1 bài
      if (currentDayMinutes + nodeMinutes > dailyTargetMinutes && currentDayNodes.length > 0) {
        calendarDays.push({
          dayNumber: currentDayIndex,
          totalMinutes: currentDayMinutes,
          nodes: currentDayNodes
        });

        currentDayIndex++;
        currentDayNodes = [];
        currentDayMinutes = 0;
      }

      currentDayNodes.push({
        ...node,
        assignedDurationMinutes: nodeMinutes
      });
      currentDayMinutes += nodeMinutes;
    });

    // Đẩy nốt các đốt của ngày cuối cùng
    if (currentDayNodes.length > 0) {
      calendarDays.push({
        dayNumber: currentDayIndex,
        totalMinutes: currentDayMinutes,
        nodes: currentDayNodes
      });
    }

    const totalDays = calendarDays.length;
    const estimatedMonths = Math.round((totalDays / 30) * 10) / 10;

    return {
      totalDays,
      estimatedMonths,
      dailySchedule: calendarDays
    };
  }
}

export const curriculumEngine = new CurriculumEngine();
