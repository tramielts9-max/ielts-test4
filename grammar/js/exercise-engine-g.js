export class ExerciseEngine {
  static normalize(str) {
    return (str || "")
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ");
  }

  static checkAnswer(question, userAnswer) {
    if (question.type === "fill_blank") {
      const cleanUser = this.normalize(userAnswer);
      const isCorrect = question.acceptAnswers.some(ans => this.normalize(ans) === cleanUser);
      return { isCorrect, correctText: question.acceptAnswers.join(" / ") };
    }

    if (question.type === "multiple_choice") {
      const isCorrect = parseInt(userAnswer, 10) === question.correctIndex;
      return { isCorrect, correctText: question.options[question.correctIndex] };
    }

    if (question.type === "rewrite") {
      const cleanUser = this.normalize(userAnswer);
      const isCorrect = question.acceptAnswers.some(ans => this.normalize(ans) === cleanUser);
      return { isCorrect, correctText: question.acceptAnswers[0] };
    }

    return { isCorrect: false, correctText: "" };
  }
}
