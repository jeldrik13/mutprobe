// ═══ Mutprobe – App-Logik ═══

const STORAGE_KEY = "mutprobe-state-v1";

const defaultState = () => ({
  track: null,
  xp: 0,
  koerbe: 0,
  streak: 0,
  bestStreak: 0,
  lastDoneDay: null,      // "YYYY-MM-DD" des letzten Tages mit Eintrag
  todayKey: null,          // Tag, für den todayPicks/currentChallenge gelten
  todayPicks: [],          // 3 vorgeschlagene Challenge-IDs
  currentChallengeId: null,
  doneToday: false,
  history: [],             // { date, challengeId, outcome, text, fearBefore, fearAfter, xp }
  earnedBadges: [],
});

let state = loadState();
let pendingOutcome = null; // { challengeId, outcome } während das Reflexions-Modal offen ist

// ── Persistenz ──────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch (e) { /* korrupte Daten → frisch starten */ }
  return defaultState();
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Helfer ──────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

function currentLevel() {
  let lvl = 0;
  LEVELS.forEach((l, i) => { if (state.xp >= l.xp) lvl = i; });
  return lvl;
}
function unlockedStufen() {
  const lvl = currentLevel();
  if (lvl >= 4) return [1, 2, 3];
  if (lvl >= 2) return [1, 2];
  return [1];
}
function showToast(msg, ms = 2600) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), ms);
}

// ── Tages-Logik ─────────────────────────────────────────
function ensureToday() {
  const today = todayStr();
  if (state.todayKey !== today) {
    state.todayKey = today;
    state.doneToday = false;
    state.currentChallengeId = null;
    state.todayPicks = pickChallenges(3);
    saveState();
  }
}
function pickChallenges(n) {
  const stufen = unlockedStufen();
  const maxStufe = Math.max(...stufen);
  const pool = CHALLENGES.filter((c) => c.track === state.track && stufen.includes(c.stufe));
  const recent = state.history.slice(-6).map((h) => h.challengeId);
  const fresh = pool.filter((c) => !recent.includes(c.id));
  const usable = fresh.length >= n ? fresh : pool;
  // Höchste freigeschaltete Stufe leicht bevorzugen, dann mischen
  const shuffled = [...usable].sort(() => Math.random() - 0.5);
  shuffled.sort((a, b) => (b.stufe === maxStufe ? 1 : 0) - (a.stufe === maxStufe ? 1 : 0) + (Math.random() - 0.5));
  return shuffled.slice(0, n).map((c) => c.id);
}

// ── Rendering ───────────────────────────────────────────
function render() {
  const onb = $("#onboarding"), main = $("#main");
  if (!state.track) {
    onb.classList.remove("hidden");
    main.classList.add("hidden");
    renderTrackList();
    return;
  }
  onb.classList.add("hidden");
  main.classList.remove("hidden");
  ensureToday();
  renderHeader();
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
    btn.innerHTML = `<div class="t-name">${t.emoji} ${t.name}</div><div class="t-desc">${t.beschreibung}</div>`;
    btn.addEventListener("click", () => {
      state.track = key;
      saveState();
      render();
    });
    list.appendChild(btn);
  });
}

function renderHeader() {
  const t = TRACKS[state.track];
  $("#header-track").textContent = `${t.emoji} ${t.name}`;
  $("#header-streak").textContent = `🔥 ${state.streak} ${state.streak === 1 ? "Tag" : "Tage"}`;
  const lvl = currentLevel();
  const cur = LEVELS[lvl];
  const next = LEVELS[lvl + 1];
  $("#level-name").textContent = `Lv. ${lvl + 1} · ${cur.name}`;
  if (next) {
    $("#level-xp").textContent = `${state.xp} / ${next.xp} XP`;
    const pct = ((state.xp - cur.xp) / (next.xp - cur.xp)) * 100;
    $("#level-progress").style.width = `${Math.min(100, pct)}%`;
  } else {
    $("#level-xp").textContent = `${state.xp} XP · Max-Level!`;
    $("#level-progress").style.width = "100%";
  }
}

function renderHeute() {
  const v = $("#view-heute");
  if (state.doneToday) {
    v.innerHTML = `
      <div class="card done-hero">
        <div class="big">🎉</div>
        <h2>Mutprobe erledigt!</h2>
        <p class="muted">Für heute bist du durch. Das Leben darf jetzt wieder unernst sein.</p>
        <p style="margin-top:12px">Morgen wartet die nächste Challenge.</p>
      </div>`;
    return;
  }
  const current = CHALLENGES.find((c) => c.id === state.currentChallengeId);
  if (!current) {
    // Auswahl aus 3 Vorschlägen
    const picks = state.todayPicks
      .map((id) => CHALLENGES.find((c) => c.id === id))
      .filter(Boolean);
    v.innerHTML = `<h2>Wähle deine heutige Mutprobe</h2>`;
    picks.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "card pick-card";
      btn.innerHTML = `
        <span class="stufe-tag">Stufe ${c.stufe} · ${XP_BY_STUFE[c.stufe]} XP</span>
        <div class="c-text">${c.text}</div>`;
      btn.addEventListener("click", () => {
        state.currentChallengeId = c.id;
        saveState();
        render();
      });
      v.appendChild(btn);
    });
    const reroll = document.createElement("button");
    reroll.className = "btn ghost";
    reroll.textContent = "🎲 Andere Vorschläge";
    reroll.addEventListener("click", () => {
      state.todayPicks = pickChallenges(3);
      saveState();
      render();
    });
    v.appendChild(reroll);
    return;
  }
  // Aktive Challenge
  v.innerHTML = `
    <h2>Deine heutige Mutprobe</h2>
    <div class="card challenge-card">
      <span class="stufe-tag">Stufe ${current.stufe} · ${XP_BY_STUFE[current.stufe]} XP</span>
      <div class="c-text">${current.text}</div>
      ${current.tipp ? `<div class="c-tipp">💡 ${current.tipp}</div>` : ""}
    </div>
    <button class="btn success" id="btn-done">✅ Geschafft!</button>
    ${current.korbMoeglich ? `<button class="btn korb" id="btn-korb">🧺 Korb kassiert (+${XP_KORB_BONUS} Bonus-XP!)</button>` : ""}
    <button class="btn ghost" id="btn-skip">Heute nicht geschafft – ehrlich gesagt</button>
    <button class="btn ghost small" id="btn-change">↩︎ Andere Challenge wählen</button>`;
  $("#btn-done").addEventListener("click", () => openReflect(current.id, "done"));
  const korbBtn = $("#btn-korb");
  if (korbBtn) korbBtn.addEventListener("click", () => openReflect(current.id, "korb"));
  $("#btn-skip").addEventListener("click", () => openReflect(current.id, "skip"));
  $("#btn-change").addEventListener("click", () => {
    state.currentChallengeId = null;
    saveState();
    render();
  });
}

function renderFortschritt() {
  const v = $("#view-fortschritt");
  const lvl = currentLevel();
  v.innerHTML = `
    <h2>Dein Fortschritt</h2>
    <div class="stats-grid">
      <div class="stat"><div class="num">${state.xp}</div><div class="lbl">XP gesamt</div></div>
      <div class="stat"><div class="num">${state.history.length}</div><div class="lbl">Mutproben</div></div>
      <div class="stat"><div class="num">🧺 ${state.koerbe}</div><div class="lbl">Körbe gesammelt</div></div>
      <div class="stat"><div class="num">🔥 ${state.bestStreak}</div><div class="lbl">Beste Serie</div></div>
    </div>
    <h2>Abzeichen</h2>
    <div class="badge-grid" id="badge-grid"></div>
    <h2>Track</h2>
    <div class="card">
      <p class="small muted" style="margin-bottom:8px">Aktuell: ${TRACKS[state.track].emoji} ${TRACKS[state.track].name} · Level ${lvl + 1}</p>
      <button class="btn ghost" id="btn-switch-track">Track wechseln</button>
      <button class="btn ghost" id="btn-reset" style="color:var(--danger)">Alles zurücksetzen</button>
    </div>`;
  const grid = $("#badge-grid");
  BADGES.forEach((b) => {
    const earned = b.check(state);
    const el = document.createElement("div");
    el.className = "badge" + (earned ? "" : " locked");
    el.innerHTML = `<span class="b-emoji">${b.emoji}</span>${b.name}`;
    grid.appendChild(el);
  });
  $("#btn-switch-track").addEventListener("click", () => {
    state.track = null;
    state.currentChallengeId = null;
    state.todayKey = null;
    saveState();
    render();
  });
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich ALLES löschen? XP, Körbe, Journal – alles weg.")) {
      state = defaultState();
      saveState();
      render();
    }
  });
}

function renderJournal() {
  const v = $("#view-journal");
  v.innerHTML = `<h2>Dein Journal</h2>`;
  if (state.history.length === 0) {
    v.innerHTML += `<div class="card"><p class="muted">Noch keine Einträge. Deine erste Mutprobe wartet im „Heute“-Tab. 🎯</p></div>`;
    return;
  }
  const outcomeLabel = { done: "✅ Geschafft", korb: "🧺 Korb kassiert", skip: "⏭️ Ausgelassen" };
  [...state.history].reverse().forEach((h) => {
    const c = CHALLENGES.find((x) => x.id === h.challengeId);
    const el = document.createElement("div");
    el.className = "journal-entry";
    el.innerHTML = `
      <div class="j-head">
        <span>${h.date}</span>
        <span class="outcome-${h.outcome}">${outcomeLabel[h.outcome]} · +${h.xp} XP</span>
      </div>
      <div class="j-challenge">${c ? c.text : "(Challenge)"} </div>
      <div class="j-text">${escapeHtml(h.text)}</div>
      <div class="j-fear">Angst: ${h.fearBefore} → ${h.fearAfter}</div>`;
    v.appendChild(el);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// ── Reflexion & XP ──────────────────────────────────────
function openReflect(challengeId, outcome) {
  pendingOutcome = { challengeId, outcome };
  const titles = {
    done: "Stark! Kurz reflektieren 💪",
    korb: "Ein Korb! Glückwunsch, du lebst noch 🧺",
    skip: "Ehrlichkeit zählt auch 🤍",
  };
  $("#modal-title").textContent = titles[outcome];
  $("#reflect-text").value = "";
  $("#modal-error").classList.add("hidden");
  $("#modal").classList.remove("hidden");
}

function closeReflect() {
  $("#modal").classList.add("hidden");
  pendingOutcome = null;
}

function saveReflect() {
  if (!pendingOutcome) return;
  const text = $("#reflect-text").value.trim();
  if (text.length < 5) {
    $("#modal-error").classList.remove("hidden");
    return;
  }
  const { challengeId, outcome } = pendingOutcome;
  const c = CHALLENGES.find((x) => x.id === challengeId);
  let xp = 0;
  if (outcome === "done") xp = XP_BY_STUFE[c.stufe];
  if (outcome === "korb") { xp = XP_BY_STUFE[c.stufe] + XP_KORB_BONUS; state.koerbe += 1; }
  if (outcome === "skip") xp = XP_EHRLICHKEIT;

  const prevLevel = currentLevel();
  const prevBadges = BADGES.filter((b) => b.check(state)).map((b) => b.id);

  // Streak aktualisieren
  const today = todayStr();
  if (state.lastDoneDay !== today) {
    state.streak = state.lastDoneDay === yesterdayStr() ? state.streak + 1 : 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.lastDoneDay = today;
  }

  state.history.push({
    date: today,
    challengeId,
    outcome,
    text,
    fearBefore: Number($("#fear-before").value),
    fearAfter: Number($("#fear-after").value),
    xp,
  });
  state.xp += xp;
  state.doneToday = true;
  state.currentChallengeId = null;
  saveState();
  closeReflect();
  render();

  // Feedback
  const newLevel = currentLevel();
  const newBadges = BADGES.filter((b) => b.check(state) && !prevBadges.includes(b.id));
  if (newLevel > prevLevel) {
    showToast(`🎖️ Level up! Du bist jetzt: ${LEVELS[newLevel].name}`, 3500);
  } else if (newBadges.length > 0) {
    showToast(`${newBadges[0].emoji} Neues Abzeichen: ${newBadges[0].name}!`, 3500);
  } else {
    showToast(`+${xp} XP kassiert!`);
  }
}

// ── Event-Verkabelung ───────────────────────────────────
function init() {
  // Onboarding-Schritte
  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".onb-step").forEach((s) => s.classList.add("hidden"));
      document.querySelector(`.onb-step[data-step="${btn.dataset.next}"]`).classList.remove("hidden");
    });
  });
  // Tab-Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
      $(`#view-${btn.dataset.view}`).classList.remove("hidden");
    });
  });
  // Modal
  $("#modal-save").addEventListener("click", saveReflect);
  $("#modal-cancel").addEventListener("click", closeReflect);
  $("#fear-before").addEventListener("input", (e) => { $("#fear-before-val").textContent = e.target.value; });
  $("#fear-after").addEventListener("input", (e) => { $("#fear-after-val").textContent = e.target.value; });

  render();
}

init();
