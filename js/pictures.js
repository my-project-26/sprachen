// Bilder (Emoji) für greifbare Wörter – sprachunabhängig über die deutsche Bedeutung
// bzw. das englische Stichwort. Nur Wörter, bei denen ein Bild die Bedeutung eindeutig zeigt.
const EN = {
  // Essen & Trinken
  coffee: "☕", tea: "🍵", milk: "🥛", juice: "🧃", beer: "🍺", wine: "🍷", bread: "🍞", butter: "🧈", cheese: "🧀", egg: "🥚",
  meat: "🥩", chicken: "🍗", fish: "🐟", rice: "🍚", pasta: "🍝", potato: "🥔", salad: "🥗", soup: "🍲", fruit: "🍓", vegetable: "🥦",
  apple: "🍎", banana: "🍌", tomato: "🍅", carrot: "🥕", onion: "🧅", sugar: "🍬", salt: "🧂", cake: "🍰", chocolate: "🍫",
  "ice cream": "🍦", sandwich: "🥪", pizza: "🍕", breakfast: "🍳", lunch: "🍱", dinner: "🍽️", restaurant: "🍽️", "café": "☕", cafe: "☕",
  cup: "☕", glass: "🥛", bottle: "🍾", plate: "🍽️", fork: "🍴", spoon: "🥄", knife: "🔪", bowl: "🥣", beef: "🥩", pork: "🥓",
  sausage: "🌭", ham: "🍖", steak: "🥩", seafood: "🦐", beans: "🫘", peas: "🫛", cucumber: "🥒", garlic: "🧄", mushroom: "🍄",
  lemon: "🍋", orange: "🍊", pear: "🍐", grapes: "🍇", strawberry: "🍓", cherry: "🍒", nut: "🥜", oil: "🫒", honey: "🍯",
  jam: "🍓", cereal: "🥣", yoghurt: "🥛", biscuit: "🍪", sweets: "🍬", crisps: "🥔", chips: "🍟", "soft drink": "🥤", kitchen: "🍳",
  pan: "🍳", pot: "🍲", picnic: "🧺", pepper: "🌶️", flour: "🌾", oven: "♨️", fridge: "🧊", snack: "🥨", dessert: "🍮", menu: "📋",
  waiter: "🤵", bill: "🧾", receipt: "🧾", recipe: "📖", meal: "🍽️", slice: "🍕", takeaway: "🥡", chef: "👨‍🍳", cook: "👩‍🍳",
  // Familie & Menschen
  family: "👨‍👩‍👧", mother: "👩", father: "👨", mum: "👩", dad: "👨", brother: "👦", sister: "👧", son: "👦", daughter: "👧",
  child: "🧒", children: "👧", baby: "👶", husband: "🤵", wife: "👰", grandmother: "👵", grandfather: "👴", grandparents: "👴",
  friend: "🧑‍🤝‍🧑", "best friend": "🧑‍🤝‍🧑", boyfriend: "💑", girlfriend: "💑", man: "👨", woman: "👩", boy: "👦", girl: "👧",
  people: "👥", person: "🧑", twin: "👯", wedding: "💒", birthday: "🎂", couple: "💑", teenager: "🧑", adult: "🧑", guest: "🛎️",
  // Körper & Gesundheit
  body: "🧍", head: "🗣️", face: "🙂", eye: "👁️", ear: "👂", nose: "👃", mouth: "👄", hair: "💇", hand: "✋", arm: "💪", leg: "🦵",
  foot: "🦶", tooth: "🦷", lips: "👄", finger: "☝️", neck: "🧣", knee: "🦵", heart: "❤️", skin: "🖐️", blood: "🩸", stomach: "🫃",
  doctor: "🧑‍⚕️", nurse: "👩‍⚕️", hospital: "🏥", medicine: "💊", pill: "💊", tablet: "💊", ambulance: "🚑", plaster: "🩹",
  headache: "🤕", toothache: "🦷", fever: "🤒", cough: "😷", cold: "🤧", flu: "🤒", dentist: "🦷", sleep: "😴", injury: "🤕",
  // Tiere & Natur
  dog: "🐕", cat: "🐈", pet: "🐾", bird: "🐦", horse: "🐎", cow: "🐄", pig: "🐖", sheep: "🐑", mouse: "🐁", bee: "🐝", spider: "🕷️",
  snake: "🐍", rabbit: "🐇", duck: "🦆", lion: "🦁", tiger: "🐅", elephant: "🐘", monkey: "🐒", insect: "🐞", zoo: "🦒", farm: "🚜",
  weather: "🌤️", sun: "☀️", rain: "🌧️", wind: "💨", sky: "🌌", tree: "🌳", flower: "🌸", plant: "🪴", grass: "🌱", leaf: "🍃",
  cloud: "☁️", storm: "⛈️", thunder: "⚡", lightning: "⚡", snow: "❄️", ice: "🧊", fog: "🌫️", sea: "🌊", ocean: "🌊", wave: "🌊",
  beach: "🏖️", sand: "🏖️", stone: "🪨", rock: "🪨", mountain: "⛰️", hill: "⛰️", forest: "🌲", wood: "🪵", river: "🏞️", lake: "🏞️",
  island: "🏝️", earth: "🌍", world: "🌍", moon: "🌙", star: "⭐", field: "🌾", valley: "🏞️", coast: "🏖️", nature: "🌿",
  spring: "🌷", summer: "☀️", autumn: "🍂", winter: "⛄", temperature: "🌡️",
  // Kleidung & Einkaufen
  clothes: "👕", "T-shirt": "👕", shirt: "👔", jeans: "👖", trousers: "👖", dress: "👗", skirt: "👗", shoe: "👟", trainers: "👟",
  boots: "🥾", boot: "🥾", hat: "🎩", cap: "🧢", sock: "🧦", jacket: "🧥", coat: "🧥", sweater: "🧶", tie: "👔", scarf: "🧣",
  gloves: "🧤", belt: "👖", watch: "⌚", ring: "💍", jewellery: "💎", glasses: "👓", umbrella: "☂️", bag: "👜", wallet: "👛",
  purse: "👛", money: "💶", euro: "💶", pound: "💷", dollar: "💵", coin: "🪙", cash: "💵", "credit card": "💳", card: "💳",
  shop: "🏪", supermarket: "🛒", shopping: "🛍️", "shopping centre": "🏬", "department store": "🏬", bakery: "🥐", market: "🏪",
  price: "🏷️", sale: "🏷️", discount: "🏷️", "special offer": "🏷️", key: "🔑", battery: "🔋", envelope: "✉️", stamp: "📮",
  parcel: "📦", box: "📦", "post office": "🏤", gift: "🎁", present: "🎁", toy: "🧸",
  // Freizeit
  sport: "⚽", football: "⚽", tennis: "🎾", music: "🎵", song: "🎶", film: "🎬", movie: "🎬", book: "📕", game: "🎲", ball: "⚽",
  guitar: "🎸", piano: "🎹", drum: "🥁", camera: "📷", photo: "📷", photograph: "📷", photography: "📷", ticket: "🎫",
  concert: "🎤", festival: "🎪", party: "🎉", cinema: "🎦", theatre: "🎭", museum: "🏛️", gallery: "🖼️", painting: "🖼️",
  picture: "🖼️", art: "🎨", artist: "🧑‍🎨", singer: "🎤", actor: "🎭", actress: "🎭", cycling: "🚴", running: "🏃", jogging: "🏃",
  skiing: "⛷️", fishing: "🎣", camping: "🏕️", hiking: "🥾", swimming: "🏊", "swimming pool": "🏊", dancing: "💃", reading: "📖",
  gym: "🏋️", team: "👥", prize: "🏆", champion: "🏆", goal: "🥅", race: "🏁", chess: "♟️", puzzle: "🧩", cards: "🃏",
  "video game": "🎮", comic: "💬", love: "❤️", surprise: "🎉", tears: "😢", fun: "😄",
  // Reisen & Verkehr
  car: "🚗", bus: "🚌", taxi: "🚕", train: "🚆", tram: "🚋", bike: "🚲", bicycle: "🚲", motorbike: "🏍️", lorry: "🚚", ship: "🚢",
  boat: "⛵", ferry: "⛴️", plane: "✈️", flight: "✈️", airport: "🛫", station: "🚉", "bus stop": "🚏", road: "🛣️", motorway: "🛣️",
  street: "🛣️", bridge: "🌉", "traffic lights": "🚦", traffic: "🚗", "petrol station": "⛽", petrol: "⛽", "car park": "🅿️",
  underground: "🚇", platform: "🚉", passport: "🛂", suitcase: "🧳", luggage: "🧳", backpack: "🎒", map: "🗺️", hotel: "🏨",
  holiday: "🏖️", tourist: "📸", postcard: "💌", castle: "🏰", church: "⛪", souvenir: "🎁", "sun cream": "🧴", tent: "⛺",
  "police officer": "👮", police: "👮", "police station": "🚓", "driving licence": "🪪", roundabout: "🔄", compass: "🧭",
  // Haus & Wohnen
  house: "🏠", home: "🏡", flat: "🏢", apartment: "🏢", building: "🏢", room: "🚪", bedroom: "🛏️", bathroom: "🛁", "living room": "🛋️",
  door: "🚪", window: "🪟", wall: "🧱", table: "🪑", chair: "🪑", bed: "🛏️", sofa: "🛋️", armchair: "🛋️", lamp: "💡", toilet: "🚽",
  television: "📺", TV: "📺", clock: "🕰️", mirror: "🪞", pillow: "🛏️", blanket: "🛏️", towel: "🧺", bath: "🛁", shower: "🚿",
  roof: "🏠", garage: "🚗", garden: "🏡", balcony: "🌇", stairs: "🪜", lift: "🛗", fence: "🚧", furniture: "🛋️", cupboard: "🗄️",
  shelf: "📚", carpet: "🧶", curtain: "🪟", rubbish: "🗑️", bin: "🗑️", tap: "🚰", "washing machine": "🧺", heating: "🔥",
  village: "🏘️", town: "🏙️", city: "🌆", countryside: "🌾", library: "📚", school: "🏫", university: "🎓", office: "🏢", factory: "🏭",
  bank: "🏦",
  // Schule, Arbeit, Technik
  pen: "🖊️", pencil: "✏️", paper: "📄", notebook: "📓", ruler: "📏", rubber: "🧽", dictionary: "📖", homework: "📝", exam: "📝",
  test: "📝", teacher: "🧑‍🏫", student: "🧑‍🎓", pupil: "🧒", classroom: "🏫", maths: "➗", science: "🔬", chemistry: "🧪",
  history: "📜", geography: "🌍", computer: "💻", laptop: "💻", keyboard: "⌨️", screen: "🖥️", phone: "📱", "mobile phone": "📱",
  telephone: "☎️", email: "📧", message: "💬", letter: "✉️", newspaper: "📰", news: "📰", magazine: "📰", radio: "📻",
  headphones: "🎧", speaker: "🔊", internet: "🌐", website: "🌐", password: "🔒", printer: "🖨️", document: "📄", desk: "🗄️",
  meeting: "👥", boss: "👔", job: "💼", business: "💼", farmer: "🧑‍🌾", pilot: "🧑‍✈️", mechanic: "🧑‍🔧", engineer: "🧑‍🔧",
  scientist: "🧑‍🔬", worker: "👷", machine: "⚙️", app: "📱", video: "🎥",
  // Zeit
  morning: "🌅", evening: "🌆", night: "🌙", weekend: "🎉", calendar: "📅", hour: "⏰", minute: "⏱️", time: "⏰",
};

// Für andere Lernsprachen: über die deutsche Bedeutung (erzeugt aus der englischen Wortliste)
const DE = {"gepäck":"🧳","buchen":"📕","zelt":"⛺","paar":"💑","geschenk":"🎁","erwachsene":"🧑","gast":"🛎️","kleidung":"👕","jacke":"🧥","mantel":"🧥","hose":"👖","hemd":"👔","pullover":"🧶","krawatte":"👔","schal":"🧣","handschuhe":"🧤","knie":"🦵","magen":"🫃","haut":"🖐️","herz":"❤️","zwilling":"👯","hochzeit":"💒","geburtstag":"🎂","schauer":"🚿","nebel":"🌫️","schnee":"❄️","eis":"🧊","brücke":"🌉","gebäude":"🏢","bücherei":"📚","dorf":"🏘️","land":"🌾","schlüssel":"🔑","geldbörse":"👛","regenschirm":"☂️","brille":"👓","batterie":"🔋","briefumschlag":"✉️","briefmarke":"📮","job":"💼","chef":"👔","besprechung":"👥","büro":"🏢","prüfung":"📝","universität":"🎓","hausaufgaben":"📝","wörterbuch":"📖","student":"🧑‍🎓","messer":"🔪","insekt":"🐞","see":"🏞️","fluss":"🏞️","wald":"🌲","hügel":"⛰️","tal":"🏞️","berg":"⛰️","decke":"🛏️","blitz":"⚡","stiefel":"🥾","kompass":"🧭","teenager":"🧑","beleg":"🧾","bargeld":"💵","rabatt":"🏷️","ausverkauf":"🏷️","preis":"🏷️","paket":"📦","einkaufszentrum":"🏬","post":"🏤","rezept":"📖","mahlzeit":"🍽️","nachtisch":"🍮","rechnung":"🧾","kellner":"🤵","speisekarte":"📋","scheibe":"🍕","pfeffer":"🌶️","mehl":"🌾","backofen":"♨️","kühlschrank":"🧊","snack":"🥨","essen zum mitnehmen":"🥡","wandern":"🥾","fotografie":"📷","fitnessstudio":"🏋️","mannschaft":"👥","galerie":"🖼️","konzert":"🎤","festival":"🎪","schwimmbad":"🏊","joggen":"🏃","eintrittskarte":"🎫","verletzung":"🤕","husten":"😷","erkältung":"🤧","grippe":"🤒","fieber":"🤒","medizin":"💊","tablette":"💊","krankenpfleger":"👩‍⚕️","krankenwagen":"🚑","blut":"🩸","pflaster":"🩹","schlaf":"😴","zahnarzt":"🦷","nachrichten":"📰","zeitung":"📰","zeitschrift":"📰","nachricht":"💬","website":"🌐","passwort":"🔒","partei":"🎉","fahrrad":"🚲","ampel":"🚦","polizist":"👮","fähre":"⛴️","küste":"🏖️","flug":"✈️","reisepass":"🛂","andenken":"🎁","koffer":"🧳","tourist":"📸","rucksack":"🎒","strand":"🏖️","urlaub":"🏖️","karte":"🗺️","temperatur":"🌡️","natur":"🌿","pflanze":"🪴","ozean":"🌊","sturm":"⛈️","verkehr":"🚗","autobahn":"🛣️","führerschein":"🪪","benzin":"⛽","tankstelle":"⛽","parkplatz":"🅿️","bahnsteig":"🚉","u-bahn":"🚇","kreisverkehr":"🔄","markt":"🏪","münze":"🪙","kreditkarte":"💳","ingenieur":"🧑‍🔧","wissenschaftler":"🧑‍🔬","computer":"💻","bildschirm":"🖥️","maschine":"⚙️","app":"📱","wohnung":"🏢","möbel":"🛋️","schrank":"🗄️","regal":"📚","teppich":"🧶","treppe":"🪜","balkon":"🌇","garten":"🏡","heizung":"🔥","waschmaschine":"🧺","müll":"🗑️","mülleimer":"🗑️","wasserhahn":"🚰","lehrer":"🧑‍🏫","landwirt":"🧑‍🌾","e-mail":"📧","arbeiter":"👷","fabrik":"🏭","koch":"👨‍🍳","mechaniker":"🧑‍🔧","pilot":"🧑‍✈️","geschäft":"💼","schreibtisch":"🗄️","drucker":"🖨️","dokument":"📄","schule":"🏫","kuli":"🖊️","bleistift":"✏️","papier":"📄","test":"📝","mathe":"➗","geschichte":"📜","erdkunde":"🌍","naturwissenschaft":"🔬","chemie":"🧪","klassenzimmer":"🏫","schüler":"🧒","heft":"📓","radiergummi":"🧽","lineal":"📏","laden":"🏪","supermarkt":"🛒","geld":"💶","euro":"💶","pfund":"💷","einkaufen":"🛍️","t-shirt":"👕","jeans":"👖","kleid":"👗","rock":"👗","schuh":"👟","hut":"🎩","socke":"🧦","bank":"🏦","sonderangebot":"🏷️","bäckerei":"🥐","kaufhaus":"🏬","turnschuhe":"👟","kappe":"🧢","gürtel":"👖","armbanduhr":"⌚","schmuck":"💎","ring":"💍","kaffee":"☕","tee":"🍵","milch":"🥛","saft":"🧃","bier":"🍺","wein":"🍷","brot":"🍞","butter":"🧈","käse":"🧀","ei":"🥚","fleisch":"🥩","hähnchen":"🍗","fisch":"🐟","reis":"🍚","nudeln":"🍝","kartoffel":"🥔","salat":"🥗","suppe":"🍲","obst":"🍓","gemüse":"🥦","apfel":"🍎","banane":"🍌","tomate":"🍅","karotte":"🥕","zwiebel":"🧅","zucker":"🍬","salz":"🧂","kuchen":"🍰","schokolade":"🍫","belegtes brot":"🥪","pizza":"🍕","frühstück":"🍳","mittagessen":"🍱","abendessen":"🍽️","restaurant":"🍽️","café":"☕","tasse":"☕","glas":"🥛","flasche":"🍾","teller":"🍽️","gabel":"🍴","löffel":"🥄","schüssel":"🥣","rindfleisch":"🥩","schweinefleisch":"🥓","wurst":"🌭","schinken":"🍖","steak":"🥩","meeresfrüchte":"🦐","bohnen":"🫘","erbsen":"🫛","gurke":"🥒","knoblauch":"🧄","pilz":"🍄","zitrone":"🍋","orange":"🍊","birne":"🍐","weintrauben":"🍇","erdbeere":"🍓","kirsche":"🍒","nuss":"🥜","öl":"🫒","honig":"🍯","marmelade":"🍓","müsli":"🥣","joghurt":"🥛","keks":"🍪","süßigkeiten":"🍬","chips":"🥔","pommes":"🍟","erfrischungsgetränk":"🥤","küche":"🍳","pfanne":"🍳","topf":"🍲","picknick":"🧺","familie":"👨‍👩‍👧","mutter":"👩","vater":"👨","mama":"👩","papa":"👨","bruder":"👦","schwester":"👧","sohn":"👦","tochter":"👧","kind":"🧒","kinder":"👧","baby":"👶","ehemann":"🤵","ehefrau":"👰","großmutter":"👵","großvater":"👴","großeltern":"👴","freund":"🧑‍🤝‍🧑","freundin":"💑","mann":"👨","frau":"👩","junge":"👦","mädchen":"👧","leute":"👥","person":"🧑","körper":"🧍","kopf":"🗣️","gesicht":"🙂","auge":"👁️","ohr":"👂","nase":"👃","mund":"👄","haare":"💇","hand":"✋","arm":"💪","bein":"🦵","fuß":"🦶","hund":"🐕","katze":"🐈","haustier":"🐾","hals":"🧣","finger":"☝️","zahn":"🦷","lippen":"👄","beste freund":"🧑‍🤝‍🧑","sport":"⚽","fußball":"⚽","tennis":"🎾","musik":"🎵","lied":"🎶","film":"🎬","buch":"📕","spiel":"🎲","ball":"⚽","gitarre":"🎸","klavier":"🎹","kamera":"📷","spaß":"😄","tor":"🥅","rennen":"🏁","meister":"🏆","radfahren":"🚴","laufen":"🏃","skifahren":"⛷️","angeln":"🎣","camping":"🏕️","sänger":"🎤","trommel":"🥁","kunst":"🎨","künstler":"🧑‍🎨","gemälde":"🖼️","schauspieler":"🎭","schauspielerin":"🎭","comic":"💬","trainieren":"🚆","spielzeug":"🧸","karten":"🃏","schach":"♟️","rätsel":"🧩","videospiel":"🎮","liebe":"❤️","überraschung":"🎉","tränen":"😢","arzt":"🧑‍⚕️","krankenhaus":"🏥","kopfschmerzen":"🤕","zahnschmerzen":"🦷","stunde":"⏰","minute":"⏱️","zeit":"⏰","morgen":"🌅","abend":"🌆","nacht":"🌙","wochenende":"🎉","frühling":"🌷","sommer":"☀️","herbst":"🍂","winter":"⛄","fernseher":"📺","telefon":"☎️","tanzen":"💃","schwimmen":"🏊","lesen":"📖","polizei":"👮","dollar":"💵","kofferraum":"🥾","handy":"📱","internet":"🌐","radio":"📻","brief":"✉️","laptop":"💻","tastatur":"⌨️","foto":"📷","video":"🎥","kopfhörer":"🎧","lautsprecher":"🔊","hotel":"🏨","meer":"🌊","flughafen":"🛫","flugzeug":"✈️","welt":"🌍","postkarte":"💌","museum":"🏛️","burg":"🏰","kirche":"⛪","insel":"🏝️","sonnencreme":"🧴","wetter":"🌤️","sonne":"☀️","regen":"🌧️","wind":"💨","himmel":"🌌","baum":"🌳","vogel":"🐦","pferd":"🐎","kuh":"🐄","schwein":"🐖","schaf":"🐑","maus":"🐁","donner":"⚡","wolke":"☁️","feld":"🌾","holz":"🪵","welle":"🌊","sand":"🏖️","stein":"🪨","fels":"🪨","gras":"🌱","blatt":"🍃","erde":"🌍","mond":"🌙","stern":"⭐","biene":"🐝","spinne":"🕷️","schlange":"🐍","kaninchen":"🐇","ente":"🦆","löwe":"🦁","tiger":"🐅","elefant":"🐘","affe":"🐒","zoo":"🦒","bauernhof":"🚜","auto":"🚗","bus":"🚌","taxi":"🚕","bahnhof":"🚉","straße":"🛣️","straßenbahn":"🚋","motorrad":"🏍️","lastwagen":"🚚","schiff":"🚢","boot":"⛵","bushaltestelle":"🚏","polizeiwache":"🚓","kino":"🎦","theater":"🎭","haus":"🏠","zuhause":"🏡","zimmer":"🚪","schlafzimmer":"🛏️","badezimmer":"🛁","wohnzimmer":"🛋️","tür":"🚪","fenster":"🪟","wand":"🧱","tisch":"🪑","stuhl":"🪑","bett":"🛏️","sofa":"🛋️","lampe":"💡","toilette":"🚽","uhr (wand-":"🕰️","bild":"🖼️","kiste":"📦","tasche":"👜","sessel":"🛋️","vorhang":"🪟","spiegel":"🪞","kopfkissen":"🛏️","handtuch":"🧺","badewanne":"🛁","dach":"🏠","garage":"🚗","aufzug":"🛗","zaun":"🚧","blume":"🌸","kleinstadt":"🏙️","stadt":"🌆"};
const deKey = (g) =>
  String(g || "")
    .split(/[;,]/)[0]
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/^(der|die|das|ein|eine|sich) /, "")
    .trim();

export function pictureFor(card) {
  if (!card) return "";
  const en = String(card.en || "").trim();
  return EN[en] || EN[en.toLowerCase()] || EN[en.replace(/^(a|an|the|to)\s+/i, "")] || DE[deKey(card.de)] || "";
}
