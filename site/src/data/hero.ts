/* The hero cuts open one real screen: Cutaway's level view, a concept with
   simulated data, captured from the live demo. Boxes are percentages of the
   1400 × 875 capture. Every label repeats a fact from the Cutaway case in
   _dev/projects.json; nothing here is new. */
type Both = { en: string; ar: string };
type Box = { x: number; y: number; w: number; h: number; label: Both; inside?: boolean; below?: boolean; after?: boolean };

export const HERO = {
  image: "cutaway-route-1400",
  alt: {
    en: "Cutaway, a concept digital twin of a hospital: level 4 in 3D with a route drawn from a room to the nearest free infusion pump, and the room’s day in the side panel.",
    ar: "Cutaway، توأم رقمي لمستشفى كتصور تصميمي: الطابق الرابع ثلاثي الأبعاد ومسار مرسوم من غرفة إلى أقرب مضخة تسريب متاحة، ويوم الغرفة في اللوحة الجانبية.",
  } as Both,
  caption: {
    en: "Cutaway, a concept digital twin of a hospital. The data is simulated, and the demo says so on every view.",
    ar: "Cutaway، توأم رقمي لمستشفى كتصور تصميمي. البيانات مُحاكاة، والعرض يقول ذلك في كل شاشة.",
  } as Both,
  link: "work/cutaway/",
  design: [
    { x: 0.5, y: 7, w: 71.5, h: 74, inside: true, label: { en: "A white model; colour only ever means data", ar: "نموذج أبيض، واللون لا يعني إلا البيانات" } },
    { x: 1, y: 82.5, w: 46, h: 9, after: true, label: { en: "One layer at a time, its key beside it", ar: "طبقة واحدة في كل مرة، ومفتاحها بجانبها" } },
    { x: 73, y: 24.5, w: 26.5, h: 32, inside: true, label: { en: "Strong colour in the panel, soft on the floors", ar: "لون قوي في اللوحة، وخفيف على الأرضيات" } },
  ] as Box[],
  build: [
    { x: 3, y: 30, w: 66, h: 26, label: { en: "Wayfinding on a graph of 4,296 points", ar: "تحديد المسار على شبكة من 4,296 نقطة" } },
    { x: 0.5, y: 7, w: 71.5, h: 74, inside: true, label: { en: "React Three Fiber; one instanced mesh per part for all 36 wings", ar: "React Three Fiber، وشبكة واحدة متكررة لكل جزء في الأجنحة الـ36" } },
    { x: 0, y: 92.5, w: 47.5, h: 7.5, after: true, label: { en: "The day simulated in a Web Worker", ar: "اليوم مُحاكى داخل Web Worker" } },
    { x: 79.5, y: 1, w: 4.5, h: 4.5, below: true, label: { en: "Arabic from one switch", ar: "العربية بمفتاح واحد" } },
  ] as Box[],
  measure: {
    title: { en: "Cutaway, measured", ar: "Cutaway، مقيسًا" } as Both,
    rows: {
      en: [["89.7 kB", "what paints the interface first, gzipped"], ["72–90 fps", "the whole hospital, integrated GPU"], ["33", "draw calls for the whole hospital"], ["93.6%", "four-hour ranges that held, backtested"]],
      ar: [["89.7 kB", "ما يرسم الواجهة أولًا، مضغوطًا"], ["72–90 fps", "المستشفى كاملًا، معالج رسوم مدمج"], ["33", "عملية رسم للمستشفى كاملًا"], ["93.6%", "نطاقات الساعات الأربع التي صمدت، باختبار رجعي"]],
    } as { en: [string, string][]; ar: [string, string][] },
    source: { en: "Measured in September 2026, from the case study", ar: "قيس في سبتمبر 2026، من دراسة الحالة" } as Both,
  },
};
