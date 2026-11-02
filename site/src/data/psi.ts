/* The weekly PageSpeed numbers, read at build time from the profile repository.
   The page fetches the same files again when it opens, so a later week shows up
   without a rebuild. If the build cannot reach GitHub, the cells stay empty. */
const BASE = "https://raw.githubusercontent.com/imsemoo/imsemoo/main/data/psi/";
export const PSI_SITES = ["imsemoo-github-io", "qudsn-co", "musnadye-com"] as const;

export type Psi = { perf: number | ""; a11y: number | ""; lcp: string; at: string };

export async function loadPsi(): Promise<Record<string, Psi>> {
  const out: Record<string, Psi> = {};
  await Promise.all(PSI_SITES.map(async (slug) => {
    try {
      const r = await fetch(BASE + slug + ".json");
      const d = await r.json();
      const m = d.results.mobile;
      out[slug] = { perf: m.scores.performance, a11y: m.scores.accessibility, lcp: m.metrics.lcp.display.replace(/ /g, " "), at: d.measuredAt.slice(0, 10) };
    } catch {
      out[slug] = { perf: "", a11y: "", lcp: "", at: "" };
    }
  }));
  return out;
}
