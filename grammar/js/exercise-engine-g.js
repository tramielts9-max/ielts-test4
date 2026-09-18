export class ExerciseEngine {
  /**
   * Chuẩn hóa chuỗi người dùng nhập (bỏ hoa thường, bỏ dấu câu thừa)
   */
  static clean(text) {
    return (text || "")
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .replace(/\s+/g, " ");
  }

  /**
   * Chấm điểm 1 câu hỏi dựa trên các đáp án được chấp nhận trong JSON
   */
  static grade(question, userValue) {
    const cleanUser = this.clean(userValue);
    
    // Nếu học sinh bỏ trống
    if (!cleanUser) {
      return {
        isCorrect: false,
        correctDisplay: question.answers.join(" HOẶC "),
        isSkipped: true
      };
    }

    const isCorrect = question.answers.some(ans => {
      // Cho phép khớp chính xác hoặc khớp qua chuẩn hóa
      return this.clean(ans) === cleanUser || ans.trim().toLowerCase() === userValue.trim().toLowerCase();
    });

    return {
      isCorrect,
      correctDisplay: question.answers.join(" HOẶC "),
      isSkipped: false
    };
  }
}
