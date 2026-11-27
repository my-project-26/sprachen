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
  return want.map((w) => `<span class="${got.has(fold(w)) ? "ok" : "bad"}">${esc(w)}</span>`).join(" ");
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

// Kleiner Mikrofon-Block für Lernkarten: „Nachsprechen“
export function micBlock(target) {
  if (!canSpeak()) return "";
  return `<div class="mic-block"><button type="button" class="mic-btn" data-mic="${esc(plain(target))}">🎤 <span>Nachsprechen</span></button><p class="mic-res small" aria-live="polite"></p></div>`;
}
export function bindMic(root) {
  root.querySelectorAll("[data-mic]").forEach(
    (b) =>
      (b.onclick = async () => {
        const out = b.parentElement.querySelector(".mic-res");
        const label = b.querySelector("span").textContent;
        b.classList.add("rec");
        b.querySelector("span").textContent = "Ich höre …";
        out.textContent = "";
        try {
          const heard = await listenOnce((t) => (out.textContent = "„" + t + "“"));
          if (!heard) throw new Error("Ich habe nichts gehört. Tippe noch einmal und sprich direkt los.");
          const r = rateSpeech(b.dataset.mic, heard);
          out.className = `mic-res small ${r.cls}`;
          out.innerHTML = `${r.text}${heard ? `<br><span class="muted">Verstanden: „${esc(String(heard))}“</span>` : ""}`;
        } catch (e) {
          out.className = "mic-res small bad";
          out.textContent = e.message;
        }
        b.classList.remove("rec");
        b.querySelector("span").textContent = label;
      })
  );
}

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
      ${canSpeak() ? `<a class="ef-tile" href="#/practice/sprechen"><span class="ef-tic">🎤</span><b>Sprechen</b><small>Satz hören und nachsprechen</small></a>` : ""}
      <a class="ef-tile" href="#/listen"><span class="ef-tic">🎧</span><b>Hören</b><small>Wörter zum Anhören</small></a>
      <a class="ef-tile" href="#/chat"><span class="ef-tic">🗣️</span><b>Gespräch</b><small>Rollenspiel mit der KI</small></a>
      <a class="ef-tile" href="#/toolbox"><span class="ef-tic">🧰</span><b>Toolbox</b><small>Fertige Sätze für den Alltag</small></a>
    </div>
    ${canSpeak() ? "" : `<p class="small muted">Sprechen üben geht in diesem Browser leider nicht. Am iPhone und in Chrome funktioniert es.</p>`}`;
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
          : `<button class="mic-btn big" id="pMic">🎤 <span>Jetzt sprechen</span></button>
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
      const mic = document.getElementById("pMic");
      document.getElementById("pShow").onclick = () => {
        const t = document.getElementById("pText");
        t.hidden = !t.hidden;
        document.getElementById("pShow").textContent = t.hidden ? "📝 Satz anzeigen" : "📝 Satz ausblenden";
      };
      let busy = false;
      mic.onclick = async () => {
        if (busy) return;
        busy = true;
        mic.classList.add("rec");
        mic.querySelector("span").textContent = "Ich höre zu …";
        try {
          const heard = await listenOnce((t) => (res.innerHTML = `<p class="small muted">„${esc(t)}“</p>`));
          const r = rateSpeech(sent, heard);
          reveal(r.cls === "ok", `<p class="p-verdict ${r.cls}">${r.text}</p>${heard ? `<p class="small muted">Verstanden: „${esc(String(heard))}“</p>` : ""}`);
        } catch (e) {
          res.innerHTML = `<p class="p-verdict bad">${esc(e.message)}</p>`;
        }
        mic.classList.remove("rec");
        mic.querySelector("span").textContent = "Nochmal sprechen";
        busy = false;
      };
    }
  };
  show();
}
