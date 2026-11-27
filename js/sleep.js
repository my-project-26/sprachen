// Lange Geschichte zum Hören (auch zum Einschlafen): ruhig, ca. 10 Minuten, auf Englisch (bzw. der Lernsprache).
// Pro Geschichte 30 gelernte Wörter, rotierend: die am längsten nicht gehörten zuerst, schwierige mit Vorrang.
// Die KI schreibt sie, Google liest sie vor.
// Die Aufnahme wird zu EINER Audiodatei zusammengesetzt – die spielt das iPhone auch bei gesperrtem Bildschirm weiter.
// Zum Ende hin wird sie leiser (die letzten Abschnitte werden leiser eingesprochen).

import * as S from "./store.js";
import * as tts from "./tts.js";
import { L } from "./langs.js";
import { callApi, normalizeStory } from "./api.js";
import { SLEEP_CATEGORIES } from "./prompts.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const AUDIO_CACHE = "sleep-audio"; // bewusst ohne „wortwerk-“: bleibt beim App-Aktualisieren erhalten
const RATE = 0.9; // ruhiges Vorlesetempo
const fmt = (sec) => {
  sec = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

// ---------- Wörter: rotierend durch den ganzen gelernten Wortschatz ----------
// sleepAt = wann das Wort zuletzt in einer langen Geschichte vorkam (nur wenn es wirklich im Text stand)
export function sleepWords(max = 30) {
  const all = S.cards().filter((c) => c.en && c.state && c.state !== "new");
  const hard = (c) => (c.weak ? 2 : 0) + Math.min(3, c.lapses || 0);
  return [...all]
    .sort((a, b) => (a.sleepAt || 0) - (b.sleepAt || 0) || hard(b) - hard(a) || (b.introducedAt || 0) - (a.introducedAt || 0))
    .slice(0, max);
}

// Welche Wörter stehen wirklich im Text? Nur diese zählen als „dran gewesen“.
function markUsed(words, text) {
  const t = String(text).toLowerCase().replace(/\*\*/g, "");
  const now = Date.now();
  let n = 0;
  for (const w of words) {
    const stem = w.en.toLowerCase().replace(/^(to|the|a|an) /, "").trim();
    const core = stem.length > 4 ? stem.slice(0, stem.length - 1) : stem; // apologise → apologis(ed) …
    if (core && t.includes(core)) {
      w.sleepAt = now;
      n++;
    }
  }
  S.save();
  return n;
}

// ---------- Text in Stücke für die Google-Stimme (max. 900 Zeichen je Abruf) ----------
function chunksOf(text, max = 820) {
  const paras = String(text)
    .replace(/\*\*/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const out = [];
  let cur = "";
  for (const p of paras) {
    const sentences = p.match(/[^.!?…]+[.!?…]+["'”’)]*\s*|[^.!?…]+$/g) || [p];
    for (let s of sentences) {
      s = s.trim();
      if (!s) continue;
      if (cur && (cur + " " + s).length > max) {
        out.push(cur);
        cur = "";
      }
      cur = cur ? cur + " " + s : s;
    }
    // Absatzende: Stück abschließen, wenn es schon lang genug ist (natürliche Pause)
    if (cur.length > max * 0.6) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ---------- Audiodatei bauen (oder aus dem Speicher holen) ----------
const cacheKey = (id) => `/sleep/${id}.mp3`;
async function cachedAudio(id) {
  try {
    const c = await caches.open(AUDIO_CACHE);
    const r = await c.match(cacheKey(id));
    return r ? await r.blob() : null;
  } catch {
    return null;
  }
}
async function storeAudio(id, blob) {
  try {
    const c = await caches.open(AUDIO_CACHE);
    await c.put(cacheKey(id), new Response(blob, { headers: { "content-type": "audio/mpeg" } }));
  } catch {}
}
export async function deleteSleepAudio(id) {
  try {
    const c = await caches.open(AUDIO_CACHE);
    await c.delete(cacheKey(id));
  } catch {}
}

async function fetchChunk(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("Stimme: Fehler " + r.status);
      const b = await r.arrayBuffer();
      if (b.byteLength < 500) throw new Error("Stimme: leere Antwort");
      return b;
    } catch (e) {
      last = e;
      await new Promise((ok) => setTimeout(ok, 800 * (i + 1)));
    }
  }
  throw last;
}

async function buildAudio(story, preset, onProgress) {
  const cached = await cachedAudio(story.id);
  if (cached) return cached;
  if (!tts.hasServer()) throw new Error("Für das Vorlesen braucht die App den KI-Server (Einstellungen → KI-Server).");
  const parts = chunksOf(story.text);
  const n = parts.length;
  // die letzten Abschnitte leiser: −3, −6, −9 dB
  const gainOf = (i) => (i === n - 1 ? -9 : i === n - 2 ? -6 : i === n - 3 ? -3 : 0);
  const urls = parts.map((t, i) => tts.serverUrl(t, { preset, rate: RATE, gain: gainOf(i) }));
  const bufs = new Array(n);
  let done = 0,
    next = 0;
  const worker = async () => {
    while (next < n) {
      const i = next++;
      bufs[i] = await fetchChunk(urls[i]);
      done++;
      onProgress && onProgress(done / n);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const blob = new Blob(bufs, { type: "audio/mpeg" });
  await storeAudio(story.id, blob);
  return blob;
}

// ---------- Abspielen: dunkler Bildschirm ----------
let PLAYER = null;
export function stopSleep() {
  if (PLAYER) {
    PLAYER.close();
    PLAYER = null;
  }
}

function openPlayer(story, blob) {
  stopSleep();
  tts.stop();
  const url = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.src = url;
  audio.preload = "auto";
  const ov = document.createElement("div");
  ov.className = "sl-player";
  ov.innerHTML = `
    <button class="sl-close" type="button" aria-label="Schließen">✕</button>
    <div class="sl-moon" aria-hidden="true"></div>
    <p class="sl-cat">${esc(story.theme || "")}</p>
    <h2 class="sl-title">${esc(story.title)}</h2>
    <button class="sl-play" type="button" aria-label="Abspielen"><span>▶</span></button>
    <div class="sl-bar" aria-hidden="true"><i></i></div>
    <p class="sl-time"><span class="sl-cur">0:00</span><span class="sl-dur">–:––</span></p>
    <div class="sl-row">
      <button class="sl-small sl-back" type="button">↺ 30 s</button>
      <a class="sl-small" href="#/story/${esc(story.id)}">Text lesen</a>
    </div>
    <p class="sl-hint">Du kannst den Bildschirm sperren – die Geschichte läuft weiter und wird zum Ende hin leiser.</p>`;
  document.body.appendChild(ov);
  const $play = ov.querySelector(".sl-play");
  const $fill = ov.querySelector(".sl-bar i");
  const $cur = ov.querySelector(".sl-cur");
  const $dur = ov.querySelector(".sl-dur");
  const setBtn = () => {
    const on = !audio.paused;
    $play.innerHTML = `<span>${on ? "❚❚" : "▶"}</span>`;
    $play.setAttribute("aria-label", on ? "Pause" : "Abspielen");
    try {
      if (navigator.mediaSession) navigator.mediaSession.playbackState = on ? "playing" : "paused";
    } catch {}
  };
  const toggle = () => (audio.paused ? audio.play().catch(() => {}) : audio.pause());
  $play.onclick = toggle;
  ov.querySelector(".sl-back").onclick = () => (audio.currentTime = Math.max(0, audio.currentTime - 30));
  audio.onplay = audio.onpause = setBtn;
  audio.ontimeupdate = () => {
    const d = isFinite(audio.duration) ? audio.duration : 0;
    $cur.textContent = fmt(audio.currentTime);
    if (d) {
      $dur.textContent = fmt(d);
      $fill.style.width = `${Math.min(100, (audio.currentTime / d) * 100)}%`;
    }
  };
  audio.onended = () => {
    setBtn();
    $fill.style.width = "100%";
  };
  try {
    if (navigator.mediaSession) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: story.title, artist: "Wortwerk · Geschichte zum Hören", album: story.theme || "" });
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => (audio.currentTime = Math.max(0, audio.currentTime - 30)));
    }
  } catch {}
  const close = () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    URL.revokeObjectURL(url);
    ov.remove();
    if (PLAYER && PLAYER.audio === audio) PLAYER = null;
  };
  ov.querySelector(".sl-close").onclick = close;
  ov.querySelector('a[href^="#/story/"]').addEventListener("click", () => close());
  PLAYER = { audio, close };
  audio.play().catch(() => {}); // direkt im Tipp starten (iPhone erlaubt Ton nur nach einem Tipp)
  setBtn();
  return PLAYER;
}

// ---------- Seite ----------
// Von der Geschichten-Seite aus abspielen (Aufnahme ggf. erst erstellen)
export async function playSleepStory(st, preset, onProgress) {
  const blob = (await cachedAudio(st.id)) || (await buildAudio(st, preset, onProgress));
  return openPlayer(st, blob);
}

export function sleepView($app, { settings, ICON }) {
  const s = settings();
  const prefs = { category: "ruhig", level: "A2", ...(s.sleep || {}) };
  const savePrefs = () => {
    S.getState().settings.sleep = { category: prefs.category, level: prefs.level };
    S.save();
  };
  const words = sleepWords();
  const mine = S.getState().stories.filter((x) => x.sleep).slice(0, 6);
  const cats = Object.entries(SLEEP_CATEGORIES);

  $app.innerHTML = `
  <header class="top"><a class="icon-btn plain" href="#/stories" aria-label="Zurück">${ICON.back}</a>
    <h1 class="h-sm">Neue Geschichte</h1><span></span></header>
  <div class="speed seg st-len" role="group" aria-label="Länge">
    <a href="#/story/new" class="${S.storyReady() ? "" : "off"}">Kurz zum Lesen</a><a href="#/sleep" class="on" aria-current="true">🌙 Lang zum Hören</a>
  </div>
  <section class="sl-hero">
    <h2>Lange Geschichte zum Hören</h2>
    <p>Ruhig vorgelesen auf ${esc(L().name)}, etwa 10 Minuten – ideal vor dem Einschlafen. Darin kommen 30 deiner gelernten Wörter vor, jedes Mal andere. So hörst du nach und nach deinen ganzen Wortschatz wieder.</p>
  </section>
  ${
    words.length < 2
      ? `<section class="card"><h2>Noch zu wenige Wörter</h2><p>Lerne zuerst ein paar Wörter. Dann baut die App sie in deine Einschlaf-Geschichte ein.</p><a class="btn primary" href="#/learn">Jetzt lernen</a></section>`
      : `<section class="card sl-setup">
    <h2>Worum soll es gehen?</h2>
    <div class="sl-cats" role="radiogroup" aria-label="Kategorie">${cats
      .map(([k, c]) => `<button type="button" class="sl-cat-btn${prefs.category === k ? " on" : ""}" data-cat="${k}" role="radio" aria-checked="${prefs.category === k}"><span>${c.ic}</span>${esc(c.de)}</button>`)
      .join("")}</div>
    <h2>Wie leicht?</h2>
    <div class="speed seg">${["A1", "A2", "B1"].map((l) => `<button type="button" class="${prefs.level === l ? "on" : ""}" data-lvl="${l}" aria-pressed="${prefs.level === l}">${l}</button>`).join("")}</div>
    <p class="small muted">A2 ist leicht und gut zum Einschlafen.</p>
    <h2>Diese ${words.length} Wörter kommen dran</h2>
    <div class="chips">${words.map((w) => `<span class="chip new" title="${esc(w.de)}">${esc(w.en)}</span>`).join("")}</div>
    <button class="ef-btn ef-pri sl-go" id="slGo" type="button">🌙 Lange Geschichte erstellen</button>
    <p class="small muted sl-note" id="slNote">Deine Geschichte wird geschrieben und eingesprochen – das kann ein paar Sekunden bis eine Minute dauern.</p>
    <div class="gen-progress" id="slProg" hidden aria-live="polite">
      <div class="gp-bar"><i id="slFill"></i></div>
      <p class="gp-row"><b id="slStep">Los geht's …</b><span id="slTime">0 s</span></p>
    </div>
    <p class="small err" id="slErr"></p>
  </section>`
  }
  ${
    mine.length
      ? `<section class="card sl-list"><h2>Deine langen Geschichten</h2>
    <ul>${mine
      .map(
        (st) => `<li><button type="button" class="sl-item" data-play="${esc(st.id)}"><span class="sl-i-ic">▶</span><span class="sl-i-t"><b>${esc(st.title)}</b><small>${esc(st.theme || "")} · ${new Date(st.createdAt).toLocaleDateString("de-DE")}</small></span></button></li>`
      )
      .join("")}</ul></section>`
      : ""
  }`;

  $app.querySelectorAll("[data-cat]").forEach(
    (b) =>
      (b.onclick = () => {
        prefs.category = b.dataset.cat;
        savePrefs();
        $app.querySelectorAll("[data-cat]").forEach((x) => {
          x.classList.toggle("on", x === b);
          x.setAttribute("aria-checked", x === b);
        });
      })
  );
  $app.querySelectorAll("[data-lvl]").forEach(
    (b) =>
      (b.onclick = () => {
        prefs.level = b.dataset.lvl;
        savePrefs();
        $app.querySelectorAll("[data-lvl]").forEach((x) => {
          x.classList.toggle("on", x === b);
          x.setAttribute("aria-pressed", x === b);
        });
      })
  );

  // gespeicherte Geschichte abspielen
  $app.querySelectorAll("[data-play]").forEach(
    (b) =>
      (b.onclick = async () => {
        const st = S.getState().stories.find((x) => x.id === b.dataset.play);
        if (!st) return;
        const ic = b.querySelector(".sl-i-ic");
        // Sofort im Tipp einen Player öffnen geht nur mit fertiger Datei – sonst kurz einsprechen
        const blob = await cachedAudio(st.id);
        if (blob) return openPlayer(st, blob);
        ic.textContent = "…";
        try {
          const made = await buildAudio(st, s.voicePreset, (p) => (ic.textContent = Math.round(p * 100) + "%"));
          ic.textContent = "▶";
          openPlayer(st, made);
        } catch (e) {
          ic.textContent = "▶";
          alertBox(e.message);
        }
      })
  );

  const go = document.getElementById("slGo");
  if (!go) return;
  go.onclick = async () => {
    const prog = document.getElementById("slProg");
    const fill = document.getElementById("slFill");
    const step = document.getElementById("slStep");
    const time = document.getElementById("slTime");
    const err = document.getElementById("slErr");
    err.textContent = "";
    go.disabled = true;
    go.textContent = "Wird erstellt …";
    prog.hidden = false;
    const t0 = Date.now();
    let phase = "write",
      ttsPart = 0;
    const tick = setInterval(() => {
      const sec = Math.round((Date.now() - t0) / 1000);
      time.textContent = `${sec} s`;
      if (phase === "write") {
        // Schreiben: geschätzt bis 60 %
        fill.style.width = `${Math.min(60, 6 + sec * 2)}%`;
        step.textContent = sec < 4 ? "Deine Wörter werden zusammengestellt" : sec < 12 ? "Die Handlung wird ausgedacht" : "Die Geschichte wird geschrieben";
      } else {
        fill.style.width = `${60 + ttsPart * 40}%`;
        step.textContent = `Die Geschichte wird eingesprochen (${Math.round(ttsPart * 100)} %)`;
      }
    }, 500);
    try {
      const cat = SLEEP_CATEGORIES[prefs.category] || SLEEP_CATEGORIES.ruhig;
      const data = await callApi("story", {
        sleep: true,
        category: prefs.category,
        level: prefs.level,
        words: words.map((w) => ({ en: w.en, de: w.de })),
        goal: s.goal || "",
      });
      const st = { ...normalizeStory(data, words), theme: `🌙 ${cat.de}`, sleep: true, category: prefs.category, level: prefs.level };
      // nur die Wörter, die wirklich vorkommen, zählen als „dran gewesen“ (die anderen kommen nächstes Mal zuerst)
      const used = markUsed(words, st.text);
      st.words = st.words.filter((w) => st.text.toLowerCase().includes(w.en.toLowerCase().replace(/^(to|the|a|an) /, "").slice(0, Math.max(3, w.en.length - 1))));
      st.usedCount = used;
      S.addStory(st, { count: false });
      phase = "tts";
      const blob = await buildAudio(st, s.voicePreset, (p) => (ttsPart = p));
      clearInterval(tick);
      fill.style.width = "100%";
      step.textContent = "Fertig – gute Nacht 🌙";
      go.disabled = false;
      go.textContent = "🌙 Noch eine Geschichte erstellen";
      // Kein Autostart möglich (iPhone erlaubt Ton nur nach einem Tipp) → großer Start-Knopf im Player
      const p = openPlayer(st, blob);
      if (p.audio.paused) p.audio.play().catch(() => {});
    } catch (e) {
      clearInterval(tick);
      prog.hidden = true;
      go.disabled = false;
      go.textContent = "🌙 Nochmal versuchen";
      err.textContent = e.message || "Das hat nicht geklappt. Bitte versuche es noch einmal.";
    }
  };
}

function alertBox(msg) {
  const el = document.getElementById("slErr");
  if (el) el.textContent = msg;
}
