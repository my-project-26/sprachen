// Üben: Nachsprechen (Spracherkennung des Geräts) und Diktat (hören → schreiben)
// Beides mit Wörtern/Sätzen, die schon gelernt wurden.

import * as S from "./store.js";
import * as tts from "./tts.js";
import { L } from "./langs.js";

const plain = (t) => String(t || "").replace(/\*+/g, "");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Vergleich ohne Groß/klein, Akzente und Satzzeichen
const fold = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function similarity(a, b) {
  a = fold(a);
  b = fold(b);
  if (!a && !b) return 1;
  const m = a.length,
    n = b.length;
  const d = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return 1 - d[n] / Math.max(m, n, 1);
}

// Wortweiser Vergleich für die Anzeige: richtige Wörter grün, falsche rot
function diffHtml(target, typed) {
  const want = plain(target).split(/\s+/);
  const got = new Set(fold(typed).split(" "));
  // „I'd“ wird zu „i d“ – alle Teile müssen vorkommen
  const hit = (w) => {
    const parts = fold(w).split(" ").filter(Boolean);
    return !parts.length || parts.every((x) => got.has(x));
  };
  return want.map((w) => `<span class="${hit(w) ? "ok" : "bad"}">${esc(w)}</span>`).join(" ");
}

export const canSpeak = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Spracherkennung: liefert den erkannten Text (oder "").
// onPartial(text) zeigt schon während des Sprechens, was erkannt wird.
// iPhone: Jede NEUE Erkennung fragt das Mikrofon neu an („Mikrofonzugriff gewährt“) und bekommt danach oft keinen Ton.
// Deshalb gibt es nur EIN Erkennungs-Objekt, das bei jedem Tippen neu gestartet wird.
// Außerdem hängt das iPhone manchmal die Ergebnisse der letzten Aufnahme vorne an → werden abgeschnitten.
let REC = null; // das eine Erkennungs-Objekt
let RUNNING = false; // läuft gerade eine Aufnahme?
let SESSION = null; // Handler der aktuellen Aufnahme
let LAST = ""; // Gesamttext der letzten Aufnahme

function recognizer() {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (REC) return REC;
  const r = new R();
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 3;
  r.onstart = () => {
    RUNNING = true;
    SESSION && SESSION.start();
  };
  r.onresult = (e) => SESSION && SESSION.result(e);
  r.onerror = (e) => SESSION && SESSION.error(e.error);
  r.onend = () => {
    RUNNING = false;
    // Ende einer vorherigen Aufnahme, während die neue noch nicht gestartet ist → ignorieren
    if (SESSION && !SESSION.started() && !SESSION.blocked()) return;
    const s = SESSION;
    SESSION = null;
    s && s.end();
  };
  REC = r;
  return r;
}

// Falls das Objekt hängt: verwerfen, beim nächsten Mal ein neues anlegen
function resetRecognizer() {
  if (REC) {
    try {
      REC.onstart = REC.onresult = REC.onerror = REC.onend = null;
      REC.abort();
    } catch {}
  }
  REC = null;
  RUNNING = false;
}

export function listenOnce(onPartial) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return Promise.reject(new Error("Spracherkennung geht in diesem Browser nicht. Bitte Safari oder Chrome nutzen."));
  tts.stop();
  // Eine noch laufende Aufnahme (anderer Knopf) still beenden
  if (SESSION) {
    const old = SESSION;
    SESSION = null;
    old.cancel();
  }
  return new Promise((res, rej) => {
    let best = "",
      alts = [],
      raw = "",
      failed = null,
      done = false,
      started = false;
    const finish = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      clearTimeout(startGuard);
      fn();
    };
    const sess = {
      start() {
        started = true;
      },
      started: () => started,
      result(e) {
        let text = "";
        for (let i = 0; i < e.results.length; i++) text += (text ? " " : "") + e.results[i][0].transcript.trim();
        text = text.trim();
        raw = text;
        if (LAST && text.length > LAST.length + 1 && text.toLowerCase().startsWith(LAST.toLowerCase())) text = text.slice(LAST.length).trim();
        if (!text) return;
        best = text;
        const last = e.results[e.results.length - 1];
        alts = [...last].map((x) => x.transcript.trim()).filter(Boolean);
        onPartial && onPartial(best);
      },
      error(code) {
        if (code === "aborted" && !started) return; // Abbruch der vorherigen Aufnahme
        failed = code;
      },
      blocked: () => failed === "not-allowed" || failed === "service-not-allowed",
      end() {
        finish(() => {
          if (best) {
            LAST = raw || best;
            return res(Object.assign(new String(best), { alts: [best, ...alts] }));
          }
          if (failed === "not-allowed" || failed === "service-not-allowed")
            return rej(new Error("Das Mikrofon ist blockiert. iPhone: Einstellungen → Safari (bzw. Chrome) → Mikrofon → Erlauben. Danach die App einmal ganz schließen und neu öffnen."));
          if (failed === "audio-capture") {
            resetRecognizer();
            return rej(new Error("Das Mikrofon ist gerade belegt. Tippe noch einmal."));
          }
          if (failed && failed !== "no-speech" && failed !== "aborted") {
            resetRecognizer();
            return rej(new Error("Spracherkennung: " + failed + ". Tippe noch einmal."));
          }
          res("");
        });
      },
      cancel() {
        finish(() => res(""));
      },
    };
    // Sicherheitsnetz 1: Startet die Aufnahme nicht innerhalb von 3 s → Objekt erneuern
    const startGuard = setTimeout(() => {
      if (started || done) return;
      resetRecognizer();
      finish(() => rej(new Error("Das Mikrofon hat nicht reagiert. Tippe bitte noch einmal.")));
    }, 3000);
    // Sicherheitsnetz 2: Nach 10 s selbst beenden
    const guard = setTimeout(() => {
      try {
        REC && REC.stop();
      } catch {}
      setTimeout(() => {
        if (done) return;
        if (SESSION === sess) SESSION = null;
        resetRecognizer();
        sess.end();
      }, 1200);
    }, 10000);

    const r = recognizer();
    r.lang = (L().tts && L().tts[0]) || S.lang();
    SESSION = sess;
    const go = () => {
      try {
        r.start(); // direkt im Tipp starten – iPhone erlaubt das Mikrofon nur direkt nach dem Tippen
      } catch (e) {
        // Läuft noch (InvalidStateError) → kurz stoppen und neu starten
        try {
          r.abort();
        } catch {}
        setTimeout(() => {
          if (done || SESSION !== sess) return;
          try {
            r.start();
          } catch {
            resetRecognizer();
            finish(() => rej(new Error("Das Mikrofon hat nicht reagiert. Tippe bitte noch einmal.")));
          }
        }, 400);
      }
    };
    if (RUNNING) {
      try {
        r.abort();
      } catch {}
      setTimeout(go, 300);
    } else go();
  });
}

// Bewertung eines gesprochenen Versuchs
export function rateSpeech(target, heard) {
  const alts = heard?.alts || [String(heard || "")];
  // Zusätzlich nur das Ende des Gehörten werten (falls noch alte Wörter davor hängen)
  const n = plain(target).split(/\s+/).length;
  const cands = alts.flatMap((h) => {
    const w = String(h).trim().split(/\s+/);
    return w.length > n ? [h, w.slice(-n).join(" ")] : [h];
  });
  const score = Math.max(...cands.map((h) => similarity(target, h)));
  if (score >= 0.85) return { score, cls: "ok", text: "Super, sehr gut ausgesprochen! 🎉" };
  if (score >= 0.6) return { score, cls: "almost", text: "Fast! Hör es dir noch einmal an und versuch es erneut." };
  return { score, cls: "bad", text: "Das habe ich nicht richtig verstanden. Hör genau hin und probier es nochmal." };
}

// ---------- Sprechen per Tastatur-Diktat ----------
// Statt der störanfälligen Browser-Spracherkennung: ein Eingabefeld. Man tippt hinein und
// diktiert über das 🎤 der Handy-Tastatur (wie bei WhatsApp) – oder schreibt einfach.
// Während des Diktierens wird live Wort für Wort verglichen; „Prüfen“ bewertet.

// Deutsch statt Zielsprache diktiert? (Tastatur steht dann meist noch auf Deutsch)
const DE_WORDS = new Set("ich nicht und ist das der ein eine einen bitte danke möchte gerne haben habe wir sie mit auf für zu den dem wo wie kann hallo ja nein auch noch sehr gut heute".split(" "));
export function looksGerman(text) {
  const t = String(text || "").toLowerCase();
  if (S.lang() === "de") return false;
  const words = t.split(/[^a-zäöüß]+/).filter(Boolean);
  const hits = words.filter((w) => DE_WORDS.has(w)).length;
  return hits >= 2 || (/[äöß]/.test(t) && hits >= 1);
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = () => /Android/i.test(navigator.userAgent);

// Anleitung: Tastatur der Lernsprache hinzufügen (direkt in die Einstellungen springen erlauben iPhone und Android nicht)
export function keyboardHelp(onDone) {
  const lang = L().name;
  const ios = `<h3>iPhone</h3>
    <ol class="kb-steps">
      <li>Öffne die App <b>Einstellungen</b> (graues Zahnrad).</li>
      <li>Tippe auf <b>Allgemein</b> → <b>Tastatur</b> → <b>Tastaturen</b>.</li>
      <li>Tippe auf <b>Tastatur hinzufügen …</b> und wähle <b>${esc(lang)}</b>.</li>
      <li>Zurück in dieser App: Tippe ins Feld und halte unten links die <b>🌐-Taste</b> gedrückt → <b>${esc(lang)}</b>. Jetzt das <b>🎤</b> der Tastatur antippen und sprechen.</li>
    </ol>`;
  const android = `<h3>Android</h3>
    <ol class="kb-steps">
      <li>Tippe ins Feld, damit die Tastatur aufgeht.</li>
      <li>Halte das <b>🎤</b> der Tastatur gedrückt (oder ⚙️ → <b>Sprachen</b>).</li>
      <li>Wähle <b>Sprache hinzufügen</b> → <b>${esc(lang)}</b>.</li>
      <li>Jetzt erkennt die Tastatur beim Diktieren auch ${esc(lang)}. Sonst kurz über die 🌐-Taste oder die Leertaste umschalten.</li>
    </ol>`;
  const body = isIOS() ? ios : isAndroid() ? android : ios + android;
  const ov = document.createElement("div");
  ov.className = "kb-overlay";
  ov.innerHTML = `<div class="kb-sheet" role="dialog" aria-modal="true" aria-label="Diktieren auf ${esc(lang)}">
      <h2>Auf ${esc(lang)} diktieren</h2>
      <p class="small muted">Dein Handy diktiert in der Sprache der Tastatur. Füge einmal eine Tastatur für ${esc(lang)} hinzu – danach geht es mit einem Tipp.</p>
      ${body}
      <button class="ef-btn ef-pri kb-done" type="button">Erledigt – nochmal versuchen</button>
    </div>`;
  const close = () => {
    ov.remove();
    onDone && onDone();
  };
  ov.querySelector(".kb-done").onclick = close;
  ov.onclick = (e) => e.target === ov && close();
  document.body.appendChild(ov);
  ov.querySelector(".kb-done").focus({ preventScroll: true });
}

// Eingabefeld zum Nachsprechen. open = gleich aufgeklappt (sonst Knopf „🎤 Nachsprechen“)
export function sayBlock(target, { open = false, label = "Nachsprechen" } = {}) {
  const t = esc(plain(target));
  return `<div class="say-block${open ? " open" : ""}" data-target="${t}">
    ${open ? "" : `<button type="button" class="say-toggle mic-btn">🎤 <span>${esc(label)}</span></button>`}
    <div class="say-body" ${open ? "" : "hidden"}>
      <div class="say-row">
        <input class="say-in" type="text" lang="${esc(S.lang())}" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="done"
          placeholder="Tippe hier, dann 🎤 der Tastatur" aria-label="Satz sprechen oder schreiben">
        <button type="button" class="say-help" aria-label="Hilfe zum Diktieren">?</button>
      </div>
      <p class="say-live small" aria-live="polite"></p>
      <button type="button" class="ef-btn ef-pri say-check">Prüfen</button>
      <p class="say-res small" aria-live="polite"></p>
    </div>
  </div>`;
}

// Verhalten für alle Sprech-Felder in root. onCheck(target, text, rating) optional.
export function bindSay(root, { onCheck } = {}) {
  root.querySelectorAll(".say-block").forEach((blk) => {
    const target = blk.dataset.target;
    const inp = blk.querySelector(".say-in");
    const live = blk.querySelector(".say-live");
    const res = blk.querySelector(".say-res");
    const body = blk.querySelector(".say-body");
    const tog = blk.querySelector(".say-toggle");
    const help = () => keyboardHelp(() => inp.focus());
    if (tog)
      tog.onclick = () => {
        body.hidden = !body.hidden;
        tog.classList.toggle("on", !body.hidden);
        if (!body.hidden) {
          tts.stop();
          inp.focus();
        }
      };
    blk.querySelector(".say-help").onclick = help;
    inp.oninput = () => {
      res.textContent = "";
      res.className = "say-res small";
      const v = inp.value.trim();
      if (!v) return (live.innerHTML = "");
      live.innerHTML = looksGerman(v)
        ? `<span class="say-warn">Das klingt nach Deutsch. Stell die Tastatur auf ${esc(L().name)} um. <button type="button" class="linkish say-how">So geht's</button></span>`
        : `<span class="p-diff">${diffHtml(target, v)}</span>`;
      const how = live.querySelector(".say-how");
      if (how) how.onclick = help;
    };
    const check = () => {
      const v = inp.value.trim();
      if (!v) {
        res.className = "say-res small bad";
        res.textContent = "Tippe ins Feld und sprich über das 🎤 der Tastatur – oder schreib den Satz.";
        inp.focus();
        return;
      }
      if (looksGerman(v)) return help();
      const r = rateSpeech(target, v);
      res.className = `say-res small ${r.cls}`;
      res.innerHTML = r.cls === "ok" ? "Super, genau richtig! 🎉" : r.cls === "almost" ? "Fast! Die roten Wörter passen noch nicht – korrigiere sie und prüfe nochmal." : "Noch nicht. Hör dir den Satz an und versuch es nochmal.";
      live.innerHTML = `<span class="p-diff">${diffHtml(target, v)}</span>`;
      inp.blur();
      onCheck && onCheck(target, v, r);
    };
    blk.querySelector(".say-check").onclick = check;
    inp.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        check();
      }
    };
  });
}

// Alte Namen (Lernkarte, Toolbox) – zeigen jetzt das Diktat-Feld
export const micBlock = (target) => sayBlock(target);
export const bindMic = (root) => bindSay(root);

// ---------- Übungsseite: Diktat oder Sprechen ----------
export function practiceView($app, { settings, rateSlider, ICON }, mode = "") {
  const pool = S.cards().filter((c) => c.state !== "new" && c.ex);
  const header = `<header class="top"><a class="icon-btn plain" href="#/" aria-label="Zurück">${ICON.back}</a>
    <h1 class="h-sm">${mode === "diktat" ? "Diktat" : mode === "sprechen" ? "Sprechen" : "Üben"}</h1><span></span></header>`;
  if (!pool.length) {
    $app.innerHTML = `${header}<section class="card"><h2>Noch nichts zum Üben</h2><p>Lerne zuerst ein paar Wörter. Danach kannst du hier hören, schreiben und sprechen üben.</p><a class="btn primary" href="#/learn">Jetzt lernen</a></section>`;
    return;
  }
  if (!mode) {
    $app.innerHTML = `${header}
    <div class="ef-tiles practice-tiles">
      <a class="ef-tile" href="#/practice/diktat"><span class="ef-tic">✍️</span><b>Diktat</b><small>Satz hören und aufschreiben</small></a>
      <a class="ef-tile" href="#/practice/sprechen"><span class="ef-tic">🎤</span><b>Sprechen</b><small>Satz hören und nachsprechen</small></a>
      <a class="ef-tile" href="#/listen"><span class="ef-tic">🎧</span><b>Hören</b><small>Wörter zum Anhören</small></a>
      <a class="ef-tile" href="#/sleep"><span class="ef-tic">🌙</span><b>Einschlafen</b><small>Ruhige Geschichte, 15 Minuten</small></a>
      <a class="ef-tile" href="#/chat"><span class="ef-tic">🗣️</span><b>Gespräch</b><small>Rollenspiel mit der KI</small></a>
      <a class="ef-tile" href="#/toolbox"><span class="ef-tic">🧰</span><b>Toolbox</b><small>Fertige Sätze für den Alltag</small></a>
    </div>
    `;
    return;
  }
  const list = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
  let i = 0,
    good = 0;
  const say = (t) => tts.speak(t, { rate: settings().voiceRate, preset: settings().voicePreset });

  const show = () => {
    if (i >= list.length) {
      $app.innerHTML = `${header}<section class="card center-card"><h2>Geschafft! 🎉</h2><p>${good} von ${list.length} richtig.</p>
        <a class="btn primary" href="#/practice/${mode}">Noch eine Runde</a> <a class="btn ghost" href="#/practice">Andere Übung</a></section>`;
      return;
    }
    const c = list[i];
    const sent = plain(c.ex);
    $app.innerHTML = `${header}
    <p class="ef-step"><span>${mode === "diktat" ? "Hör zu und schreib den Satz auf" : "Hör zu und sprich den Satz nach"}</span><span>${i + 1} von ${list.length}</span></p>
    <section class="card practice-card">
      <button class="listen-play" id="pSay">${ICON.speaker}<span>Satz anhören</span></button>
      ${rateSlider("", sent)}
      ${
        mode === "diktat"
          ? `<textarea id="pIn" rows="3" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Schreib hier, was du hörst …"></textarea>
             <button class="ef-btn ef-pri" id="pCheck">Prüfen</button>`
          : `${sayBlock(sent, { open: true })}
             <button class="linkish" id="pShow" type="button">📝 Satz anzeigen</button>
             <p class="p-sol" id="pText" hidden><b>${esc(sent)}</b><br><span class="muted">${esc(plain(c.exDe))}</span></p>`
      }
      <div id="pRes" aria-live="polite"></div>
      <button class="ef-btn ef-sec" id="pNext" hidden>Weiter</button>
      <p class="small muted">Tipp: Bei „Langsam“ verstehst du jedes Wort.</p>
    </section>`;
    const res = document.getElementById("pRes");
    const next = document.getElementById("pNext");
    const reveal = (ok, extra) => {
      if (ok) good++;
      res.innerHTML = `${extra}<p class="p-sol"><b>${esc(sent)}</b><br><span class="muted">${esc(plain(c.exDe))}</span></p>`;
      next.hidden = false;
      next.focus();
    };
    document.getElementById("pSay").onclick = () => say(sent);
    next.onclick = () => {
      i++;
      show();
    };
    setTimeout(() => say(sent), 300);
    if (mode === "diktat") {
      const inp = document.getElementById("pIn");
      document.getElementById("pCheck").onclick = () => {
        const sc = similarity(sent, inp.value);
        const ok = sc >= 0.9;
        reveal(ok, `<p class="p-verdict ${ok ? "ok" : sc >= 0.6 ? "almost" : "bad"}">${ok ? "Richtig! 🎉" : sc >= 0.6 ? "Fast – schau dir die roten Wörter an." : "Noch nicht ganz. So heißt der Satz:"}</p><p class="p-diff">${diffHtml(sent, inp.value)}</p>`);
        document.getElementById("pCheck").hidden = true;
      };
    } else {
      document.getElementById("pShow").onclick = () => {
        const t = document.getElementById("pText");
        t.hidden = !t.hidden;
        document.getElementById("pShow").textContent = t.hidden ? "📝 Satz anzeigen" : "📝 Satz ausblenden";
      };
      let counted = false;
      bindSay($app, {
        onCheck: (_t, v, r) => {
          if (r.cls === "ok" && !counted) {
            counted = true;
            good++;
            // Lösung mit Übersetzung nur zeigen, wenn sie nicht schon eingeblendet ist
            if (document.getElementById("pText").hidden) res.innerHTML = `<p class="p-sol"><b>${esc(sent)}</b><br><span class="muted">${esc(plain(c.exDe))}</span></p>`;
          }
          next.hidden = false; // weiter geht immer – nochmal versuchen auch
        },
      });
    }
  };
  show();
}
