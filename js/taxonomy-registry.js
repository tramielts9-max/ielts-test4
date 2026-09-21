/**
 * js/taxonomy-registry.js
 * HỆ THỐNG ĐỊNH DANH, PHÂN TẦNG VÀ GẮN TAG BÀI TẬP TOÀN DIỆN (IELTS ECOSYSTEM)
 */

export const TAXONOMY = {
  // 1. HỆ THỐNG PHÂN TẦNG ĐỘ KHÓ (MULTI-TIER BAND SCALE)
  TIERS: {
    TIER_0: { code: "TIER_0", label: "Mất Gốc / Pre-IELTS", bandRange: "0 - 4.0", color: "#64748b", bg: "#f1f5f9" },
    TIER_1: { code: "TIER_1", label: "Nền Tảng (Foundation)", bandRange: "4.5 - 5.5", color: "#0284c7", bg: "#e0f2fe" },
    TIER_2: { code: "TIER_2", label: "Tiêu Chuẩn (Standard)", bandRange: "6.0 - 6.5", color: "#16a34a", bg: "#dcfce7" },
    TIER_3: { code: "TIER_3", label: "Nâng Cao (Advanced)", bandRange: "7.0 - 7.5", color: "#d97706", bg: "#fef3c7" },
    TIER_4: { code: "TIER_4", label: "Chuyên Sâu (Master 8.0+)", bandRange: "8.0 - 9.0", color: "#dc2626", bg: "#fee2e2" }
  },

  // 2. TỪ ĐIỂN DẠNG BÀI (QUESTION TYPES & SKILL TAGS)
  TAGS: {
    // Reading
    TFNG: { id: "TFNG", name: "True / False / Not Given", skill: "READING", color: "#0284c7" },
    YNNG: { id: "YNNG", name: "Yes / No / Not Given", skill: "READING", color: "#0369a1" },
    MATCH_HEADINGS: { id: "MATCH_HEADINGS", name: "Matching Headings", skill: "READING", color: "#7c3aed" },
    MATCH_INFO: { id: "MATCH_INFO", name: "Matching Information", skill: "READING", color: "#9333ea" },
    MATCH_FEATURES: { id: "MATCH_FEATURES", name: "Matching Features", skill: "READING", color: "#a855f7" },
    SUMMARY_COMP: { id: "SUMMARY_COMP", name: "Summary Completion", skill: "READING", color: "#059669" },
    NOTE_COMP: { id: "NOTE_COMP", name: "Notes Completion", skill: "READING", color: "#10b981" },
    TABLE_COMP: { id: "TABLE_COMP", name: "Table Completion", skill: "READING", color: "#0d9488" },
    FLOW_CHART: { id: "FLOW_CHART", name: "Flow-chart Completion", skill: "READING", color: "#0891b2" },
    MCQ_SINGLE: { id: "MCQ_SINGLE", name: "Multiple Choice (1 đáp án)", skill: "READING", color: "#ea580c" },
    MCQ_MULTI: { id: "MCQ_MULTI", name: "Multiple Choice (Nhiều đáp án)", skill: "READING", color: "#c2410c" },

    // Listening
    FORM_COMP: { id: "FORM_COMP", name: "Form Completion (Part 1)", skill: "LISTENING", color: "#0284c7" },
    MAP_PLAN: { id: "MAP_PLAN", name: "Map / Plan Labelling", skill: "LISTENING", color: "#d97706" },
    MCQ_ACADEMIC: { id: "MCQ_ACADEMIC", name: "Academic Discussion (Part 3)", skill: "LISTENING", color: "#7c3aed" },
    LECTURE_COMP: { id: "LECTURE_COMP", name: "Lecture Completion (Part 4)", skill: "LISTENING", color: "#dc2626" },

    // Grammar
    TENSES: { id: "TENSES", name: "Các Thì Động Từ", skill: "GRAMMAR", color: "#0d9488" },
    CONDITIONALS: { id: "CONDITIONALS", name: "Câu Điều Kiện (If/Unless)", skill: "GRAMMAR", color: "#059669" },
    PASSIVE_VOICE: { id: "PASSIVE_VOICE", name: "Câu Bị Động", skill: "GRAMMAR", color: "#0284c7" },
    RELATIVE_CLAUSES: { id: "RELATIVE_CLAUSES", name: "Mệnh Đề Quan Hệ", skill: "GRAMMAR", color: "#6366f1" },
    COMPARISONS: { id: "COMPARISONS", name: "Cấu Trúc So Sánh", skill: "GRAMMAR", color: "#8b5cf6" },
    WORD_FORM: { id: "WORD_FORM", name: "Cấu Tạo Từ (Word Form)", skill: "GRAMMAR", color: "#d97706" },
    ARTICLES: { id: "ARTICLES", name: "Mạo Từ (A/An/The)", skill: "GRAMMAR", color: "#475569" },
    PREPOSITIONS: { id: "PREPOSITIONS", name: "Giới Từ (In/On/At...)", skill: "GRAMMAR", color: "#334155" },

    // Vocab
    ACADEMIC_VOCAB: { id: "ACADEMIC_VOCAB", name: "Từ Vựng Học Thuật Cốt Lõi", skill: "VOCAB", color: "#4f46e5" },
    SRS_SPACED: { id: "SRS_SPACED", name: "Lặp Lại Ngắt Quãng (Spaced Repetition)", skill: "VOCAB", color: "#6366f1" },

    // Speaking & Writing
    SPEAK_PART1: { id: "SPEAK_PART1", name: "Speaking Part 1: Giao Tiếp Thường Ngày", skill: "SPEAKING", color: "#047857" },
    SPEAK_PART2: { id: "SPEAK_PART2", name: "Speaking Part 2: Thuyết Trình Cue Card", skill: "SPEAKING", color: "#059669" },
    SPEAK_PART3: { id: "SPEAK_PART3", name: "Speaking Part 3: Phản Biện Học Thuật", skill: "SPEAKING", color: "#065f46" },
    WRIT_TASK1: { id: "WRIT_TASK1", name: "Writing Task 1: Phân Tích Biểu Đồ", skill: "WRITING", color: "#8B1518" },
    WRIT_TASK2: { id: "WRIT_TASK2", name: "Writing Task 2: Nghị Luận Xã Hội", skill: "WRITING", color: "#991b1b" }
  }
};

/**
 * 3. BẢNG DANH MỤC TOÀN HỆ THỐNG (CENTRAL REGISTRY)
 * Ánh xạ mã định danh chuẩn sang đường dẫn runner hiện tại
 */
export const CENTRAL_REGISTRY = [
  // ================= READING =================
  {
    id: "READ_CAM21_T1_P1",
    skill: "READING",
    tier: "TIER_2",
    title: "The Davies Sisters",
    source: "Cambridge 21 Test 1 Passage 1",
    tags: ["NOTE_COMP", "TFNG"],
    topic: "History / Art Collecting",
    durationMinutes: 20,
    runUrl: "runner-reading.html?test=data/cam21-test1/cam21-test1-p1.json"
  },
  {
    id: "READ_CAM21_T1_P2",
    skill: "READING",
    tier: "TIER_3",
    title: "Why we need silence",
    source: "Cambridge 21 Test 1 Passage 2",
    tags: ["MATCH_INFO", "SUMMARY_COMP"],
    topic: "Psychology / Health",
    durationMinutes: 20,
    runUrl: "runner-reading.html?test=data/cam21-test1/cam21-test1-p2.json"
  },
  {
    id: "READ_CAM21_T1_P3",
    skill: "READING",
    tier: "TIER_3",
    title: "The World of Sugar",
    source: "Cambridge 21 Test 1 Passage 3",
    tags: ["MCQ_SINGLE", "YNNG"],
    topic: "Economy / Agriculture",
    durationMinutes: 20,
    runUrl: "runner-reading.html?test=data/cam21-test1/cam21-test1-p3.json"
  },
  {
    id: "READ_CAM20_T1_P1",
    skill: "READING",
    tier: "TIER_1",
    title: "The kākāpō",
    source: "Cambridge 20 Test 1 Passage 1",
    tags: ["NOTE_COMP", "TFNG"],
    topic: "Biology / Wildlife",
    durationMinutes: 20,
    runUrl: "runner-reading.html?test=data/cam20-test1/cam20-test1-p1.json"
  },

  // ================= LISTENING =================
  {
    id: "LIS_CAM21_T1_P1",
    skill: "LISTENING",
    tier: "TIER_1",
    title: "Sailing Club Membership",
    source: "Cambridge 21 Listening Test 1 Part 1",
    tags: ["FORM_COMP", "NOTE_COMP"],
    topic: "Daily Life / Sports",
    durationMinutes: 10,
    runUrl: "runner-listening.html?test=cam21-lis-test1-p1"
  },
  {
    id: "LIS_CAM21_T1_P2",
    skill: "LISTENING",
    tier: "TIER_2",
    title: "Local Community Project",
    source: "Cambridge 21 Listening Test 1 Part 2",
    tags: ["MAP_PLAN", "MCQ_SINGLE"],
    topic: "Community / Tourism",
    durationMinutes: 10,
    runUrl: "runner-listening.html?test=cam21-lis-test1-p2"
  },
  {
    id: "LIS_CAM21_T1_P3",
    skill: "LISTENING",
    tier: "TIER_3",
    title: "University Research Discussion",
    source: "Cambridge 21 Listening Test 1 Part 3",
    tags: ["MCQ_ACADEMIC", "MATCH_FEATURES"],
    topic: "Academic / Science",
    durationMinutes: 10,
    runUrl: "runner-listening.html?test=cam21-lis-test1-p3"
  },
  {
    id: "LIS_CAM21_T1_P4",
    skill: "LISTENING",
    tier: "TIER_4",
    title: "Wildlife Ecology Lecture",
    source: "Cambridge 21 Listening Test 1 Part 4",
    tags: ["LECTURE_COMP"],
    topic: "Environment / Lecture",
    durationMinutes: 10,
    runUrl: "runner-listening.html?test=cam21-lis-test1-p4"
  },

  // ================= GRAMMAR =================
  {
    id: "GRAM_PRES_SIMPLE",
    skill: "GRAMMAR",
    tier: "TIER_0",
    title: "1. Thì Hiện Tại Đơn (Simple Present)",
    source: "Grammar Master Series",
    tags: ["TENSES"],
    topic: "Ngữ pháp nền tảng",
    durationMinutes: 25,
    runUrl: "grammar/lesson-g.html?tense=present-simple"
  },
  {
    id: "GRAM_PRES_CONT",
    skill: "GRAMMAR",
    tier: "TIER_1",
    title: "2. Thì Hiện Tại Tiếp Diễn (Present Continuous)",
    source: "Grammar Master Series",
    tags: ["TENSES"],
    topic: "Ngữ pháp thì",
    durationMinutes: 25,
    runUrl: "grammar/lesson-g.html?tense=present-continuous"
  },
  {
    id: "GRAM_PAST_SIMPLE",
    skill: "GRAMMAR",
    tier: "TIER_1",
    title: "3. Thì Quá Khứ Đơn (Past Simple)",
    source: "Grammar Master Series",
    tags: ["TENSES"],
    topic: "Ngữ pháp thì",
    durationMinutes: 25,
    runUrl: "grammar/lesson-g.html?tense=past-simple"
  },
  {
    id: "GRAM_CONDITIONALS",
    skill: "GRAMMAR",
    tier: "TIER_2",
    title: "8. Câu Điều Kiện (If / Unless Sentences)",
    source: "Grammar Master Series",
    tags: ["CONDITIONALS"],
    topic: "Cấu trúc câu phức",
    durationMinutes: 30,
    runUrl: "grammar/lesson-g.html?tense=conditionals"
  },
  {
    id: "GRAM_PASSIVE_VOICE",
    skill: "GRAMMAR",
    tier: "TIER_2",
    title: "10. Câu Bị Động (Passive Voice)",
    source: "Grammar Master Series",
    tags: ["PASSIVE_VOICE"],
    topic: "Writing Foundation",
    durationMinutes: 30,
    runUrl: "grammar/lesson-g.html?tense=passive-voice"
  },
  {
    id: "GRAM_COMPARISON",
    skill: "GRAMMAR",
    tier: "TIER_2",
    title: "13. Cấu Trúc So Sánh (Comparison)",
    source: "Grammar Master Series",
    tags: ["COMPARISONS"],
    topic: "Writing Task 1 Core",
    durationMinutes: 30,
    runUrl: "grammar/lesson-g.html?tense=13-comparison"
  },
  {
    id: "GRAM_REL_CLAUSES",
    skill: "GRAMMAR",
    tier: "TIER_3",
    title: "14. Mệnh Đề Quan Hệ (Relative Clauses)",
    source: "Grammar Master Series",
    tags: ["RELATIVE_CLAUSES"],
    topic: "Complex Sentences / Band 7+",
    durationMinutes: 30,
    runUrl: "grammar/lesson-g.html?tense=14-relative-clauses"
  },
  {
    id: "GRAM_WORD_FORM",
    skill: "GRAMMAR",
    tier: "TIER_3",
    title: "15. Cấu Tạo Từ Loại (Word Form)",
    source: "Grammar Master Series",
    tags: ["WORD_FORM"],
    topic: "Lexical Resource",
    durationMinutes: 35,
    runUrl: "grammar/lesson-g.html?tense=15-word-form"
  },

  // ================= VOCABULARY =================
  {
    id: "VOCAB_CORE_U01",
    skill: "VOCAB",
    tier: "TIER_1",
    title: "Unit 1: Positive Attitude & Impact",
    source: "300 Từ Học Thuật Cốt Lõi",
    tags: ["ACADEMIC_VOCAB", "SRS_SPACED"],
    topic: "Thái độ & Tác động tích cực",
    durationMinutes: 15,
    runUrl: "vocab/index-v.html?unit=1"
  },
  {
    id: "VOCAB_CORE_U04",
    skill: "VOCAB",
    tier: "TIER_2",
    title: "Unit 4: Research & Evidence",
    source: "300 Từ Học Thuật Cốt Lõi",
    tags: ["ACADEMIC_VOCAB", "SRS_SPACED"],
    topic: "Nghiên cứu & Bằng chứng",
    durationMinutes: 15,
    runUrl: "vocab/index-v.html?unit=4"
  },
  {
    id: "VOCAB_CORE_U10",
    skill: "VOCAB",
    tier: "TIER_3",
    title: "Unit 10: Society & Environment",
    source: "300 Từ Học Thuật Cốt Lõi",
    tags: ["ACADEMIC_VOCAB", "SRS_SPACED"],
    topic: "Xã hội, Thương mại & Môi trường",
    durationMinutes: 15,
    runUrl: "vocab/index-v.html?unit=10"
  },

  // ================= SPEAKING & WRITING =================
  {
    id: "SPEAK_P1_STUDY",
    skill: "SPEAKING",
    tier: "TIER_1",
    title: "Study & Work Routine",
    source: "Speaking Bank Part 1",
    tags: ["SPEAK_PART1"],
    topic: "Daily Life",
    durationMinutes: 10,
    runUrl: "speaking/index-s.html?part=1&id=p1_1"
  },
  {
    id: "SPEAK_P2_CHALLENGE",
    skill: "SPEAKING",
    tier: "TIER_2",
    title: "Describe a Difficult Challenge",
    source: "Speaking Bank Part 2",
    tags: ["SPEAK_PART2"],
    topic: "Personal Experience",
    durationMinutes: 15,
    runUrl: "speaking/index-s.html?part=2&id=p2_1"
  },
  {
    id: "WRIT_T1_BAR_CHART",
    skill: "WRITING",
    tier: "TIER_2",
    title: "Task 1: Academic Report (Biểu đồ)",
    source: "Writing Master Room",
    tags: ["WRIT_TASK1"],
    topic: "Data Analysis",
    durationMinutes: 20,
    runUrl: "writing/index-w.html?task=1"
  },
  {
    id: "WRIT_T2_ESSAY",
    skill: "WRITING",
    tier: "TIER_3",
    title: "Task 2: Academic Essay",
    source: "Writing Master Room",
    tags: ["WRIT_TASK2"],
    topic: "Social Issues",
    durationMinutes: 40,
    runUrl: "writing/index-w.html?task=2"
  }
];

/**
 * 4. HELPER CÔNG CỤ TRUY VẤN VÀ TẠO BADGE/TAG HTML
 */
export const RegistryHelper = {
  // Lấy chi tiết bài tập theo ID
  getById(id) {
    return CENTRAL_REGISTRY.find(item => item.id.toUpperCase() === id.toUpperCase());
  },

  // Lọc theo Kỹ năng
  getBySkill(skill) {
    return CENTRAL_REGISTRY.filter(item => item.skill.toUpperCase() === skill.toUpperCase());
  },

  // Lọc theo Tầng độ khó
  getByTier(tierCode) {
    return CENTRAL_REGISTRY.filter(item => item.tier === tierCode);
  },

  // Lọc theo Dạng bài tập (Tag)
  getByTag(tagId) {
    return CENTRAL_REGISTRY.filter(item => item.tags.includes(tagId));
  },

  // Tạo chuỗi HTML hiển thị toàn bộ Badges & Tags của một bài
  renderTagsHtml(exercise) {
    if (!exercise) return "";
    const tierMeta = TAXONOMY.TIERS[exercise.tier] || TAXONOMY.TIERS.TIER_2;

    let html = `
      <div class="exercise-taxonomy-tags" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin: 6px 0 10px 0;">
        <!-- ID Tag -->
        <span class="tag-id" style="font-family:monospace; font-weight:800; font-size:11px; padding:2px 7px; border-radius:4px; background:#1e293b; color:#f8fafc;">
          ${exercise.id}
        </span>

        <!-- Tier Badge -->
        <span class="tag-tier" style="font-weight:700; font-size:11.5px; padding:2px 8px; border-radius:12px; background:${tierMeta.bg}; color:${tierMeta.color}; border:1px solid ${tierMeta.color};">
          ${tierMeta.label} (${tierMeta.bandRange})
        </span>
    `;

    // Render từng Question Tag
    (exercise.tags || []).forEach(tagKey => {
      const tagMeta = TAXONOMY.TAGS[tagKey];
      if (tagMeta) {
        html += `
          <span class="tag-skill" style="font-weight:600; font-size:11px; padding:2px 7px; border-radius:4px; background:#f1f5f9; color:${tagMeta.color}; border:1px solid #cbd5e1;">
            🏷️ ${tagMeta.name}
          </span>
        `;
      }
    });

    html += `</div>`;
    return html;
  }
};
