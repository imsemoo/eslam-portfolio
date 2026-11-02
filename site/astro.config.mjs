// The portfolio, built with Astro: static pages, no client framework.
// It deploys to GitHub Pages under /eslam-portfolio/, the same address as today.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://imsemoo.github.io",
  base: "/eslam-portfolio",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "always" },
  devToolbar: { enabled: false },
});
