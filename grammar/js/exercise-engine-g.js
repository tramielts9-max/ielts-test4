/**
 * ENGINE CHẤM ĐIỂM BÀI TẬP NGỮ PHÁP TỰ ĐỘNG
 */
export class ExerciseEngine {
  /**
   * Chuẩn hóa chuỗi (bỏ dấu cách thừa, dấu câu cuối dòng, đổi thành chữ thường)
   */
  static clean(text) {
    return (text || "")
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .replace(/\s+/g, " ");
  }

  static gradeQuestion(q, userVal) {
    if (q.type === "blank" || q.type === "rewrite") {
      const cleanUser = this.clean(userVal);
      const isCorrect = q.answers.some(ans => this.clean(ans) === cleanUser);
      return {
        isCorrect,
        correctDisplay: q.answers.join(" HOẶC ")
      };
    }

    if (q.type === "choice") {
      const selectedIndex = parseInt(userVal, 10);
      const isCorrect = selectedIndex === q.correctIndex;
      return {
        isCorrect,
        correctDisplay: q.options[q.correctIndex]
      };
    }

    return { isCorrect: false, correctDisplay: "" };
  }
}
