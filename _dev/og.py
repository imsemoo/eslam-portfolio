"""Render _dev/og.html to img/og.png (1200 x 630), the card link previews show.

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

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto(pathlib.Path(ROOT, "_dev", "og.html").as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(300)
    out = os.path.join(ROOT, "img", "og.png")
    page.screenshot(path=out)
    browser.close()
im = Image.open(out).convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT)
im.save(out, optimize=True)
print(f"img/og.png written, {os.path.getsize(out) // 1024} KB")
