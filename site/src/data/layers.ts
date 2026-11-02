/* How each case page is ordered by the three layers: what was designed, what
   was built, what was measured. Numbers point into the case's "story" list in
   _dev/projects.json; the other entries are blocks Case.astro knows how to draw.
   Where a layer is someone else's work or was never measured, an "absent" block
   says so in plain words instead of leaving the layer out. */

type Both = { en: string; ar: string };
export type Block =
  | number
  | "swatches"
  | "grid"
  | "numbers"
  | "platform"
  | { fig: string[]; alt: Both }
  | { absent: Both };

export type CaseLayers = {
  title: Both;
  h1: Both;
  film: Both;
  kind: Both;
  live: Both;
  design: Block[];
  build: Block[];
  measure: Block[];
  numbers?: { en: [string, string, boolean?][]; ar: [string, string, boolean?][] };
};

/* The order the cases are read in; "next" follows it and wraps round. */
export const ORDER = ["devlo", "mo3ta", "cutaway", "freightzone", "kevla"] as const;

export const LAYERS: Record<string, CaseLayers> = {
  devlo: {
    title: { en: "Devlo CMS", ar: "ديفلو" },
    h1: { en: "One Laravel application, 24 newsrooms.", ar: "تطبيق <bdi>Laravel</bdi> واحد، و24 غرفة أخبار." },
    film: { en: "devlo-intro", ar: "devlo-intro-ar" },
    kind: { en: "Production, team work at TakTek", ar: "إنتاج، عمل فريق في <bdi>TakTek</bdi>" },
    live: { en: "demo.taktek.co, behind a login", ar: "<bdi>demo.taktek.co</bdi>، بتسجيل دخول" },
    design: [3, 2, "swatches", { fig: ["iwad-home-1400", "iwad-home-phone-390"], alt: { en: "IWAD home page on a laptop|IWAD home page on a phone", ar: "الصفحة الرئيسية لإيواد على الحاسوب|الصفحة الرئيسية لإيواد على الهاتف" } }, 4],
    build: [0, 1, "platform", { fig: ["qudsn-phone-390"], alt: { en: "Quds News Network at phone width", ar: "شبكة قدس الإخبارية على عرض الهاتف" } }, 5],
    measure: [6, "numbers"],
    numbers: {
      en: [["749 → 78 KB", "Fonts on Maktoob Media"], ["302 → 31.6 KB", "Icons on Maktoob Media"], ["84 vs 83", "content-visibility, measured and thrown away", true], ["2.33 s", "Quds News Network, real users’ LCP over 28 days"], ["104 ms", "Quds News Network, real users’ INP"]],
      ar: [["749 → 78 KB", "الخطوط في مكتوب ميديا"], ["302 → 31.6 KB", "الأيقونات في مكتوب ميديا"], ["84 vs 83", "content-visibility، قيست واستُبعدت", true], ["2.33 s", "شبكة قدس، LCP لمستخدمين فعليين خلال 28 يومًا"], ["104 ms", "شبكة قدس، INP لمستخدمين فعليين"]],
    },
  },

  mo3ta: {
    title: { en: "Mo3ta", ar: "معطى" },
    h1: { en: "A number, with its date and its source.", ar: "رقم، ومعه تاريخه ومصدره." },
    film: { en: "mo3ta-intro", ar: "mo3ta-intro-ar" },
    kind: { en: "Production, independent", ar: "إنتاج، عمل مستقل" },
    live: { en: "mo3ta.ps", ar: "<bdi>mo3ta.ps</bdi>" },
    design: [0, 3, { fig: ["mo3ta-dashboard-1400", "mo3ta-home-phone-390"], alt: { en: "Mo3ta’s daily dashboard: headline counts, filters and the top of a map|Mo3ta’s home page on a phone: the map with four headline counts around it", ar: "لوحة معطى اليومية: الأرقام الرئيسية والمرشحات وأعلى الخريطة|الصفحة الرئيسية لمعطى على الهاتف: الخريطة وحولها أربعة أرقام رئيسية" } }],
    build: [1, 2, { fig: ["mo3ta-dashboard-phone-390"], alt: { en: "Mo3ta’s daily dashboard at phone width", ar: "لوحة معطى اليومية على عرض الهاتف" } }],
    measure: [{ absent: {
      en: "Not measured here yet. Mo3ta is not on the weekly PageSpeed run, and the centre has not shared usage numbers I can publish. The case says the site is live, and no more than that.",
      ar: "لم يُقس هنا بعد. معطى ليس ضمن قياس PageSpeed الأسبوعي، ولم يشارك المركز أرقام استخدام يمكنني نشرها. الحالة تقول إن الموقع منشور، ولا شيء أكثر.",
    } }],
  },

  cutaway: {
    title: { en: "Cutaway", ar: "Cutaway" },
    h1: { en: "A hospital, one question at a time.", ar: "مستشفى، سؤالًا واحدًا في كل مرة." },
    film: { en: "cutaway-film", ar: "cutaway-film" },
    kind: { en: "Concept, independent; the data is simulated", ar: "تصور، عمل مستقل، والبيانات مُحاكاة" },
    live: { en: "imsemoo.github.io/cutaway", ar: "<bdi>imsemoo.github.io/cutaway</bdi>" },
    design: [2, "swatches", "grid", 6, 8],
    build: [0, 1, 3, { fig: ["cutaway-clinic-1400", "cutaway-ops-phone-390"], alt: { en: "The real clinic, read from its BIM model, in plan|The operations view on a phone", ar: "العيادة الحقيقية، مقروءة من نموذج BIM، في المسقط|عرض العمليات على الهاتف" } }, 4, 5, 9, 10, 11],
    measure: [13, "numbers", 7, 12, 14],
    numbers: {
      en: [["89.7 kB", "What paints the interface first, gzipped"], ["72–90 fps", "The whole hospital, integrated GPU, 1280 × 800"], ["33", "Draw calls for the whole hospital"], ["93.6%", "How often each wing’s four-hour range held, backtested"]],
      ar: [["89.7 kB", "ما يرسم الواجهة أولًا، مضغوطًا"], ["72–90 fps", "المستشفى كاملًا، معالج رسوم مدمج، 1280 × 800"], ["33", "عمليات رسم للمستشفى كاملًا"], ["93.6%", "نسبة صمود نطاق الساعات الأربع لكل جناح، باختبار رجعي"]],
    },
  },

  freightzone: {
    title: { en: "FreightZone", ar: "FreightZone" },
    h1: { en: "Every bid looks the same.", ar: "كل العروض تبدو بالشكل نفسه." },
    film: { en: "freightzone-intro", ar: "freightzone-intro" },
    kind: { en: "Design only, client work", ar: "تصميم فقط، عمل لعميل" },
    live: { en: "The Figma file", ar: "ملف <bdi>Figma</bdi>" },
    design: [0, 1, 2, 3, 4, "swatches", { fig: ["freightzone-cover-1400"], alt: { en: "FreightZone cover: three phone screens with bids, an arrival time and an escrow confirmation", ar: "غلاف FreightZone: ثلاث شاشات هاتف فيها عروض ووقت وصول وتأكيد الدفع في الضمان" } }],
    build: [{ absent: {
      en: "I designed it and did not build it. The Figma file, with the case study inside it, is what I delivered.",
      ar: "صمّمته ولم أبنه. ملف Figma، ودراسة الحالة بداخله، هو ما سلّمته.",
    } }],
    measure: [{ absent: {
      en: "Nothing measured yet. The file proposes four hypotheses, each with the metric that would confirm or kill it after launch, from the time it takes to pick a bid to the drop-off before payment. They are proposals, not results.",
      ar: "لم يُقس شيء بعد. يقترح الملف أربع فرضيات، لكلٍّ منها المقياس الذي يؤكدها أو ينفيها بعد الإطلاق، من وقت اختيار العرض إلى التسرّب قبل الدفع. هي مقترحات، لا نتائج.",
    } }],
  },

  kevla: {
    title: { en: "Kevla Campa", ar: "Kevla Campa" },
    h1: { en: "The scroll does the explaining.", ar: "التمرير هو الذي يشرح." },
    film: { en: "kevla-intro", ar: "kevla-intro" },
    kind: { en: "Concept, not launched", ar: "تصور، غير مُطلق" },
    live: { en: "imsemoo.github.io/kevla-campa", ar: "<bdi>imsemoo.github.io/kevla-campa</bdi>" },
    design: ["swatches", "grid", 3, 4],
    build: [0, { fig: ["kevla-home-1400", "kevla-home-phone-390", "kevla-caravan-phone-390"], alt: { en: "Kevla Campa’s home page on a laptop|The home page on a phone|The caravan explorer on a phone", ar: "الصفحة الرئيسية لـKevla Campa على الحاسوب|الصفحة الرئيسية على الهاتف|مستكشف الكرفان على الهاتف" } }, 2, 5],
    measure: [1, "numbers"],
    numbers: {
      en: [["0", "axe-core violations across 24 page states"], ["100", "Lighthouse accessibility, best practices and SEO, every page"], ["16.8 ms", "95th-percentile frame at 4× CPU throttling"], ["296 → 73 px", "Largest jump in one frame, before and after the fix"]],
      ar: [["0", "مخالفة axe-core في 24 حالة صفحة"], ["100", "Lighthouse للوصول والممارسات وSEO، كل صفحة"], ["16.8 ms", "الإطار عند المئين 95 مع إبطاء المعالج 4×"], ["296 → 73 px", "أكبر قفزة في إطار واحد، قبل الإصلاح وبعده"]],
    },
  },
};
