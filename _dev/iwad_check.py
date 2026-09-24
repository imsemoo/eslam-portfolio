"""Have the IWAD section hubs got publications yet?

The Devlo case shows the five IWAD section hubs from the theme build with
its sample content, because the live sections launched empty. Each empty
section serves the line "لم يصدر في هذا القسم شيء بعد" in its HTML; once it
is gone, the hub has publications and can be captured from the live site.

Run from the repository root:  python _dev/iwad_check.py
Prints one line per hub. Exit code: 0 while every hub is empty, 1 once all
five have publications, 3 while only some do, 2 if a page could not be
read. The grid is recaptured only at 1, so it never mixes the theme build
with the live site.
"""
import sys
import urllib.parse
import urllib.request

BASE = "https://wardefense.institute/section/"
HUBS = [
    ("global", "العالم"),
    ("regional", "قضايا إقليمية"),
    ("doctrine", "عقائد عسكرية"),
    ("education", "مواد تعليمية"),
    ("heritage", "إرث عسكري"),
]
EMPTY = "لم يصدر في هذا القسم شيء بعد"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    filled, failed = [], []
    for key, name in HUBS:
        url = BASE + urllib.parse.quote(name)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (portfolio evidence check)"})
            html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
        except Exception as err:  # the site is down or the path moved
            print(f"{key:10s} unreadable ({type(err).__name__})")
            failed.append(key)
            continue
        state = "empty" if EMPTY in html else "has publications"
        print(f"{key:10s} {state:17s} {url}")
        if state != "empty":
            filled.append(key)
    if failed:
        return 2
    if not filled:
        return 0
    return 1 if len(filled) == len(HUBS) else 3


if __name__ == "__main__":
    sys.exit(main())
