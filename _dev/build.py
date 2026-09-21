"""Generate index.html from _dev/template.html and _dev/projects.json.

The shipped page is static HTML. This script only exists so that thirty-odd
projects live in one JSON file instead of being hand-edited in markup, and so
the page can print its own weight honestly in the footer.

Run from the repository root:  python _dev/build.py
"""
import datetime as dt
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV = os.path.join(ROOT, "_dev")
ICONS = os.path.join(DEV, "icons")

LANG = {"ar": "Arabic", "en": "English", "bi": "Arabic and English", "de": "German and English"}
LANG_SHORT = {"ar": "AR", "en": "EN", "bi": "AR/EN", "de": "DE/EN"}


def esc(s):
    return html.escape(s or "", quote=True)


def host(url):
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/")


def icon(name, cls="icon"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def sprite():
    """Phosphor's regular set, inlined as symbols so there is no icon font."""
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">']
    for f in sorted(os.listdir(ICONS)):
        if not f.endswith(".svg"):
            continue
        raw = open(os.path.join(ICONS, f), encoding="utf-8").read()
        vb = re.search(r'viewBox="([^"]+)"', raw)
        inner = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", raw, flags=re.S).strip()
        inner = re.sub(r"<title>.*?</title>", "", inner, flags=re.S)
        parts.append(f'<symbol id="i-{f[:-4]}" viewBox="{vb.group(1) if vb else "0 0 256 256"}">{inner}</symbol>')
    parts.append("</svg>")
    return "\n".join(parts)


def picture(p, sizes, cls="", loading="lazy", priority=None):
    """priority: True for the LCP candidate, False for images that should yield, None for default."""
    slug = p["slug"]
    alt = esc(p.get("alt") or f"{p['name']} website")
    extra = {True: ' fetchpriority="high"', False: ' fetchpriority="low"'}.get(priority, "")
    return (
        f'<img class="{cls}" src="img/work/{slug}-1200.webp" '
        f'srcset="img/work/{slug}-600.webp 600w, img/work/{slug}-800.webp 800w, img/work/{slug}-1200.webp 1200w" '
        f'sizes="{sizes}" width="1200" height="750" alt="{alt}" loading="{loading}" decoding="async"{extra}>'
    )


def shot(p, sizes, priority=None, cls=""):
    """A screenshot in the page's thin frame. Caption is the host, nothing else."""
    cap = p.get("caption") or (host(p["url"]) if p.get("url") else ("code on GitHub" if p.get("code") else "private build"))
    loading = "eager" if priority is not None else "lazy"
    return (
        f'<figure class="shot {cls}">'
        f'<div class="shot__bar"><span class="shot__cap mono">{esc(cap)}</span></div>'
        f'{picture(p, sizes, "shot__img", loading, priority)}'
        f"</figure>"
    )


def tags(stack):
    return "".join(f'<span class="tag">{esc(t)}</span>' for t in stack)


def rank_attrs(p, ranks):
    """data-rank-<filter> for the filters whose order is set by hand under
    "orders" in projects.json; filters.js sorts the visible rows by it. Every
    other filter follows the order of the projects array."""
    out = ""
    for fid, order in ranks.items():
        if p["slug"] in order:
            out += f' data-rank-{fid}="{order.index(p["slug"]) + 1}"'
    return out


def row(p, n, ranks):
    tier = p["tier"]
    featured = bool(p.get("case"))
    has_img = bool(p.get("image"))
    if featured:
        href, external = f"#case-{p['slug']}", False
    elif p.get("url"):
        href, external = p["url"], True
    elif p.get("code"):
        href, external = p["code"], True
    else:
        href, external = None, False

    thumb = (
        f'<span class="row__thumb"><img src="img/work/{p["slug"]}-thumb.webp" width="240" height="150" '
        f'alt="" loading="lazy" decoding="async"></span>'
        if has_img
        else f'<span class="row__thumb row__thumb--empty" aria-hidden="true" data-initial="{esc(p["name"][0])}" data-note="{"repo" if p.get("code") else "private"}"></span>'
    )
    ar = f' <span class="ar">{esc(p["ar"])}</span>' if p.get("ar") else ""
    where = f'<span class="row__where">{esc(p["where"])}</span>' if p.get("where") else ""
    name_html = f'<span class="row__name">{esc(p["name"])}{ar}</span>'
    if href:
        attrs = ' target="_blank" rel="noopener"' if external else ""
        name_html = f'<a class="row__link" href="{esc(href)}"{attrs}>{name_html}</a>'
    if featured and p.get("url"):
        ext = (
            f'<a class="row__ext" href="{esc(p["url"])}" target="_blank" rel="noopener" '
            f'aria-label="Open {esc(host(p["url"]))}"><span class="row__ext-text">Visit</span>{icon("arrow-up-right")}</a>'
        )
    elif p.get("url"):
        ext = f'<span class="row__ext" aria-hidden="true"><span class="row__ext-text">Visit</span>{icon("arrow-up-right")}</span>'
    elif p.get("code"):
        ext = f'<span class="row__ext" aria-hidden="true"><span class="row__ext-text">Code</span>{icon("arrow-up-right")}</span>'
    else:
        ext = '<span class="row__ext row__ext--none" aria-hidden="true"><span class="row__ext-text">Private</span></span>'
    preview = f' data-preview="img/work/{p["slug"]}-600.webp"' if has_img else ""
    return (
        f'<li class="row row--t{tier}" id="p-{p["slug"]}" data-tags="{esc(" ".join(p["tags"]))}"{preview}{rank_attrs(p, ranks)}>'
        f'<span class="row__n mono" aria-hidden="true"></span>'
        f"{thumb}"
        f'<div class="row__main">{name_html}'
        f'<span class="row__client">{esc(p["client"])}{where}</span></div>'
        f'<span class="row__role">{esc(p["role"])}</span>'
        f'<span class="row__stack">{tags(p["stack"][:3])}</span>'
        f'<span class="row__lang mono" title="{LANG[p["lang"]]}">{LANG_SHORT[p["lang"]]}</span>'
        f"{ext}"
        f"</li>"
    )


def case(p, i):
    c = p["case"]
    layout = "case--full" if i in (0, 3) else ("case--flip" if i == 2 else "")
    meta = (
        '<dl class="case__meta">'
        f'<div><dt>Client</dt><dd>{esc(p["client"])}</dd></div>'
        f'<div><dt>Where</dt><dd>{esc(p["where"])}</dd></div>'
        f'<div><dt>Role</dt><dd>{esc(p["role"])}</dd></div>'
        f'<div><dt>Stack</dt><dd>{esc(", ".join(p["stack"]))}</dd></div>'
        "</dl>"
    )
    def block(title, items):
        lis = "".join(f"<li>{esc(x)}</li>" for x in items)
        return f'<div class="case__block"><h4>{title}</h4><ul>{lis}</ul></div>'
    link = (
        f'<a class="btn btn--ghost" href="{esc(p["url"])}" target="_blank" rel="noopener">'
        f'Open {esc(host(p["url"]))}{" (Australia only)" if p["slug"] == "ozcar" else ""} {icon("arrow-up-right")}</a>'
        if p.get("url")
        else ""
    )
    sizes = "(min-width: 900px) 1180px, 100vw" if "full" in layout else "(min-width: 900px) 56vw, 100vw"
    back = f'<a class="case__back" href="#index">{icon("arrow-up")}Back to the index</a>'
    return f"""
<article class="case {layout}" id="case-{p['slug']}">
  <header class="case__head">
    <p class="case__cat mono">{esc(c['category'])}</p>
    <h3>{esc(p['name'])}{' <span class="ar">' + esc(p['ar']) + '</span>' if p.get('ar') else ''}</h3>
    <p class="case__lede">{esc(p['summary'])}</p>
    {meta}
  </header>
  <div class="case__visual" data-parallax-section>{shot(p, sizes, cls='shot--case')}</div>
  <div class="case__body">
    <div class="case__block case__block--problem"><h4>The problem</h4><p>{esc(c['problem'])}</p></div>
    {block('What I did', c['did'])}
    {block('Technical notes', c['tech'])}
    {block('Result', c['result'])}
    <div class="case__cta">{link}{back}</div>
  </div>
</article>"""


CSS_ORDER = ["fonts", "tokens", "base", "components", "sections", "motion"]


def bundle_css():
    """One stylesheet on the wire; the sources stay separate for editing.
    Comments and indentation go, nothing else is rewritten."""
    parts = []
    for name in CSS_ORDER:
        css = open(os.path.join(ROOT, "css", f"{name}.css"), encoding="utf-8").read()
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        css = re.sub(r"\s*\n\s*", "\n", css).strip()
        css = re.sub(r"\n+", "\n", css)
        parts.append(f"/* {name} */\n{css}")
    out = "\n".join(parts) + "\n"
    open(os.path.join(ROOT, "css", "site.css"), "w", encoding="utf-8", newline="\n").write(out)
    return out


def footprint():
    """The stylesheet is inlined into the document, so the first paint needs
    one request: the HTML itself. The bundle is still written to css/site.css
    for anyone who wants to read it."""
    css = bundle_css()
    jsdir = os.path.join(ROOT, "js")
    js_files = [f for f in os.listdir(jsdir) if f.endswith(".js")]
    js = round(sum(os.path.getsize(os.path.join(jsdir, f)) for f in js_files) / 1024)
    n = 1 + len(js_files)  # the document, then the module graph
    return css, js, n


def main():
    data = json.load(open(os.path.join(DEV, "projects.json"), encoding="utf-8"))
    projects = data["projects"]
    tpl = open(os.path.join(DEV, "template.html"), encoding="utf-8").read()

    ranks = data.get("orders", {})
    for fid, order in ranks.items():
        tagged = {p["slug"] for p in projects if fid in p["tags"]}
        assert set(order) == tagged and len(order) == len(tagged), f"orders.{fid} must list every {fid} project exactly once"
    featured = [p for p in projects if p.get("case")]
    rows = "\n".join(row(p, i + 1, ranks) for i, p in enumerate(projects))
    cases = "\n".join(case(p, i) for i, p in enumerate(featured))
    def tally(fid):
        return len(projects) if fid == "all" else sum(1 for p in projects if fid in p["tags"])
    chips = "".join(
        f'<button class="chip" type="button" data-filter="{f["id"]}" aria-pressed="{"true" if f["id"] == "all" else "false"}">'
        f'{esc(f["label"])} <span class="chip__n mono">{tally(f["id"])}</span></button>'
        for f in data["filters"]
    )
    by = {p["slug"]: p for p in projects}
    def card(s, i):
        p = by[s]
        if p.get("case"):
            href, open_ = f"#case-{s}", "open the case study"
        elif p.get("url"):
            href, open_ = p["url"], f"open {host(p['url'])}"
        else:
            href, open_ = f"#p-{s}", "find it in the index"
        kind = p["case"]["category"].lower() if p.get("case") else p["client"].lower()
        cap = p.get("caption") or (host(p["url"]) if p.get("url") else p["name"])
        ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        return (
            f'<a class="hero__card" href="{esc(href)}"{ext} data-card data-name="{esc(p["name"])}" '
            f'data-cap="{esc(cap)}" data-kind="{esc(kind)}" data-open="{esc(open_)}">'
            f'{shot(p, "(min-width: 900px) 38vw, 80vw", priority=(i == 0))}</a>'
        )
    hero_shots = "".join(
        f'<div class="hero__layer hero__layer--{i + 1}{" is-front" if i == 0 else ""}" data-depth="{d}" data-slot="{i + 1}">{card(s, i)}</div>'
        for i, (s, d) in enumerate([("mo3ta", 0.12), ("iwad", 0.22), ("qasioun", 0.34)])
    )
    css, js_kb, requests = footprint()
    css_kb = round(len(css.encode("utf-8")) / 1024)
    live = sum(1 for p in projects if p.get("url"))

    out = (
        tpl.replace("{{CSS}}", "<style>\n" + css.replace("../fonts/", "fonts/") + "</style>")
        .replace("{{ICONS}}", sprite())
        .replace("{{CHIPS}}", chips)
        .replace("{{ROWS}}", rows)
        .replace("{{CASES}}", cases)
        .replace("{{HERO_SHOTS}}", hero_shots)
        .replace("{{COUNT}}", str(len(projects)))
        .replace("{{LIVE}}", str(live))
        .replace("{{CSS_KB}}", str(css_kb))
        .replace("{{JS_KB}}", str(js_kb))
        .replace("{{REQUESTS}}", str(requests))
        .replace("{{BUILT}}", dt.date.today().strftime("%d %B %Y").lstrip("0"))
    )
    assert "—" not in out and "–" not in out, "no dashes but hyphens on this page"
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8", newline="\n").write(out)
    print(f"index.html written: {len(projects)} projects, {len(featured)} cases, {css_kb} KB css, {js_kb} KB js")


if __name__ == "__main__":
    main()
