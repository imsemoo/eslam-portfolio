"""Render the link-preview cards (1200 x 630): _dev/og.html to img/og.png for
the English page, and _dev/og.ar.html to img/og-ar.png for the Arabic one.

The PNG is reduced to a 256-colour palette: it looks the same and stays far
under the 300 KB some crawlers give up at.

Run from the repository root:  python _dev/og.py
Needs:  pip install playwright   (it drives the Chrome already installed)
"""
import os
import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS = [("og.html", "og.png"), ("og.ar.html", "og-ar.png")]

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    for source, name in CARDS:
        page.goto(pathlib.Path(ROOT, "_dev", source).as_uri(), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ROOT, "img", name))
    browser.close()
for _, name in CARDS:
    out = os.path.join(ROOT, "img", name)
    im = Image.open(out).convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    im.save(out, optimize=True)
    print(f"img/{name} written, {os.path.getsize(out) // 1024} KB")
