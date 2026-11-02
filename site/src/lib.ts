import ui from "./i18n/ui.json";

export type Lang = "en" | "ar";
export const t = (lang: Lang) => (ui as any)[lang];

/** A path inside the site, with the GitHub Pages base in front. */
export function url(path = "") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}

/** The same page in the other language. Both trees share their slugs. */
export function otherLang(lang: Lang, path: string) {
  return lang === "en" ? url(`ar/${path}`) : url(path);
}

export const EMAIL = "en.developer2@gmail.com";
export const CURRENT_SITE = "https://imsemoo.github.io/eslam-portfolio/";
