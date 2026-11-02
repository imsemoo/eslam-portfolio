/* Every page in both languages, with its hreflang pair. */
import { LAYERS } from "../data/layers";
export const prerender = true;
export function GET({ site }: { site: URL }) {
  const base = new URL(import.meta.env.BASE_URL.replace(/\/?$/, "/"), site).href;
  const paths = ["", "work/", "lab/", "about/", ...Object.keys(LAYERS).map((s) => `work/${s}/`)];
  const urls = paths.map((p) => {
    const en = base + p, ar = base + "ar/" + p;
    const alt = `<xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="ar" href="${ar}"/>`;
    return `<url><loc>${en}</loc>${alt}</url><url><loc>${ar}</loc>${alt}</url>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, { headers: { "Content-Type": "application/xml" } });
}
