/**
 * js/curriculum-manifest.js
 * SỔ CÁI ĐỘC LẬP - QUẢN LÝ CHUỖI ĐỐT SỐNG TUYẾN TÍNH & ĐỊNH MỨC THỜI GIAN
 */

export const CURRICULUM_NODES = [
  // =========================================================================
  // GIAI ĐOẠN 1: NỀN TẢNG NGỮ PHÁP (21 CHUYÊN ĐỀ TỪ PDF) & TỪ VỰNG CƠ BẢN
  // =========================================================================
  // 1. Cơ bản (Danh từ số ít & số nhiều)
  {
    id: "N0010",
    title: "Cơ bản: Danh từ số ít & số nhiều (Concept Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=basic-nouns&type=theory",
    duration: { fast: 5, normal: 10, slow: 15 },
    coachHours: 0,
    tags: ["G_NOUNS"]
  },
  {
    id: "N0020",
    title: "Cơ bản: Danh từ số ít & số nhiều (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=basic-nouns&type=exercises",
    duration: { fast: 5, normal: 10, slow: 15 },
    coachHours: 0.25,
    tags: ["G_NOUNS"]
  },

  // 2. Thì Hiện tại đơn (Simple Present)
  {
    id: "N0030",
    title: "Thì Hiện tại đơn: Simple Present (Concept Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=present-simple&type=theory",
    duration: { fast: 10, normal: 15, slow: 30 },
    coachHours: 0,
    tags: ["G_PRES_SIMPLE"]
  },
  {
    id: "N0040",
    title: "Thì Hiện tại đơn: Simple Present (Bài tập lọc nhanh)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=present-simple&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.5,
    tags: ["G_PRES_SIMPLE"]
  },

  // 3. Thì Hiện tại tiếp diễn (Present Continuous)
  {
    id: "N0050",
    title: "Thì Hiện tại tiếp diễn: Present Continuous (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=present-continuous&type=theory",
    duration: { fast: 8, normal: 12, slow: 20 },
    coachHours: 0,
    tags: ["G_PRES_CONT"]
  },
  {
    id: "N0060",
    title: "Thì Hiện tại tiếp diễn: Present Continuous (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=present-continuous&type=exercises",
    duration: { fast: 12, normal: 20, slow: 35 },
    coachHours: 0.25,
    tags: ["G_PRES_CONT"]
  },

  // 4. Động từ bất quy tắc V2 (Cho Quá khứ đơn)
  {
    id: "N0070",
    title: "Động từ bất quy tắc V2: Nhận diện mặt chữ (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=irregular-v2&type=theory",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0,
    tags: ["G_IRREG_V2"]
  },
  {
    id: "N0080",
    title: "Động từ bất quy tắc V2: Bài tập lọc nhanh",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=irregular-v2&type=exercises",
    duration: { fast: 8, normal: 12, slow: 20 },
    coachHours: 0.25,
    tags: ["G_IRREG_V2"]
  },

  // 5. Thì Quá khứ đơn (Past Simple)
  {
    id: "N0090",
    title: "Thì Quá khứ đơn: Past Simple (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=past-simple&type=theory",
    duration: { fast: 10, normal: 20, slow: 35 },
    coachHours: 0,
    tags: ["G_PAST_SIMPLE"]
  },
  {
    id: "N0100",
    title: "Thì Quá khứ đơn: Past Simple (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=past-simple&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.5,
    tags: ["G_PAST_SIMPLE"]
  },

  // 6. Thì Quá khứ tiếp diễn (Past Continuous)
  {
    id: "N0110",
    title: "Thì Quá khứ tiếp diễn: Past Continuous (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=past-continuous&type=theory",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0,
    tags: ["G_PAST_CONT"]
  },
  {
    id: "N0120",
    title: "Thì Quá khứ tiếp diễn: Past Continuous (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=past-continuous&type=exercises",
    duration: { fast: 12, normal: 20, slow: 35 },
    coachHours: 0.25,
    tags: ["G_PAST_CONT"]
  },

  // 7. Động từ bất quy tắc V3
  {
    id: "N0130",
    title: "Động từ bất quy tắc V3 cho các thì Hoàn thành (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=irregular-v3&type=theory",
    duration: { fast: 12, normal: 20, slow: 40 },
    coachHours: 0,
    tags: ["G_IRREG_V3"]
  },
  {
    id: "N0140",
    title: "Động từ bất quy tắc V3 (Bài tập lọc nhanh)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=irregular-v3&type=exercises",
    duration: { fast: 8, normal: 12, slow: 20 },
    coachHours: 0.25,
    tags: ["G_IRREG_V3"]
  },

  // 8. Thì Hiện tại hoàn thành (Present Perfect)
  {
    id: "N0150",
    title: "Thì Hiện tại hoàn thành: Present Perfect (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=present-perfect&type=theory",
    duration: { fast: 12, normal: 20, slow: 40 },
    coachHours: 0,
    tags: ["G_PRES_PERF"]
  },
  {
    id: "N0160",
    title: "Thì Hiện tại hoàn thành: Present Perfect (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=present-perfect&type=exercises",
    duration: { fast: 18, normal: 30, slow: 50 },
    coachHours: 0.5,
    tags: ["G_PRES_PERF"]
  },

  // 9. Thì Quá khứ hoàn thành (Past Perfect)
  {
    id: "N0170",
    title: "Thì Quá khứ hoàn thành: Past Perfect (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=past-perfect&type=theory",
    duration: { fast: 10, normal: 15, slow: 30 },
    coachHours: 0,
    tags: ["G_PAST_PERF"]
  },
  {
    id: "N0180",
    title: "Thì Quá khứ hoàn thành: Past Perfect (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=past-perfect&type=exercises",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0.25,
    tags: ["G_PAST_PERF"]
  },

  // 10. Thì Tương lai đơn (Simple Future)
  {
    id: "N0190",
    title: "Thì Tương lai đơn: Simple Future (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=simple-future&type=theory",
    duration: { fast: 5, normal: 10, slow: 18 },
    coachHours: 0,
    tags: ["G_FUTURE_SIMPLE"]
  },
  {
    id: "N0200",
    title: "Thì Tương lai đơn: Simple Future (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=simple-future&type=exercises",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0.25,
    tags: ["G_FUTURE_SIMPLE"]
  },

  // 11. Câu điều kiện IF
  {
    id: "N0210",
    title: "Câu điều kiện IF: Loại 1, 2, 3 & Unless (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=conditionals&type=theory",
    duration: { fast: 15, normal: 30, slow: 50 },
    coachHours: 0,
    tags: ["G_CONDITIONALS"]
  },
  {
    id: "N0220",
    title: "Câu điều kiện IF (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=conditionals&type=exercises",
    duration: { fast: 20, normal: 35, slow: 60 },
    coachHours: 0.5,
    tags: ["G_CONDITIONALS"]
  },

  // 12. Giới từ cơ bản (In - On - At)
  {
    id: "N0230",
    title: "Giới từ cơ bản: In - On - At theo quy tắc tam giác (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=prepositions&type=theory",
    duration: { fast: 5, normal: 8, slow: 15 },
    coachHours: 0,
    tags: ["G_PREPOSITIONS_BASIC"]
  },
  {
    id: "N0240",
    title: "Giới từ cơ bản: In - On - At (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=prepositions&type=exercises",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0.25,
    tags: ["G_PREPOSITIONS_BASIC"]
  },

  // 13. Giới từ nâng cao
  {
    id: "N0250",
    title: "Giới từ nâng cao: Vị trí & Hướng chuyển động (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=prepositions-adv&type=theory",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0,
    tags: ["G_PREPOSITIONS_ADV"]
  },
  {
    id: "N0260",
    title: "Giới từ nâng cao (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=prepositions-adv&type=exercises",
    duration: { fast: 25, normal: 45, slow: 80 },
    coachHours: 0.5,
    tags: ["G_PREPOSITIONS_ADV"]
  },

  // 14. Câu bị động (Passive Voice)
  {
    id: "N0270",
    title: "Câu bị động: Passive Voice (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=passive-voice&type=theory",
    duration: { fast: 12, normal: 20, slow: 40 },
    coachHours: 0,
    tags: ["G_PASSIVE_VOICE"]
  },
  {
    id: "N0280",
    title: "Câu bị động: Passive Voice (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=passive-voice&type=exercises",
    duration: { fast: 20, normal: 35, slow: 60 },
    coachHours: 0.5,
    tags: ["G_PASSIVE_VOICE"]
  },

  // 15. Lượng từ (Quantifiers)
  {
    id: "N0290",
    title: "Lượng từ: Quantifiers Đếm được vs Không đếm được (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=quantifiers&type=theory",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0,
    tags: ["G_QUANTIFIERS"]
  },
  {
    id: "N0300",
    title: "Lượng từ: Quantifiers (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=quantifiers&type=exercises",
    duration: { fast: 12, normal: 20, slow: 35 },
    coachHours: 0.25,
    tags: ["G_QUANTIFIERS"]
  },

  // 16. Mạo từ (Articles)
  {
    id: "N0310",
    title: "Mạo từ: A / An / The (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=articles&type=theory",
    duration: { fast: 10, normal: 18, slow: 30 },
    coachHours: 0,
    tags: ["G_ARTICLES"]
  },
  {
    id: "N0320",
    title: "Mạo từ: A / An / The (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=articles&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.25,
    tags: ["G_ARTICLES"]
  },

  // 17. Câu tường thuật (Reported Speech)
  {
    id: "N0330",
    title: "Câu tường thuật: Quy tắc Lùi 1 thì & Đổi ngôi (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=reported-speech&type=theory",
    duration: { fast: 18, normal: 30, slow: 55 },
    coachHours: 0,
    tags: ["G_REPORTED_SPEECH"]
  },
  {
    id: "N0340",
    title: "Câu tường thuật (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=reported-speech&type=exercises",
    duration: { fast: 25, normal: 45, slow: 80 },
    coachHours: 0.5,
    tags: ["G_REPORTED_SPEECH"]
  },

  // 18. So sánh (Comparison)
  {
    id: "N0350",
    title: "Cấu trúc So sánh: Hơn, Nhất & Bằng (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=13-comparison&type=theory",
    duration: { fast: 10, normal: 20, slow: 35 },
    coachHours: 0,
    tags: ["G_COMPARISON"]
  },
  {
    id: "N0360",
    title: "Cấu trúc So sánh (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=13-comparison&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.25,
    tags: ["G_COMPARISON"]
  },

  // 19. Mệnh đề quan hệ (Relative Clause)
  {
    id: "N0370",
    title: "Mệnh đề quan hệ: Who, Which, Whose, Where (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=14-relative-clauses&type=theory",
    duration: { fast: 10, normal: 18, slow: 30 },
    coachHours: 0,
    tags: ["G_RELATIVE_CLAUSE"]
  },
  {
    id: "N0380",
    title: "Mệnh đề quan hệ (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=14-relative-clauses&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.5,
    tags: ["G_RELATIVE_CLAUSE"]
  },

  // 20. Chuyển đổi thì HTHT <-> Quá khứ đơn
  {
    id: "N0390",
    title: "Chuyển đổi thì: HTHT tương đương Quá khứ đơn (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=tense-conversion&type=theory",
    duration: { fast: 10, normal: 18, slow: 30 },
    coachHours: 0,
    tags: ["G_TENSE_CONV"]
  },
  {
    id: "N0400",
    title: "Chuyển đổi thì: HTHT tương đương Quá khứ đơn (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=tense-conversion&type=exercises",
    duration: { fast: 25, normal: 45, slow: 80 },
    coachHours: 0.5,
    tags: ["G_TENSE_CONV"]
  },

  // 21. Cấu tạo từ / Loại từ (Word Form)
  {
    id: "N0410",
    title: "Cấu tạo từ / Loại từ: Vị trí N, V, Adj, Adv (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?topic=15-word-form&type=theory",
    duration: { fast: 18, normal: 30, slow: 50 },
    coachHours: 0,
    tags: ["G_WORD_FORM"]
  },
  {
    id: "N0420",
    title: "Cấu tạo từ / Loại từ (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?topic=15-word-form&type=exercises",
    duration: { fast: 20, normal: 35, slow: 60 },
    coachHours: 0.5,
    tags: ["G_WORD_FORM"]
  },

  // =========================================================================
  // GIAI ĐOẠN 2: TỪ VỰNG & PRE-LISTENING & PRE-READING
  // =========================================================================
  {
    id: "N0430",
    title: "Từ vựng Học thuật Unit 1: Positive Attitude & Impact",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=1",
    duration: { fast: 20, normal: 30, slow: 45 },
    coachHours: 0,
    tags: ["VOCAB_U01"]
  },
  {
    id: "N0440",
    title: "Từ vựng Học thuật Unit 2: Negative Attitude & Impact",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=2",
    duration: { fast: 20, normal: 30, slow: 45 },
    coachHours: 0,
    tags: ["VOCAB_U02"]
  },
  {
    id: "N0450",
    title: "Pre-Listening: Luyện Nghe Bắt Âm & Dictation #01",
    domain: "PRE_LISTENING",
    type: "PRACTICE",
    url: "pre-listening/index-pl.html?id=pl_01",
    duration: { fast: 5, normal: 7, slow: 10 },
    coachHours: 0,
    tags: ["PRE_LIS"]
  },
  {
    id: "N0460",
    title: "Pre-Listening: Luyện Nghe Nối Âm & Chép Chính Tả #02",
    domain: "PRE_LISTENING",
    type: "PRACTICE",
    url: "pre-listening/index-pl.html?id=pl_02",
    duration: { fast: 5, normal: 7, slow: 10 },
    coachHours: 0,
    tags: ["PRE_LIS"]
  },
  {
    id: "N0470",
    title: "Pre-Reading: Kỹ Năng Scanning Định Vị Từ Khóa #01",
    domain: "PRE_READING",
    type: "PRACTICE",
    url: "pre-reading/index-pr.html?id=pr_01",
    duration: { fast: 10, normal: 15, slow: 20 },
    coachHours: 0.25,
    tags: ["PRE_READ"]
  },
  {
    id: "N0480",
    title: "Pre-Reading: Kỹ Năng Skimming Nắm Ý Đại Cương #02",
    domain: "PRE_READING",
    type: "PRACTICE",
    url: "pre-reading/index-pr.html?id=pr_02",
    duration: { fast: 10, normal: 15, slow: 20 },
    coachHours: 0.25,
    tags: ["PRE_READ"]
  },

  // =========================================================================
  // GIAI ĐOẠN 3: IELTS READING & LISTENING CHUYÊN SÂU (CAMBRIDGE & VOL)
  // =========================================================================
  {
    id: "N0500",
    title: "Reading: Vol 7 Test 1 - Passage 1",
    domain: "READING",
    type: "PRACTICE",
    url: "runner-reading.html?test=vol7-test1-p1",
    duration: { fast: 15, normal: 20, slow: 25 },
    coachHours: 0,
    tags: ["READ_P1", "TFNG", "NOTE_COMP"]
  },
  {
    id: "N0510",
    title: "Reading: Vol 7 Test 1 - Passage 2",
    domain: "READING",
    type: "PRACTICE",
    url: "runner-reading.html?test=vol7-test1-p2",
    duration: { fast: 15, normal: 20, slow: 25 },
    coachHours: 0,
    tags: ["READ_P2", "MATCH_INFO"]
  },
  {
    id: "N0520",
    title: "Reading: Vol 7 Test 1 - Passage 3 (Nâng Cao)",
    domain: "READING",
    type: "PRACTICE",
    url: "runner-reading.html?test=vol7-test1-p3",
    duration: { fast: 20, normal: 25, slow: 30 },
    coachHours: 0.5,
    tags: ["READ_P3", "MCQ", "YNNG"]
  },
  {
    id: "N0530",
    title: "Listening: Cambridge 21 Test 1 - Part 1 (Form Completion)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "runner-listening.html?test=cam21-lis-test1-p1",
    duration: { fast: 10, normal: 12, slow: 15 },
    coachHours: 0,
    tags: ["LIS_P1", "FORM_COMP"]
  },
  {
    id: "N0540",
    title: "Listening: Cambridge 21 Test 1 - Part 2 (Map & Multiple Choice)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "runner-listening.html?test=cam21-lis-test1-p2",
    duration: { fast: 10, normal: 12, slow: 15 },
    coachHours: 0.25,
    tags: ["LIS_P2", "MAP_PLAN"]
  },
  {
    id: "N0550",
    title: "Listening: Cambridge 21 Test 1 - Part 3 (Academic Discussion)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "runner-listening.html?test=cam21-lis-test1-p3",
    duration: { fast: 10, normal: 12, slow: 15 },
    coachHours: 0.25,
    tags: ["LIS_P3", "MCQ"]
  },
  {
    id: "N0560",
    title: "Listening: Cambridge 21 Test 1 - Part 4 (Lecture Completion)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "runner-listening.html?test=cam21-lis-test1-p4",
    duration: { fast: 10, normal: 12, slow: 15 },
    coachHours: 0.5,
    tags: ["LIS_P4", "NOTE_COMP"]
  },

  // =========================================================================
  // GIAI ĐOẠN 4: PRE-WRITING (TASK 1 & TASK 2)
  // =========================================================================
  {
    id: "N0600",
    title: "Pre-Writing Task 1: Line Graph - Tỷ lệ thất nghiệp",
    domain: "PRE_WRITING_T1",
    type: "PRACTICE",
    url: "pre-writing/index-pwt1.html?test=01-1-line-unemployment-pwt1",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.5,
    tags: ["PWT1_LINE"]
  },
  {
    id: "N0610",
    title: "Pre-Writing Task 1: Bar Chart - Lượng khách du lịch",
    domain: "PRE_WRITING_T1",
    type: "PRACTICE",
    url: "pre-writing/index-pwt1.html?test=02-1-bar-tourists-pwt1",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.5,
    tags: ["PWT1_BAR"]
  },
  {
    id: "N0650",
    title: "Pre-Writing Task 2: Opinion Essay - Chủ đề Môi trường",
    domain: "PRE_WRITING_T2",
    type: "PRACTICE",
    url: "pre-writing/index-pwt2.html?test=01-1-op-environment-pwt2",
    duration: { fast: 40, normal: 50, slow: 60 },
    coachHours: 0.75,
    tags: ["PWT2_OPINION"]
  },
  {
    id: "N0660",
    title: "Pre-Writing Task 2: Discussion Essay - Việc làm & Tuyển dụng",
    domain: "PRE_WRITING_T2",
    type: "PRACTICE",
    url: "pre-writing/index-pwt2.html?test=02-1-dis-work-employment-pwt2",
    duration: { fast: 40, normal: 50, slow: 60 },
    coachHours: 0.75,
    tags: ["PWT2_DISCUSSION"]
  },

  // =========================================================================
  // GIAI ĐOẠN 5: IELTS WRITING CHÍNH THỨC & SPEAKING 2 TẦNG
  // =========================================================================
  {
    id: "N0700",
    title: "IELTS Writing Task 1: Viết hoàn chỉnh & Sửa 2 tầng với AI",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing/index-w.html?task=1",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 1.0,
    tags: ["WRITING_TASK1"]
  },
  {
    id: "N0720",
    title: "IELTS Writing Task 2: Luận văn học thuật chuẩn PEEL",
    domain: "WRITING_T2",
    type: "PRACTICE",
    url: "writing/index-w.html?task=2",
    duration: { fast: 40, normal: 50, slow: 60 },
    coachHours: 1.0,
    tags: ["WRITING_TASK2"]
  },
  {
    id: "N0800",
    title: "Pre-Speaking: Shadowing Video luyện ngữ điệu (Độ dài V = 5 phút)",
    domain: "PRE_SPEAKING",
    type: "PRACTICE",
    url: "pre-speaking/index.html?v=5",
    duration: { fast: 8, normal: 10, slow: 15 }, // V x 1.5, V x 2, V x 3
    coachHours: 0.25,
    tags: ["PRE_SPEAK"]
  },
  {
    id: "N0810",
    title: "IELTS Speaking Part 1: Study & Work Topics (Speech-to-Text & AI)",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html?prompt=p1_1",
    duration: { fast: 10, normal: 10, slow: 10 },
    coachHours: 0.5,
    tags: ["SPEAKING_P1"]
  },

  // =========================================================================
  // GIAI ĐOẠN 6: FULL MOCK TEST (BẤM GIỜ THI THẬT)
  // =========================================================================
  {
    id: "N0900",
    title: "Full Mock Test: Reading Cambridge 21 Test 1 (Passage 1, 2, 3)",
    domain: "MOCK_TEST",
    type: "TEST",
    url: "runner-reading.html?test=cam21-test1-full",
    duration: { fast: 60, normal: 70, slow: 80 },
    coachHours: 1.5,
    tags: ["MOCK_READING"]
  },
  {
    id: "N0910",
    title: "Full Mock Test: Listening Cambridge 21 Test 1 (40 câu chuẩn)",
    domain: "MOCK_TEST",
    type: "TEST",
    url: "runner-listening.html?test=cam21-lis-test1-full",
    duration: { fast: 40, normal: 40, slow: 40 },
    coachHours: 1.0,
    tags: ["MOCK_LISTENING"]
  }
];
