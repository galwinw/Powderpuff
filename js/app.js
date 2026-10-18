import { POSITIONS, OFFENSE_IDS, DEFENSE_IDS, ROUTES, SITUATIONS, GLOSSARY, GROUPS } from "./data.js";
import { state, init, save, cloud, canEdit, login, logout, setMe, setLocalCoach, resetToDefault, bus } from "./store.js";
import { drawPlay, Animator, posInfo } from "./field.js";
import { mountEditor, newPlay } from "./editor.js";

const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let cleanup = [];
const onLeave = (fn) => cleanup.push(fn);

// ---------- Helpers ----------
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

function plays(side) {
  return state.playbook.plays.filter((p) => p.side === side);
}

function rosterPlayer(id) {
  return state.roster.players.find((p) => p.id === id);
}

function myPos(side) {
  const me = state.me;
  if (!me) return null;
  const src = me.playerId ? rosterPlayer(me.playerId) || me : me;
  return side === "offense" ? src.offense || null : src.defense || null;
}

function myName() {
  const me = state.me;
  if (!me) return null;
  if (me.playerId) return rosterPlayer(me.playerId)?.name || me.name || null;
  return me.name || null;
}

function namesAt(pos, side) {
  return state.roster.players.filter((p) => (side === "offense" ? p.offense : p.defense) === pos).map((p) => p.name);
}

function dot(id, big = false) {
  return `<span class="dot${big ? " big" : ""}" style="background:${posInfo(id).color}"></span>`;
}

function labelFor(play, id) {
  return play.players.find((p) => p.id === id)?.label || posInfo(id).name;
}

function routeLink(rid) {
  const r = ROUTES.find((x) => x.id === rid);
  return r ? `<a class="route-link" href="#/learn/routes/${r.id}">${esc(r.name)} route ›</a>` : "";
}

function renderMeChip() {
  const chip = $("#me-chip");
  const name = myName();
  const pos = myPos("offense") || myPos("defense");
  chip.innerHTML = name || pos
    ? `${pos ? dot(pos) : ""}<span>${esc(name || posInfo(pos).name)}</span>`
    : `<span>Who are you?</span>`;
}

function setActiveTab(page) {
  const map = { play: null, edit: null };
  let tab = page in map ? null : page;
  if (page === "play" || page === "edit") {
    const id = location.hash.split("/")[2];
    const p = state.playbook.plays.find((x) => x.id === id);
    tab = p?.side === "defense" ? "defense" : "plays";
    if (id === "new-defense") tab = "defense";
  }
  for (const a of document.querySelectorAll(".tabs a")) a.classList.toggle("on", a.dataset.tab === tab);
}

// ---------- "Who are you?" dialog ----------
function openMeDialog() {
  const dlg = $("#me-dialog");
  const roster = state.roster.players;
  const posOptions = (ids, cur) => `<option value="">Not sure yet</option>` + ids.map((id) => `<option value="${id}" ${cur === id ? "selected" : ""}>${esc(POSITIONS[id].name)}</option>`).join("");
  dlg.innerHTML = `
    <form method="dialog" class="dialog-body">
      <h2>Who are you?</h2>
      <p class="muted">We'll highlight your job in every play. This is saved on this device only.</p>
      ${roster.length ? `
        <div class="pick-list">
          ${roster.map((p) => `<button type="button" class="pick ${state.me?.playerId === p.id ? "on" : ""}" data-me="${p.id}">
            <strong>${esc(p.name)}</strong>
            <span class="muted">${p.offense ? esc(POSITIONS[p.offense].name) : "—"} · ${p.defense ? esc(POSITIONS[p.defense].name) : "—"}</span>
          </button>`).join("")}
        </div>
        <p class="muted small">Not on the list? Pick your positions instead:</p>` : `<p class="muted small">The roster is empty, so pick your positions:</p>`}
      <label class="field">Offense position<select id="me-off">${posOptions(OFFENSE_IDS, !state.me?.playerId ? state.me?.offense : "")}</select></label>
      <label class="field">Defense position<select id="me-def">${posOptions(DEFENSE_IDS, !state.me?.playerId ? state.me?.defense : "")}</select></label>
      <div class="row wrap">
        <button type="button" class="btn primary" id="me-save">Use these positions</button>
        ${state.me ? `<button type="button" class="btn" id="me-clear">Clear</button>` : ""}
        <button type="button" class="btn" id="me-close">Close</button>
      </div>
    </form>`;
  dlg.onclick = (e) => {
    const b = e.target.closest("[data-me]");
    if (b) { setMe({ playerId: b.dataset.me }); dlg.close(); toast("Your plays are highlighted now."); }
    if (e.target.id === "me-save") {
      const offense = $("#me-off", dlg).value || null, defense = $("#me-def", dlg).value || null;
      setMe(offense || defense ? { offense, defense } : null);
      dlg.close();
    }
    if (e.target.id === "me-clear") { setMe(null); dlg.close(); }
    if (e.target.id === "me-close") dlg.close();
    if (e.target === dlg) dlg.close();
  };
  dlg.showModal();
}

// ---------- Playbook list ----------
function renderPlays(side) {
  const list = plays(side);
  const groups = GROUPS[side].filter((g) => list.some((p) => p.group === g));
  let filter = sessionStorage.getItem("filter:" + side) || "All";
  if (filter !== "All" && !groups.includes(filter)) filter = "All";
  const mine = myPos(side);

  view.innerHTML = `
    <div class="page-head">
      <h1>${side === "offense" ? "Offense" : "Defense"}</h1>
      <p class="lede">${side === "offense"
        ? "Tap a play to watch it run. Every play uses the same formation, so you always line up in the same spot."
        : "We use two defenses. Tap one to see where you go."}</p>
    </div>
    ${!mine ? `<button type="button" class="banner" id="who">${state.me ? "Pick your " + side + " position" : "Tell us who you are"} to see your job highlighted in every play →</button>` : ""}
    <div class="chips" role="group" aria-label="Filter plays">
      ${["All", ...groups].map((g) => `<button type="button" class="chip ${g === filter ? "on" : ""}" data-filter="${g}">${g}</button>`).join("")}
    </div>
    <div class="cards" id="cards"></div>
    ${canEdit() ? `<a class="btn primary add" href="#/edit/new-${side}">+ New ${side} play</a>` : ""}`;

  function draw() {
    const shown = list.filter((p) => filter === "All" || p.group === filter);
    $("#cards").innerHTML = shown.length ? shown.map((p) => {
      const me = mine && p.players.find((x) => x.id === mine);
      return `
      <a class="play-card" href="#/play/${p.id}">
        <svg class="thumb" data-play="${p.id}" role="img" aria-label="${esc(p.name)} diagram"></svg>
        <div class="play-card-body">
          <div class="row between"><h2>${esc(p.name)}</h2><span class="pill">${esc(p.group)}</span></div>
          <p>${esc(p.summary)}</p>
          ${me ? `<p class="you">${dot(mine)} <strong>You:</strong> ${esc(me.note.split(/(?<=\.)\s/)[0])}</p>` : ""}
        </div>
      </a>`;
    }).join("") : `<p class="empty">No ${side} plays yet.${canEdit() ? " Add the first one below." : ""}</p>`;
    for (const svg of view.querySelectorAll("svg[data-play]")) {
      const p = list.find((x) => x.id === svg.dataset.play);
      drawPlay(svg, p, { thumb: true, highlight: mine });
    }
  }
  draw();
  view.querySelector(".chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    filter = b.dataset.filter;
    sessionStorage.setItem("filter:" + side, filter);
    for (const c of view.querySelectorAll("[data-filter]")) c.classList.toggle("on", c === b);
    draw();
  });
  $("#who")?.addEventListener("click", openMeDialog);
}

// ---------- Play detail ----------
function renderPlay(id) {
  const play = state.playbook.plays.find((p) => p.id === id);
  if (!play) { view.innerHTML = `<p class="empty">That play doesn't exist anymore. <a href="#/plays">Back to plays</a></p>`; return; }
  const side = play.side;
  const mine = myPos(side);
  let selected = mine && play.players.some((p) => p.id === mine) ? mine : null;
  const situations = SITUATIONS.filter((s) => play.situations?.includes(s.id));

  view.innerHTML = `
    <div class="page-head">
      <a class="back" href="#/${side === "offense" ? "plays" : "defense"}">← ${side === "offense" ? "Offense" : "Defense"}</a>
      <div class="row between wrap">
        <h1>${esc(play.name)}</h1>
        ${canEdit() ? `<a class="btn small" href="#/edit/${play.id}">Edit play</a>` : ""}
      </div>
      <div class="row wrap gap-s"><span class="pill">${esc(play.group)}</span>${situations.map((s) => `<span class="pill soft">${esc(s.label)}</span>`).join("")}</div>
      <p class="lede">${esc(play.summary)}</p>
    </div>
    <div class="play-layout">
      <section class="card field-card">
        <svg id="field" class="field-svg" role="img" aria-label="${esc(play.name)} animated diagram"></svg>
        <div class="controls">
          <button type="button" class="btn icon" id="pp" aria-label="Play">▶</button>
          <input type="range" id="scrub" min="0" max="1000" value="0" aria-label="Play timeline">
          <button type="button" class="btn small" id="spd">1×</button>
        </div>
        <p class="status" id="status" aria-live="polite">Tap ▶ to run the play. Tap a player to see their job.</p>
        <ul class="legend">
          <li><b>Blue line</b> = line of scrimmage</li>
          <li><b>→</b> run this way</li>
          ${side === "offense" ? `<li><b>⊥</b> block here</li>` : `<li><b>- - →</b> rush / follow</li><li><b>Shaded area</b> = your zone</li>`}
        </ul>
      </section>
      <aside class="play-side">
        <section class="card job" id="job"></section>
        <section class="card">
          <h2>Why it works</h2>
          <p>${esc(play.why)}</p>
          ${play.qbRead ? `<h3>QB's reads</h3><p>${esc(play.qbRead)}</p>` : ""}
        </section>
        <section class="card">
          <h2>Everyone's job</h2>
          <ul class="assign" id="assign"></ul>
        </section>
      </aside>
    </div>`;

  let anim = null;
  anim = new Animator($("#field"), play, {
    highlight: selected,
    onPlayer: (pid) => select(pid),
    onTick: (t, label) => {
      if (!anim) return;
      const k = (t - anim.tl.tMin) / (anim.tl.tMax - anim.tl.tMin);
      $("#scrub").value = Math.round(k * 1000);
      if (anim.playing || t > anim.tl.tMin) $("#status").textContent = label;
    },
    onEnd: () => { $("#pp").textContent = "↺"; $("#pp").setAttribute("aria-label", "Replay"); },
  });
  onLeave(() => anim.destroy());

  $("#pp").addEventListener("click", () => {
    if (anim.playing) { anim.pause(); $("#pp").textContent = "▶"; $("#pp").setAttribute("aria-label", "Play"); }
    else { anim.start(); $("#pp").textContent = "❚❚"; $("#pp").setAttribute("aria-label", "Pause"); }
  });
  $("#scrub").addEventListener("input", (e) => {
    anim.pause();
    $("#pp").textContent = "▶";
    anim.setTime(anim.tl.tMin + (e.target.value / 1000) * (anim.tl.tMax - anim.tl.tMin));
  });
  $("#spd").addEventListener("click", (e) => {
    anim.speed = anim.speed === 1 ? 0.5 : 1;
    e.target.textContent = anim.speed === 1 ? "1×" : "½×";
  });

  function select(pid) {
    selected = selected === pid ? null : pid;
    anim.setHighlight(selected);
    drawJob();
    drawAssign();
  }

  function drawJob() {
    const box = $("#job");
    if (!selected) {
      box.innerHTML = mine
        ? `<h2>Your job</h2><p class="muted">Your position (${esc(posInfo(mine).name)}) isn't in this play.</p>`
        : `<h2>Find your job</h2><p class="muted">Tap any player on the field, or <button type="button" class="linkish" id="who2">tell us who you are</button> to always see your job first.</p>`;
      $("#who2")?.addEventListener("click", openMeDialog);
      return;
    }
    const p = play.players.find((x) => x.id === selected);
    const names = namesAt(selected, side);
    box.innerHTML = `
      <h2>${dot(selected, true)}${selected === mine ? "Your job" : esc(labelFor(play, selected))}</h2>
      <p class="muted small">${esc(labelFor(play, selected))}${names.length ? " · " + esc(names.join(", ")) : ""}</p>
      <p class="job-text">${esc(p.note || "No instructions yet.")}</p>
      ${p.route ? routeLink(p.route) : ""}
      <a class="route-link" href="#/learn/positions#${selected}">About this position ›</a>`;
  }

  function drawAssign() {
    $("#assign").innerHTML = play.players.map((p) => {
      const names = namesAt(p.id, side);
      return `<li><button type="button" class="assign-row ${p.id === selected ? "on" : ""}" data-pid="${p.id}">
        ${dot(p.id)}<span><strong>${esc(labelFor(play, p.id))}</strong>${names.length ? ` <span class="muted">· ${esc(names.join(", "))}</span>` : ""}<br><span class="muted">${esc(p.note)}</span></span>
      </button></li>`;
    }).join("");
  }
  $("#assign").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pid]");
    if (b) { select(b.dataset.pid); $("#field").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
  });

  drawJob();
  drawAssign();
}

// ---------- Editor ----------
function renderEdit(id) {
  if (!canEdit()) { view.innerHTML = `<p class="empty">Only coaches can edit plays. <a href="#/team">Coach login</a></p>`; return; }
  const isNew = id === "new-offense" || id === "new-defense";
  const play = isNew ? newPlay(id === "new-offense" ? "offense" : "defense") : state.playbook.plays.find((p) => p.id === id);
  if (!play) { view.innerHTML = `<p class="empty">Play not found.</p>`; return; }
  const back = () => { location.hash = isNew ? (play.side === "offense" ? "#/plays" : "#/defense") : `#/play/${play.id}`; };
  const ed = mountEditor(view, play, {
    isNew,
    onCancel: back,
    onSave: async (updated) => {
      const list = state.playbook.plays;
      const i = list.findIndex((p) => p.id === updated.id);
      const before = structuredClone(state.playbook);
      if (i >= 0) list[i] = updated; else list.push(updated);
      try { await save("playbook"); }
      catch (e) { state.playbook = before; throw e; }
      toast("Play saved.");
      location.hash = `#/play/${updated.id}`;
    },
    onDelete: async (p) => {
      const before = structuredClone(state.playbook);
      state.playbook.plays = state.playbook.plays.filter((x) => x.id !== p.id);
      try { await save("playbook"); }
      catch (e) { state.playbook = before; toast("Couldn't delete: " + e.message); return; }
      toast("Play deleted.");
      location.hash = p.side === "offense" ? "#/plays" : "#/defense";
    },
  });
  onLeave(() => ed.destroy());
}

// ---------- Learn ----------
function renderLearn(sub, extra) {
  if (sub === "positions") return renderPositions();
  if (sub === "routes") return renderRoutes(extra);
  if (sub === "rules") return renderRules();
  view.innerHTML = `
    <div class="page-head"><h1>Learn</h1><p class="lede">New to football? Start here. Everything is explained in plain words.</p></div>
    <div class="learn-grid">
      <a class="learn-card" href="#/learn/rules"><strong>Rules &amp; words</strong><span>How our games work, plus a glossary of football terms.</span></a>
      <a class="learn-card" href="#/learn/positions"><strong>Positions</strong><span>What each spot does on offense and defense, and who plays it.</span></a>
      <a class="learn-card" href="#/learn/routes"><strong>Routes</strong><span>The paths receivers run, animated, with step-by-step directions.</span></a>
      <a class="learn-card" href="#/gameday"><strong>Game Day</strong><span>Which play to call in each situation.</span></a>
    </div>`;
}

function renderPositions() {
  const section = (ids, title) => `
    <h2 class="section-title">${title}</h2>
    <div class="pos-grid">
      ${ids.map((id) => {
        const p = POSITIONS[id];
        const names = namesAt(id, p.side);
        const isMe = myPos(p.side) === id;
        return `<article class="card pos-card ${isMe ? "is-me" : ""}" id="${id}">
          <h3>${dot(id, true)}${esc(p.name)}${isMe ? ` <span class="pill">You</span>` : ""}</h3>
          <p>${esc(p.job)}</p>
          <ul class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <p class="muted small"><strong>Good fit:</strong> ${esc(p.good)}</p>
          ${names.length ? `<p class="small"><strong>Playing here:</strong> ${esc(names.join(", "))}</p>` : ""}
        </article>`;
      }).join("")}
    </div>`;
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/learn">← Learn</a><h1>Positions</h1>
    <p class="lede">Each position has the same color in every play diagram.</p></div>
    ${section(OFFENSE_IDS, "Offense")}
    ${section(DEFENSE_IDS, "Defense")}`;
  const target = location.hash.split("#")[2];
  if (target) document.getElementById(target)?.scrollIntoView();
}

function renderRoutes(focus) {
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/learn">← Learn</a><h1>Routes</h1>
    <p class="lede">A route is the path you run. Tap any route to replay it.</p></div>
    <div class="route-grid">
      ${ROUTES.map((r) => `
        <article class="card route-card ${r.id === focus ? "focus" : ""}" id="route-${r.id}">
          <svg class="route-svg" data-route="${r.id}" role="img" aria-label="${esc(r.name)} route animation"></svg>
          <div><h3>${esc(r.name)}</h3><p>${esc(r.steps)}</p><p class="muted small">${esc(r.use)}</p></div>
        </article>`).join("")}
    </div>`;
  for (const svg of view.querySelectorAll("svg[data-route]")) {
    const r = ROUTES.find((x) => x.id === svg.dataset.route);
    const demo = { players: [{ id: "RS", start: r.start, path: r.path, kind: r.kind || "route" }], ghosts: r.ghosts || [] };
    const a = new Animator(svg, demo, { loop: !reduceMotion });
    a.speed = 0.8;
    if (!reduceMotion) a.start(); else a.setTime(a.tl.tMax);
    svg.closest(".route-card").addEventListener("click", () => { a.setTime(a.tl.tMin); a.start(); });
    onLeave(() => a.destroy());
  }
  if (focus) document.getElementById("route-" + focus)?.scrollIntoView({ block: "center" });
}

function renderRules() {
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/learn">← Learn</a><h1>Rules &amp; words</h1></div>
    <section class="card">
      <h2>Our league rules</h2>
      <ol class="rules">${state.settings.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
      ${canEdit() ? `<p class="muted small">Coaches can change these on the Team page.</p>` : ""}
    </section>
    <section class="card">
      <h2>Football words</h2>
      <dl class="glossary">${GLOSSARY.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("")}</dl>
    </section>`;
}

// ---------- Game Day ----------
function renderGameDay() {
  let gd;
  try { gd = JSON.parse(sessionStorage.getItem("gameday")) || null; } catch { gd = null; }
  gd = gd || { down: 1, firsts: 0, qbRun: false };
  const saveGd = () => { try { sessionStorage.setItem("gameday", JSON.stringify(gd)); } catch { /* ignore */ } };

  const callList = (side) => SITUATIONS.filter((s) => s.side === side).map((s) => {
    const ps = plays(side).filter((p) => p.situations?.includes(s.id));
    return `<div class="call">
      <div><strong>${esc(s.label)}</strong><span class="muted small">${esc(s.hint)}</span></div>
      <div class="call-plays">${ps.length ? ps.map((p) => `<a class="call-btn" href="#/play/${p.id}">${esc(p.name)}</a>`).join("") : `<span class="muted small">No play tagged yet</span>`}</div>
    </div>`;
  }).join("");

  view.innerHTML = `
    <div class="page-head"><h1>Game Day</h1><p class="lede">Big buttons for the sideline. Tap a play to see it.</p></div>
    <section class="card tracker">
      <h2>Drive tracker</h2>
      <div class="tracker-grid">
        <div><span class="muted small">Down</span><div class="seg" id="downs">${[1, 2, 3, 4].map((d) => `<button type="button" class="seg-btn ${gd.down === d ? "on" : ""}" data-down="${d}">${d}</button>`).join("")}</div></div>
        <div><span class="muted small">First downs this drive</span><div class="seg" id="firsts">${[0, 1, 2].map((f) => `<button type="button" class="seg-btn ${gd.firsts === f ? "on" : ""}" data-first="${f}">${f}/2</button>`).join("")}</div></div>
        <div><span class="muted small">QB run this set</span><button type="button" class="qb-run ${gd.qbRun ? "used" : ""}" id="qbrun">${gd.qbRun ? "Used" : "Available"}</button></div>
      </div>
      <p class="muted small">Getting a first down resets the down to 1 and makes the QB run available again.</p>
    </section>
    <section class="card"><h2>Offense: what to call</h2>${callList("offense")}</section>
    <section class="card"><h2>Defense: what to call</h2>${callList("defense")}</section>`;

  const tracker = view.querySelector(".tracker");
  tracker.addEventListener("click", (e) => {
    const d = e.target.closest("[data-down]"), f = e.target.closest("[data-first]");
    if (d) gd.down = Number(d.dataset.down);
    else if (f) {
      const n = Number(f.dataset.first);
      if (n > gd.firsts) { gd.down = 1; gd.qbRun = false; }
      gd.firsts = n;
    } else if (e.target.id === "qbrun") gd.qbRun = !gd.qbRun;
    else return;
    saveGd();
    renderGameDay();
  });
}

// ---------- Team ----------
function renderTeam() {
  const roster = state.roster.players;
  const editable = canEdit();
  const posSelect = (ids, cur, attr) => `<select ${attr}><option value="">—</option>${ids.map((id) => `<option value="${id}" ${cur === id ? "selected" : ""}>${esc(POSITIONS[id].name)}</option>`).join("")}</select>`;

  view.innerHTML = `
    <div class="page-head"><h1>Team</h1><p class="lede">${esc(state.settings.teamName)}</p></div>
    <section class="card">
      <div class="row between wrap"><h2>Roster</h2><button type="button" class="btn small" id="whoami">${state.me ? "Change who I am" : "Who am I?"}</button></div>
      ${roster.length ? `
      <div class="table-wrap"><table class="roster">
        <thead><tr><th>Name</th><th>Offense</th><th>Defense</th>${editable ? "<th></th>" : ""}</tr></thead>
        <tbody>${roster.map((p) => editable ? `
          <tr data-row="${p.id}">
            <td><input value="${esc(p.name)}" data-k="name" aria-label="Name" maxlength="30"></td>
            <td>${posSelect(OFFENSE_IDS, p.offense, 'data-k="offense" aria-label="Offense position"')}</td>
            <td>${posSelect(DEFENSE_IDS, p.defense, 'data-k="defense" aria-label="Defense position"')}</td>
            <td><button type="button" class="btn small danger" data-remove="${p.id}" aria-label="Remove ${esc(p.name)}">✕</button></td>
          </tr>` : `
          <tr><td><strong>${esc(p.name)}</strong></td>
            <td>${p.offense ? dot(p.offense) + esc(POSITIONS[p.offense].name) : "—"}</td>
            <td>${p.defense ? dot(p.defense) + esc(POSITIONS[p.defense].name) : "—"}</td></tr>`).join("")}
        </tbody></table></div>` : `<p class="empty">No players yet.${editable ? " Add your team below. Names show up next to each position in the plays." : " A coach will add the roster soon."}</p>`}
      ${editable ? `
        <form class="row wrap add-player" id="add-player">
          <input id="np-name" placeholder="Player name" maxlength="30" aria-label="New player name" required>
          ${posSelect(OFFENSE_IDS, "", 'id="np-off" aria-label="Offense position"')}
          ${posSelect(DEFENSE_IDS, "", 'id="np-def" aria-label="Defense position"')}
          <button class="btn primary" type="submit">Add player</button>
        </form>
        <p class="muted small">Tip: use first names or nicknames. Anyone with the link can see this page.</p>` : ""}
    </section>
    ${editable ? `
    <section class="card">
      <h2>Team settings</h2>
      <label class="field">Team name<input id="team-name-in" maxlength="40" value="${esc(state.settings.teamName)}"></label>
      <label class="field">League rules (one per line)<textarea id="rules-in" rows="8">${esc(state.settings.rules.join("\n"))}</textarea></label>
      <div class="row wrap">
        <button type="button" class="btn primary" id="save-settings">Save settings</button>
        <button type="button" class="btn danger" id="reset-plays">Reset plays to the starter playbook</button>
      </div>
    </section>` : ""}
    <section class="card" id="coach"></section>`;

  $("#whoami").addEventListener("click", openMeDialog);
  renderCoachBox();

  if (!editable) return;
  const persistRoster = async (msg) => {
    try { await save("roster"); if (msg) toast(msg); renderMeChip(); }
    catch (e) { toast("Couldn't save: " + e.message); }
  };
  view.querySelector("table.roster")?.addEventListener("change", (e) => {
    const row = e.target.closest("[data-row]");
    if (!row) return;
    const p = rosterPlayer(row.dataset.row);
    const k = e.target.dataset.k;
    p[k] = k === "name" ? e.target.value.trim() || p.name : e.target.value || null;
    persistRoster("Roster saved.");
  });
  view.querySelector("table.roster")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Remove?"; return; }
    state.roster.players = roster.filter((p) => p.id !== b.dataset.remove);
    persistRoster("Player removed.").then(renderTeam);
  });
  $("#add-player").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#np-name").value.trim();
    if (!name) return;
    roster.push({ id: "p-" + Math.random().toString(36).slice(2, 8), name, offense: $("#np-off").value || null, defense: $("#np-def").value || null });
    persistRoster(`${name} added.`).then(() => { renderTeam(); $("#np-name").focus(); });
  });
  $("#save-settings").addEventListener("click", async () => {
    state.settings.teamName = $("#team-name-in").value.trim() || "Powderpuff Playbook";
    state.settings.rules = $("#rules-in").value.split("\n").map((s) => s.trim()).filter(Boolean);
    try { await save("settings"); toast("Settings saved."); applyTeamName(); renderTeam(); }
    catch (e) { toast("Couldn't save: " + e.message); }
  });
  const reset = $("#reset-plays");
  reset.addEventListener("click", async () => {
    if (!reset.dataset.armed) { reset.dataset.armed = "1"; reset.textContent = "Tap again: this replaces ALL plays"; return; }
    try { await resetToDefault("playbook"); toast("Plays reset to the starter playbook."); renderTeam(); }
    catch (e) { toast("Couldn't reset: " + e.message); }
  });
}

function renderCoachBox() {
  const box = $("#coach");
  if (!box) return;
  if (cloud.enabled) {
    if (cloud.user) {
      box.innerHTML = `<h2>Coach</h2><p>Logged in as <strong>${esc(cloud.user.email)}</strong>. Your changes save for the whole team.</p>
        <button type="button" class="btn" id="logout">Log out</button>`;
      $("#logout").addEventListener("click", async () => { await logout(); toast("Logged out."); route(); });
    } else {
      box.innerHTML = `<h2>Coach login</h2><p class="muted">Coaches log in to edit plays and the roster. Players don't need an account.</p>
        <form id="login" class="stack">
          <label class="field">Email<input type="email" id="lg-email" autocomplete="username" required></label>
          <label class="field">Password<input type="password" id="lg-pass" autocomplete="current-password" required></label>
          <p class="error" id="lg-err" role="alert"></p>
          <button class="btn primary" type="submit">Log in</button>
        </form>`;
      $("#login").addEventListener("submit", async (e) => {
        e.preventDefault();
        try { await login($("#lg-email").value, $("#lg-pass").value); toast("Welcome, coach."); route(); }
        catch (err) { $("#lg-err").textContent = err.message === "Invalid login credentials" ? "That email and password don't match a coach account." : err.message; }
      });
    }
    if (cloud.error) box.insertAdjacentHTML("beforeend", `<p class="error">Couldn't reach the team database (${esc(cloud.error)}). Showing the last saved copy.</p>`);
  } else {
    box.innerHTML = `<h2>Coach mode</h2>
      <p class="muted">Cloud saving isn't set up yet, so edits only save on <strong>this device</strong>. Once it's connected, coaches log in here and changes reach the whole team.</p>
      <button type="button" class="btn ${state.localCoach ? "" : "primary"}" id="local-coach">${state.localCoach ? "Turn off coach mode" : "Turn on coach mode"}</button>`;
    $("#local-coach").addEventListener("click", () => { setLocalCoach(!state.localCoach); route(); });
  }
}

function applyTeamName() {
  $("#team-name").textContent = state.settings.teamName;
  document.title = state.settings.teamName;
}

// ---------- Router ----------
function route() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
  const parts = (location.hash.replace(/^#\/?/, "").split("#")[0] || "plays").split("/");
  const [page, arg, extra] = parts;
  setActiveTab(page);
  switch (page) {
    case "plays": renderPlays("offense"); break;
    case "defense": renderPlays("defense"); break;
    case "play": renderPlay(arg); break;
    case "edit": renderEdit(arg); break;
    case "learn": renderLearn(arg, extra); break;
    case "gameday": renderGameDay(); break;
    case "team": renderTeam(); break;
    default: renderPlays("offense");
  }
  if (!location.hash.split("#")[2] && !(page === "learn" && extra)) window.scrollTo(0, 0);
}

async function start() {
  view.innerHTML = `<p class="empty">Loading the playbook…</p>`;
  await init();
  applyTeamName();
  renderMeChip();
  $("#me-chip").addEventListener("click", openMeDialog);
  bus.addEventListener("me", () => { renderMeChip(); route(); });
  bus.addEventListener("auth", () => { if (location.hash.startsWith("#/team")) renderCoachBox(); });
  window.addEventListener("hashchange", route);
  route();
}

start();
