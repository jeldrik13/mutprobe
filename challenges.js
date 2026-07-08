// Challenge-Datenbank für Mutprobe
// Jede Challenge: id, track, stufe (1-3), text, tipp (optional), korbMoeglich

const TRACKS = {
  dating: {
    name: "Dating-Mut",
    beschreibung: "Ansprechangst abbauen – Schritt für Schritt, mit Neugier statt Anmachsprüchen.",
  },
  smalltalk: {
    name: "Small Talk",
    beschreibung: "Leichter ins Gespräch kommen – mit Fremden, Kolleg:innen, überall.",
  },
  grenzen: {
    name: "Selbstbehauptung",
    beschreibung: "Nein sagen, Wünsche äußern, für dich einstehen.",
  },
};

const CHALLENGES = [
  // ── Dating-Mut · Stufe 1 ──────────────────────────────
  { id: "d1a", track: "dating", stufe: 1, text: "Halte heute mit drei fremden Menschen kurz freundlichen Blickkontakt und lächle.", tipp: "Es geht nicht um Reaktionen – nur ums Aushalten des Moments.", korbMoeglich: false },
  { id: "d1b", track: "dating", stufe: 1, text: "Wünsch einer Person an der Kasse, im Café oder im Bus ehrlich einen schönen Tag.", tipp: "Kurz, freundlich, weitergehen. Mehr nicht.", korbMoeglich: false },
  { id: "d1c", track: "dating", stufe: 1, text: "Grüße heute fünf fremde Menschen zuerst – bevor sie dich grüßen.", tipp: "Spaziergang, Hausflur, Supermarkt – überall möglich.", korbMoeglich: false },
  { id: "d1d", track: "dating", stufe: 1, text: "Stell dich für 60 Sekunden an einen belebten Ort und beobachte, wie wenig sich die Leute für dich interessieren.", tipp: "Spoiler: niemand schaut. Das ist die gute Nachricht.", korbMoeglich: false },
  { id: "d1e", track: "dating", stufe: 1, text: "Setz dich allein in ein Café – ohne Handy. 15 Minuten nur da sein und beobachten.", tipp: "Sichtbar sein aushalten ist die Grundlage von allem.", korbMoeglich: false },
  { id: "d1f", track: "dating", stufe: 1, text: "Sag im Vorbeigehen zu jemandem mit Hund: „Schöner Hund.“ Und geh weiter.", tipp: "Hundebesitzer:innen hören das gern. Null Risiko, voller Trainingseffekt.", korbMoeglich: false },
  // ── Dating-Mut · Stufe 2 ──────────────────────────────
  { id: "d2a", track: "dating", stufe: 2, text: "Frag eine fremde Person nach einer Empfehlung: bestes Café der Gegend, ein Buch, ein Song.", tipp: "Menschen empfehlen gern Dinge. Du machst ihnen sogar eine Freude.", korbMoeglich: true },
  { id: "d2b", track: "dating", stufe: 2, text: "Mach einer fremden Person ein ehrliches, konkretes Kompliment – über Stil, Ausstrahlung oder etwas, das sie gerade tut.", tipp: "Ehrlich und konkret schlägt glatt und auswendig. Danach darfst du gehen.", korbMoeglich: true },
  { id: "d2c", track: "dating", stufe: 2, text: "Stell jemandem, den du interessant findest, eine echte Frage – etwas, das dich wirklich interessiert.", tipp: "Neugier ist attraktiver als jeder Spruch.", korbMoeglich: true },
  { id: "d2d", track: "dating", stufe: 2, text: "Bleib nach einem kurzen Wortwechsel bewusst 30 Sekunden länger im Gespräch, statt sofort zu flüchten.", tipp: "Die Stille aushalten. Sie ist fast nie so lang, wie sie sich anfühlt.", korbMoeglich: true },
  // ── Dating-Mut · Stufe 3 ──────────────────────────────
  { id: "d3a", track: "dating", stufe: 3, text: "Sprich eine Person an, die du interessant findest, und sag ehrlich: „Ich wollte dich einfach kurz kennenlernen.“", tipp: "Ehrlichkeit ist die mutigste und sympathischste Strategie, die es gibt.", korbMoeglich: true },
  { id: "d3b", track: "dating", stufe: 3, text: "Wenn ein Gespräch gut läuft: Frag nach der Nummer oder schlag vor, mal einen Kaffee zu trinken.", tipp: "Ein Nein ändert nichts an deinem Wert. Es füllt nur deine Korb-Sammlung.", korbMoeglich: true },
  { id: "d3c", track: "dating", stufe: 3, text: "Geh heute gezielt an einen Ort, an dem man ins Gespräch kommt (Kurs, Bar, Event) – und sprich dort eine Person an.", tipp: "Der Kontext macht es leichter. Du musst nicht auf der Straße anfangen.", korbMoeglich: true },
  { id: "d3d", track: "dating", stufe: 3, text: "Königsdisziplin: Hol dir absichtlich einen Korb. Frag nach etwas, bei dem ein Nein wahrscheinlich ist – und überlebe es.", tipp: "Wer das Nein nicht mehr fürchtet, ist frei.", korbMoeglich: true },

  // ── Small Talk · Stufe 1 ──────────────────────────────
  { id: "s1a", track: "smalltalk", stufe: 1, text: "Grüße heute fünf Menschen zuerst – Nachbarn, Kolleg:innen, Fremde.", tipp: "Zuerst grüßen heißt: du bestimmst den Ton.", korbMoeglich: false },
  { id: "s1b", track: "smalltalk", stufe: 1, text: "Stell an der Haltestelle, im Aufzug oder in der Schlange eine harmlose Frage.", tipp: "Situative Fragen sind der leichteste Einstieg der Welt.", korbMoeglich: false },
  { id: "s1c", track: "smalltalk", stufe: 1, text: "Bedanke dich heute einmal ausführlicher als nötig – mit einem ganzen Satz statt nur „Danke“.", tipp: "„Danke, das hat mir echt geholfen“ öffnet Türen.", korbMoeglich: false },
  { id: "s1d", track: "smalltalk", stufe: 1, text: "Frag im Supermarkt eine:n Mitarbeiter:in, wo etwas steht – auch wenn du es eigentlich weißt.", tipp: "Trainiert das Ansprechen ohne jedes Risiko.", korbMoeglich: false },
  { id: "s1e", track: "smalltalk", stufe: 1, text: "Halte jemandem die Tür auf und sag einen Satz dazu – mehr als nur ein Nicken.", tipp: "„Bitte sehr, heute ist Service.“ Ein Lächeln reicht auch.", korbMoeglich: false },
  // ── Small Talk · Stufe 2 ──────────────────────────────
  { id: "s2a", track: "smalltalk", stufe: 2, text: "Führe ein Gespräch von mindestens zwei Minuten mit einer Person, die du nicht kennst.", tipp: "Frage, Nachfrage, etwas von dir erzählen. Das ist die ganze Formel.", korbMoeglich: true },
  { id: "s2b", track: "smalltalk", stufe: 2, text: "Erzähl heute jemandem eine kleine Geschichte von dir, statt nur Fragen zu beantworten.", tipp: "Small Talk wird gut, wenn du etwas von dir zeigst.", korbMoeglich: false },
  { id: "s2c", track: "smalltalk", stufe: 2, text: "Sprich eine Person auf etwas an, das sie bei sich trägt: Buch, Band-Shirt, Hund, Sportzeug.", tipp: "Gemeinsame Anknüpfungspunkte machen 80 Prozent der Arbeit.", korbMoeglich: true },
  // ── Small Talk · Stufe 3 ──────────────────────────────
  { id: "s3a", track: "smalltalk", stufe: 3, text: "Erzähl in einer Gruppe (Pause, Feier, Treffen) eine Anekdote – und halte die Aufmerksamkeit aus.", tipp: "Kurz und mit Pointe. Wenn keiner lacht: Bonus fürs Aushalten.", korbMoeglich: true },
  { id: "s3b", track: "smalltalk", stufe: 3, text: "Geh allein zu einer Veranstaltung und komm dort mit mindestens zwei Menschen ins Gespräch.", tipp: "Allein hingehen ist der Cheat-Code: Man muss reden – und es funktioniert.", korbMoeglich: true },
  { id: "s3c", track: "smalltalk", stufe: 3, text: "Stell einer Person eine überraschend tiefe Frage: „Was war der beste Moment deiner Woche?“", tipp: "Menschen lieben es, das erzählen zu dürfen. Fast niemand fragt sie.", korbMoeglich: true },

  // ── Selbstbehauptung · Stufe 1 ────────────────────────
  { id: "g1a", track: "grenzen", stufe: 1, text: "Sag heute einmal „Nein“ – ohne Begründung, ohne Entschuldigung.", tipp: "„Nein, das passt mir nicht.“ Der Satz ist vollständig.", korbMoeglich: false },
  { id: "g1b", track: "grenzen", stufe: 1, text: "Äußere einen kleinen Wunsch, den du sonst runterschlucken würdest.", tipp: "Kleine Wünsche äußern trainiert den Muskel für die großen.", korbMoeglich: false },
  { id: "g1c", track: "grenzen", stufe: 1, text: "Korrigiere heute einmal freundlich, wenn etwas nicht stimmt – falscher Name, falsche Bestellung, falsche Info.", tipp: "Freundlich und klar geht gleichzeitig. Versprochen.", korbMoeglich: false },
  { id: "g1d", track: "grenzen", stufe: 1, text: "Bestell etwas anderes als sonst – und stell dazu eine Frage.", tipp: "Gewohnheiten brechen im Kleinen macht Mut fürs Große.", korbMoeglich: false },
  { id: "g1e", track: "grenzen", stufe: 1, text: "Sag heute in einem Gespräch einmal ehrlich: „Das weiß ich nicht.“", tipp: "Nichtwissen zugeben ist Selbstsicherheit in Reinform.", korbMoeglich: false },
  // ── Selbstbehauptung · Stufe 2 ────────────────────────
  { id: "g2a", track: "grenzen", stufe: 2, text: "Gib etwas zurück oder reklamiere etwas, das nicht in Ordnung war.", tipp: "Du bist nicht anstrengend. Du nimmst dich ernst.", korbMoeglich: true },
  { id: "g2b", track: "grenzen", stufe: 2, text: "Frag heute nach einem Rabatt oder einem Extra – einfach, weil Fragen erlaubt ist.", tipp: "Das Nein ist hier eingeplant und tut nicht weh.", korbMoeglich: true },
  { id: "g2c", track: "grenzen", stufe: 2, text: "Sprich eine kleine Unstimmigkeit direkt an, statt sie auszusitzen.", tipp: "„Mir ist aufgefallen, dass … können wir kurz darüber reden?“", korbMoeglich: false },
  // ── Selbstbehauptung · Stufe 3 ────────────────────────
  { id: "g3a", track: "grenzen", stufe: 3, text: "Setze eine Grenze bei einer Person, die dir wichtig ist – ruhig, klar, ohne Rechtfertigungsmarathon.", tipp: "Eine Grenze ist kein Angriff. Sie ist eine Information.", korbMoeglich: false },
  { id: "g3b", track: "grenzen", stufe: 3, text: "Bitte um etwas Großes: Gehaltsgespräch, Gefallen, Unterstützung – etwas, das dich echt Überwindung kostet.", tipp: "Wer nicht fragt, hat schon ein Nein. Fragen kann es nur besser machen.", korbMoeglich: true },
  { id: "g3c", track: "grenzen", stufe: 3, text: "Vertritt in einer Gruppe eine Meinung, von der du weißt, dass nicht alle sie teilen.", tipp: "Du darfst anecken. Das ist keine Katastrophe, das ist Persönlichkeit.", korbMoeglich: true },
];

// Wochen-Boss: eine große Challenge pro Woche, 3-fache XP
const BOSS_CHALLENGES = [
  { id: "boss-d1", track: "dating", text: "Sprich diese Woche die Person an, bei der du dich am wenigsten traust – und bleib zwei Minuten im Gespräch.", tipp: "Der Boss ist genau die Begegnung, die du seit Wochen vor dir herschiebst." },
  { id: "boss-d2", track: "dating", text: "Hol dir diese Woche zwei Körbe an einem Tag – und geh nach dem zweiten lächelnd nach Hause.", tipp: "Doppelte Exposition, doppelte Freiheit." },
  { id: "boss-s1", track: "smalltalk", text: "Starte diese Woche an einem einzigen Tag drei Gespräche mit drei verschiedenen Fremden.", tipp: "Nach dem dritten fühlt es sich fast normal an. Genau darum geht es." },
  { id: "boss-s2", track: "smalltalk", text: "Geh allein auf eine Veranstaltung und bleib mindestens eine Stunde.", tipp: "Der Endgegner der Komfortzone. Danach bist du ein anderer Mensch." },
  { id: "boss-g1", track: "grenzen", text: "Führe diese Woche das Gespräch, das du am längsten vor dir herschiebst.", tipp: "Du weißt genau, welches gemeint ist." },
  { id: "boss-g2", track: "grenzen", text: "Sag diese Woche eine Zusage ab, die du nur aus Pflichtgefühl gegeben hast.", tipp: "Ein ehrliches Nein ist besser als ein verbittertes Ja." },
];

// Mut-Truhe: trockene Sprüche als Belohnung
const QUOTES = [
  "Die Angst war wieder lauter als die Realität. Klassiker.",
  "Niemand denkt über dich nach. Alle denken über sich nach. Befreiend, oder?",
  "Ein Korb wiegt nichts. Du trägst ihn nicht mal nach Hause.",
  "Peinlichkeit verjährt nach etwa 40 Sekunden. Bei allen Beteiligten.",
  "Mut ist nur Angst, die losgegangen ist.",
  "Heute gemacht, worüber du morgen lachst. Gute Bilanz.",
  "Das Leben ist zu kurz, um es ernst zu nehmen. Weitermachen.",
  "Deine Komfortzone hat dich heute kurz vermisst. Sie kommt klar.",
  "Wieder ein Beweis: Die Welt geht nicht unter. Sie merkt es nicht mal.",
  "Übung macht nicht perfekt. Übung macht gelassen. Reicht völlig.",
];

// Mut-Gedanke des Tages – echte Zitate, täglich wechselnd, deterministisch nach Datum
const THOUGHTS = [
  { text: "Tu jeden Tag eine Sache, die dir Angst macht.", by: "Eleanor Roosevelt" },
  { text: "Mut ist Widerstand gegen die Angst, Beherrschung der Angst – nicht die Abwesenheit von Angst.", by: "Mark Twain" },
  { text: "Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.", by: "Seneca" },
  { text: "Ich habe gelernt, dass Mut nicht die Abwesenheit von Furcht ist, sondern der Triumph über sie.", by: "Nelson Mandela" },
  { text: "Du gewinnst Kraft, Mut und Selbstvertrauen durch jede Erfahrung, in der du der Angst wirklich ins Gesicht siehst.", by: "Eleanor Roosevelt" },
  { text: "Es gibt nichts Gutes, außer man tut es.", by: "Erich Kästner" },
  { text: "Das Einzige, was wir fürchten müssen, ist die Furcht selbst.", by: "Franklin D. Roosevelt" },
  { text: "Was wäre das Leben, hätten wir nicht den Mut, etwas zu riskieren?", by: "Vincent van Gogh" },
  { text: "Nichts im Leben muss man fürchten, man muss es nur verstehen.", by: "Marie Curie" },
  { text: "Es ist egal, wie langsam du gehst, solange du nicht stehen bleibst.", by: "Konfuzius" },
  { text: "Das habe ich noch nie vorher versucht, also bin ich völlig sicher, dass ich es schaffe.", by: "Astrid Lindgren (Pippi Langstrumpf)" },
  { text: "Untätigkeit erzeugt Zweifel und Angst. Handeln erzeugt Zuversicht und Mut.", by: "Dale Carnegie" },
  { text: "Wer nicht mutig genug ist, Risiken einzugehen, wird im Leben nichts erreichen.", by: "Muhammad Ali" },
  { text: "Wer tapfer ist, ist frei.", by: "Seneca" },
  { text: "Mut steht am Anfang des Handelns, Glück am Ende.", by: "Demokrit" },
  { text: "Jedem Anfang wohnt ein Zauber inne.", by: "Hermann Hesse" },
];

// Mut-Sammlung: Sammelkarten aus der Truhe (Seltenheitsstufen wie im Gaming)
const CARDS = [
  { id: "c01", rarity: "haeufig", name: "Erster Funke", text: "Jede Legende beginnt mit einem Hallo." },
  { id: "c02", rarity: "haeufig", name: "Kaltstart", text: "Einfach angefangen, bevor der Kopf Nein sagen konnte." },
  { id: "c03", rarity: "haeufig", name: "Blickkontakt", text: "Zwei Sekunden Standhalten. Fühlte sich an wie zwanzig." },
  { id: "c04", rarity: "haeufig", name: "Türöffner", text: "Ein Satz genügt, und ein Fremder wird ein Mensch." },
  { id: "c05", rarity: "haeufig", name: "Morgenmut", text: "Vor dem ersten Kaffee schon mutiger als gestern." },
  { id: "c06", rarity: "haeufig", name: "Smalltalk-Azubi", text: "Über das Wetter reden zählt. Ehrlich." },
  { id: "c07", rarity: "haeufig", name: "Nachfrager", text: "Wer fragt, führt. Wer nicht fragt, rät." },
  { id: "c08", rarity: "selten", name: "Eisbrecher", text: "Bricht Schweigen bei jeder Wetterlage." },
  { id: "c09", rarity: "selten", name: "Korb-Katapult", text: "Wirft dich nach jedem Nein zurück ins Spiel." },
  { id: "c10", rarity: "selten", name: "Neinsager", text: "Sagt Nein ohne Fußnoten und Entschuldigungsschleife." },
  { id: "c11", rarity: "selten", name: "Plauderprofi", text: "Findet in jeder Schlange ein Gespräch." },
  { id: "c12", rarity: "selten", name: "Adrenalin-Abo", text: "Herzklopfen ist hier ein Feature, kein Bug." },
  { id: "c13", rarity: "episch", name: "Angstflüsterer", text: "Hört die Angst an – und macht es trotzdem." },
  { id: "c14", rarity: "episch", name: "Herz aus Stahl", text: "Klopft laut, gibt aber nicht nach." },
  { id: "c15", rarity: "episch", name: "Bühnenlöwe", text: "Alle Blicke im Raum? Genau richtig so." },
  { id: "c16", rarity: "legendaer", name: "Die Taube", text: "Null Angst. Null Filter. Läuft jedem vor die Füße. Dein wahres Vorbild." },
];

const RARITY_ICON = { haeufig: "●", selten: "◆", episch: "★", legendaer: "♛" };
const RARITY_NAME = { haeufig: "Häufig", selten: "Selten", episch: "Episch", legendaer: "Legendär" };

// Level-System
const LEVELS = [
  { xp: 0, name: "Stiller Beobachter" },
  { xp: 40, name: "Zaghafter Zeigefinger" },
  { xp: 100, name: "Mutiger Anfänger" },
  { xp: 180, name: "Gesprächsstarter" },
  { xp: 300, name: "Korbsammler" },
  { xp: 450, name: "Angstfresser" },
  { xp: 650, name: "Sozialer Freigeist" },
  { xp: 900, name: "Lebenskünstler" },
];

const XP_BY_STUFE = { 1: 10, 2: 20, 3: 35 };
const XP_KORB_BONUS = 15;
const XP_EHRLICHKEIT = 5;
const XP_WETTE_BONUS = 5;
const BOSS_MULTIPLIER = 3;

const BADGES = [
  { id: "erste", name: "Erster Schritt", desc: "Erste Mutprobe abgeschlossen", check: (s) => s.history.length >= 1 },
  { id: "korb1", name: "Erster Korb", desc: "Einen Korb kassiert und überlebt", check: (s) => s.koerbe >= 1 },
  { id: "korb5", name: "Korbflechter", desc: "Fünf Körbe gesammelt", check: (s) => s.koerbe >= 5, progress: (s) => [s.koerbe, 5] },
  { id: "streak3", name: "Drei Tage dran", desc: "Drei Tage Serie", check: (s) => s.bestStreak >= 3, progress: (s) => [s.bestStreak, 3] },
  { id: "streak7", name: "Eine ganze Woche", desc: "Sieben Tage Serie", check: (s) => s.bestStreak >= 7, progress: (s) => [s.bestStreak, 7] },
  { id: "zehn", name: "Zehn Mutproben", desc: "Zehn Einträge im Journal", check: (s) => s.history.length >= 10, progress: (s) => [s.history.length, 10] },
  { id: "dreissig", name: "Dranbleiber", desc: "Dreißig Mutproben geschafft", check: (s) => s.history.filter((h) => h.outcome !== "skip").length >= 30, progress: (s) => [s.history.filter((h) => h.outcome !== "skip").length, 30] },
  { id: "ehrlich", name: "Ehrliche Haut", desc: "Einmal ehrlich ausgelassen", check: (s) => s.history.some((h) => h.outcome === "skip") },
  { id: "prophet", name: "Angst widerlegt", desc: "Fünf Wetten gegen die Angst gewonnen", check: (s) => s.history.filter((h) => h.wette && h.wette.eingetreten === "nein").length >= 5, progress: (s) => [s.history.filter((h) => h.wette && h.wette.eingetreten === "nein").length, 5] },
  { id: "boss", name: "Bosskampf", desc: "Einen Wochen-Boss besiegt", check: (s) => s.history.some((h) => h.isBoss && h.outcome !== "skip") },
  { id: "boss4", name: "Bossjäger", desc: "Vier Wochen-Bosse besiegt", check: (s) => s.history.filter((h) => h.isBoss && h.outcome !== "skip").length >= 4, progress: (s) => [s.history.filter((h) => h.isBoss && h.outcome !== "skip").length, 4] },
  { id: "stufe3", name: "Königsklasse", desc: "Eine Stufe-3-Challenge gemeistert", check: (s) => s.history.some((h) => { const c = CHALLENGES.find((x) => x.id === h.challengeId); return c && c.stufe === 3 && h.outcome !== "skip"; }) },
  { id: "sammler", name: "Sammler", desc: "Acht Karten aus der Mut-Truhe", check: (s) => (s.collection || []).length >= 8, progress: (s) => [(s.collection || []).length, 8] },
  { id: "taube", name: "Taubenfreund", desc: "Die legendäre Taube gezogen", check: (s) => (s.collection || []).includes("c16") },
];
