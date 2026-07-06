// Challenge-Datenbank für Mutprobe
// Jede Challenge: id, track, stufe (1-3), text, tipp (optional), korbMoeglich (kann man dabei einen "Korb" kassieren?)

const TRACKS = {
  dating: {
    name: "Dating-Mut",
    emoji: "💘",
    beschreibung: "Ansprechangst abbauen – Schritt für Schritt, mit Neugier statt Anmachsprüchen.",
  },
  smalltalk: {
    name: "Small Talk",
    emoji: "💬",
    beschreibung: "Leichter ins Gespräch kommen – mit Fremden, Kolleg:innen, überall.",
  },
  grenzen: {
    name: "Selbstbehauptung",
    emoji: "🛡️",
    beschreibung: "Nein sagen, Wünsche äußern, für dich einstehen.",
  },
};

const CHALLENGES = [
  // ── Dating-Mut · Stufe 1 ──────────────────────────────
  { id: "d1a", track: "dating", stufe: 1, text: "Halte heute mit drei fremden Menschen kurz freundlichen Blickkontakt und lächle.", tipp: "Es geht nicht um Reaktionen – nur ums Aushalten des Moments.", korbMoeglich: false },
  { id: "d1b", track: "dating", stufe: 1, text: "Wünsch einer Person an der Kasse, im Café oder im Bus ehrlich einen schönen Tag.", tipp: "Kurz, freundlich, weitergehen. Mehr nicht.", korbMoeglich: false },
  { id: "d1c", track: "dating", stufe: 1, text: "Grüße heute fünf fremde Menschen zuerst – bevor sie dich grüßen.", tipp: "Spaziergang, Hausflur, Supermarkt – überall möglich.", korbMoeglich: false },
  { id: "d1d", track: "dating", stufe: 1, text: "Stell dich für 60 Sekunden an einen belebten Ort und beobachte, wie wenig sich die Leute für dich interessieren.", tipp: "Spoiler: niemand schaut. Das ist die gute Nachricht.", korbMoeglich: false },
  // ── Dating-Mut · Stufe 2 ──────────────────────────────
  { id: "d2a", track: "dating", stufe: 2, text: "Frag eine fremde Person nach einer Empfehlung: bestes Café der Gegend, ein Buch, ein Song.", tipp: "Menschen empfehlen gern Dinge. Du machst ihnen sogar eine Freude.", korbMoeglich: true },
  { id: "d2b", track: "dating", stufe: 2, text: "Mach einer fremden Person ein ehrliches, konkretes Kompliment – über Stil, Ausstrahlung oder etwas, das sie gerade tut.", tipp: "Ehrlich und konkret schlägt glatt und auswendig. Danach darfst du gehen.", korbMoeglich: true },
  { id: "d2c", track: "dating", stufe: 2, text: "Stell jemandem, den du interessant findest, eine echte Frage – etwas, das dich wirklich interessiert.", tipp: "Neugier ist attraktiver als jeder Spruch.", korbMoeglich: true },
  { id: "d2d", track: "dating", stufe: 2, text: "Bleib nach einem kurzen Wortwechsel bewusst 30 Sekunden länger im Gespräch, statt sofort zu flüchten.", tipp: "Die Stille aushalten. Sie ist fast nie so lang, wie sie sich anfühlt.", korbMoeglich: true },
  // ── Dating-Mut · Stufe 3 ──────────────────────────────
  { id: "d3a", track: "dating", stufe: 3, text: "Sprich eine Person an, die du interessant findest, und sag ehrlich: „Ich wollte dich einfach kurz kennenlernen.“", tipp: "Ehrlichkeit ist die mutigste und sympathischste Strategie, die es gibt.", korbMoeglich: true },
  { id: "d3b", track: "dating", stufe: 3, text: "Wenn ein Gespräch gut läuft: Frag nach der Nummer oder schlag vor, mal einen Kaffee zu trinken.", tipp: "Ein Nein ändert nichts an deinem Wert. Es füllt nur deine Korb-Sammlung.", korbMoeglich: true },
  { id: "d3c", track: "dating", stufe: 3, text: "Geh heute gezielt an einen Ort, an dem man ins Gespräch kommt (Kurs, Bar, Event) – und sprich dort eine Person an.", tipp: "Der Kontext macht es leichter. Du musst nicht auf der Straße anfangen.", korbMoeglich: true },
  { id: "d3d", track: "dating", stufe: 3, text: "Königsdisziplin: Hol dir absichtlich einen Korb. Frag nach etwas, bei dem ein Nein wahrscheinlich ist – und überlebe es.", tipp: "Rejection Therapy: Wer das Nein nicht mehr fürchtet, ist frei.", korbMoeglich: true },

  // ── Small Talk · Stufe 1 ──────────────────────────────
  { id: "s1a", track: "smalltalk", stufe: 1, text: "Grüße heute fünf Menschen zuerst – Nachbarn, Kolleg:innen, Fremde.", tipp: "Zuerst grüßen = du bestimmst den Ton.", korbMoeglich: false },
  { id: "s1b", track: "smalltalk", stufe: 1, text: "Stell an der Haltestelle, im Aufzug oder in der Schlange eine harmlose Frage („Fährt der Bus schon lange nicht?“).", tipp: "Situative Fragen sind der leichteste Einstieg der Welt.", korbMoeglich: false },
  { id: "s1c", track: "smalltalk", stufe: 1, text: "Bedanke dich heute einmal ausführlicher als nötig – mit einem ganzen Satz statt nur „Danke“.", tipp: "„Danke, das hat mir echt geholfen“ öffnet Türen.", korbMoeglich: false },
  // ── Small Talk · Stufe 2 ──────────────────────────────
  { id: "s2a", track: "smalltalk", stufe: 2, text: "Führe ein Gespräch von mindestens zwei Minuten mit einer Person, die du nicht kennst.", tipp: "Frage + Nachfrage + etwas von dir erzählen. Das ist die ganze Formel.", korbMoeglich: true },
  { id: "s2b", track: "smalltalk", stufe: 2, text: "Erzähl heute jemandem eine kleine Geschichte von dir, statt nur Fragen zu beantworten.", tipp: "Small Talk wird gut, wenn du etwas von dir zeigst.", korbMoeglich: false },
  { id: "s2c", track: "smalltalk", stufe: 2, text: "Sprich eine Person auf etwas an, das sie bei sich trägt: Buch, Band-Shirt, Hund, Sportzeug.", tipp: "Gemeinsame Anknüpfungspunkte machen 80 % der Arbeit.", korbMoeglich: true },
  // ── Small Talk · Stufe 3 ──────────────────────────────
  { id: "s3a", track: "smalltalk", stufe: 3, text: "Erzähl in einer Gruppe (Pause, Feier, Treffen) eine Anekdote – und halte die Aufmerksamkeit aus.", tipp: "Kurz und mit Pointe. Und wenn keiner lacht: Bonus-XP fürs Aushalten.", korbMoeglich: true },
  { id: "s3b", track: "smalltalk", stufe: 3, text: "Geh allein zu einer Veranstaltung und komm dort mit mindestens zwei Menschen ins Gespräch.", tipp: "Allein hingehen ist der Cheat-Code: Man MUSS reden – und es funktioniert.", korbMoeglich: true },
  { id: "s3c", track: "smalltalk", stufe: 3, text: "Stell einer Person eine überraschend tiefe Frage: „Was war der beste Moment deiner Woche?“", tipp: "Menschen lieben es, das erzählen zu dürfen. Fast niemand fragt sie.", korbMoeglich: true },

  // ── Selbstbehauptung · Stufe 1 ────────────────────────
  { id: "g1a", track: "grenzen", stufe: 1, text: "Sag heute einmal „Nein“ – ohne Begründung, ohne Entschuldigung.", tipp: "„Nein, das passt mir nicht.“ Punkt. Der Satz ist vollständig.", korbMoeglich: false },
  { id: "g1b", track: "grenzen", stufe: 1, text: "Äußere einen kleinen Wunsch, den du sonst runterschlucken würdest („Können wir das Fenster aufmachen?“).", tipp: "Kleine Wünsche äußern trainiert den Muskel für die großen.", korbMoeglich: false },
  { id: "g1c", track: "grenzen", stufe: 1, text: "Korrigiere heute einmal freundlich, wenn etwas nicht stimmt – falscher Name, falsche Bestellung, falsche Info.", tipp: "Freundlich UND klar geht gleichzeitig. Versprochen.", korbMoeglich: false },
  // ── Selbstbehauptung · Stufe 2 ────────────────────────
  { id: "g2a", track: "grenzen", stufe: 2, text: "Gib etwas zurück oder reklamiere etwas, das nicht in Ordnung war.", tipp: "Du bist nicht anstrengend. Du nimmst dich ernst.", korbMoeglich: true },
  { id: "g2b", track: "grenzen", stufe: 2, text: "Frag heute nach einem Rabatt oder einem Extra – einfach, weil Fragen erlaubt ist.", tipp: "Klassische Rejection-Übung: Das Nein ist eingeplant und tut nicht weh.", korbMoeglich: true },
  { id: "g2c", track: "grenzen", stufe: 2, text: "Sprich eine kleine Unstimmigkeit direkt an, statt sie auszusitzen.", tipp: "„Mir ist aufgefallen, dass … können wir kurz darüber reden?“", korbMoeglich: false },
  // ── Selbstbehauptung · Stufe 3 ────────────────────────
  { id: "g3a", track: "grenzen", stufe: 3, text: "Setze eine Grenze bei einer Person, die dir wichtig ist – ruhig, klar, ohne Rechtfertigungsmarathon.", tipp: "Eine Grenze ist kein Angriff. Sie ist eine Information.", korbMoeglich: false },
  { id: "g3b", track: "grenzen", stufe: 3, text: "Bitte um etwas Großes: Gehaltsgespräch, Gefallen, Unterstützung – etwas, das dich echt Überwindung kostet.", tipp: "Wer nicht fragt, hat schon ein Nein. Fragen kann es nur besser machen.", korbMoeglich: true },
  { id: "g3c", track: "grenzen", stufe: 3, text: "Vertritt in einer Gruppe eine Meinung, von der du weißt, dass nicht alle sie teilen.", tipp: "Du darfst anecken. Das ist keine Katastrophe, das ist Persönlichkeit.", korbMoeglich: true },
];

// Level-System: XP-Schwellen und (augenzwinkernde) Titel
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
const XP_KORB_BONUS = 15;   // Bonus fürs Kassieren eines Korbs
const XP_EHRLICHKEIT = 5;   // Trost-XP fürs ehrliche Eingestehen "heute nicht geschafft"

const BADGES = [
  { id: "erste", name: "Erster Schritt", emoji: "👣", check: (s) => s.history.length >= 1 },
  { id: "korb1", name: "Erster Korb", emoji: "🧺", check: (s) => s.koerbe >= 1 },
  { id: "korb5", name: "Korbflechter", emoji: "🧺✨", check: (s) => s.koerbe >= 5 },
  { id: "streak3", name: "3 Tage dran", emoji: "🔥", check: (s) => s.bestStreak >= 3 },
  { id: "streak7", name: "Eine ganze Woche", emoji: "🔥🔥", check: (s) => s.bestStreak >= 7 },
  { id: "zehn", name: "10 Mutproben", emoji: "🏅", check: (s) => s.history.length >= 10 },
  { id: "ehrlich", name: "Ehrliche Haut", emoji: "🤍", check: (s) => s.history.some((h) => h.outcome === "skip") },
  { id: "stufe3", name: "Königsklasse", emoji: "👑", check: (s) => s.history.some((h) => { const c = CHALLENGES.find((x) => x.id === h.challengeId); return c && c.stufe === 3 && h.outcome !== "skip"; }) },
];
