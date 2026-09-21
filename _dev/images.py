"""Build the project images from the raw screenshots.

Every project gets the same treatment so the index reads as one system:
a 16:10 crop from the top of a 1440-wide above-the-fold screenshot, saved as
WebP at 1200 and 600 wide for srcset, plus a 240-wide thumbnail for the index
rows. OzCar's site is offline, so its image is a montage of two of the
screens I built, laid on the page's own paper colour.

Run from the repository root:  python _dev/images.py <raw-dir> <legacy-dir>
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "img", "work")
RAW = sys.argv[1] if len(sys.argv) > 1 else "raw"
LEGACY = sys.argv[2] if len(sys.argv) > 2 else "legacy"

PAPER = (243, 242, 238)
SIZES = ((1200, 750), (800, 500), (600, 375))
THUMB = (240, 150)


def top_crop(im, ratio=1.6):
    w, h = im.size
    ch = min(h, int(w / ratio))
    return im.crop((0, 0, w, ch))


def montage(paths):
    """One large screen on the left, two stacked on the right, on paper.
    Used where one screenshot cannot carry the project: OzCar, whose public
    site is limited to Australia, and Devlo, whose evidence is the sites
    it runs rather than its login page."""
    canvas = Image.new("RGB", (1440, 900), PAPER)
    pad, gap = 24, 20
    big_w = int((1440 - pad * 2 - gap) * 0.62)
    small_w = 1440 - pad * 2 - gap - big_w
    inner_h = 900 - pad * 2

    def framed(path, w, h):
        im = Image.open(path).convert("RGB")
        iw, ih = im.size
        target = w / h
        ch = min(ih, int(iw / target))
        im = im.crop((0, 0, iw, ch)).resize((w, h), Image.LANCZOS)
        frame = Image.new("RGB", (w + 2, h + 2), (214, 212, 205))
        frame.paste(im, (1, 1))
        return frame

    canvas.paste(framed(paths[0], big_w, inner_h), (pad - 1, pad - 1))
    small_h = (inner_h - gap) // 2
    x = pad + big_w + gap
    canvas.paste(framed(paths[1], small_w, small_h), (x - 1, pad - 1))
    canvas.paste(framed(paths[2], small_w, small_h), (x - 1, pad + small_h + gap - 1))
    return canvas


def save_all(im, slug):
    im = top_crop(im.convert("RGB"))
    for w, h in SIZES:
        im.resize((w, h), Image.LANCZOS).save(
            os.path.join(OUT, f"{slug}-{w}.webp"), "WEBP", quality=80, method=6
        )
    im.resize(THUMB, Image.LANCZOS).save(
        os.path.join(OUT, f"{slug}-thumb.webp"), "WEBP", quality=78, method=6
    )


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(ROOT, "_dev", "projects.json"), encoding="utf-8") as f:
        projects = json.load(f)["projects"]
    done = 0
    for p in projects:
        src = p.get("image")
        if not src:
            continue
        if isinstance(src, list):
            im = montage([os.path.join(RAW, s) if os.path.exists(os.path.join(RAW, s)) else os.path.join(LEGACY, s) for s in src])
        elif src.startswith("legacy/"):
            im = Image.open(os.path.join(LEGACY, src[7:]))
        else:
            im = Image.open(os.path.join(RAW, src))
        save_all(im, p["slug"])
        done += 1
        print("ok", p["slug"])
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"{done} projects, {len(os.listdir(OUT))} files, {total // 1024} KB")


if __name__ == "__main__":
    main()
