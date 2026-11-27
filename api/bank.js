// Wortliste für eine neue Lernsprache erzeugen (nur für das Werkzeug tools/make-bank.py in GitHub Actions).
// POST { lang: "fr", rows: [[en, de, pos, level, topic, ex, exDe], …] }
// → { rows: [[wort, beispiel], …] } in derselben Reihenfolge.
// Schutz: Kopfzeile x-ww-sig = sha256(GOOGLE_TTS_KEY + ":bank") – den Schlüssel kennen nur Vercel und GitHub.
import { createHash } from "node:crypto";
import { callLLM, readBody, send, wrap, httpError, providerFrom } from "./_llm.js";
import { extractJson } from "../js/prompts.js";

const LANGS = {
  fr: "French (France). Nouns with the definite article (le, la, les; for l' add the gender in brackets, e.g. « l'école (f) »)",
  it: "Italian (Italy). Nouns with the definite article (il, lo, la, l', i, gli, le)",
  pt: "European Portuguese. Nouns with the definite article (o, a, os, as)",
};

function system(lang) {
  return `You are an expert lexicographer building a vocabulary trainer for German native speakers.
For each English entry you get the German meaning, part of speech, CEFR level, an English example sentence and its German translation.
Give the most natural equivalent in ${LANGS[lang]} that matches the GERMAN meaning, plus a short, natural example sentence in that language with the same meaning as the German example.
Rules:
- Everyday standard language, correct spelling and accents, typographic apostrophe-free (use ').
- Verbs in the infinitive; adjectives in the masculine singular.
- In the example, mark the word (in the form used) with single asterisks, e.g. Je *mange* une pomme.
- Keep the example short (max. 12 words) and at the given CEFR level.
- Output strict JSON only: {"r":[["word","example"], …]} – exactly one pair per input line, same order.`;
}

export default wrap(async (req, res) => {
  if (req.method !== "POST") throw httpError(405, "Nur POST erlaubt");
  const key = process.env.GOOGLE_TTS_KEY || "";
  const sig = createHash("sha256").update(key + ":bank").digest("hex");
  if (!key || req.headers["x-ww-sig"] !== sig) throw httpError(403, "Nicht erlaubt");
  const body = await readBody(req);
  const lang = String(body.lang || "");
  if (!LANGS[lang]) throw httpError(400, "Sprache nicht unterstützt");
  const rows = (Array.isArray(body.rows) ? body.rows : []).slice(0, 50);
  if (!rows.length) throw httpError(400, "Keine Zeilen");
  const user = rows
    .map((r, i) => `${i + 1}. ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[5]} | ${r[6]}`.replace(/\*/g, ""))
    .join("\n");
  const text = await callLLM({ ...providerFrom({}), model: body.model === "lite" ? "gemini-flash-lite-latest" : "gemini-flash-latest" }, system(lang), user, 6000);
  const d = extractJson(text);
  const out = Array.isArray(d?.r) ? d.r : [];
  if (out.length !== rows.length) throw httpError(502, `Antwort hat ${out.length} statt ${rows.length} Zeilen`);
  return send(res, 200, { rows: out.map((x) => [String(x[0] || "").trim(), String(x[1] || "").trim()]) });
});
