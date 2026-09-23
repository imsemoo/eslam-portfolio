"""Capture the screenshots that the case studies use as evidence.

Every evidence item in projects.json names the page, the device and, when it
matters, how far down to scroll. This script opens each one in the installed
Chrome (through Playwright) and saves the viewport as a PNG in <raw-dir>;
images.py then crops and converts them. Phones are emulated properly
(390 x 844 CSS px, 2x, touch, mobile UA), so what lands in the portfolio is
what a reader's phone shows, not a squeezed desktop.

Most items point at a live site. A few point at a file in the project's own
repository instead (the IWAD section hubs, whose modules show only with the
theme's sample content): the item names a "root" and a "local" path, and the
root is given on the command line, so no local path is written into this
repository.

The live sites are newsrooms and dashboards, so a capture is a snapshot of
one day.

Run from the repository root:
    python _dev/snap.py <raw-dir> [--root iwad=<path-to-theme>] [slug ...]
Needs:  pip install playwright   (it drives the Chrome already installed)
"""
import json
import os
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PHONE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
)


def args(argv):
    raw, roots, only = (argv[0] if argv else "raw"), {}, set()
    rest = argv[1:]
    while rest:
        a = rest.pop(0)
        if a == "--root" and rest:
            name, _, path = rest.pop(0).partition("=")
            roots[name] = path
        else:
            only.add(a)
    return raw, roots, only


def context(browser, device):
    if device == "phone":
        return browser.new_context(
            viewport={"width": 390, "height": 844}, device_scale_factor=2,
            is_mobile=True, has_touch=True, user_agent=PHONE_UA,
        )
    return browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)


def items(data, only):
    """Every capture a case asks for: its evidence, and the grid inside its system block."""
    for p in data["projects"]:
        c = p.get("case") or {}
        if only and p["slug"] not in only:
            continue
        for e in c.get("evidence", []):
            if e.get("file"):
                yield e
        for e in (c.get("system") or {}).get("grid", {}).get("items", []):
            yield {"device": "desktop", **e}


def main():
    raw, roots, only = args(sys.argv[1:])
    os.makedirs(raw, exist_ok=True)
    data = json.load(open(os.path.join(ROOT, "_dev", "projects.json"), encoding="utf-8"))
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True)
        for e in items(data, only):
            if e.get("local"):
                if e.get("root") not in roots:
                    print("  skip:", e["file"], f"(needs --root {e.get('root')}=<path>)")
                    continue
                url = pathlib.Path(roots[e["root"]], e["local"]).resolve().as_uri()
            else:
                url = e["url"]
            ctx = context(browser, e.get("device", "desktop"))
            page = ctx.new_page()
            try:
                page.goto(url, wait_until="networkidle", timeout=45000)
            except Exception as err:  # a slow ad or socket never settles; the page is there
                print("  slow:", e["file"], type(err).__name__)
            if e.get("scroll"):
                page.evaluate(f"window.scrollTo(0, {int(e['scroll'])})")
            page.wait_for_timeout(e.get("wait", 3500))
            page.screenshot(path=os.path.join(raw, e["file"] + ".png"))
            ctx.close()
            print("ok", e["file"])
        browser.close()


if __name__ == "__main__":
    main()
