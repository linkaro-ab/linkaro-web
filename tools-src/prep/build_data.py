#!/usr/bin/env python3
"""Build data/prep.html from prep.template.html.

Fetches:
  - Lexicon data from zrajm/teckentranskription (lexicon-data.js + lexicon-data.csv),
    which originates from Svenskt teckenspråkslexikon, Stockholms universitet (CC BY-NC-SA 4.0).
    Swap LEX_JS_URL/LEX_CSV_URL for SU's own dump when available.
  - Swedish word frequencies from the wordfreq package (CC BY-SA 4.0 data).

Usage: python3 build_data.py [--out ../build/prep.html]
Requires: pip install wordfreq
"""
import argparse, csv, io, json, math, re, sys, urllib.request
from pathlib import Path

LEX_JS_URL = "https://raw.githubusercontent.com/zrajm/teckentranskription/master/lexicon-data.js"
LEX_CSV_URL = "https://raw.githubusercontent.com/zrajm/teckentranskription/master/lexicon-data.csv"
HERE = Path(__file__).resolve().parent

def fetch(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read().decode("utf-8")

def build_lexicon():
    src = fetch(LEX_JS_URL)
    date = re.search(r'new Date\("([^"]+)"\)', src).group(1)
    tags = json.loads(re.search(r"let lexiconTags=(\[.*?\])\s*\n\s*let", src, re.S).group(1))
    rows = json.loads(re.search(r"let lexicon=(\[.*?\]\])\.map", src, re.S).group(1))
    infl = {}
    for r in csv.reader(io.StringIO(fetch(LEX_CSV_URL))):
        if r:
            infl[r[0]] = [x for x in r[10:13] if x and not x.isdigit()]
    entries, forms = [], {}
    for r in rows:
        sid = r[0]
        words = [x for x in r[2:] if isinstance(x, str)]
        tg = [x for x in r[2:] if isinstance(x, int)]
        if not words:
            continue
        i = len(entries)
        entries.append([int(sid), words[0], tg])
        for w in set(words + infl.get(sid, [])):
            k = w.strip().lower()
            if k:
                forms.setdefault(k, []).append(i)
    if len(entries) < 15000:
        sys.exit(f"Lexicon looks incomplete ({len(entries)} entries), aborting.")
    return {"date": date, "tags": tags, "e": entries, "f": forms}

def build_freq():
    from wordfreq import get_frequency_dict
    bands = {}
    for w, f in get_frequency_dict("sv").items():
        z = math.log10(f) + 9
        if z < 2.5 or not re.fullmatch(r"[a-zåäöéü-]+", w):
            continue
        b = min(int(z * 2) / 2, 6.0)
        bands.setdefault(str(b), []).append(w)
    return {k: " ".join(v) for k, v in bands.items()}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(HERE.parent / "build" / "prep.html"))
    a = ap.parse_args()
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = (HERE / "prep.template.html").read_text(encoding="utf-8")
    lex = build_lexicon()
    html = html.replace("__LEXDATA__", dump(lex)).replace("__FREQDATA__", dump(build_freq()))
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size/1e6:.2f} MB), {len(lex['e'])} signs, lexicon date {lex['date']}")

if __name__ == "__main__":
    main()
