"""Generate the two pages: index.html in English from _dev/template.html, and
ar/index.html in Arabic from _dev/template.ar.html. Both read
_dev/projects.json; the Arabic page lays _dev/projects.ar.json over it.

The shipped pages are static HTML. This script only exists so that thirty-odd
projects live in one JSON file instead of being hand-edited in markup, and so
the page can print its own weight honestly.

Anything a case study still needs from me (a result I cannot prove, a missing
screen) sits under "todo" in projects.json. It is printed here after every
build and never rendered on the page. So is anything the Arabic page would
still show in English, and any English that changed after its Arabic was
written. Once the Arabic has caught up, record that with --stamp.

Run from the repository root:  python _dev/build.py [--stamp]
"""
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV = os.path.join(ROOT, "_dev")
ICONS = os.path.join(DEV, "icons")
SOURCES = os.path.join(DEV, "ar.sources.json")

LANG = {"ar": "Arabic", "en": "English", "bi": "Arabic and English", "de": "German and English", "sv": "Swedish"}
LANG_SHORT = {"ar": "AR", "en": "EN", "bi": "AR/EN", "de": "DE/EN", "sv": "SV"}
MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]


def ar_count(n, one, two, few, many, other):
    """An Arabic number and its noun, which agree by the number: one and two
    are said by the noun alone, 3 to 10 take the plural, 11 to 99 the
    singular with tanween, a round hundred the plain singular. These are
    CLDR's Arabic plural classes, the ones Intl.PluralRules gives the JS."""
    m = n % 100
    if n == 0:
        return f"لا {few}"
    if n == 1:
        return one
    if n == 2:
        return two
    if 3 <= m <= 10:
        return f"{n} {few}"
    if 11 <= m <= 99:
        return f"{n} {many}"
    return f"{n} {other}"


def ar_projects(n):
    return ar_count(n, "مشروع واحد", "مشروعان", "مشاريع", "مشروعًا", "مشروع")


# The words the build itself writes into the page. The prose lives in the
# templates, in projects.json and, for the Arabic page, in projects.ar.json.
WORDS = {
    "en": {
        "lang": LANG,
        "lang_short": LANG_SHORT,
        "case_study": "Case study",
        "in_case": "In the {name} case study",
        "in_brief": "In brief",
        "visit": "Visit",
        "visit_label": "Visit {host}",
        "code": "Code",
        "private": "Private",
        "note_repo": "repo",
        "note_private": "private",
        "site_alt": "{name} website",
        "front_page": "{name} front page",
        "code_caption": "code on GitHub",
        "private_caption": "private build",
        "hub_alt": "The {label} section hub, in its {hex} accent",
        "theme_alt": "The {label} theme",
        "live": "Live",
        "decision": "The decision.",
        "result": "Result",
        "reflect": "What I would do differently",
        "notes": "Notes",
        "code_link": "Code on GitHub",
        "on_laptop": "{name} on a laptop",
        "on_phone": "{name} on a phone",
        "chip_count": lambda n: f", {n} projects",
        "built": lambda d: d.strftime("%d %B %Y").lstrip("0"),
    },
    "ar": {
        "lang": {"ar": "العربية", "en": "الإنجليزية", "bi": "العربية والإنجليزية", "de": "الألمانية والإنجليزية", "sv": "السويدية"},
        "lang_short": {"ar": "عربي", "en": "إنجليزي", "bi": "ثنائي", "de": "ألماني", "sv": "سويدي"},
        "case_study": "دراسة حالة",
        "in_case": "ضمن دراسة حالة {name}",
        "in_brief": "باختصار",
        "visit": "زيارة",
        "visit_label": "زيارة {host}",
        "code": "الكود",
        "private": "خاص",
        "note_repo": "كود",
        "note_private": "خاص",
        "site_alt": "موقع {name}",
        "front_page": "الصفحة الرئيسية لموقع {name}",
        "code_caption": "الكود على GitHub",
        "private_caption": "نسخة خاصة",
        "hub_alt": "صفحة {label}، بلونه {hex}",
        "theme_alt": "{label}",
        "live": "الموقع",
        "decision": "القرار.",
        "result": "النتيجة",
        "reflect": "ما سأغيّره لو بدأت من جديد",
        "notes": "ملاحظات",
        "code_link": "الكود على GitHub",
        "on_laptop": "{name} على شاشة حاسوب",
        "on_phone": "{name} على الهاتف",
        "chip_count": lambda n: f"، {ar_projects(n)}",
        "built": lambda d: f"{d.day} {MONTHS_AR[d.month - 1]} {d.year}",
    },
}

# the page being built: its words, and whether it is the Arabic one
W = WORDS["en"]
AR = False


def esc(s):
    return html.escape(s or "", quote=True)


def host(url):
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/")


def icon(name, cls="icon"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def arabic(p):
    return f' <span class="ar" lang="ar" dir="rtl">{esc(p["ar"])}</span>' if p.get("ar") else ""


def title(p):
    """A project's name as plain text: the Arabic page uses its Arabic name
    where it has one."""
    return p["ar"] if AR and p.get("ar") else p["name"]


def named(p):
    """A project's name in markup. The English page follows it with the
    Arabic name; the Arabic page leads with the Arabic name and follows it
    with the English one, and marks an English-only name as English."""
    if not AR:
        return f"{esc(p['name'])}{arabic(p)}"
    if p.get("ar"):
        return f'{esc(p["ar"])} <span class="lat" lang="en" dir="ltr">{esc(p["name"])}</span>'
    return f'<span lang="en" dir="ltr">{esc(p["name"])}</span>'


# on the Arabic page the arrows point the way the page reads
MIRROR = {"arrow-up-right", "arrow-down-right"}


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
        box = vb.group(1) if vb else "0 0 256 256"
        if AR and f[:-4] in MIRROR:
            inner = f'<g transform="matrix(-1 0 0 1 {box.split()[2]} 0)">{inner}</g>'
        parts.append(f'<symbol id="i-{f[:-4]}" viewBox="{box}">{inner}</symbol>')
    parts.append("</svg>")
    return "\n".join(parts)


def picture(p, sizes, cls="", loading="lazy", priority=None):
    """priority: True for the LCP candidate, False for images that should yield, None for default."""
    slug = p["slug"]
    alt = esc(p.get("alt") or W["site_alt"].format(name=title(p)))
    extra = {True: ' fetchpriority="high"', False: ' fetchpriority="low"'}.get(priority, "")
    return (
        f'<img class="{cls}" src="img/work/{slug}-1200.webp" '
        f'srcset="img/work/{slug}-600.webp 600w, img/work/{slug}-800.webp 800w, img/work/{slug}-1200.webp 1200w" '
        f'sizes="{sizes}" width="1200" height="750" alt="{alt}" loading="{loading}" decoding="async"{extra}>'
    )


def frame(cap, img, cls=""):
    """The page's thin screenshot frame. The bar carries the host, nothing else.
    On the Arabic page an address reads left to right, as in a browser, so a
    long one is cut at its end."""
    ltr = ' dir="ltr"' if AR and not re.search(r"[\u0600-\u06ff]", cap) else ""
    return (
        f'<div class="shot {cls}">'
        f'<div class="shot__bar"><span class="shot__cap"{ltr}>{esc(cap)}</span></div>'
        f"{img}</div>"
    )


def caption(p):
    return p.get("caption") or (host(p["url"]) if p.get("url") else (W["code_caption"] if p.get("code") else W["private_caption"]))


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
        return f"#case-{p['slug']}", False, W["case_study"]
    if p.get("in_case"):
        return f"#case-{p['in_case']}", False, W["in_case"].format(name=CASE_NAMES.get(p["in_case"], "case"))
    if p.get("brief"):
        return f"#brief-{p['slug']}", False, W["in_brief"]
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
        else f'<span class="row__thumb row__thumb--empty" aria-hidden="true" data-initial="{esc(title(p)[0])}" data-note="{W["note_repo"] if p.get("code") else W["note_private"]}"></span>'
    )
    where = f'<span class="row__where">{esc(p["where"])}</span>' if p.get("where") else ""
    name_html = f'<span class="row__name">{named(p)}</span>'
    if href:
        attrs = ' target="_blank" rel="noopener"' if external else ""
        name_html = f'<a class="row__link" href="{esc(href)}"{attrs}>{name_html}</a>'
    badge_html = f'<span class="row__badge">{badge}</span>' if badge else ""
    if badge and p.get("url"):
        # the row opens something on this page; the site gets its own link
        ext = (
            f'<a class="row__ext" href="{esc(p["url"])}" target="_blank" rel="noopener" '
            f'aria-label="{W["visit_label"].format(host=esc(host(p["url"])))}"><span class="row__ext-text">{W["visit"]}</span>{icon("arrow-up-right")}</a>'
        )
    elif p.get("url"):
        ext = f'<span class="row__ext" aria-hidden="true"><span class="row__ext-text">{W["visit"]}</span>{icon("arrow-up-right")}</span>'
    elif p.get("code"):
        ext = f'<span class="row__ext" aria-hidden="true"><span class="row__ext-text">{W["code"]}</span>{icon("arrow-up-right")}</span>'
    else:
        ext = f'<span class="row__ext row__ext--none" aria-hidden="true"><span class="row__ext-text">{W["private"]}</span></span>'
    preview = f' data-preview="img/work/{p["slug"]}-600.webp"' if p.get("image") else ""
    extra = " data-extra" if i >= open_n else ""
    lang, short = W["lang"][p["lang"]], W["lang_short"][p["lang"]]
    return (
        f'<li class="row row--t{p["tier"]}" id="p-{p["slug"]}" data-tags="{esc(" ".join(p["tags"]))}"{preview}{rank_attrs(p, ranks)}{extra}>'
        f"{thumb}"
        f'<div class="row__main"><span class="row__title">{name_html}{badge_html}</span>'
        f'<span class="row__client">{esc(p["client"])}{where}</span></div>'
        f'<span class="row__role">{esc(p["role"])}</span>'
        f'<span class="row__stack">{tags(p["stack"][:3])}</span>'
        f'<span class="row__lang" title="{lang}"><span class="visually-hidden">{lang}</span><span aria-hidden="true">{short}</span></span>'
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
            f'alt="{esc(W["front_page"].format(name=title(by[s])))}" loading="lazy" decoding="async">'
            f'<span class="fleet__name">{named(by[s])}</span></li>'
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
                alt = esc(W["hub_alt"].format(label=i["label"], hex=i["hex"]))
                label = (
                    f'<span class="vgrid__dot" style="--c:{esc(i["hex"])}" aria-hidden="true"></span>'
                    f'{esc(i["label"])} <code>{esc(i["hex"])}</code> <span class="vgrid__ratio">{esc(i["ratio"])}</span>'
                )
            else:
                alt = esc(i.get("alt") or W["theme_alt"].format(label=i["label"].lower()))
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


def film(c):
    """A case's short film: an intro made from the project's own fonts, colours
    and photos, or a recording of a live demo. Native controls are the
    fallback; js/film.js swaps them for one play/pause button and plays the
    film only while it is on screen."""
    f = c.get("film")
    if not f:
        return ""
    base = f"img/work/ev/{f['file']}"
    return (
        f'<figure class="film" data-film data-reveal-ev><div class="film__frame">'
        f'<video class="film__video" src="{base}-720.mp4" poster="{base}-still.webp" width="1280" height="720" '
        f'controls muted playsinline preload="none" aria-label="{esc(f["label"])}"></video></div>'
        f'<figcaption class="ev__cap">{esc(f["caption"])}</figcaption></figure>'
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
            f'<div><dt>{esc(live.get("label", W["live"]))}</dt><dd><a href="{esc(p["url"])}" target="_blank" rel="noopener">'
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
        f'<div class="outcome__reflect"><h4>{W["reflect"]}</h4><p>{esc(c["reflection"])}</p></div>'
        if c.get("reflection") else ""
    )
    links = "".join(
        f'<a class="btn btn--ghost" href="{esc(l["href"])}" target="_blank" rel="noopener">{esc(l["label"])} {icon("arrow-up-right")}</a>'
        for l in c.get("links", [])
    )
    return f"""
<article class="feature{' feature--film' if c.get('film') else ''}" id="case-{slug}" aria-labelledby="case-{slug}-title">
  <header class="feature__head">
    <h3 class="feature__title" id="case-{slug}-title">{named(p)}</h3>
    <p class="feature__lede">{esc(c['lede'])}</p>
  </header>
  <dl class="glance">{glance}</dl>
  {film(c)}
  {evidence}
  <p class="decision"><strong class="decision__lead">{W['decision']}</strong> {esc(c['decision'])}</p>
  {system(c, slug)}
  {story}
  <div class="outcome{' outcome--two' if reflect else ''}"><div class="outcome__result"><h4>{W['result']}</h4><ul>{result}</ul></div>{reflect}</div>
  {f'<p class="feature__links">{links}</p>' if links else ''}
</article>"""


# ------------------------------------------------------------------ briefs
def brief(p):
    b = p["brief"]
    slug = p["slug"]
    notes = ""
    if b.get("notes"):
        lis = "".join(f"<li>{esc(n)}</li>" for n in b["notes"])
        notes = f'<details class="brief__notes"><summary>{esc(b.get("notes_title", W["notes"]))}</summary><ul>{lis}</ul></details>'
    links = []
    if p.get("url"):
        note = f' <span class="brief__note">({esc(b["link_note"])})</span>' if b.get("link_note") else ""
        links.append(f'<a href="{esc(p["url"])}" target="_blank" rel="noopener">{esc(host(p["url"]))}{icon("arrow-up-right")}</a>{note}')
    if p.get("code"):
        links.append(f'<a href="{esc(p["code"])}" target="_blank" rel="noopener">{W["code_link"]}{icon("arrow-up-right")}</a>')
    if not links and b.get("status"):
        links.append(f'<span class="brief__note">{esc(b["status"])}</span>')
    # a wide brief takes the whole row, picture and text side by side
    wide = b.get("wide")
    sizes = "(min-width: 900px) 56vw, 94vw" if wide else "(min-width: 900px) 34vw, 94vw"
    return f"""
<article class="brief{' brief--wide' if wide else ''}" id="brief-{slug}" aria-labelledby="brief-{slug}-title">
  <div class="brief__media">{shot(p, sizes)}</div>
  <div class="brief__body">
    <h4 id="brief-{slug}-title">{named(p)}</h4>
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
            "alt": W["on_laptop"].format(name=title(by[desk_slug])),
            "phone_alt": W["on_phone"].format(name=title(p)),
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
        f'<span><span class="rail__name"{" lang=\"en\"" if AR and not k["p"].get("ar") else ""}>{esc(title(k["p"]))}</span><span class="rail__note">{esc(k["note"])}</span></span>'
        f'{icon("arrow-down-right")}</a></li>'
        for i, k in enumerate(packs)
    )
    return stage, rail


CSS_ORDER = ["fonts", "tokens", "base", "components", "sections", "motion"]


def bundle_css(extra=()):
    """One stylesheet on the wire; the sources stay separate for editing.
    Comments and indentation go, nothing else is rewritten. The English
    bundle is also written to css/site.css; the Arabic page adds rtl.css."""
    parts = []
    for name in CSS_ORDER + list(extra):
        css = open(os.path.join(ROOT, "css", f"{name}.css"), encoding="utf-8").read()
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        css = re.sub(r"\s*\n\s*", "\n", css).strip()
        css = re.sub(r"\n+", "\n", css)
        parts.append(f"/* {name} */\n{css}")
    out = "\n".join(parts) + "\n"
    if not extra:
        open(os.path.join(ROOT, "css", "site.css"), "w", encoding="utf-8", newline="\n").write(out)
    return out


def footprint(tpl, extra=()):
    """The stylesheet is inlined into the document, so the first paint needs
    one request: the HTML itself. After it come the module graph and the
    three PageSpeed files the measured section reads."""
    css = bundle_css(extra)
    jsdir = os.path.join(ROOT, "js")
    js_files = [f for f in os.listdir(jsdir) if f.endswith(".js")]
    # LF bytes, as served: a CRLF checkout would count one extra byte per line
    js = round(sum(len(open(os.path.join(jsdir, f), "rb").read().replace(b"\r\n", b"\n")) for f in js_files) / 1024)
    n = 1 + len(js_files) + tpl.count("data-psi=")
    return css, js, n


def relocate(out):
    """ar/index.html sits one folder down, so its relative asset paths get
    ../ in front. Links to #fragments stay on the page."""
    return re.sub(r"""(?<=[\s"'(,])(img|js|fonts|css)/""", r"../\1/", out)


# A run of Latin inside Arabic text, as escaped HTML (so &lt; and &quot;
# belong to it): words, code, a tag, an address, a size such as 360 × 800.
LATIN_RUN = re.compile(r"[A-Za-z0-9#&(][A-Za-z0-9#&;:.,/@%+=×_'*()\- ]*[A-Za-z0-9;%)*]")


def isolate(body):
    """Every Latin run in the Arabic page's text goes into a <bdi>. The bidi
    algorithm then keeps it whole and in its own order whatever sits at its
    edges (a tag's angle brackets, A*, color-mix(), a size), motion.js can
    split it into words without reordering them, and a run with letters is
    marked English for screen readers. Text already marked English is left
    as it is."""
    def run(m):
        text = html.unescape(m.group(0))
        if re.search(r"[A-Za-z]", text):
            # a number keeps its unit or its name on the same line: 78 KB, Vue 3
            glued = re.sub(r"(?<=\d) (?=[A-Za-z])|(?<=[A-Za-z]) (?=\d)", "&nbsp;", m.group(0))
            return f'<bdi lang="en">{glued}</bdi>'
        # a size has no letter to set its direction, and never breaks
        return f'<bdi dir="ltr" class="nobr">{m.group(0)}</bdi>' if "×" in text else m.group(0)

    def node(m):
        tag, text = m.group(1), m.group(2)
        if 'lang="en"' in tag or 'dir="ltr"' in tag or tag.startswith(("<script", "<style", "<code", "<bdi")):
            return tag + text
        # and an Arabic count or unit stays by its number: 24 موقعًا, 16 بكسل
        text = re.sub(r"(?<=\d) (?=[\u0621-\u064a])", "\u00a0", text)
        out = LATIN_RUN.sub(run, text)
        # inside a flex box (a button, a caption with its dot) every <bdi>
        # would be an item of its own, with a gap for a space: one span keeps
        # the words in one item
        if out != text and re.sub(r"<bdi[^>]*>.*?</bdi>", "", out).strip():
            out = f"<span>{out}</span>"
        return tag + out

    return re.sub(r"(<[^>]*>)([^<]+)(?=<)", node, body)


# ------------------------------------------------------------------ the Arabic copy
# Keys that never hold words for the page: addresses, files, switches and
# numbers, the data only the build or snap.py reads, and the two fields the
# Arabic page takes from dictionaries (where, stack).
NOT_PROSE = {"slug", "url", "code", "image", "file", "device", "wait", "href", "hex", "ratio", "sites", "todo",
             "tier", "tags", "stack", "where", "lang", "in_case", "local", "root", "click", "scroll", "export",
             "layout", "wide", "summary", "ar"}


def prose(x, path=""):
    """(path, text) for every string of a project that reaches the page as
    words. A host or a file name is not words; a brief's kind is, an
    evidence item's kind is not; a colour's name is, the project's is not."""
    if isinstance(x, str):
        if " " in x or not re.search(r"[./:]", x):
            yield path, x
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from prose(v, f"{path}.{i}")
    elif isinstance(x, dict):
        for k, v in x.items():
            if k in NOT_PROSE or (k == "kind" and not path.endswith("brief")) or (k == "name" and not path):
                continue
            yield from prose(v, f"{path}.{k}" if path else k)


def at(x, path):
    for part in path.split("."):
        if isinstance(x, list):
            x = x[int(part)] if int(part) < len(x) else None
        elif isinstance(x, dict):
            x = x.get(part)
        else:
            return None
        if x is None:
            return None
    return x


def lay(en, ar):
    """The English entry with every string the Arabic gives laid over it.
    Lists pair up by position; whatever the Arabic lacks stays English."""
    if isinstance(en, dict) and isinstance(ar, dict):
        return {**en, **{k: lay(en[k], v) if k in en else v for k, v in ar.items()}}
    if isinstance(en, list) and isinstance(ar, list):
        return [lay(e, a) for e, a in zip(en, ar)] + en[len(ar):]
    return ar


def arabic_data(data, tr):
    """projects.json as the Arabic page reads it: projects.ar.json laid over
    each project, and the places and the stack through their dictionaries."""
    places, words = tr.get("places", {}), tr.get("stack", {})
    projects = []
    for p in data["projects"]:
        q = lay(p, tr["projects"].get(p["slug"], {}))
        if q.get("where"):
            q["where"] = "، ".join(places.get(w.strip(), w.strip()) for w in q["where"].split(","))
        q["stack"] = [words.get(s, s) for s in q["stack"]]
        projects.append(q)
    return {
        **data,
        "projects": projects,
        "filters": [dict(f, label=tr["filters"].get(f["id"], f["label"])) for f in data["filters"]],
        "filter_groups": {**data.get("filter_groups", {}), **tr.get("filter_groups", {})},
        "hero": [dict(h, **tr["hero"].get(h["slug"], {})) for h in data["hero"]],
    }


def blocks(tpl):
    """The English template cut at its head, nav, sections and footer, each
    keyed by id or class, so a change to one can be flagged for the Arabic."""
    marks = []
    for m in re.finditer(r'<head>|<header class="nav"|<section\b[^>]*>|<footer class="foot"', tpl):
        tag = m.group(0)
        key = re.search(r'\bid="([^"]+)"', tag) or re.search(r'\bclass="([^" ]+)', tag)
        marks.append((m.start(), key.group(1) if key else "head"))
    ends = [s for s, _ in marks[1:]] + [len(tpl)]
    return {k: tpl[s:e] for (s, k), e in zip(marks, ends)}


def digest(x):
    return hashlib.sha1(json.dumps(x, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:10]


def sources(data, tpl):
    """A fingerprint of every piece of English the Arabic was written from.
    A project's is kept string by string: the Arabic pairs lists by position,
    so a story inserted in the middle must name every block it moved."""
    return {
        "template": {k: digest(v) for k, v in blocks(tpl).items()},
        "projects": {p["slug"]: {path: digest(text) for path, text in prose(p)} for p in data["projects"]},
        "lists": {
            "filters": digest([f["label"] for f in data["filters"]]),
            "filter_groups": digest(data.get("filter_groups", {})),
            "hero": digest([[h["note"], h["cap"]] for h in data["hero"]]),
            "places": digest(sorted({w.strip() for p in data["projects"] for w in (p.get("where") or "").split(",") if w.strip()})),
            "stack": digest(sorted({s for p in data["projects"] for s in p["stack"]})),
        },
    }


def check_arabic(data, tr, tpl, stamp):
    """Print what the Arabic page still shows in English, and what changed in
    English after its Arabic was written; with --stamp, record the English
    the Arabic now matches."""
    now = sources(data, tpl)
    if stamp:
        open(SOURCES, "w", encoding="utf-8", newline="\n").write(json.dumps(now, indent=1, sort_keys=True) + "\n")
        print("\nArabic stamped as up to date with the English.")
    old = json.load(open(SOURCES, encoding="utf-8")) if os.path.exists(SOURCES) else {}
    missing = [
        f"{p['slug']}.{path}"
        for p in data["projects"]
        for path, _ in prose(p)
        if not isinstance(at(tr["projects"].get(p["slug"], {}), path), str)
    ]
    missing += [f"filters.{f['id']}" for f in data["filters"] if f["id"] not in tr["filters"]]
    missing += [f"hero.{h['slug']}" for h in data["hero"] if h["slug"] not in tr["hero"]]
    places = {w.strip() for p in data["projects"] for w in (p.get("where") or "").split(",") if w.strip()}
    missing += [f"places.{w}" for w in sorted(places - set(tr.get("places", {})))]
    stale = []
    for kind, keys in now.items():
        for key, h in keys.items():
            was = old.get(kind, {}).get(key)
            if not isinstance(h, dict):
                if was != h:
                    stale.append(f"{kind} {key}")
                continue
            was = was if isinstance(was, dict) else {}
            moved = [p for p in h if was.get(p) != h[p]] + [f"{p} (gone)" for p in was if p not in h]
            if moved:
                stale.append(f"{kind} {key}: {', '.join(moved)}")
    if missing:
        print(f"\nThe Arabic page still shows {len(missing)} strings in English (add them to projects.ar.json):")
        for m in missing:
            print(f"  - {m}")
    if stale:
        print("\nChanged in English since the Arabic was written (update the Arabic, then run  python _dev/build.py --stamp):")
        for s in stale:
            print(f"  - {s}")


# ------------------------------------------------------------------ one page
def page(lang, data, tpl):
    global W, AR
    W, AR = WORDS[lang], lang == "ar"
    projects = data["projects"]
    by = {p["slug"]: p for p in projects}
    ranks = data.get("orders", {})

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
            f'<span class="visually-hidden" data-n-sr>{W["chip_count"](tally(f["id"]))}</span></button>'
            for f in fs
        )
        + "</div></div>"
        for g, fs in groups.items()
    )

    CASE_NAMES.clear()
    CASE_NAMES.update({slug: title(by[slug]) if AR else by[slug]["name"].split(" ")[0] for slug in data["featured"]})
    rows = "\n".join(row(p, i, ranks, open_n) for i, p in enumerate(projects))
    hero_stage, hero_rail = hero_parts(data["hero"], by)
    css, js_kb, requests = footprint(tpl, ["rtl"] if AR else [])
    # hash the LF content, so a CRLF checkout (autocrlf on Windows) gives the same ?v=
    version = hashlib.sha1(
        b"".join(open(os.path.join(ROOT, "js", f), "rb").read().replace(b"\r\n", b"\n") for f in sorted(os.listdir(os.path.join(ROOT, "js"))) if f.endswith(".js"))
    ).hexdigest()[:8]
    css_kb = round(len(css.encode("utf-8")) / 1024)

    out = (
        # the English page sits next to fonts/; the Arabic one a folder below
        tpl.replace("{{CSS}}", "<style>\n" + (css if AR else css.replace("../fonts/", "fonts/")) + "</style>")
        .replace("{{CHIPS}}", chips)
        .replace("{{ROWS}}", rows)
        .replace("{{FEATURES}}", features)
        .replace("{{BRIEFS}}", briefs)
        .replace("{{HERO_STAGE}}", hero_stage)
        .replace("{{HERO_RAIL}}", hero_rail)
        .replace("{{V}}", version)
        .replace("{{COUNT}}", str(len(projects)))
        .replace("{{COUNT_AR}}", ar_projects(len(projects)))
        .replace("{{LIVE}}", str(sum(1 for p in projects if p.get("url"))))
        .replace("{{DESIGNED}}", str(tally("design")))
        .replace("{{RTL}}", str(tally("rtl")))
        .replace("{{INDEX_OPEN}}", str(open_n))
        .replace("{{CSS_KB}}", str(css_kb))
        .replace("{{JS_KB}}", str(js_kb))
        .replace("{{REQUESTS}}", str(requests))
        .replace("{{REQUESTS_AR}}", ar_count(requests, "طلب واحد", "طلبان", "طلبات", "طلبًا", "طلب"))
        .replace("{{BUILT}}", W["built"](dt.date.today()))
    )
    used = set(re.findall(r'href="#i-([a-z0-9-]+)"', out))
    out = out.replace("{{ICONS}}", sprite(used))
    head, body = out.split("<body>", 1)
    if AR:
        body = isolate(body)
    else:
        body = re.sub(r">([^<]*)<", lambda m: ">" + m.group(1).replace("front-end", '<span class="nobr">front-end</span>') + "<", body)
    out = head + "<body>" + body
    left = re.findall(r"\{\{[A-Z_]+\}\}", out)
    assert not left, f"unfilled placeholders: {left}"
    assert "—" not in out and "–" not in out, "no dashes but hyphens on this page"
    name = "index.html"
    if AR:
        out = relocate(out)
        stray = re.findall(r'(?:src|href|poster|data-src|data-phone|data-preview)="(?!https?:|mailto:|#|\.\./|data:)([^"]+)"', out)
        stray += [u for s in re.findall(r'(?:srcset|data-srcset|data-phone-set|imagesrcset)="([^"]+)"', out) for u in re.findall(r"(\S+)\s+\d+w", s) if not u.startswith("../")]
        assert not stray, f"paths the Arabic page cannot reach from ar/: {stray[:5]}"
        os.makedirs(os.path.join(ROOT, "ar"), exist_ok=True)
        name = "ar/index.html"
    open(os.path.join(ROOT, name), "w", encoding="utf-8", newline="\n").write(out)
    print(f"{name} written: {len(projects)} projects, {len(data['featured'])} cases, {len(data['briefs'])} briefs, "
          f"{css_kb} KB css, {js_kb} KB js, {requests} requests, {len(used)} icons")


def main():
    data = json.load(open(os.path.join(DEV, "projects.json"), encoding="utf-8"))
    projects = data["projects"]
    by = {p["slug"]: p for p in projects}
    for fid, order in data.get("orders", {}).items():
        tagged = {p["slug"] for p in projects if fid in p["tags"]}
        assert set(order) == tagged and len(order) == len(tagged), f"orders.{fid} must list every {fid} project exactly once"
    for s in data["featured"]:
        assert by[s].get("case"), f"{s} is featured but has no case"
    for s in data["briefs"]:
        assert by[s].get("brief"), f"{s} is listed in briefs but has no brief"

    tpl = open(os.path.join(DEV, "template.html"), encoding="utf-8").read()
    page("en", data, tpl)

    tpl_ar = os.path.join(DEV, "template.ar.html")
    if os.path.exists(tpl_ar):
        ar = open(tpl_ar, encoding="utf-8").read()
        ids = lambda t: set(re.findall(r'\bid="([^"{]+)"', t))
        assert ids(ar) == ids(tpl), f"the two templates must carry the same ids: {sorted(ids(ar) ^ ids(tpl))}"
        tr = json.load(open(os.path.join(DEV, "projects.ar.json"), encoding="utf-8"))
        page("ar", arabic_data(data, tr), ar)
        check_arabic(data, tr, tpl, "--stamp" in sys.argv)

    todo = [(s, t) for s in data["featured"] + data["briefs"] for t in (by[s].get("case") or by[s].get("brief") or {}).get("todo", [])]
    if todo:
        print("\nStill needs you (in projects.json, never on the page):")
        for s, t in todo:
            print(f"  - {s}: {t}")


if __name__ == "__main__":
    main()
