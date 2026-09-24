"""Generate index.html from _dev/template.html and _dev/projects.json.

The shipped page is static HTML. This script only exists so that thirty-odd
projects live in one JSON file instead of being hand-edited in markup, and so
the page can print its own weight honestly.

Anything a case study still needs from me (a result I cannot prove, a missing
screen) sits under "todo" in projects.json. It is printed here after every
build and never rendered on the page.

Run from the repository root:  python _dev/build.py
"""
import datetime as dt
import hashlib
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV = os.path.join(ROOT, "_dev")
ICONS = os.path.join(DEV, "icons")

LANG = {"ar": "Arabic", "en": "English", "bi": "Arabic and English", "de": "German and English", "sv": "Swedish"}
LANG_SHORT = {"ar": "AR", "en": "EN", "bi": "AR/EN", "de": "DE/EN", "sv": "SV"}


def esc(s):
    return html.escape(s or "", quote=True)


def host(url):
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/")


def icon(name, cls="icon"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def arabic(p):
    return f' <span class="ar" lang="ar" dir="rtl">{esc(p["ar"])}</span>' if p.get("ar") else ""


def sprite(used):
    """Phosphor's regular set, inlined as symbols so there is no icon font.
    Only the icons the page actually references are included."""
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">']
    for f in sorted(os.listdir(ICONS)):
        if not f.endswith(".svg") or f[:-4] not in used:
            continue
        raw = open(os.path.join(ICONS, f), encoding="utf-8").read()
        vb = re.search(r'viewBox="([^"]+)"', raw)
        inner = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", raw, flags=re.S).strip()
        inner = re.sub(r"<title>.*?</title>", "", inner, flags=re.S)
        inner = re.sub(r'\sid="[^"]*"', "", inner)
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


def frame(cap, img, cls=""):
    """The page's thin screenshot frame. The bar carries the host, nothing else."""
    return (
        f'<div class="shot {cls}">'
        f'<div class="shot__bar"><span class="shot__cap">{esc(cap)}</span></div>'
        f"{img}</div>"
    )


def caption(p):
    return p.get("caption") or (host(p["url"]) if p.get("url") else ("code on GitHub" if p.get("code") else "private build"))


def shot(p, sizes, priority=None, cls=""):
    loading = "eager" if priority is not None else "lazy"
    return frame(caption(p), picture(p, sizes, "shot__img", loading, priority), cls)


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


CASE_NAMES = {}


def target(p):
    """Where a project's name leads: its case study or brief on this page if
    it has one, otherwise the live site, otherwise the code."""
    if p.get("case"):
        return f"#case-{p['slug']}", False, "Case study"
    if p.get("in_case"):
        return f"#case-{p['in_case']}", False, f"In the {CASE_NAMES.get(p['in_case'], 'case')} case study"
    if p.get("brief"):
        return f"#brief-{p['slug']}", False, "In brief"
    if p.get("url"):
        return p["url"], True, None
    if p.get("code"):
        return p["code"], True, None
    return None, False, None


# ------------------------------------------------------------------ index rows
def row(p, i, ranks, open_n):
    href, external, badge = target(p)
    thumb = (
        f'<span class="row__thumb"><img src="img/work/{p["slug"]}-thumb.webp" width="240" height="150" '
        f'alt="" loading="lazy" decoding="async"></span>'
        if p.get("image")
        else f'<span class="row__thumb row__thumb--empty" aria-hidden="true" data-initial="{esc(p["name"][0])}" data-note="{"repo" if p.get("code") else "private"}"></span>'
    )
    where = f'<span class="row__where">{esc(p["where"])}</span>' if p.get("where") else ""
    name_html = f'<span class="row__name">{esc(p["name"])}{arabic(p)}</span>'
    if href:
        attrs = ' target="_blank" rel="noopener"' if external else ""
        name_html = f'<a class="row__link" href="{esc(href)}"{attrs}>{name_html}</a>'
    badge_html = f'<span class="row__badge">{badge}</span>' if badge else ""
    if badge and p.get("url"):
        # the row opens something on this page; the site gets its own link
        ext = (
            f'<a class="row__ext" href="{esc(p["url"])}" target="_blank" rel="noopener" '
            f'aria-label="Visit {esc(host(p["url"]))}"><span class="row__ext-text">Visit</span>{icon("arrow-up-right")}</a>'
        )
    elif p.get("url"):
        ext = f'<span class="row__ext" aria-hidden="true"><span class="row__ext-text">Visit</span>{icon("arrow-up-right")}</span>'
    elif p.get("code"):
        ext = f'<span class="row__ext" aria-hidden="true"><span class="row__ext-text">Code</span>{icon("arrow-up-right")}</span>'
    else:
        ext = '<span class="row__ext row__ext--none" aria-hidden="true"><span class="row__ext-text">Private</span></span>'
    preview = f' data-preview="img/work/{p["slug"]}-600.webp"' if p.get("image") else ""
    extra = " data-extra" if i >= open_n else ""
    return (
        f'<li class="row row--t{p["tier"]}" id="p-{p["slug"]}" data-tags="{esc(" ".join(p["tags"]))}"{preview}{rank_attrs(p, ranks)}{extra}>'
        f"{thumb}"
        f'<div class="row__main"><span class="row__title">{name_html}{badge_html}</span>'
        f'<span class="row__client">{esc(p["client"])}{where}</span></div>'
        f'<span class="row__role">{esc(p["role"])}</span>'
        f'<span class="row__stack">{tags(p["stack"][:3])}</span>'
        f'<span class="row__lang" title="{LANG[p["lang"]]}"><span class="visually-hidden">{LANG[p["lang"]]}</span><span aria-hidden="true">{LANG_SHORT[p["lang"]]}</span></span>'
        f"{ext}"
        f"</li>"
    )


# ------------------------------------------------------------------ evidence
def ev_img(e):
    f, kind = e["file"], e["kind"]
    alt = esc(e["alt"])
    if kind == "phone":
        return (
            f'<img src="img/work/ev/{f}-600.webp" srcset="img/work/ev/{f}-390.webp 390w, img/work/ev/{f}-600.webp 600w" '
            f'sizes="(min-width: 900px) 15vw, 44vw" width="600" height="1298" alt="{alt}" loading="lazy" decoding="async">'
        )
    if kind == "strip":
        return (
            f'<img class="shot__img shot__img--strip" src="img/work/ev/{f}-1600.webp" srcset="img/work/ev/{f}-1000.webp 1000w, img/work/ev/{f}-1600.webp 1600w" '
            f'sizes="(min-width: 1240px) 1140px, 94vw" width="1600" height="533" alt="{alt}" loading="lazy" decoding="async">'
        )
    return (
        f'<img class="shot__img" src="img/work/ev/{f}-1400.webp" srcset="img/work/ev/{f}-800.webp 800w, img/work/ev/{f}-1400.webp 1400w" '
        f'sizes="(min-width: 900px) 58vw, 94vw" width="1400" height="875" alt="{alt}" loading="lazy" decoding="async">'
    )


def ev_figure(e, by):
    cap = f'<figcaption class="ev__cap">{esc(e["caption"])}</figcaption>'
    if e["kind"] == "fleet":
        sites = "".join(
            f'<li class="fleet__site"><img src="img/work/{s}-600.webp" width="600" height="375" '
            f'alt="{esc(by[s]["name"])} front page" loading="lazy" decoding="async">'
            f'<span class="fleet__name">{esc(by[s]["name"])}{arabic(by[s])}</span></li>'
            for s in e["sites"]
        )
        return f'<figure class="ev ev--fleet" data-reveal-ev><ul class="fleet">{sites}</ul>{cap}</figure>'
    if e["kind"] == "phone":
        return f'<figure class="ev ev--phone" data-reveal-ev><div class="phone">{ev_img(e)}</div>{cap}</figure>'
    bar = e.get("bar") or host(e["url"])
    return f'<figure class="ev ev--{e["kind"]}" data-reveal-ev>{frame(bar, ev_img(e))}{cap}</figure>'


def system(c, slug):
    """A case's design system shown with its own values: the colour tokens
    as they are in the project's CSS, and small screens of the variants."""
    s = c.get("system")
    if not s:
        return ""
    sw = "".join(
        f'<li class="sw"><span class="sw__chip" style="--c:{esc(x["hex"])}" aria-hidden="true"></span>'
        f'<span class="sw__name">{esc(x["name"])}</span><code>{esc(x["hex"])}</code>'
        f'<span class="sw__role">{esc(x["role"])}</span></li>'
        for x in s["swatches"]
    )
    grid = ""
    if s.get("grid"):
        g = s["grid"]
        def cell(i):
            if i.get("hex"):
                alt = f'The {esc(i["label"])} section hub, in its {esc(i["hex"])} accent'
                label = (
                    f'<span class="vgrid__dot" style="--c:{esc(i["hex"])}" aria-hidden="true"></span>'
                    f'{esc(i["label"])} <code>{esc(i["hex"])}</code> <span class="vgrid__ratio">{esc(i["ratio"])}</span>'
                )
            else:
                alt = esc(i.get("alt") or f'The {i["label"].lower()} theme')
                label = esc(i["label"])
            return (
                f'<li class="vgrid__item"><img src="img/work/ev/{esc(i["file"])}-600.webp" width="600" height="375" '
                f'alt="{alt}" loading="lazy" decoding="async"><span class="vgrid__label">{label}</span></li>'
            )
        cells = "".join(cell(i) for i in g["items"])
        grid = (
            f'<figure class="ev ev--grid" data-reveal-ev><ul class="vgrid" style="--n: {len(g["items"])}">{cells}</ul>'
            f'<figcaption class="ev__cap">{esc(g["caption"])}</figcaption></figure>'
        )
    return (
        f'<section class="system" aria-labelledby="case-{slug}-system">'
        f'<h4 id="case-{slug}-system">{esc(s["title"])}</h4>'
        f'<ul class="swatches">{sw}</ul>'
        f'<p class="system__note">{esc(s["note"])}</p>{grid}</section>'
    )


# ------------------------------------------------------------------ featured cases
def feature(p, by):
    c = p["case"]
    slug = p["slug"]
    glance = "".join(f"<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>" for k, v in c["glance"])
    if not p.get("url") and c.get("live"):
        glance += f'<div><dt>{esc(c["live"]["label"])}</dt><dd>{esc(c["live"]["text"])}</dd></div>'
    if p.get("url"):
        live = c.get("live", {})
        glance += (
            f'<div><dt>{esc(live.get("label", "Live"))}</dt><dd><a href="{esc(p["url"])}" target="_blank" rel="noopener">'
            f'{esc(live.get("text", host(p["url"])))}</a></dd></div>'
        )
    lead = [e for e in c["evidence"] if e["kind"] != "phone"]
    phones = [e for e in c["evidence"] if e["kind"] == "phone"]
    aside = c.get("layout") == "aside" or any(e["kind"] == "strip" for e in lead)
    row_items = lead if aside else lead + phones
    n_phones = 0 if aside else len(phones)
    evidence = (
        f'<div class="evidence evidence--p{n_phones}" style="--phones: {n_phones}">'
        + "".join(ev_figure(e, by) for e in row_items)
        + "</div>"
    )
    blocks = "".join(f'<section class="story__block"><h4>{esc(b["h"])}</h4><p>{esc(b["p"])}</p></section>' for b in c["story"])
    story_aside = f'<div class="story__aside">{"".join(ev_figure(e, by) for e in phones)}</div>' if aside and phones else ""
    story = f'<div class="story{" story--aside" if story_aside else ""}">{story_aside}<div class="story__blocks">{blocks}</div></div>'
    result = "".join(f"<li>{esc(r)}</li>" for r in c["result"])
    reflect = (
        f'<div class="outcome__reflect"><h4>What I would do differently</h4><p>{esc(c["reflection"])}</p></div>'
        if c.get("reflection") else ""
    )
    links = "".join(
        f'<a class="btn btn--ghost" href="{esc(l["href"])}" target="_blank" rel="noopener">{esc(l["label"])} {icon("arrow-up-right")}</a>'
        for l in c.get("links", [])
    )
    return f"""
<article class="feature" id="case-{slug}" aria-labelledby="case-{slug}-title">
  <header class="feature__head">
    <h3 class="feature__title" id="case-{slug}-title">{esc(p['name'])}{arabic(p)}</h3>
    <p class="feature__lede">{esc(c['lede'])}</p>
  </header>
  <dl class="glance">{glance}</dl>
  {evidence}
  <p class="decision"><strong class="decision__lead">The decision.</strong> {esc(c['decision'])}</p>
  {system(c, slug)}
  {story}
  <div class="outcome{' outcome--two' if reflect else ''}"><div class="outcome__result"><h4>Result</h4><ul>{result}</ul></div>{reflect}</div>
  {f'<p class="feature__links">{links}</p>' if links else ''}
</article>"""


# ------------------------------------------------------------------ briefs
def brief(p):
    b = p["brief"]
    slug = p["slug"]
    notes = ""
    if b.get("notes"):
        lis = "".join(f"<li>{esc(n)}</li>" for n in b["notes"])
        notes = f'<details class="brief__notes"><summary>{esc(b.get("notes_title", "Notes"))}</summary><ul>{lis}</ul></details>'
    links = []
    if p.get("url"):
        note = f' <span class="brief__note">({esc(b["link_note"])})</span>' if b.get("link_note") else ""
        links.append(f'<a href="{esc(p["url"])}" target="_blank" rel="noopener">{esc(host(p["url"]))}{icon("arrow-up-right")}</a>{note}')
    if p.get("code"):
        links.append(f'<a href="{esc(p["code"])}" target="_blank" rel="noopener">Code on GitHub{icon("arrow-up-right")}</a>')
    if not links and b.get("status"):
        links.append(f'<span class="brief__note">{esc(b["status"])}</span>')
    # a wide brief takes the whole row, picture and text side by side
    wide = b.get("wide")
    sizes = "(min-width: 900px) 56vw, 94vw" if wide else "(min-width: 900px) 34vw, 94vw"
    return f"""
<article class="brief{' brief--wide' if wide else ''}" id="brief-{slug}" aria-labelledby="brief-{slug}-title">
  <div class="brief__media">{shot(p, sizes)}</div>
  <div class="brief__body">
    <h4 id="brief-{slug}-title">{esc(p['name'])}{arabic(p)}</h4>
    <p class="brief__meta">{esc(b['kind'])}. {esc(p['role'])}.</p>
    <p class="brief__text">{esc(b['text'])}</p>
    {notes}
    <p class="brief__links">{" ".join(links)}</p>
  </div>
</article>"""


def src_set(ref):
    """work:<slug> is a project image; anything else is a file in img/work/ev."""
    if ref.startswith("work:"):
        slug = ref[5:]
        return (f"img/work/{slug}-1200.webp",
                f"img/work/{slug}-600.webp 600w, img/work/{slug}-800.webp 800w, img/work/{slug}-1200.webp 1200w")
    return (f"img/work/ev/{ref}-1400.webp", f"img/work/ev/{ref}-800.webp 800w, img/work/ev/{ref}-1400.webp 1400w")


def hero_parts(items, by):
    """The stage shows the first case; the rail lists all three and carries
    what the stage needs to show each of them on hover."""
    def pack(h):
        p = by[h["slug"]]
        desk_slug = h["desk"][5:] if h["desk"].startswith("work:") else h["slug"]
        src, srcset = src_set(h["desk"])
        phone = h["phone"]
        return {
            "p": p, "src": src, "srcset": srcset,
            "phone": f"img/work/ev/{phone}-600.webp",
            "phone_set": f"img/work/ev/{phone}-390.webp 390w, img/work/ev/{phone}-600.webp 600w",
            "host": caption(by[desk_slug]),
            "alt": f"{by[desk_slug]['name']} on a laptop",
            "phone_alt": f"{p['name']} on a phone",
            "cap": h["cap"], "note": h["note"],
        }
    packs = [pack(h) for h in items]
    f = packs[0]
    stage = f"""<div class="hero__stage">
      <figure class="stage" data-stage>
        <div class="stage__rig" data-stage-rig>
          <div class="stage__desk">
            <div class="stage__bar"><i></i><i></i><i></i><span data-stage-host>{esc(f['host'])}</span></div>
            <div class="stage__screen">
              <img class="stage__img" data-stage-img src="{f['src']}" srcset="{f['srcset']}" sizes="(min-width: 1000px) 44vw, 92vw" width="1200" height="750" alt="{esc(f['alt'])}" fetchpriority="high" decoding="async">
              <div class="stage__blueprint" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
              <span class="stage__scan" aria-hidden="true"></span>
            </div>
          </div>
          <div class="stage__phone"><img data-stage-phone src="{f['phone']}" srcset="{f['phone_set']}" sizes="(min-width: 1000px) 12vw, 28vw" width="600" height="1298" alt="{esc(f['phone_alt'])}" decoding="async"></div>
          <div class="stage__select" aria-hidden="true"><b></b><b></b><b></b><b></b><span class="stage__size">1440 &#215; 900</span></div>
        </div>
        <figcaption class="stage__cap" data-stage-cap>{esc(f['cap'])}</figcaption>
      </figure>
    </div>"""
    rail = "".join(
        f'<li><a class="rail" href="#case-{k["p"]["slug"]}" data-rail'
        f'{" aria-current=\"true\"" if i == 0 else ""} data-src="{k["src"]}" data-srcset="{k["srcset"]}" '
        f'data-phone="{k["phone"]}" data-phone-set="{k["phone_set"]}" data-host="{esc(k["host"])}" '
        f'data-alt="{esc(k["alt"])}" data-phone-alt="{esc(k["phone_alt"])}" data-cap="{esc(k["cap"])}">'
        f'<img src="img/work/{k["p"]["slug"]}-thumb.webp" width="240" height="150" alt="" loading="lazy" decoding="async">'
        f'<span><span class="rail__name">{esc(k["p"]["name"])}</span><span class="rail__note">{esc(k["note"])}</span></span>'
        f'{icon("arrow-down-right")}</a></li>'
        for i, k in enumerate(packs)
    )
    return stage, rail


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


def footprint(tpl):
    """The stylesheet is inlined into the document, so the first paint needs
    one request: the HTML itself. After it come the module graph and the
    three PageSpeed files the measured section reads."""
    css = bundle_css()
    jsdir = os.path.join(ROOT, "js")
    js_files = [f for f in os.listdir(jsdir) if f.endswith(".js")]
    js = round(sum(os.path.getsize(os.path.join(jsdir, f)) for f in js_files) / 1024)
    n = 1 + len(js_files) + tpl.count("data-psi=")
    return css, js, n


def main():
    data = json.load(open(os.path.join(DEV, "projects.json"), encoding="utf-8"))
    projects = data["projects"]
    by = {p["slug"]: p for p in projects}
    tpl = open(os.path.join(DEV, "template.html"), encoding="utf-8").read()

    ranks = data.get("orders", {})
    for fid, order in ranks.items():
        tagged = {p["slug"] for p in projects if fid in p["tags"]}
        assert set(order) == tagged and len(order) == len(tagged), f"orders.{fid} must list every {fid} project exactly once"
    for s in data["featured"]:
        assert by[s].get("case"), f"{s} is featured but has no case"
    for s in data["briefs"]:
        assert by[s].get("brief"), f"{s} is listed in briefs but has no brief"

    open_n = data.get("index_open", len(projects))
    features = "\n".join(feature(by[s], by) for s in data["featured"])
    briefs = "\n".join(brief(by[s]) for s in data["briefs"])

    def tally(fid):
        return len(projects) if fid == "all" else sum(1 for p in projects if fid in p["tags"])

    groups = {}
    for f in data["filters"]:
        groups.setdefault(f.get("group", "type"), []).append(f)
    labels = data.get("filter_groups", {})
    chips = "".join(
        f'<div class="filters__group" role="group" aria-labelledby="fg-{g}">'
        f'<span class="filters__label" id="fg-{g}">{esc(labels.get(g, g))}</span><div class="filters__chips">'
        + "".join(
            f'<button class="chip" type="button" data-filter="{f["id"]}" data-group="{g}" '
            f'aria-pressed="{"true" if f["id"] == "all" else "false"}">'
            f'{esc(f["label"])}<span class="chip__n" aria-hidden="true" data-n>{tally(f["id"])}</span>'
            f'<span class="visually-hidden" data-n-sr>, {tally(f["id"])} projects</span></button>'
            for f in fs
        )
        + "</div></div>"
        for g, fs in groups.items()
    )

    CASE_NAMES.update({slug: by[slug]["name"].split(" ")[0] for slug in data["featured"]})
    rows = "\n".join(row(p, i, ranks, open_n) for i, p in enumerate(projects))
    hero_stage, hero_rail = hero_parts(data["hero"], by)
    css, js_kb, requests = footprint(tpl)
    version = hashlib.sha1(
        b"".join(open(os.path.join(ROOT, "js", f), "rb").read() for f in sorted(os.listdir(os.path.join(ROOT, "js"))) if f.endswith(".js"))
    ).hexdigest()[:8]
    css_kb = round(len(css.encode("utf-8")) / 1024)

    out = (
        tpl.replace("{{CSS}}", "<style>\n" + css.replace("../fonts/", "fonts/") + "</style>")
        .replace("{{CHIPS}}", chips)
        .replace("{{ROWS}}", rows)
        .replace("{{FEATURES}}", features)
        .replace("{{BRIEFS}}", briefs)
        .replace("{{HERO_STAGE}}", hero_stage)
        .replace("{{HERO_RAIL}}", hero_rail)
        .replace("{{V}}", version)
        .replace("{{COUNT}}", str(len(projects)))
        .replace("{{LIVE}}", str(sum(1 for p in projects if p.get("url"))))
        .replace("{{DESIGNED}}", str(tally("design")))
        .replace("{{RTL}}", str(tally("rtl")))
        .replace("{{INDEX_OPEN}}", str(open_n))
        .replace("{{CSS_KB}}", str(css_kb))
        .replace("{{JS_KB}}", str(js_kb))
        .replace("{{REQUESTS}}", str(requests))
        .replace("{{BUILT}}", dt.date.today().strftime("%d %B %Y").lstrip("0"))
    )
    head, body = out.split("<body>", 1)
    body = re.sub(r">([^<]*)<", lambda m: ">" + m.group(1).replace("front-end", '<span class="nobr">front-end</span>') + "<", body)
    out = head + "<body>" + body
    used = set(re.findall(r'href="#i-([a-z0-9-]+)"', out))
    out = out.replace("{{ICONS}}", sprite(used))
    left = re.findall(r"\{\{[A-Z_]+\}\}", out)
    assert not left, f"unfilled placeholders: {left}"
    assert "—" not in out and "–" not in out, "no dashes but hyphens on this page"
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8", newline="\n").write(out)
    print(f"index.html written: {len(projects)} projects, {len(data['featured'])} cases, {len(data['briefs'])} briefs, "
          f"{css_kb} KB css, {js_kb} KB js, {requests} requests, {len(used)} icons")

    todo = [(s, t) for s in data["featured"] + data["briefs"] for t in (by[s].get("case") or by[s].get("brief") or {}).get("todo", [])]
    if todo:
        print("\nStill needs you (in projects.json, never on the page):")
        for s, t in todo:
            print(f"  - {s}: {t}")


if __name__ == "__main__":
    main()
