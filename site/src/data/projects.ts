/* The case-study copy lives in _dev/projects.json (English) and
   _dev/projects.ar.json (Arabic), the same files the current site and the
   proposal tooling read. This page never keeps a second copy of it. */
import en from "../../../_dev/projects.json";
import ar from "../../../_dev/projects.ar.json";
import type { Lang } from "../lib";

const EN: Record<string, any> = Object.fromEntries((en as any).projects.map((p: any) => [p.slug, p]));
const AR: Record<string, any> = (ar as any).projects;

export function caseOf(slug: string, lang: Lang) {
  const base = EN[slug]?.case;
  if (!base) throw new Error(`No case for ${slug}`);
  if (lang === "en") return base;
  const over = AR[slug]?.case || {};
  return {
    ...base,
    ...over,
    // links and swatches keep their English hrefs and hex values, with Arabic labels laid over by position
    links: (base.links || []).map((l: any, i: number) => ({ ...l, ...(over.links?.[i] || {}) })),
    system: base.system && {
      ...base.system,
      ...(over.system || {}),
      swatches: (base.system.swatches || []).map((s: any, i: number) => ({ ...s, ...(over.system?.swatches?.[i] || {}) })),
      // grid items keep their English file names; only the words are Arabic
      grid: base.system.grid && {
        ...base.system.grid,
        ...(over.system?.grid || {}),
        items: (base.system.grid.items || []).map((it: any, i: number) => ({ ...it, ...(over.system?.grid?.items?.[i] || {}) })),
      },
    },
  };
}
