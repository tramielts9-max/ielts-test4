export const LESSON_DATA = {
  id: "tenses",
  title: "Chuyên Đề: Các Thì Cơ Bản (Tenses)",
  theory: [
    {
      title: "1. Danh từ số ít & số nhiều (Noun Singular & Plural)",
      content: `
        <ul>
          <li><b>Quy tắc chung:</b> Thêm <code>-s</code> vào danh từ số ít (<i>cats, dogs, books, chairs</i>).</li>
          <li><b>Kết thúc bằng s, x, z, sh, ch:</b> Thêm <code>-es</code> (<i>buses, boxes, watches</i>).</li>
          <li><b>Phụ âm + y:</b> Đổi thành <code>-ies</code> (<i>baby → babies, city → cities</i>).</li>
          <li><b>Nguyên âm + y:</b> Giữ nguyên thêm <code>-s</code> (<i>toy → toys, day → days</i>).</li>
          <li><b>Kết thúc bằng f/fe:</b> Thường đổi thành <code>-ves</code> (<i>wolf → wolves, knife → knives</i>).</li>
          <li><b>Bất quy tắc:</b> Man → Men, Woman → Women, Tooth → Teeth, Foot → Feet, Child → Children, Mouse → Mice.</li>
        </ul>
      `
    },
    {
      title: "2. Hiện Tại Đơn với To-Be & Động từ thường",
      content: `
        <p><b>Cấu trúc To Be:</b> S + am/is/are + O</p>
        <p><b>Cấu trúc Động từ thường:</b> S + V(s/es) + O | S + do/does not + V0 | Do/Does + S + V0?</p>
        <p><b>Dấu hiệu nhận biết:</b> Always (100%), Usually (90%), Often (60-70%), Sometimes (30-50%), Rarely/Seldom (10-20%), Never (0%), Every day/week/month...</p>
      `
    }
  ],
  exercises: [
    {
      id: "q1",
      type: "fill_blank",
      instruction: "Viết dạng số nhiều của danh từ sau:",
      prompt: "knife ➔ [blank]",
      acceptAnswers: ["knives"],
      explanation: "Danh từ kết thúc bằng -fe đổi thành -ves: knife ➔ knives."
    },
    {
      id: "q2",
      type: "fill_blank",
      instruction: "Chia động từ to be ở hiện tại đơn:",
      prompt: "The flowers (be) [blank] beautiful.",
      acceptAnswers: ["are"],
      explanation: "Chủ ngữ 'The flowers' là danh từ số nhiều nên dùng 'are'."
    },
    {
      id: "q3",
      type: "multiple_choice",
      instruction: "Chọn đáp án chính xác:",
      prompt: "Water ______ at 100°C.",
      options: ["boil", "boils", "is boiling", "boiled"],
      correctIndex: 1,
      explanation: "Diễn tả chân lý/sự thật hiển nhiên, chủ ngữ không đếm được đi với V(s/es) ➔ boils."
    },
    {
      id: "q4",
      type: "rewrite",
      instruction: "Chuyển câu sau sang thể phủ định:",
      prompt: "She drinks coffee every morning.",
      targetStart: "She does not ",
      acceptAnswers: ["drink coffee every morning.", "drink coffee every morning"],
      explanation: "Phủ định ngôi She: mượn trợ động từ does not + V nguyên mẫu (drink)."
    }
  ]
};
