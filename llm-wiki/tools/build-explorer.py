#!/usr/bin/env python3
"""Kindred Collective LLM wiki — connected map explorer (neo-brutalist).

Usage: python3 tools/build-explorer.py [output.html]   (requires: pip install markdown)
Regenerate after each ingest; open the HTML anywhere, or publish as an artifact.
"""
import json
import sys
import re
from pathlib import Path

import markdown

WIKI = Path(__file__).resolve().parent.parent / "wiki"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent / "kindred-wiki-explorer.html"

FM = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
WL = re.compile(r"\[\[([^\]|#]+)\]\]")

SECTIONS = [
    ("topic",   "Topics",   "the routing hubs — start here"),
    ("concept", "Concepts", "regulation, supply chains and hard-won community lessons"),
    ("entity",  "Entities", "who moves the market. ✦ marks regulators; the rest are companies"),
    ("source",  "Sources",  "the documents it all rests on"),
    ("meta",    "Meta",     "the catalog and the operations log"),
]
REGULATORS = {"hmrc", "defra"}

pages = {}
for p in sorted(WIKI.rglob("*.md")):
    text = p.read_text()
    m = FM.match(text)
    meta, body = {}, text
    if m:
        body = text[m.end():]
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    stem = p.stem
    if stem == "index":
        meta = {"type": "meta", "title": "Index", "description": "Catalog of every page — the query router"}
    elif stem == "log":
        meta = {"type": "meta", "title": "Log", "description": "Append-only record of every wiki operation"}
    pages[stem] = {"stem": stem, "type": meta.get("type", "meta"),
                   "title": meta.get("title", stem), "desc": meta.get("description", ""),
                   "updated": meta.get("updated", ""), "body": body}

# link graph
out_links = {s: [] for s in pages}
back_links = {s: set() for s in pages}
for s, pg in pages.items():
    seen = set()
    for target in WL.findall(pg["body"]):
        t = target.strip()
        if t in pages and t != s and t not in seen:
            seen.add(t)
            out_links[s].append(t)
            back_links[t].add(s)
edges = {tuple(sorted((a, b))) for a in out_links for b in out_links[a]}
n_conn = len(edges)

md = markdown.Markdown(extensions=["tables"])
data = {}
for s, pg in pages.items():
    def sub(m):
        t = m.group(1).strip()
        return f'[{pages[t]["title"]}](#{t})' if t in pages else m.group(0)
    body = WL.sub(sub, pg["body"])
    body = re.sub(r"^# .+\n", "", body, count=1, flags=re.MULTILINE)
    data[s] = {"t": pg["title"], "y": pg["type"], "d": pg["desc"], "u": pg["updated"],
               "h": md.reset().convert(body),
               "l": out_links[s], "b": sorted(back_links[s], key=lambda x: pages[x]["title"].lower())}

# chip sections
sections_html = []
for typ, label, blurb in SECTIONS:
    items = sorted((p for p in pages.values() if p["type"] == typ), key=lambda x: x["title"].lower())
    if not items:
        continue
    chips = "".join(
        f'<button class="chip" data-stem="{p["stem"]}" data-type="{typ}">'
        f'{"✦ " if p["stem"] in REGULATORS else ""}{p["title"]}</button>'
        for p in items)
    sections_html.append(
        f'<section class="grp"><h2><span class="grp-name">{label}</span>'
        f'<span class="grp-blurb">{blurb}</span></h2><div class="chips">{chips}</div></section>')

doc = """<title>Kindred Collective — LLM Wiki</title>
<style>
:root{
  --paper:#f4f4f1; --card:#ffffff; --ink:#0a0a0a; --muted:#5a5a56; --line:#0a0a0a;
  --cyan:#00d9ff; --lime:#ccff00; --coral:#ff5d5d; --neutral:#e4e4df;
  --hover:#eafbff; --sh:4px 4px 0 var(--ink); --sh-big:8px 8px 0 var(--ink);
  --wire-alpha:.75;
}
@media (prefers-color-scheme: dark){:root{
  --paper:#101214; --card:#191c20; --ink:#f2f2ee; --muted:#9c9c96; --line:#f2f2ee;
  --neutral:#3a3d42; --hover:#0c2b33; --sh:4px 4px 0 #00d9ff66; --sh-big:8px 8px 0 #00d9ff66;
}}
:root[data-theme="dark"]{
  --paper:#101214; --card:#191c20; --ink:#f2f2ee; --muted:#9c9c96; --line:#f2f2ee;
  --neutral:#3a3d42; --hover:#0c2b33; --sh:4px 4px 0 #00d9ff66; --sh-big:8px 8px 0 #00d9ff66;
}
:root[data-theme="light"]{
  --paper:#f4f4f1; --card:#ffffff; --ink:#0a0a0a; --muted:#5a5a56; --line:#0a0a0a;
  --neutral:#e4e4df; --hover:#eafbff; --sh:4px 4px 0 var(--ink); --sh-big:8px 8px 0 var(--ink);
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--paper);color:var(--ink);overflow:hidden;
  font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.mono{font-family:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace}
button{font:inherit;color:inherit;cursor:pointer}
/* ---- top bar ---- */
.topbar{height:56px;display:flex;align-items:center;gap:1rem;padding:0 1.1rem;
  background:var(--cyan);color:#0a0a0a;border-bottom:2px solid var(--line)}
.brand{font-weight:900;text-transform:uppercase;letter-spacing:-.01em;font-size:1.05rem;white-space:nowrap}
.brand .tag{background:#0a0a0a;color:var(--cyan);padding:.1em .4em;margin-left:.5em;
  font-size:.68rem;letter-spacing:.14em;vertical-align:middle}
.topbar .stats{margin-left:auto;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;
  font-weight:700;white-space:nowrap}
.topbar .clock{font-size:.72rem;letter-spacing:.1em;font-weight:700;white-space:nowrap}
/* ---- stage ---- */
.stage{display:flex;height:calc(100vh - 56px - 54px)}
.map{flex:1;min-width:0;overflow-y:auto;position:relative;padding:1.3rem 1.4rem 3rem}
#wires{position:absolute;inset:0;width:100%;pointer-events:none;overflow:visible;z-index:4}
#wires path{fill:none;stroke-width:2;opacity:var(--wire-alpha)}
.grp h2{position:relative;z-index:2}
.chips{position:relative;z-index:6}
.grp{position:relative;border:2px solid var(--line);background:var(--card);
  box-shadow:var(--sh);margin:0 0 1.5rem;padding:1rem 1.1rem 1.2rem}
.grp h2{margin:0 0 .8rem;display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap}
.grp-name{font-size:.8rem;font-weight:900;text-transform:uppercase;letter-spacing:.22em}
.grp-blurb{font-size:.8rem;color:var(--muted);font-weight:400}
.chips{display:flex;flex-wrap:wrap;gap:.55rem}
.chip{background:var(--card);border:2px solid var(--line);padding:.34em .75em;
  font-size:.88rem;font-weight:600;border-radius:0;position:relative;
  transition:transform .08s,box-shadow .08s}
.chip:hover{background:var(--hover)}
.chip:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
/* selection states */
.map.has-sel .chip{opacity:.3}
.map.has-sel .chip.on,.map.has-sel .chip.sel{opacity:1}
.chip.on[data-type="topic"],.chip.sel[data-type="topic"]{background:var(--cyan);color:#0a0a0a}
.chip.on[data-type="concept"],.chip.sel[data-type="concept"]{background:var(--lime);color:#0a0a0a}
.chip.on[data-type="entity"],.chip.sel[data-type="entity"]{background:var(--coral);color:#0a0a0a}
.chip.on[data-type="source"],.chip.sel[data-type="source"]{background:var(--neutral);color:var(--ink)}
.chip.on[data-type="meta"],.chip.sel[data-type="meta"]{background:var(--neutral);color:var(--ink)}
:root[data-theme="dark"] .chip.on[data-type="source"],:root[data-theme="dark"] .chip.sel[data-type="source"],
:root[data-theme="dark"] .chip.on[data-type="meta"],:root[data-theme="dark"] .chip.sel[data-type="meta"]{color:#f2f2ee}
.chip.sel{transform:translate(-2px,-2px);box-shadow:var(--sh);font-weight:800}
/* ---- panel ---- */
.panel{width:min(480px,44%);flex:none;border-left:2px solid var(--line);background:var(--card);
  overflow-y:auto;padding:1.5rem 1.6rem 3rem}
.panel .badge-row{display:flex;gap:.7rem;align-items:center;margin-bottom:.9rem;flex-wrap:wrap}
.badge{font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;
  padding:.22em .6em;border:2px solid var(--line);color:#0a0a0a}
.badge.b-topic{background:var(--cyan)} .badge.b-concept{background:var(--lime)}
.badge.b-entity{background:var(--coral)} .badge.b-source{background:var(--neutral);color:var(--ink)}
.badge.b-meta{background:var(--neutral);color:var(--ink)}
.badge-row .upd{font-size:.7rem;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.panel h1{margin:0 0 .4rem;font-size:1.65rem;font-weight:900;letter-spacing:-.02em;
  line-height:1.12;text-wrap:balance}
.panel .lede{margin:0 0 1.2rem;color:var(--muted);font-size:.92rem;border-bottom:2px solid var(--line);
  padding-bottom:1rem}
.prose{font-size:.94rem}
.prose h2{font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;
  margin:1.8em 0 .5em}
.prose h3{font-size:.95rem;font-weight:700;margin:1.3em 0 .35em}
.prose p{margin:.7em 0}
.prose ul,.prose ol{padding-left:1.2em;margin:.7em 0}
.prose li{margin:.32em 0}
.prose a{color:inherit;font-weight:700;text-decoration:none;border-bottom:2px solid var(--cyan)}
.prose a:hover{background:var(--cyan);color:#0a0a0a}
.prose a[href^="http"]{font-weight:400;border-bottom:1px dotted var(--muted)}
.prose code{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.85em;
  background:var(--hover);padding:.08em .3em;border:1px solid var(--line)}
.prose table{border-collapse:collapse;margin:1em 0;display:block;overflow-x:auto;
  font-variant-numeric:tabular-nums;font-size:.85rem}
.prose th,.prose td{border:2px solid var(--line);padding:.35em .6em;text-align:left}
.prose th{background:var(--hover);text-transform:uppercase;font-size:.68rem;letter-spacing:.08em}
.prose blockquote{margin:1em 0;padding:.3em 1em;border-left:4px solid var(--cyan);color:var(--muted)}
.linkedfrom{margin-top:1.8rem;border-top:2px solid var(--line);padding-top:1rem}
.linkedfrom .lf-label{display:block;font-size:.68rem;font-weight:900;text-transform:uppercase;
  letter-spacing:.18em;color:var(--muted);margin-bottom:.6rem}
.linkedfrom a{display:inline-block;margin:0 .45rem .45rem 0;font-size:.8rem;font-weight:700;
  color:var(--ink);text-decoration:none;border:2px solid var(--line);padding:.15em .55em;
  background:var(--card);box-shadow:2px 2px 0 var(--line)}
.linkedfrom a:hover{background:var(--cyan);color:#0a0a0a}
/* empty state */
.empty h1{font-size:1.5rem;font-weight:900;margin:0 0 .8rem;letter-spacing:-.02em}
.empty p{color:var(--muted);font-size:.92rem}
.empty .starts{margin-top:1.2rem}
/* ---- bottom bar ---- */
.bottombar{height:54px;display:flex;align-items:center;gap:1rem;padding:0 1.1rem;
  border-top:2px solid var(--line);background:var(--card)}
#filter{flex:0 1 340px;padding:.45rem .7rem;font:inherit;font-size:.88rem;color:var(--ink);
  background:var(--paper);border:2px solid var(--line);border-radius:0}
#filter:focus{outline:3px solid var(--cyan);outline-offset:1px}
.legend{margin-left:auto;display:flex;gap:1rem;font-size:.68rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.12em;color:var(--muted);flex-wrap:wrap}
.legend i{display:inline-block;width:.75em;height:.75em;border:2px solid var(--line);
  margin-right:.35em;vertical-align:-.05em}
.legend .l-topic i{background:var(--cyan)} .legend .l-concept i{background:var(--lime)}
.legend .l-entity i{background:var(--coral)} .legend .l-source i{background:var(--neutral)}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
@media (max-width: 860px){
  body{overflow:auto}
  .stage{flex-direction:column;height:auto}
  .map{overflow:visible}
  .panel{width:100%;border-left:0;border-top:2px solid var(--line)}
  .legend{display:none}
}
</style>
<header class="topbar">
  <span class="brand">Kindred Collective<span class="tag">LLM Wiki</span></span>
  <span class="stats mono">__NPAGES__ pages &middot; __NCONN__ connections</span>
  <span class="clock mono" id="clock"></span>
</header>
<div class="stage">
  <div class="map" id="map">
    <svg id="wires" aria-hidden="true"></svg>
    __SECTIONS__
  </div>
  <aside class="panel" id="panel" aria-live="polite"></aside>
</div>
<footer class="bottombar">
  <input id="filter" type="search" placeholder="Filter the map&hellip;" aria-label="Filter pages">
  <div class="legend">
    <span class="l-topic"><i></i>Topics</span><span class="l-concept"><i></i>Concepts</span>
    <span class="l-entity"><i></i>Entities</span><span class="l-source"><i></i>Sources</span>
  </div>
</footer>
<script id="wiki-data" type="application/json">__DATA__</script>
<script>
(function(){
  var DATA = JSON.parse(document.getElementById("wiki-data").textContent);
  var COLORS = {topic:"#00d9ff", concept:"#ccff00", entity:"#ff5d5d", source:"#9c9c96", meta:"#9c9c96"};
  var map = document.getElementById("map");
  var svg = document.getElementById("wires");
  var panel = document.getElementById("panel");
  var chips = {};
  map.querySelectorAll(".chip").forEach(function(c){ chips[c.dataset.stem] = c; });
  var selected = null;

  function clock(){
    var d = new Date();
    var days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    var hh = String(d.getHours()).padStart(2,"0"), mm = String(d.getMinutes()).padStart(2,"0");
    document.getElementById("clock").textContent =
      days[d.getDay()] + " " + d.getDate() + " " + months[d.getMonth()] + " \\u00b7 " + hh + ":" + mm;
  }
  clock(); setInterval(clock, 30000);

  function center(el){
    var r = el.getBoundingClientRect(), m = map.getBoundingClientRect();
    return {x: r.left - m.left + r.width/2, y: r.top - m.top + map.scrollTop + r.height/2};
  }
  function drawWires(){
    svg.setAttribute("height", map.scrollHeight);
    svg.innerHTML = "";
    if (!selected) return;
    var selEl = chips[selected];
    if (!selEl || selEl.style.display === "none") return;
    var a = center(selEl);
    var targets = (DATA[selected].l || []).concat(DATA[selected].b || []);
    var seen = {};
    targets.forEach(function(t){
      if (seen[t] || t === selected) return; seen[t] = 1;
      var el = chips[t];
      if (!el || el.style.display === "none") return;
      var b = center(el);
      var dy = Math.max(46, Math.abs(b.y - a.y) * .45);
      var d = "M" + a.x + "," + a.y +
              " C" + a.x + "," + (a.y + (b.y > a.y ? dy : -dy)) +
              " " + b.x + "," + (b.y + (b.y > a.y ? -dy : dy)) +
              " " + b.x + "," + b.y;
      var path = document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d", d);
      path.setAttribute("stroke", COLORS[el.dataset.type] || "#888");
      svg.appendChild(path);
    });
  }
  function renderPanel(stem){
    var p = DATA[stem];
    var bl = (p.b || []).map(function(b){
      return '<a href="#' + b + '">' + DATA[b].t + "</a>";
    }).join("");
    panel.innerHTML =
      '<div class="badge-row"><span class="badge b-' + p.y + '">' + p.y + "</span>" +
      (p.u ? '<span class="upd mono">updated: ' + p.u + "</span>" : "") + "</div>" +
      "<h1>" + p.t + "</h1>" +
      '<p class="lede">' + p.d + "</p>" +
      '<div class="prose">' + p.h + "</div>" +
      (bl ? '<div class="linkedfrom"><span class="lf-label">Linked from</span>' + bl + "</div>" : "");
    panel.scrollTop = 0;
  }
  function emptyPanel(){
    panel.innerHTML =
      '<div class="empty"><h1>How to read this map</h1>' +
      "<p>Every card is a wiki page. Click one to light up its connections across the map and read it here \\u2014 links inside the text jump between pages, and \\u201cLinked from\\u201d walks the graph backwards.</p>" +
      "<p>Colour is the page type: cyan topics route, lime concepts explain, coral entities act, grey sources evidence it all.</p>" +
      '<div class="starts prose"><p>Good places to start: <a href="#supplier-intelligence">Supplier Intelligence</a>, ' +
      '<a href="#uk-drinks-legislation-and-tax">UK Drinks Legislation &amp; Tax</a>, ' +
      '<a href="#kindred-collective">Kindred Collective</a>, <a href="#scam-warnings">Scam Warnings</a>.</p></div></div>';
  }
  function select(stem){
    selected = (stem in DATA) ? stem : null;
    Object.keys(chips).forEach(function(s){
      chips[s].classList.remove("sel","on");
    });
    map.classList.toggle("has-sel", !!selected);
    if (selected){
      chips[selected].classList.add("sel");
      (DATA[selected].l || []).concat(DATA[selected].b || []).forEach(function(t){
        if (chips[t]) chips[t].classList.add("on");
      });
      renderPanel(selected);
      if (location.hash !== "#" + selected) history.replaceState(null, "", "#" + selected);
      var r = chips[selected].getBoundingClientRect(), m = map.getBoundingClientRect();
      if (r.top < m.top || r.bottom > m.bottom) chips[selected].scrollIntoView({block:"center"});
    } else {
      emptyPanel();
      history.replaceState(null, "", location.pathname + location.search);
    }
    requestAnimationFrame(drawWires);
  }
  map.addEventListener("click", function(e){
    var c = e.target.closest(".chip");
    if (c) select(c.dataset.stem === selected ? null : c.dataset.stem);
  });
  panel.addEventListener("click", function(e){
    var a = e.target.closest("a[href^='#']");
    if (a){ e.preventDefault(); select(a.getAttribute("href").slice(1)); }
  });
  window.addEventListener("hashchange", function(){
    var s = location.hash.replace("#","");
    if (s !== selected) select(s || null);
  });
  var filter = document.getElementById("filter");
  filter.addEventListener("input", function(){
    var q = filter.value.trim().toLowerCase();
    Object.keys(chips).forEach(function(s){
      var hit = !q || DATA[s].t.toLowerCase().indexOf(q) >= 0;
      chips[s].style.display = hit ? "" : "none";
    });
    map.querySelectorAll(".grp").forEach(function(g){
      var any = Array.prototype.some.call(g.querySelectorAll(".chip"), function(c){
        return c.style.display !== "none";
      });
      g.style.display = any ? "" : "none";
    });
    requestAnimationFrame(drawWires);
  });
  var rsz;
  window.addEventListener("resize", function(){
    clearTimeout(rsz); rsz = setTimeout(drawWires, 120);
  });
  // init
  var initial = location.hash.replace("#","");
  if (initial && DATA[initial]) select(initial); else emptyPanel();
  requestAnimationFrame(drawWires);
})();
</script>
"""

doc = (doc.replace("__NPAGES__", str(len(pages) - 2))  # content pages (excl. index/log)
          .replace("__NCONN__", str(n_conn))
          .replace("__SECTIONS__", "".join(sections_html))
          .replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")))
OUT.write_text(doc)
print(f"wrote {OUT} ({OUT.stat().st_size//1024}KB), {len(pages)} pages, {n_conn} connections")
