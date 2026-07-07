// ═══ Mutprobe – App-Logik ═══

const STORAGE_KEY = "mutprobe-state-v1";

const QUIZ = [
  { q: "Eine fremde Person nach dem Weg fragen – wie fühlt sich das an?", a: [
    { t: "Mach ich, ohne nachzudenken", pts: 2 },
    { t: "Kostet mich etwas Überwindung", pts: 1 },
    { t: "Das vermeide ich, wenn es geht", pts: 0 },
  ]},
  { q: "Einer fremden Person ein ehrliches Kompliment machen?", a: [
    { t: "Kein Problem", pts: 2 },
    { t: "Mit Anlauf schaffe ich das", pts: 1 },
    { t: "Sehr schwer für mich", pts: 0 },
  ]},
  { q: "Wie oft kommst du aktuell mit Fremden ins Gespräch?", a: [
    { t: "Regelmäßig", pts: 2 },
    { t: "Ab und zu", pts: 1 },
    { t: "So gut wie nie", pts: 0 },
  ]},
  { q: "In einer Gruppe etwas sagen, wenn alle zuhören?", a: [
    { t: "Mache ich gern", pts: 2 },
    { t: "Wenn es sein muss, geht das", pts: 1 },
    { t: "Ich bleibe lieber still", pts: 0 },
  ]},
  { q: "Wie gehst du mit einem Nein oder einer Abfuhr um?", a: [
    { t: "Schulterzucken – passiert", pts: 2 },
    { t: "Nagt eine Weile an mir", pts: 1 },
    { t: "Trifft mich richtig hart", pts: 0 },
  ]},
];

const defaultState = () => ({
  track: null,
  xp: 0,
  koerbe: 0,
  streak: 0,
  bestStreak: 0,
  lastDoneDay: null,
  todayKey: null,
  todayPicks: [],
  todayCompleted: [],
  startLevels: {},           // Einstufung pro Track – Ängste sind bereichsspezifisch
  reminderDismissedDay: null,
  soundOn: true,
  name: "",
  lastRecapWeek: null,
  currentChallengeId: null,
  currentIsBoss: false,
  currentWette: null,        // { text, prob, fearBefore }
  doneToday: false,
  bossDoneWeek: null,
  lastSkipXpDay: null,
  jokers: 0,
  jokerEarnedBasis: 0,
  history: [],               // { date, challengeId, isBoss, outcome, text, fearBefore, fearAfter, xp, wette }
});

let state = loadState();
let pendingOutcome = null;
let recognition = null;

// ── Persistenz ──────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = { ...defaultState(), ...JSON.parse(raw) };
      // Migration: alte globale Einstufung auf den aktuellen Track übertragen
      if (s.startLevel != null && s.track && s.startLevels[s.track] == null) {
        s.startLevels[s.track] = s.startLevel;
      }
      return s;
    }
  } catch (e) { /* korrupte Daten → frisch starten */ }
  return defaultState();
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Helfer ──────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const todayStr = () => localDateStr(new Date());
function localDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), t = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${t}`;
}
function daysAgoStr(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return localDateStr(d);
}
function weekKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const wk = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${wk}`;
}
function weekNum() { return parseInt(weekKey().split("W")[1], 10); }
function fmtDate(iso) {
  const [y, m, t] = iso.split("-").map(Number);
  return new Date(y, m - 1, t).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function currentLevel() {
  let lvl = 0;
  LEVELS.forEach((l, i) => { if (state.xp >= l.xp) lvl = i; });
  return lvl;
}
function unlockedStufen() {
  const sl = ((state.startLevels || {})[state.track]) ?? 0;
  const lvl = Math.max(currentLevel(), sl);
  if (lvl >= 4) return [1, 2, 3];
  if (lvl >= 2) return [1, 2];
  return [1];
}
function showToast(msg, ms = 2800) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), ms);
  if (typeof Sound !== "undefined") Sound.pop();
}
function ringSvg(pct, size, r, w, color) {
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0.02, Math.min(1, pct)));
  const mid = size / 2;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="var(--ring-track)" stroke-width="${w}"></circle>
    <circle class="ring-fill" cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 ${mid} ${mid})"></circle>
  </svg>`;
}

// ── Sound-Engine (synthetisiert, keine Audiodateien) ────
const Sound = (() => {
  let ctx = null;
  const enabled = () => state.soundOn !== false;
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, { type = "sine", vol = 0.15, when = 0, slide = 0 } = {}) {
    if (!enabled()) return;
    try {
      const c = ac(), t = c.currentTime + when;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch (e) { /* Audio nicht verfügbar – still bleiben */ }
  }
  return {
    tap: () => tone(520, 0.05, { vol: 0.06 }),
    tick: () => tone(1100, 0.03, { type: "square", vol: 0.025 }),
    pop: () => tone(600, 0.07, { type: "triangle", vol: 0.1, slide: 1400 }),
    whoosh: () => tone(160, 0.55, { vol: 0.1, slide: 950 }),
    success: () => { tone(523.25, 0.13, { vol: 0.14 }); tone(659.25, 0.13, { when: 0.1, vol: 0.14 }); tone(783.99, 0.24, { when: 0.2, vol: 0.16 }); },
    korb: () => { tone(320, 0.28, { type: "sawtooth", vol: 0.09, slide: 140 }); tone(523.25, 0.12, { when: 0.34, vol: 0.13 }); tone(659.25, 0.22, { when: 0.46, vol: 0.14 }); },
    levelUp: () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.14, { when: i * 0.11, vol: 0.15 })); tone(1318.5, 0.4, { when: 0.46, vol: 0.16 }); },
    chest: () => { tone(220, 0.09, { type: "square", vol: 0.09 }); tone(440, 0.32, { when: 0.09, vol: 0.12, slide: 1100 }); },
  };
})();

// ── Tages-Logik ─────────────────────────────────────────
function ensureToday() {
  const today = todayStr();
  if (state.todayKey !== today) {
    state.todayKey = today;
    state.doneToday = false;
    state.todayCompleted = [];
    state.currentChallengeId = null;
    state.currentIsBoss = false;
    state.currentWette = null;
    state.todayPicks = pickChallenges(3);
    saveState();
  }
}
// Wählt n Challenges, möglichst aus verschiedenen Stufen (alle am selben Tag machbar)
function pickChallenges(n, avoid = []) {
  const stufen = unlockedStufen();
  const recent = state.history.slice(-6).map((h) => h.challengeId);
  const poolFor = (st) => {
    let p = CHALLENGES.filter((c) => c.track === state.track && c.stufe === st && !recent.includes(c.id));
    if (!p.length) p = CHALLENGES.filter((c) => c.track === state.track && c.stufe === st);
    return p;
  };
  const pools = stufen.map(poolFor);
  for (let attempt = 0; attempt < 12; attempt++) {
    const picks = [];
    for (let i = 0; i < n; i++) {
      const pool = pools[Math.min(i, pools.length - 1)];
      const cands = pool.filter((c) => !picks.includes(c.id));
      if (cands.length) picks.push(cands[Math.floor(Math.random() * cands.length)].id);
    }
    if (picks.length < n) {
      const rest = CHALLENGES.filter((c) => c.track === state.track && stufen.includes(c.stufe) && !picks.includes(c.id));
      while (picks.length < n && rest.length) {
        picks.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0].id);
      }
    }
    picks.sort((a, b) => (findChallenge(a).stufe || 1) - (findChallenge(b).stufe || 1));
    const same = avoid.length && picks.every((id) => avoid.includes(id));
    if (!same) return picks;
  }
  return pools.flat().slice(0, n).map((c) => c.id);
}
function bossForWeek() {
  const list = BOSS_CHALLENGES.filter((b) => b.track === state.track);
  if (!list.length) return null;
  return list[weekNum() % list.length];
}
function findChallenge(id) {
  return CHALLENGES.find((c) => c.id === id) || BOSS_CHALLENGES.find((b) => b.id === id) || null;
}

// ── Rendering ───────────────────────────────────────────
function render() {
  const onb = $("#onboarding"), main = $("#main");
  if (!state.track) {
    onb.classList.remove("hidden");
    main.classList.add("hidden");
    // Bestandsnutzer (Track-Wechsel) landen direkt bei der Track-Auswahl
    const step = state.history.length || state.xp > 0 ? "3" : "1";
    document.querySelectorAll(".onb-step").forEach((s) => s.classList.add("hidden"));
    document.querySelector(`.onb-step[data-step="${step}"]`).classList.remove("hidden");
    renderTrackList();
    return;
  }
  onb.classList.add("hidden");
  main.classList.remove("hidden");
  ensureToday();
  renderHeute();
  renderFortschritt();
  renderJournal();
}

function renderTrackList() {
  const list = $("#track-list");
  list.innerHTML = "";
  Object.entries(TRACKS).forEach(([key, t]) => {
    const btn = document.createElement("button");
    btn.className = "track-card";
    btn.innerHTML = `<div><div class="t-name">${t.name}</div><div class="t-desc">${t.beschreibung}</div></div>
      <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none"/></svg>`;
    btn.addEventListener("click", () => {
      state.track = key;
      // doneToday bleibt beim Track-Wechsel erhalten – kein Mehrfach-XP am selben Tag
      if (state.todayKey === todayStr()) {
        state.todayPicks = pickChallenges(3);
        state.currentChallengeId = null;
        state.currentIsBoss = false;
        state.currentWette = null;
      }
      saveState();
      // Jeder Track hat seine eigene Einstufung – Ängste sind bereichsspezifisch
      if (((state.startLevels || {})[key]) == null) showQuiz();
      else render();
    });
    list.appendChild(btn);
  });
}

// ── Einstufungs-Quiz ────────────────────────────────────
function showQuiz() {
  $("#onboarding").classList.remove("hidden");
  $("#main").classList.add("hidden");
  document.querySelectorAll(".onb-step").forEach((s) => s.classList.add("hidden"));
  document.querySelector('.onb-step[data-step="4"]').classList.remove("hidden");
  const intro = $("#quiz-intro");
  if (intro) intro.textContent = `${QUIZ.length} kurze Fragen, damit dein Startlevel passt.`;
  let qi = 0, score = 0;
  const box = $("#quiz-box");
  const step = () => {
    const q = QUIZ[qi];
    box.innerHTML = `<p class="quiz-q">${qi + 1}/${QUIZ.length} · ${q.q}</p>` +
      q.a.map((a) => `<button class="track-card" data-pts="${a.pts}"><div><div class="t-name">${a.t}</div></div></button>`).join("");
    box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      score += Number(b.dataset.pts);
      qi += 1;
      if (qi < QUIZ.length) step();
      else finish();
    }));
  };
  const finish = () => {
    const sl = score >= 8 ? 4 : score >= 4 ? 2 : 0;
    if (!state.startLevels) state.startLevels = {};
    state.startLevels[state.track] = sl;
    if (state.todayKey === todayStr()) state.todayPicks = pickChallenges(3);
    saveState();
    render();
    const maxStufe = Math.max(...unlockedStufen());
    showToast(`Dein Start in ${TRACKS[state.track].name}: Aufgaben bis Stufe ${maxStufe}`, 4200);
  };
  step();
}

function heuteHeader() {
  const dateStr = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const h = new Date().getHours();
  const zeit = h < 5 ? "Gute Nacht" : h < 11 ? "Guten Morgen" : h < 18 ? "Hallo" : "Guten Abend";
  const gruss = state.name ? `${zeit}, ${escapeHtml(state.name)}.` : `${zeit}.`;
  return `<p class="view-date">${dateStr}</p><h1>${gruss}</h1>`;
}

// Wochenrückblick: erscheint einmal pro Woche, wenn letzte Woche etwas passiert ist
function recapCard() {
  if (state.lastRecapWeek === weekKey()) return null;
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const lastWeekDates = [];
  for (let i = 7; i >= 1; i--) {
    const d = new Date(monday);
    d.setDate(d.getDate() - i);
    lastWeekDates.push(localDateStr(d));
  }
  const entries = state.history.filter((h) => lastWeekDates.includes(h.date) && h.outcome !== "skip");
  if (!entries.length) return null;
  const xpSum = entries.reduce((a, h) => a + h.xp, 0);
  const withFear = entries.filter((h) => typeof h.fearBefore === "number");
  let fearLine = "";
  if (withFear.length) {
    const avgB = withFear.reduce((a, h) => a + h.fearBefore, 0) / withFear.length;
    const avgA = withFear.reduce((a, h) => a + h.fearAfter, 0) / withFear.length;
    fearLine = ` · Angst Ø ${avgB.toFixed(1)} → ${avgA.toFixed(1)}`;
  }
  return {
    title: "Deine letzte Woche",
    text: `${entries.length} ${entries.length === 1 ? "Mutprobe" : "Mutproben"} · +${xpSum} XP${fearLine}`,
  };
}

function reminderBanner() {
  if (state.reminderDismissedDay === todayStr() || state.doneToday) return null;
  const hour = new Date().getHours();
  const streakAtRisk = state.lastDoneDay === daysAgoStr(2) && state.jokers === 0;
  if (streakAtRisk) {
    return { text: `Deine Serie von ${state.streak} ${state.streak === 1 ? "Tag" : "Tagen"} reißt heute ohne Joker ab. Noch ist Zeit.`, urgent: true };
  }
  if (hour >= 19 && state.streak > 0) {
    return { text: `Deine Serie von ${state.streak} ${state.streak === 1 ? "Tag" : "Tagen"} läuft heute noch aus. Eine Mutprobe reicht.`, urgent: false };
  }
  if (hour >= 21 && state.streak === 0 && state.history.length > 0) {
    return { text: "Der Tag ist noch nicht vorbei. Eine kleine Mutprobe passt auch spät noch.", urgent: false };
  }
  return null;
}

function renderHeute() {
  const v = $("#view-heute");
  const ringPct = state.doneToday ? 1 : 0.04;
  const ringSub = state.doneToday
    ? (state.streak > 1 ? `Geschlossen. Serie: ${state.streak} Tage.` : "Geschlossen. Deine Serie beginnt.")
    : (state.streak > 0 ? `Noch offen. Serie: ${state.streak} ${state.streak === 1 ? "Tag" : "Tage"}.` : "Noch offen. Eine Mutprobe schließt ihn.");

  let html = heuteHeader();

  const banner = reminderBanner();
  if (banner) {
    html += `<div class="card banner-card${banner.urgent ? " urgent" : ""}">
      <p class="banner-text">${banner.text}</p>
      <button class="banner-close" id="btn-dismiss-banner" aria-label="Hinweis ausblenden">
        <svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
      </button>
    </div>`;
  }

  const recap = recapCard();
  if (recap) {
    html += `<div class="card recap-card">
      <div class="row-main"><p class="r-title">${recap.title}</p><p class="r-sub">${recap.text}</p></div>
      <button class="banner-close" id="btn-recap-close" aria-label="Rückblick ausblenden">
        <svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
      </button>
    </div>`;
  }

  html += `<div class="card ring-card">
    ${ringSvg(ringPct, 80, 30, 9, "var(--accent)")}
    <div><p class="r-title">Mut-Ring</p><p class="r-sub">${ringSub}</p></div>
  </div>`;

  // Level-Fortschritt: das nächste Ziel immer sichtbar
  const lvl = currentLevel();
  const next = LEVELS[lvl + 1];
  if (next) {
    const prevXp = LEVELS[lvl].xp;
    const pct = Math.min(100, Math.round(((state.xp - prevXp) / (next.xp - prevXp)) * 100));
    html += `<div class="card level-card">
      <div class="level-head"><span>Lv. ${lvl + 1} · ${LEVELS[lvl].name}</span><span class="muted">${next.xp - state.xp} XP bis „${next.name}“</span></div>
      <div class="level-bar"><div class="level-fill" style="width:${pct}%"></div></div>
    </div>`;
  }

  const current = state.currentChallengeId ? findChallenge(state.currentChallengeId) : null;

  if (current) {
    const isBoss = state.currentIsBoss;
    const baseXp = isBoss ? XP_BY_STUFE[3] * BOSS_MULTIPLIER : XP_BY_STUFE[current.stufe];
    html += `<p class="section-label">${isBoss ? "Wochen-Boss" : "Deine Mutprobe"}</p>
      <div class="card">
        <span class="stufe-tag ${isBoss ? "boss-tag" : ""}">${isBoss ? `Boss · ${baseXp} XP` : `Stufe ${current.stufe} · ${baseXp} XP`}</span>
        <p class="c-text">${current.text}</p>
        ${current.tipp ? `<p class="c-tipp">${current.tipp}</p>` : ""}
        ${state.currentWette ? `<p class="wette-note">Deine Wette: „${escapeHtml(state.currentWette.text)}“ – ${state.currentWette.prob} % sicher, sagt deine Angst.</p>` : ""}
      </div>
      <button class="btn filled" id="btn-done">Geschafft</button>
      ${(!isBoss && current.korbMoeglich) || isBoss ? `<button class="btn tint" id="btn-korb">Korb kassiert · Bonus sichern</button>` : ""}
      ${!state.currentWette ? `<button class="btn plain" id="btn-wette">Wette gegen die Angst · +${XP_WETTE_BONUS} XP</button>` : ""}
      <button class="btn plain" id="btn-skip">Heute nicht geschafft</button>
      <button class="btn plain subtle" id="btn-change">${isBoss ? "Boss verschieben" : "Andere Challenge wählen"}</button>`;
  } else {
    const openPicks = state.todayPicks
      .filter((id) => !(state.todayCompleted || []).includes(id))
      .map((id) => CHALLENGES.find((c) => c.id === id))
      .filter(Boolean);
    if (openPicks.length) {
      html += `<p class="section-label">${state.doneToday ? "Bonus-Mutproben" : "Wähle deine Mutprobe"}</p>`;
      openPicks.forEach((c) => {
        html += `<button class="card pick-card" data-pick="${c.id}">
          <span class="stufe-tag">Stufe ${c.stufe} · ${XP_BY_STUFE[c.stufe]} XP</span>
          <p class="c-text">${c.text}</p>
        </button>`;
      });
      if (!state.doneToday) html += `<button class="btn plain subtle" id="btn-reroll">Neu mischen</button>`;
    } else {
      html += `<div class="card done-hero">
        <h2>Alles erledigt</h2>
        <p>Für heute bist du durch. Das Leben darf jetzt wieder unernst sein.</p>
      </div>`;
    }
  }

  // Wochen-Boss (verfügbar, solange keine Challenge aktiv ist)
  const boss = bossForWeek();
  if (boss && state.bossDoneWeek !== weekKey() && !current) {
    const daysLeft = 7 - ((new Date().getDay() + 6) % 7);
    const timer = daysLeft === 1 ? "Nur noch heute" : `Noch ${daysLeft} Tage`;
    html += `<p class="section-label">Wochen-Boss</p>
      <button class="card pick-card" data-boss="${boss.id}">
        <span class="stufe-tag boss-tag">Boss · ${XP_BY_STUFE[3] * BOSS_MULTIPLIER} XP</span><span class="boss-timer">${timer}</span>
        <p class="c-text">${boss.text}</p>
        ${boss.tipp ? `<p class="c-tipp">${boss.tipp}</p>` : ""}
      </button>`;
  }

  // Mut-Gedanke des Tages – täglich neu, ganz unten
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  html += `<p class="thought">„${THOUGHTS[dayOfYear % THOUGHTS.length]}“</p>`;

  v.innerHTML = html;

  const recapClose = $("#btn-recap-close");
  if (recapClose) recapClose.addEventListener("click", () => {
    state.lastRecapWeek = weekKey();
    saveState();
    render();
  });
  const bannerClose = $("#btn-dismiss-banner");
  if (bannerClose) bannerClose.addEventListener("click", () => {
    state.reminderDismissedDay = todayStr();
    saveState();
    render();
  });
  v.querySelectorAll("[data-pick]").forEach((el) => el.addEventListener("click", () => { Sound.tap(); acceptChallenge(el.dataset.pick, false); }));
  v.querySelectorAll("[data-boss]").forEach((el) => el.addEventListener("click", () => { Sound.tap(); acceptChallenge(el.dataset.boss, true); }));
  const reroll = $("#btn-reroll");
  if (reroll) reroll.addEventListener("click", () => {
    state.todayPicks = pickChallenges(3, state.todayPicks);
    saveState();
    render();
  });
  const bDone = $("#btn-done"), bKorb = $("#btn-korb"), bSkip = $("#btn-skip"), bChange = $("#btn-change"), bWette = $("#btn-wette");
  if (bWette) bWette.addEventListener("click", openWette);
  if (bDone) bDone.addEventListener("click", () => openReflect("done"));
  if (bKorb) bKorb.addEventListener("click", () => openReflect("korb"));
  if (bSkip) bSkip.addEventListener("click", () => openReflect("skip"));
  if (bChange) bChange.addEventListener("click", () => {
    state.currentChallengeId = null;
    state.currentIsBoss = false;
    state.currentWette = null;
    saveState();
    render();
  });
}

function renderFortschritt() {
  const v = $("#view-fortschritt");
  const lvl = currentLevel();
  const next = LEVELS[lvl + 1];

  // Ring-Trio: Mut (7 Tage), Wetten, Serie
  const last7 = new Set();
  for (let i = 0; i < 7; i++) last7.add(daysAgoStr(i));
  const activeDays = new Set(state.history.filter((h) => h.outcome !== "skip" && last7.has(h.date)).map((h) => h.date));
  const mutPct = activeDays.size / 7;
  const completions = state.history.filter((h) => h.outcome !== "skip");
  const wetten = completions.filter((h) => h.wette);
  const wettenPct = completions.length ? wetten.length / completions.length : 0;
  const seriePct = state.bestStreak ? Math.min(1, state.streak / Math.max(7, state.bestStreak)) : 0;

  const c30 = 2 * Math.PI * 30, c21 = 2 * Math.PI * 21, c12 = 2 * Math.PI * 12;
  const trioSvg = `<svg viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="40" r="30" fill="none" stroke="var(--ring-track)" stroke-width="7"></circle>
    <circle cx="40" cy="40" r="30" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${c30.toFixed(1)}" stroke-dashoffset="${(c30 * (1 - Math.max(0.02, mutPct))).toFixed(1)}" transform="rotate(-90 40 40)"></circle>
    <circle cx="40" cy="40" r="21" fill="none" stroke="var(--ring-track)" stroke-width="7"></circle>
    <circle cx="40" cy="40" r="21" fill="none" stroke="var(--green)" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${c21.toFixed(1)}" stroke-dashoffset="${(c21 * (1 - Math.max(0.02, wettenPct))).toFixed(1)}" transform="rotate(-90 40 40)"></circle>
    <circle cx="40" cy="40" r="12" fill="none" stroke="var(--ring-track)" stroke-width="7"></circle>
    <circle cx="40" cy="40" r="12" fill="none" stroke="var(--blue)" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${c12.toFixed(1)}" stroke-dashoffset="${(c12 * (1 - Math.max(0.02, seriePct))).toFixed(1)}" transform="rotate(-90 40 40)"></circle>
  </svg>`;

  // Angst-Trefferquote
  const bewertete = state.history.filter((h) => h.wette && h.wette.eingetreten);
  const daneben = bewertete.filter((h) => h.wette.eingetreten === "nein").length;
  const quoteText = bewertete.length
    ? `Deine Angst lag ${daneben} von ${bewertete.length} Mal daneben.`
    : "Platziere Wetten gegen deine Angst – hier siehst du, wie oft sie danebenliegt.";

  let html = `<h1>Fortschritt</h1>
    <div class="card trio-card">
      ${trioSvg}
      <div class="trio-legend">
        <p><span class="dot" style="background:var(--accent)"></span><b>Mut</b> · ${activeDays.size} von 7 Tagen</p>
        <p><span class="dot" style="background:var(--green)"></span><b>Wetten</b> · ${wetten.length} platziert</p>
        <p><span class="dot" style="background:var(--blue)"></span><b>Serie</b> · ${state.streak} ${state.streak === 1 ? "Tag" : "Tage"}</p>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat"><p class="num">Lv. ${lvl + 1}</p><p class="lbl">${LEVELS[lvl].name}</p></div>
      <div class="stat"><p class="num">${state.xp}${next ? ` / ${next.xp}` : ""}</p><p class="lbl">XP${next ? " bis zum nächsten Level" : " · Max-Level"}</p></div>
      <div class="stat"><p class="num">${completions.length}</p><p class="lbl">Mutproben</p></div>
      <div class="stat"><p class="num">${state.koerbe}</p><p class="lbl">Körbe kassiert</p></div>
    </div>
    <p class="section-label">Wette gegen die Angst</p>
    <div class="card"><p style="font-size:15px">${quoteText}</p>
      ${bewertete.length ? `<p class="c-tipp">Trefferquote deiner Angst: ${Math.round(((bewertete.length - daneben) / bewertete.length) * 100)} % – sie ist ein schlechter Prophet.</p>` : ""}
    </div>
    <p class="section-label">Aktivität · letzte 12 Wochen</p>
    <div class="card">${heatmapHtml()}</div>
    <p class="section-label">Angstkurve</p>
    <div class="card chart-card">${fearChart()}</div>
    <p class="section-label">Abzeichen</p>
    <div class="list-group" id="badge-list"></div>
    <p class="section-label">Einstellungen</p>
    <div class="list-group">
      <div class="list-row"><div class="row-main"><p class="row-title">Streak-Joker</p><p class="row-sub">Fängt einen verpassten Tag ab. Alle 7 Mutproben gibt es einen.</p></div><span class="row-value">${state.jokers} von 2</span></div>
      <button class="list-row" id="btn-name"><div class="row-main"><p class="row-title">Name</p><p class="row-sub">Für die Begrüßung auf dem Heute-Tab</p></div><span class="row-value">${state.name ? escapeHtml(state.name) : "–"}</span></button>
      <button class="list-row" id="btn-sound"><div class="row-main"><p class="row-title">Töne</p><p class="row-sub">Soundeffekte bei Erfolgen und Aktionen</p></div><span class="row-value">${state.soundOn !== false ? "An" : "Aus"}</span></button>
      <button class="list-row" id="btn-switch-track"><div class="row-main"><p class="row-title">Track wechseln</p><p class="row-sub">Aktuell: ${TRACKS[state.track].name}</p></div></button>
      <button class="list-row" id="btn-requiz"><div class="row-main"><p class="row-title">Einstufung wiederholen</p><p class="row-sub">Passt dein Startlevel an (aktuell: Aufgaben bis Stufe ${Math.max(...unlockedStufen())})</p></div></button>
      <button class="list-row" id="btn-reset"><div class="row-main"><p class="row-title danger">Alles zurücksetzen</p></div></button>
    </div>`;

  v.innerHTML = html;

  const list = $("#badge-list");
  BADGES.forEach((b) => {
    const earned = b.check(state);
    const row = document.createElement("div");
    row.className = "list-row" + (earned ? "" : " locked");
    // „Fast geschafft“-Anzeige: Fortschritt zum nächsten Abzeichen sichtbar machen
    let progressHtml = "";
    let value = "";
    if (!earned && b.progress) {
      const [cur, target] = b.progress(state);
      const pct = Math.min(100, Math.round((cur / target) * 100));
      value = `<span class="row-value">${Math.min(cur, target)} / ${target}</span>`;
      progressHtml = `<div class="badge-bar"><div class="badge-fill" style="width:${pct}%"></div></div>`;
    }
    row.innerHTML = `<svg class="badge-check" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="${earned ? "var(--accent)" : "var(--text-3)"}" stroke-width="1.7"/>
        ${earned ? '<path d="M8 12.5l2.6 2.6L16 9.5" fill="none" stroke="var(--accent)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' : ""}
      </svg>
      <div class="row-main"><p class="row-title">${b.name}</p><p class="row-sub">${b.desc}</p>${progressHtml}</div>${value}`;
    list.appendChild(row);
  });

  $("#btn-name").addEventListener("click", () => {
    const neu = prompt("Wie dürfen wir dich nennen?", state.name || "");
    if (neu !== null) {
      state.name = neu.trim().slice(0, 20);
      saveState();
      render();
    }
  });
  $("#btn-sound").addEventListener("click", () => {
    state.soundOn = state.soundOn === false;
    saveState();
    if (state.soundOn) Sound.success();
    render();
  });
  $("#btn-switch-track").addEventListener("click", () => {
    state.track = null;
    saveState();
    render();
  });
  $("#btn-requiz").addEventListener("click", () => {
    if (!state.startLevels) state.startLevels = {};
    state.startLevels[state.track] = null;
    saveState();
    showQuiz();
  });
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich alles löschen? XP, Körbe, Journal – alles weg.")) {
      state = defaultState();
      saveState();
      render();
    }
  });
}

// Aktivitäts-Heatmap: „Reiß die Kette nicht ab“ sichtbar gemacht
function heatmapHtml() {
  const counts = {};
  state.history.forEach((h) => {
    if (h.outcome !== "skip") counts[h.date] = (counts[h.date] || 0) + 1;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 77); // 11 Wochen zurück, Montag
  let cells = "";
  for (let w = 0; w < 12; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(monday);
      dt.setDate(dt.getDate() + w * 7 + d);
      if (dt > today) { cells += `<span class="heat-cell future"></span>`; continue; }
      const key = localDateStr(dt);
      const n = counts[key] || 0;
      const cls = n >= 2 ? "hot" : n === 1 ? "warm" : "";
      const isToday = key === localDateStr(today) ? " today" : "";
      cells += `<span class="heat-cell ${cls}${isToday}"></span>`;
    }
  }
  return `<div class="heat-grid">${cells}</div>
    <div class="heat-legend"><span>Weniger</span><span class="heat-cell"></span><span class="heat-cell warm"></span><span class="heat-cell hot"></span><span>Mehr</span></div>`;
}

function fearChart() {
  const data = state.history.filter((h) => h.outcome !== "skip" && typeof h.fearBefore === "number").slice(-20);
  if (data.length < 2) {
    return `<p style="font-size:15px;color:var(--text-3)">Nach ein paar Mutproben siehst du hier, wie deine Angst über die Zeit sinkt.</p>`;
  }
  const W = 320, H = 120, pad = 8;
  const x = (i) => pad + (i * (W - 2 * pad)) / (data.length - 1);
  const y = (val) => H - pad - (val / 10) * (H - 2 * pad);
  const line = (key) => data.map((h, i) => `${x(i).toFixed(1)},${y(h[key]).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" aria-label="Angstverlauf">
      <line x1="${pad}" y1="${y(0)}" x2="${W - pad}" y2="${y(0)}" stroke="var(--sep)" stroke-width="0.5"/>
      <line x1="${pad}" y1="${y(5)}" x2="${W - pad}" y2="${y(5)}" stroke="var(--sep)" stroke-width="0.5" stroke-dasharray="3 4"/>
      <line x1="${pad}" y1="${y(10)}" x2="${W - pad}" y2="${y(10)}" stroke="var(--sep)" stroke-width="0.5"/>
      <polyline points="${line("fearBefore")}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${line("fearAfter")}" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="chart-legend">
      <span><span class="dot" style="background:var(--accent)"></span>Angst vorher</span>
      <span><span class="dot" style="background:var(--blue)"></span>Angst nachher</span>
    </div>`;
}

function renderJournal() {
  const v = $("#view-journal");
  let html = `<h1>Journal</h1>`;
  if (state.history.length === 0) {
    html += `<div class="card"><p style="font-size:15px;color:var(--text-3)">Noch keine Einträge. Deine erste Mutprobe wartet im Tab „Heute“.</p></div>`;
    v.innerHTML = html;
    return;
  }
  const outcomeLabel = { done: "Geschafft", korb: "Korb kassiert", skip: "Ausgelassen" };
  [...state.history].reverse().forEach((h) => {
    const c = findChallenge(h.challengeId);
    let wetteLine = "";
    if (h.wette && h.wette.eingetreten) {
      const map = { nein: `<span class="won">Angst lag daneben</span>`, teil: "Befürchtung teilweise eingetreten", ja: "Befürchtung eingetreten" };
      wetteLine = `<p class="j-meta">Wette: „${escapeHtml(h.wette.text)}“ (${h.wette.prob} %) · ${map[h.wette.eingetreten]}</p>`;
    }
    html += `<div class="journal-entry">
      <div class="j-head"><span>${fmtDate(h.date)}${h.isBoss ? " · Wochen-Boss" : ""}</span>
        <span class="outcome-${h.outcome}">${outcomeLabel[h.outcome]} · +${h.xp} XP</span></div>
      <p class="j-challenge">${c ? c.text : "Challenge"}</p>
      <p class="j-text">${escapeHtml(h.text)}</p>
      ${typeof h.fearBefore === "number" ? `<p class="j-meta">Angst: ${h.fearBefore} → ${h.fearAfter}</p>` : ""}
      ${wetteLine}
    </div>`;
  });
  v.innerHTML = html;
}

// ── Challenge-Annahme & Wette (optional) ────────────────
function acceptChallenge(id, isBoss) {
  state.currentChallengeId = id;
  state.currentIsBoss = isBoss;
  state.currentWette = null;
  saveState();
  render();
}
function openWette() {
  $("#wette-text").value = "";
  $("#wette-prob").value = 50;
  $("#wette-prob-val").textContent = "50 %";
  $("#fear-before").value = 5;
  $("#fear-before-val").textContent = "5/10";
  $("#wette-modal").classList.remove("hidden");
}
function closeWette() { $("#wette-modal").classList.add("hidden"); }

// ── Reflexion ───────────────────────────────────────────
function openReflect(outcome) {
  pendingOutcome = outcome;
  const titles = {
    done: "Stark. Kurz reflektieren",
    korb: "Ein Korb. Du lebst noch",
    skip: "Ehrlich bleibt ehrlich",
  };
  $("#reflect-title").textContent = titles[outcome];
  $("#reflect-text").value = "";
  $("#reflect-error").classList.add("hidden");
  const hasWette = !!state.currentWette && outcome !== "skip";
  $("#wette-check").classList.toggle("hidden", !hasWette);
  $("#fear-before2-wrap").classList.toggle("hidden", !!state.currentWette);
  if (hasWette) {
    $("#wette-recap-text").textContent = `„${state.currentWette.text}“ – ${state.currentWette.prob} % sicher.`;
    document.querySelectorAll("#eingetreten-seg button").forEach((b) => b.classList.remove("sel"));
  }
  $("#fear-after").value = state.currentWette ? state.currentWette.fearBefore : 5;
  $("#fear-after-val").textContent = `${$("#fear-after").value}/10`;
  $("#fear-before2").value = 5;
  $("#fear-before2-val").textContent = "5/10";
  $("#reflect-modal").classList.remove("hidden");
}
function closeReflect() {
  $("#reflect-modal").classList.add("hidden");
  pendingOutcome = null;
  stopMic();
}

function saveReflect() {
  if (!pendingOutcome) return;
  const outcome = pendingOutcome;
  const text = $("#reflect-text").value.trim();
  const err = $("#reflect-error");
  if (text.length < 5) {
    err.textContent = "Schreib mindestens einen kurzen Satz – Ehrlichkeit ist der Deal.";
    err.classList.remove("hidden");
    return;
  }
  const hasWette = !!state.currentWette && outcome !== "skip";
  let eingetreten = null;
  if (hasWette) {
    const sel = document.querySelector("#eingetreten-seg button.sel");
    if (!sel) {
      err.textContent = "Sag kurz: Ist deine Befürchtung eingetreten?";
      err.classList.remove("hidden");
      return;
    }
    eingetreten = sel.dataset.val;
  }

  const challengeId = state.currentChallengeId;
  const isBoss = state.currentIsBoss;
  const c = findChallenge(challengeId);
  const stufe = isBoss ? 3 : (c ? c.stufe : 1);

  let xp = 0;
  if (outcome === "done" || outcome === "korb") {
    xp = XP_BY_STUFE[stufe] * (isBoss ? BOSS_MULTIPLIER : 1);
    if (outcome === "korb") xp += XP_KORB_BONUS;
    if (hasWette) xp += XP_WETTE_BONUS;
  } else {
    xp = state.lastSkipXpDay === todayStr() ? 0 : XP_EHRLICHKEIT;
    state.lastSkipXpDay = todayStr();
  }

  const fearBefore = state.currentWette ? state.currentWette.fearBefore : Number($("#fear-before2").value);
  const fearAfter = Number($("#fear-after").value);

  const prevLevel = currentLevel();
  const prevBadges = BADGES.filter((b) => b.check(state)).map((b) => b.id);

  const entry = {
    date: todayStr(), challengeId, isBoss, outcome, text,
    fearBefore, fearAfter, xp,
    wette: state.currentWette ? { text: state.currentWette.text, prob: state.currentWette.prob, eingetreten } : null,
  };
  state.history.push(entry);
  state.xp += xp;

  let jokerUsed = false, jokerEarned = false, truhe = null;

  if (outcome === "skip") {
    state.currentChallengeId = null;
    state.currentIsBoss = false;
    state.currentWette = null;
    saveState();
    closeReflect();
    render();
    showToast(xp > 0 ? `+${xp} XP für Ehrlichkeit. Der Tag ist noch nicht vorbei.` : "Notiert. Der Tag ist noch nicht vorbei.");
    return;
  }

  if (outcome === "korb") state.koerbe += 1;
  if (!isBoss) state.todayCompleted = [...(state.todayCompleted || []), challengeId];

  // Streak (mit Joker)
  const today = todayStr();
  if (state.lastDoneDay !== today) {
    if (state.lastDoneDay === daysAgoStr(1)) {
      state.streak += 1;
    } else if (state.lastDoneDay === daysAgoStr(2) && state.jokers > 0) {
      state.jokers -= 1;
      state.streak += 1;
      jokerUsed = true;
    } else {
      state.streak = 1;
    }
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.lastDoneDay = today;
  }

  // Joker verdienen: alle 7 Mutproben
  const completedCount = state.history.filter((h) => h.outcome !== "skip").length;
  if (completedCount >= state.jokerEarnedBasis + 7) {
    state.jokerEarnedBasis = completedCount;
    if (state.jokers < 2) { state.jokers += 1; jokerEarned = true; }
  }

  // Mut-Truhe – nur bei der ersten Mutprobe des Tages (und beim Boss)
  const firstToday = isBoss || (state.todayCompleted || []).length === 1;
  if (firstToday) {
    const roll = Math.random();
    if (roll < 0.55) {
      const bonus = 5 + Math.floor(Math.random() * 11);
      state.xp += bonus;
      truhe = { type: "xp", text: `+${bonus} Bonus-XP aus der Truhe` };
    } else if (roll < 0.9 || state.jokers >= 2) {
      truhe = { type: "quote", text: QUOTES[Math.floor(Math.random() * QUOTES.length)] };
    } else {
      state.jokers += 1;
      truhe = { type: "joker", text: "Ein Streak-Joker. Er fängt einen verpassten Tag ab." };
    }
  }

  if (isBoss) {
    state.bossDoneWeek = weekKey();
  } else {
    state.doneToday = true;
  }
  state.currentChallengeId = null;
  state.currentIsBoss = false;
  const wetteWon = eingetreten === "nein";
  state.currentWette = null;
  saveState();
  closeReflect();
  render();

  // Feier-Overlay
  const newLevel = currentLevel();
  const newBadges = BADGES.filter((b) => b.check(state) && !prevBadges.includes(b.id));
  let sub = "";
  if (newLevel > prevLevel) sub = `Level ${newLevel + 1}: ${LEVELS[newLevel].name}`;
  else if (newBadges.length) sub = `Neues Abzeichen: ${newBadges[0].name}`;
  else if (jokerUsed) sub = "Streak-Joker eingesetzt – Serie gerettet.";
  else if (jokerEarned) sub = "Streak-Joker verdient.";
  else if (wetteWon) sub = "Deine Angst lag daneben. Wieder mal.";
  else if (isBoss) sub = "Wochen-Boss besiegt.";
  celebrate(xp, sub, truhe, { outcome, leveledUp: newLevel > prevLevel });
}

// ── Feier-Overlay ───────────────────────────────────────
function celebrate(xp, sub, truhe, fx = {}) {
  const overlay = $("#celebrate");
  const ring = $("#big-ring-fill");
  const xpEl = $("#cele-xp");
  $("#cele-sub").textContent = sub;
  const chest = $("#chest");
  const reward = $("#chest-reward");
  reward.classList.add("hidden");
  reward.textContent = "";
  chest.classList.toggle("hidden", !truhe);
  chest.onclick = () => {
    Sound.chest();
    chestBurst();
    chest.classList.add("hidden");
    reward.textContent = truhe.text;
    reward.classList.remove("hidden");
  };
  ring.style.transition = "none";
  ring.style.strokeDashoffset = "289";
  overlay.classList.remove("hidden");
  spawnConfetti();
  Sound.whoosh();
  requestAnimationFrame(() => {
    ring.style.transition = "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)";
    ring.style.strokeDashoffset = "0";
  });
  // Sound und Strahlenkranz, sobald der Ring sich schließt
  setTimeout(() => {
    if (fx.leveledUp) {
      Sound.levelUp();
      spawnRays();
    } else if (fx.outcome === "korb") {
      Sound.korb();
    } else {
      Sound.success();
    }
  }, 820);
  // XP hochzählen mit Tick-Geräuschen
  const start = performance.now(), dur = 700;
  let lastTick = 0;
  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    xpEl.textContent = `+${Math.round(xp * p)} XP`;
    if (now - lastTick > 65 && p < 1) { Sound.tick(); lastTick = now; }
    if (p < 1) requestAnimationFrame(tick);
    else xpEl.classList.add("xp-pop"), setTimeout(() => xpEl.classList.remove("xp-pop"), 400);
  }
  requestAnimationFrame(tick);
}

function spawnRays() {
  const inner = document.querySelector(".celebrate-inner");
  const holder = document.createElement("div");
  holder.className = "rays";
  for (let i = 0; i < 10; i++) {
    const s = document.createElement("span");
    s.style.setProperty("--r", `${i * 36}deg`);
    s.style.animationDelay = `${i * 0.025}s`;
    holder.appendChild(s);
  }
  inner.appendChild(holder);
  setTimeout(() => holder.remove(), 1400);
}

function chestBurst() {
  const chest = $("#chest"), overlay = $("#celebrate");
  const r = chest.getBoundingClientRect(), o = overlay.getBoundingClientRect();
  const holder = document.createElement("div");
  holder.className = "burst";
  holder.style.left = `${r.left - o.left + r.width / 2}px`;
  holder.style.top = `${r.top - o.top + r.height / 2}px`;
  const colors = ["#FF9500", "#FFD60A", "#30D158", "#64D2FF", "#FF375F"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    const ang = (i / 14) * 2 * Math.PI;
    const dist = 55 + Math.random() * 45;
    s.style.background = colors[i % colors.length];
    s.style.setProperty("--dx", `${(Math.cos(ang) * dist).toFixed(0)}px`);
    s.style.setProperty("--dy", `${(Math.sin(ang) * dist).toFixed(0)}px`);
    holder.appendChild(s);
  }
  overlay.appendChild(holder);
  setTimeout(() => holder.remove(), 900);
}
function spawnConfetti() {
  const layer = $("#confetti-layer");
  layer.innerHTML = "";
  const colors = ["#FF9500", "#FFD60A", "#30D158", "#64D2FF", "#FF375F"];
  for (let i = 0; i < 32; i++) {
    const el = document.createElement("span");
    el.className = "confetto";
    el.style.left = `${Math.random() * 100}%`;
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = `${900 + Math.random() * 800}ms`;
    el.style.animationDelay = `${Math.random() * 300}ms`;
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    if (i % 3 === 0) el.style.borderRadius = "50%";
    if (i % 4 === 0) { el.style.width = "6px"; el.style.height = "10px"; }
    layer.appendChild(el);
  }
  Sound.pop();
  setTimeout(() => { layer.innerHTML = ""; }, 2200);
}

// ── Spracheingabe ───────────────────────────────────────
function setupMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = $("#mic-btn");
  if (!SR) return;
  btn.classList.remove("hidden");
  btn.addEventListener("click", () => {
    if (recognition) { stopMic(); return; }
    recognition = new SR();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (e) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) txt += e.results[i][0].transcript;
      }
      if (txt) {
        const ta = $("#reflect-text");
        ta.value = (ta.value ? ta.value.trim() + " " : "") + txt.trim();
      }
    };
    recognition.onend = () => { recognition = null; btn.classList.remove("rec"); };
    recognition.onerror = () => { recognition = null; btn.classList.remove("rec"); };
    try {
      recognition.start();
      btn.classList.add("rec");
    } catch (e) { recognition = null; }
  });
}
function stopMic() {
  if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
  const btn = $("#mic-btn");
  if (btn) btn.classList.remove("rec");
}

// ── Event-Verkabelung ───────────────────────────────────
function init() {
  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.next === "3") {
        const nameInput = $("#name-input");
        if (nameInput && nameInput.value.trim()) {
          state.name = nameInput.value.trim().slice(0, 20);
          saveState();
        }
      }
      document.querySelectorAll(".onb-step").forEach((s) => s.classList.add("hidden"));
      document.querySelector(`.onb-step[data-step="${btn.dataset.next}"]`).classList.remove("hidden");
    });
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
      $(`#view-${btn.dataset.view}`).classList.remove("hidden");
    });
  });

  // Wette-Modal
  $("#wette-prob").addEventListener("input", (e) => { $("#wette-prob-val").textContent = `${e.target.value} %`; });
  $("#fear-before").addEventListener("input", (e) => { $("#fear-before-val").textContent = `${e.target.value}/10`; });
  $("#wette-place").addEventListener("click", () => {
    const text = $("#wette-text").value.trim();
    if (text.length < 3) {
      showToast("Ohne Befürchtung keine Wette – schreib kurz, was du fürchtest.");
      return;
    }
    state.currentWette = { text, prob: Number($("#wette-prob").value), fearBefore: Number($("#fear-before").value) };
    saveState();
    closeWette();
    render();
  });
  $("#wette-cancel").addEventListener("click", closeWette);

  // Reflexions-Modal
  $("#fear-after").addEventListener("input", (e) => { $("#fear-after-val").textContent = `${e.target.value}/10`; });
  $("#fear-before2").addEventListener("input", (e) => { $("#fear-before2-val").textContent = `${e.target.value}/10`; });
  document.querySelectorAll("#eingetreten-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#eingetreten-seg button").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
    });
  });
  $("#reflect-save").addEventListener("click", saveReflect);
  $("#reflect-cancel").addEventListener("click", closeReflect);

  // Feier-Overlay
  $("#cele-done").addEventListener("click", () => $("#celebrate").classList.add("hidden"));

  setupMic();
  render();
}

// Service Worker (nur online-Version, nicht im lokalen Test)
if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

init();
