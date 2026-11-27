// Toolbox: feste Satzbausteine pro Situation – als Ganzes lernen, sofort einsetzbar.
// Zuerst für Englisch; die Situationen passen zu den Gesprächen (gleiche Schlüssel).
import * as S from "./store.js";
import * as tts from "./tts.js";
import { L } from "./langs.js";
import { micBlock, bindMic } from "./practice.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const TOOLBOX = {
  en: [
    { key: "cafe", ic: "☕", label: "Im Café & Restaurant", goals: ["reise", "familie"], items: [
      ["Could I have a coffee, please?", "Könnte ich bitte einen Kaffee haben?"],
      ["I'd like to order, please.", "Ich möchte bitte bestellen."],
      ["What do you recommend?", "Was empfehlen Sie?"],
      ["Is this table free?", "Ist dieser Tisch frei?"],
      ["A table for two, please.", "Einen Tisch für zwei, bitte."],
      ["Can I see the menu, please?", "Kann ich bitte die Karte sehen?"],
      ["I'm allergic to nuts.", "Ich bin allergisch gegen Nüsse."],
      ["Could we have the bill, please?", "Könnten wir bitte die Rechnung haben?"],
      ["Can I pay by card?", "Kann ich mit Karte zahlen?"],
      ["Keep the change.", "Stimmt so."],
      ["It was delicious, thank you.", "Es war köstlich, danke."],
      ["To take away, please.", "Zum Mitnehmen, bitte."],
    ] },
    { key: "hotel", ic: "🏨", label: "Im Hotel", goals: ["reise", "job"], items: [
      ["I have a reservation under the name …", "Ich habe eine Reservierung auf den Namen …"],
      ["I'd like to check in, please.", "Ich möchte bitte einchecken."],
      ["What time is breakfast?", "Wann gibt es Frühstück?"],
      ["What's the Wi-Fi password?", "Wie lautet das WLAN-Passwort?"],
      ["Could I have another towel, please?", "Könnte ich bitte noch ein Handtuch haben?"],
      ["The air conditioning doesn't work.", "Die Klimaanlage funktioniert nicht."],
      ["Can I leave my luggage here?", "Kann ich mein Gepäck hier lassen?"],
      ["What time do I have to check out?", "Bis wann muss ich auschecken?"],
      ["Could you call a taxi for me?", "Könnten Sie mir ein Taxi rufen?"],
      ["Is there a lift?", "Gibt es einen Aufzug?"],
      ["I'd like a quiet room, please.", "Ich hätte gern ein ruhiges Zimmer."],
      ["Thank you for everything.", "Vielen Dank für alles."],
    ] },
    { key: "weg", ic: "🗺️", label: "Nach dem Weg fragen", goals: ["reise"], items: [
      ["Excuse me, can you help me?", "Entschuldigung, können Sie mir helfen?"],
      ["How do I get to the station?", "Wie komme ich zum Bahnhof?"],
      ["Is it far from here?", "Ist es weit von hier?"],
      ["Can I walk there?", "Kann ich zu Fuß dorthin gehen?"],
      ["Where is the nearest bus stop?", "Wo ist die nächste Bushaltestelle?"],
      ["Go straight on and turn left.", "Gehen Sie geradeaus und biegen Sie links ab."],
      ["It's on the right.", "Es ist auf der rechten Seite."],
      ["Which bus goes to the city centre?", "Welcher Bus fährt ins Stadtzentrum?"],
      ["A ticket to London, please.", "Eine Fahrkarte nach London, bitte."],
      ["Could you show me on the map?", "Könnten Sie es mir auf der Karte zeigen?"],
      ["Sorry, I'm lost.", "Entschuldigung, ich habe mich verlaufen."],
      ["Thanks, that's very kind.", "Danke, das ist sehr nett."],
    ] },
    { key: "einkauf", ic: "🛍️", label: "Einkaufen", goals: ["reise", "familie"], items: [
      ["How much is this?", "Wie viel kostet das?"],
      ["I'm just looking, thanks.", "Ich schaue nur, danke."],
      ["Do you have this in a bigger size?", "Haben Sie das eine Nummer größer?"],
      ["Can I try it on?", "Kann ich es anprobieren?"],
      ["Where are the changing rooms?", "Wo sind die Umkleidekabinen?"],
      ["I'll take it.", "Ich nehme es."],
      ["Do you have it in another colour?", "Haben Sie es in einer anderen Farbe?"],
      ["Can I get a receipt, please?", "Kann ich bitte einen Kassenbon bekommen?"],
      ["I'd like to return this.", "Ich möchte das zurückgeben."],
      ["Is there a discount?", "Gibt es einen Rabatt?"],
      ["Could I have a bag, please?", "Könnte ich bitte eine Tüte haben?"],
      ["Where can I find the milk?", "Wo finde ich die Milch?"],
    ] },
    { key: "arzt", ic: "🩺", label: "Beim Arzt & in der Apotheke", goals: ["reise", "familie"], items: [
      ["I don't feel well.", "Mir geht es nicht gut."],
      ["I have a headache.", "Ich habe Kopfschmerzen."],
      ["It hurts here.", "Es tut hier weh."],
      ["I've had a fever since yesterday.", "Ich habe seit gestern Fieber."],
      ["I need to see a doctor.", "Ich muss zu einem Arzt."],
      ["Do I need a prescription?", "Brauche ich ein Rezept?"],
      ["How often should I take it?", "Wie oft soll ich es nehmen?"],
      ["I'm allergic to penicillin.", "Ich bin allergisch gegen Penicillin."],
      ["Do you have something for a cold?", "Haben Sie etwas gegen eine Erkältung?"],
      ["Please call an ambulance.", "Bitte rufen Sie einen Krankenwagen."],
      ["Where is the nearest pharmacy?", "Wo ist die nächste Apotheke?"],
      ["I feel much better now.", "Mir geht es jetzt viel besser."],
    ] },
    { key: "smalltalk", ic: "💬", label: "Smalltalk", goals: ["reise", "job", "medien", "familie"], items: [
      ["Nice to meet you.", "Schön, dich kennenzulernen."],
      ["Where are you from?", "Woher kommst du?"],
      ["I'm from Germany.", "Ich komme aus Deutschland."],
      ["What do you do for a living?", "Was machst du beruflich?"],
      ["What do you do in your free time?", "Was machst du in deiner Freizeit?"],
      ["How was your weekend?", "Wie war dein Wochenende?"],
      ["Sorry, could you say that again?", "Entschuldigung, kannst du das noch einmal sagen?"],
      ["Could you speak a bit more slowly?", "Kannst du etwas langsamer sprechen?"],
      ["My English isn't perfect yet.", "Mein Englisch ist noch nicht perfekt."],
      ["That sounds great!", "Das klingt toll!"],
      ["I totally agree.", "Da stimme ich völlig zu."],
      ["It was nice talking to you.", "Es war schön, mit dir zu reden."],
    ] },
    { key: "job", ic: "💼", label: "Beruf & Meetings", goals: ["job"], items: [
      ["Let me introduce myself.", "Darf ich mich vorstellen?"],
      ["I work as a sales manager.", "Ich arbeite als Vertriebsleiter."],
      ["Could you send me an email about it?", "Könnten Sie mir dazu eine E-Mail schicken?"],
      ["Let's schedule a meeting.", "Lassen Sie uns einen Termin vereinbaren."],
      ["Does Tuesday work for you?", "Passt Ihnen Dienstag?"],
      ["Sorry, I'm running a bit late.", "Entschuldigung, ich verspäte mich etwas."],
      ["Could you explain that in more detail?", "Könnten Sie das genauer erklären?"],
      ["I'll get back to you tomorrow.", "Ich melde mich morgen bei Ihnen."],
      ["What's the deadline?", "Bis wann ist die Frist?"],
      ["I'd like to add something.", "Ich möchte noch etwas ergänzen."],
      ["Let's sum up.", "Fassen wir zusammen."],
      ["Thank you for your time.", "Vielen Dank für Ihre Zeit."],
    ] },
  ],
};

// Situationen für die aktuelle Sprache, passend zum Lernziel zuerst
export function situations() {
  const list = TOOLBOX[S.lang()] || [];
  const goal = S.getState().settings.goal || "";
  return [...list].sort((a, b) => (b.goals.includes(goal) ? 1 : 0) - (a.goals.includes(goal) ? 1 : 0));
}
export function phrasesFor(key) {
  return (TOOLBOX[S.lang()] || []).find((s) => s.key === key)?.items || [];
}

export function toolboxView($app, { settings, rateSlider, ICON }, key = "") {
  const say = (t) => tts.speak(t, { rate: settings().voiceRate, preset: settings().voicePreset });
  const list = situations();
  const header = `<header class="top"><a class="icon-btn plain" href="#/${key ? "toolbox" : "practice"}" aria-label="Zurück">${ICON.back}</a>
    <h1 class="h-sm">Toolbox</h1><span></span></header>`;
  if (!list.length) {
    $app.innerHTML = `${header}<section class="card"><h2>Bald verfügbar</h2><p>Die Toolbox gibt es bisher nur für Englisch.</p></section>`;
    return;
  }
  const sit = list.find((s) => s.key === key);
  if (!sit) {
    $app.innerHTML = `${header}
      <p class="listen-how">Fertige Sätze für typische Situationen. Lerne sie als Ganzes – damit kommst du sofort zurecht.</p>
      <div class="ef-tiles">${list.map((s) => `<a class="ef-tile" href="#/toolbox/${s.key}"><span class="ef-tic">${s.ic}</span><b>${esc(s.label)}</b><small>${s.items.length} Sätze</small></a>`).join("")}</div>`;
    return;
  }
  const has = (en) => !!S.findCard(en);
  $app.innerHTML = `${header}
    <p class="chat-scene">${sit.ic} <b>${esc(sit.label)}</b></p>
    ${rateSlider("", "")}
    <ul class="tb-list">${sit.items
      .map(
        ([en, de], i) => `<li class="tb-item">
          <div class="tb-text"><b>${esc(en)}</b><span>${esc(de)}</span></div>
          <div class="tb-acts">
            <button class="icon-btn" data-tsay="${i}" aria-label="Anhören">${ICON.speaker}</button>
            <button class="icon-btn" data-tadd="${i}" ${has(en) ? "disabled" : ""} aria-label="In den Wortschatz">${has(en) ? "✓" : "＋"}</button>
          </div>
          ${micBlock(en)}
        </li>`
      )
      .join("")}</ul>
    <a class="ef-btn ef-pri" href="#/chat/${sit.key}">Im Gespräch anwenden</a>`;
  $app.querySelectorAll("[data-tsay]").forEach((b) => (b.onclick = () => say(sit.items[+b.dataset.tsay][0])));
  $app.querySelectorAll("[data-tadd]").forEach(
    (b) =>
      (b.onclick = () => {
        const [en, de] = sit.items[+b.dataset.tadd];
        S.addCustomCard({ en, de, pos: "phrase", level: "A2", topic: "alltag", front: true });
        b.textContent = "✓";
        b.disabled = true;
      })
  );
  bindMic($app);
}
