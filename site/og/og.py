"""Render the link-preview cards, public/img/og.png and og-ar.png, from og.html.
Run from site/: python og/og.py   (needs Playwright and the installed Chrome)"""
import asyncio, pathlib
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / "public" / "img"
AR = {"name": "إسلام ناصر", "line": "ما توافق عليه في التصميم هو ما <em>يُنفَّذ.</em>", "k1": "التصميم", "k2": "البناء", "k3": "القياس"}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width": 1200, "height": 630})
        for lang in ("en", "ar"):
            await pg.goto((HERE / "og.html").as_uri())
            if lang == "ar":
                await pg.evaluate("""(t) => {
                  document.documentElement.lang = "ar"; document.documentElement.dir = "rtl";
                  document.querySelector("[data-name]").textContent = t.name;
                  document.querySelector("[data-line]").innerHTML = t.line;
                  ["k1","k2","k3"].forEach(k => document.querySelector(`[data-${k}]`).textContent = t[k]);
                }""", AR)
            await pg.evaluate("document.fonts.ready")
            await pg.wait_for_timeout(300)
            name = "og.png" if lang == "en" else "og-ar.png"
            await pg.screenshot(path=str(OUT / name))
            print("wrote", OUT / name)
        await b.close()

asyncio.run(main())
