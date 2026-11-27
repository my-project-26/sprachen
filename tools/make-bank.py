#!/usr/bin/env python3
"""Wortliste für eine neue Lernsprache aus der englischen Liste erzeugen (über /api/bank auf Vercel).

  python3 tools/make-bank.py fr

Schreibt data/<lang>/<thema>.g.txt (gleiche Themen und Niveaus wie Englisch, deutsche Bedeutung und
deutscher Beispielsatz aus der englischen Liste). Merkt sich den Fortschritt in data/<lang>/.bank-progress.json,
kann also abgebrochen und neu gestartet werden. Meldet und speichert (git) in 10-%-Schritten.
"""
import hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
SERVER = os.environ.get("BANK_SERVER", "https://sprachen-five.vercel.app")
BATCH = int(os.environ.get("BANK_BATCH", "25"))
LEVELS = ["A1", "A2", "B1", "B2", "C1"]


def rows_from(path, start=None, end="];"):
    rows, inside = [], start is None
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not inside:
                inside = s.startswith(start)
                continue
            if start and s.startswith(end):
                break
            if s.startswith("[") and s.endswith(("],", "]")):
                try:
                    rows.append(json.loads(s.rstrip(",")))
                except json.JSONDecodeError:
                    pass
    return rows


def call(rows, lang, sig, model):
    req = urllib.request.Request(
        SERVER + "/api/bank",
        data=json.dumps({"lang": lang, "rows": rows, "model": model}).encode(),
        headers={"content-type": "application/json", "x-ww-sig": sig},
    )
    with urllib.request.urlopen(req, timeout=75) as r:
        return json.loads(r.read())["rows"]


def clean(s):
    return str(s).replace("|", "/").replace("\n", " ").strip()


def main():
    lang = sys.argv[1]
    key = os.environ["GOOGLE_TTS_KEY"]
    sig = hashlib.sha256((key + ":bank").encode()).hexdigest()
    js = os.path.join(ROOT, "js")
    src = rows_from(os.path.join(js, "words.js"), "const RAW = [") + rows_from(os.path.join(js, "wordbank.js"))
    seen, todo = set(), []
    for r in src:
        if len(r) < 7 or r[0] in seen:
            continue
        seen.add(r[0])
        todo.append(r[:7])
    todo.sort(key=lambda r: (r[4], LEVELS.index(r[3]) if r[3] in LEVELS else 9))
    batches = [todo[i : i + BATCH] for i in range(0, len(todo), BATCH)]
    out_dir = os.path.join(ROOT, "data", lang)
    os.makedirs(out_dir, exist_ok=True)
    prog_path = os.path.join(out_dir, ".bank-progress.json")
    prog = json.load(open(prog_path)) if os.path.exists(prog_path) else {}
    total, last_step = len(batches), -1
    print(f"{len(todo)} Wörter in {total} Paketen")

    def write_files():
        per = collections.defaultdict(lambda: collections.defaultdict(list))
        for i, b in enumerate(batches):
            res = prog.get(str(i))
            if not res:
                continue
            for r, (w, ex) in zip(b, res):
                if not w or "*" not in ex:
                    continue
                per[r[4]][r[3]].append(f"{clean(w)} | {clean(r[1])} | {r[2]} | {clean(ex)} | {clean(r[6])} |")
        for topic, lv in per.items():
            with open(os.path.join(out_dir, f"{topic}.g.txt"), "w", encoding="utf-8") as f:
                f.write(f"# {lang} – {topic} (aus der englischen Liste erzeugt)\n")
                for l in LEVELS:
                    if lv[l]:
                        f.write(f"\n## {l}\n" + "\n".join(lv[l]) + "\n")
        json.dump(prog, open(prog_path, "w"))

    def save(pct):
        write_files()
        if os.environ.get("BANK_COMMIT") == "1":
            subprocess.run(["git", "add", out_dir], check=False)
            subprocess.run(["git", "commit", "-q", "-m", f"Wortliste {lang}: {pct} %"], check=False)
            for _ in range(5):
                if subprocess.run(["sh", "-c", "git pull -q --rebase -X theirs origin main && git push -q origin HEAD:main"]).returncode == 0:
                    break
                time.sleep(8)

    for i, b in enumerate(batches):
        if str(i) in prog:
            continue
        payload = [[clean(x) for x in r] for r in b]
        res = None
        for attempt in range(6):
            model = "full" if attempt < 3 else "lite"
            try:
                res = call(payload, lang, sig, model)
                break
            except urllib.error.HTTPError as e:
                print(f"Paket {i}: HTTP {e.code} {e.read()[:200]!r}", flush=True)
                time.sleep(10 * (attempt + 1))
            except Exception as e:
                print(f"Paket {i}: {e}", flush=True)
                time.sleep(10 * (attempt + 1))
        if res is None:
            print(f"Paket {i} übersprungen", flush=True)
            continue
        prog[str(i)] = res
        done = len(prog)
        step = (done * 10) // total
        print(f"{done}/{total} Pakete ({done * 100 // total} %)", flush=True)
        if step != last_step and step > 0:
            last_step = step
            save(step * 10)
        time.sleep(float(os.environ.get("BANK_PAUSE", "3")))
    save(100 if len(prog) == total else len(prog) * 100 // total)
    print(f"fertig: {len(prog)}/{total} Pakete")


if __name__ == "__main__":
    main()
