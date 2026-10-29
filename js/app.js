import { POSITIONS, OFFENSE_IDS, DEFENSE_IDS, POSITION_GROUPS, ROUTE_LESSONS, SITUATIONS, GLOSSARY, GROUPS } from "./data.js?v=202610290234";
import { state, init, mutate, cloud, canEdit, setCoach, resetToDefault } from "./store.js?v=202610290234";
import { drawPlay, Animator, posInfo } from "./field.js?v=202610290234";
import { mountEditor, newPlay } from "./editor.js?v=202610290234";

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
  return state.playbook.plays.filter((p) => posSide(p.side) === side);
}

// Each offense group is its own mini playbook.
const PLAYBOOK_INFO = {
  Pass: { icon: "🎯", desc: "The QB throws it to someone. Know your route on each one." },
  Pitch: { icon: "🔄", desc: "The QB tosses it to a runner. Everyone else blocks for them." },
  Trick: { icon: "⭐", desc: "The ball changes hands more than once. Save these for when you need a big play." },
  "QB Run": { icon: "🏃", desc: "The QB keeps it. Only one QB run per set of downs, so pick the moment." },
  Coaches: { icon: "📋", desc: "Plays drawn by Galwin, Luan and Wyatt. Newest first." },
  Defense: { icon: "🛡️", desc: "Our man-to-man defense and our one blitz per set of downs." },
  Man: { icon: "🛡️", desc: "" },
  Blitz: { icon: "⚡", desc: "" },
};
const groupLabel = (g) => `${PLAYBOOK_INFO[g]?.icon ? PLAYBOOK_INFO[g].icon + " " : ""}${esc(g)}`;

// Special plays use the offense positions.
const posSide = (side) => (side === "defense" ? "defense" : "offense");
const TAB_FOR = { offense: "plays", special: "plays", defense: "defense" };
const SIDE_TITLE = { offense: "Offense", special: "Offense", defense: "Defense" };

function dot(id, big = false) {
  return `<span class="dot${big ? " big" : ""}" style="background:${posInfo(id).color}"></span>`;
}

function labelFor(play, id) {
  return play.players.find((p) => p.id === id)?.label || posInfo(id).name;
}

function routeLink(rid) {
  const r = ROUTE_LESSONS.find((x) => x.id === rid);
  return r ? `<a class="route-link" href="#/learn/routes/${r.id}">How to run a ${esc(r.name)} ›</a>` : "";
}

function groupOf(posId) {
  return POSITION_GROUPS.find((g) => g.ids.includes(posId));
}

// "Galwin's play", plus who changed it last if that's someone else.
function byline(p) {
  const parts = [];
  if (p.author) parts.push(`${p.author}'s play`);
  if (p.editedBy && p.editedBy !== p.author) parts.push(`${p.author ? "" : "Starter play · "}edited by ${p.editedBy}`);
  return parts.join(" · ");
}

function setActiveTab(page) {
  const map = { play: null, edit: null };
  let tab = page in map ? null : page;
  if (page === "play" || page === "edit") {
    const id = location.hash.split("/")[2];
    const p = state.playbook.plays.find((x) => x.id === id);
    tab = TAB_FOR[p?.side] || "plays";
    if (id?.startsWith("new-")) tab = TAB_FOR[id.slice(4)] || "plays";
  }
  for (const a of document.querySelectorAll(".tabs a")) a.classList.toggle("on", a.dataset.tab === tab);
}

// ---------- Playbook list ----------
function renderPlays(side) {
  const list = plays(side);
  const isOff = side === "offense";
  // Plays a coach drew show in their own category and also in the "Coaches" playbook (newest first).
  const coachPlays = list.filter((p) => p.author).reverse();
  const groups = isOff
    ? [...GROUPS[side], ...new Set(list.map((p) => p.group))].filter((g, i, arr) => arr.indexOf(g) === i && list.some((p) => p.group === g))
    : ["Defense"];
  const books = [...groups, "Coaches"];
  const playsIn = (b) => (b === "Coaches" ? coachPlays : isOff ? list.filter((p) => p.group === b) : list);
  let book = sessionStorage.getItem("book:" + side) || books[0];
  if (!books.includes(book)) book = books[0];
  view.innerHTML = `
    <div class="page-head">
      <h1>${SIDE_TITLE[side]}</h1>
      <p class="lede">${isOff
        ? "Pick a playbook, then tap a play to watch it run. Every play starts from the same lineup, so you always line up in the same spot."
        : "We play man-to-man with two rushers. Tap a play to see where you go."}</p>
    </div>
    <div class="books ${isOff ? "" : "two"}" role="tablist" aria-label="Playbooks">
      ${books.map((g) => `<button type="button" role="tab" class="book ${g === book ? "on" : ""}" data-book="${esc(g)}" aria-selected="${g === book}">
        <span class="book-icon" aria-hidden="true">${PLAYBOOK_INFO[g]?.icon || "📋"}</span>
        <span class="book-name">${esc(g)}</span>
        <span class="book-count">${playsIn(g).length} ${playsIn(g).length === 1 ? "play" : "plays"}</span>
      </button>`).join("")}
    </div>
    <p class="book-desc" id="book-desc"></p>
    <div class="cards" id="cards"></div>
    ${canEdit() ? `<a class="btn primary add" href="#/edit/new-${side}">+ New play</a>` : ""}`;

  function draw() {
    const shown = playsIn(book);
    $("#book-desc").textContent = PLAYBOOK_INFO[book]?.desc || "";
    $("#cards").innerHTML = shown.length ? shown.map((p) => {
      return `
      <a class="play-card" href="#/play/${p.id}">
        <svg class="thumb" data-play="${p.id}" role="img" aria-label="${esc(p.name)} diagram"></svg>
        <div class="play-card-body">
          <div class="row between"><h2>${esc(p.name)}</h2>${book === "Coaches" || !isOff ? `<span class="pill">${groupLabel(p.group)}</span>` : ""}</div>
          ${byline(p) ? `<p class="byline">${esc(byline(p))}</p>` : ""}
          <p>${esc(p.summary)}</p>
        </div>
      </a>`;
    }).join("") : book === "Coaches"
      ? `<p class="empty">No coach plays yet. ${canEdit() ? "Tap + New play below to draw one." : "Coaches can draw them in coach mode (Coach tab)."}</p>`
      : `<p class="empty">No ${side} plays yet.${canEdit() ? " Add the first one below." : ""}</p>`;
    for (const svg of view.querySelectorAll("svg[data-play]")) {
      const p = list.find((x) => x.id === svg.dataset.play);
      drawPlay(svg, p, { thumb: true });
    }
  }
  draw();
  view.querySelector(".books")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]");
    if (!b) return;
    book = b.dataset.book;
    sessionStorage.setItem("book:" + side, book);
    for (const c of view.querySelectorAll("[data-book]")) { c.classList.toggle("on", c === b); c.setAttribute("aria-selected", c === b); }
    draw();
  });
}

// ---------- Play detail ----------
function renderPlay(id) {
  const play = state.playbook.plays.find((p) => p.id === id);
  if (!play) { view.innerHTML = `<p class="empty">That play doesn't exist anymore. <a href="#/plays">Back to plays</a></p>`; return; }
  const side = play.side;
  let selected = null;
  const situations = SITUATIONS.filter((s) => play.situations?.includes(s.id));

  view.innerHTML = `
    <div class="page-head">
      <a class="back" href="#/${TAB_FOR[side]}">← ${SIDE_TITLE[side]}</a>
      <div class="row between wrap">
        <h1>${esc(play.name)}</h1>
        ${canEdit() ? `<a class="btn small" href="#/edit/${play.id}">Edit play</a>` : ""}
      </div>
      ${byline(play) ? `<p class="byline">${esc(byline(play))}</p>` : ""}
      <div class="row wrap gap-s"><span class="pill">${groupLabel(play.group)}</span>${situations.map((s) => `<span class="pill soft">${esc(s.label)}</span>`).join("")}</div>
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
          ${side !== "defense" ? `<li><b>⊥</b> block here</li><li><b class="ball-key">· · ·</b> ball (pass or pitch)</li>` : `<li><b>- - →</b> rush / follow</li><li><b>Shaded area</b> = the Middle's area</li>`}
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
      box.innerHTML = `<h2>Find your job</h2><p class="muted">Tap any player on the field, or a position in the list below, to highlight their route and see their job.</p>`;
      return;
    }
    const p = play.players.find((x) => x.id === selected);
    box.innerHTML = `
      <h2>${dot(selected, true)}${esc(labelFor(play, selected))}</h2>
      <p class="job-text">${esc(p.note || "No instructions yet.")}</p>
      ${p.route ? routeLink(p.route) : ""}
      <a class="route-link" href="#/learn/positions#${groupOf(selected)?.id || ""}">About this position ›</a>`;
  }

  function drawAssign() {
    $("#assign").innerHTML = play.players.map((p) => {
      return `<li><button type="button" class="assign-row ${p.id === selected ? "on" : ""}" data-pid="${p.id}">
        ${dot(p.id)}<span><strong>${esc(labelFor(play, p.id))}</strong><br><span class="muted">${esc(p.note)}</span></span>
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
  if (!canEdit()) { view.innerHTML = `<p class="empty">Turn on coach mode to draw and edit plays. <a href="#/team">Go to coach mode</a></p>`; return; }
  const isNew = ["new-offense", "new-special", "new-defense"].includes(id);
  const play = isNew ? newPlay(id.slice(4)) : state.playbook.plays.find((p) => p.id === id);
  if (!play) { view.innerHTML = `<p class="empty">Play not found.</p>`; return; }
  const back = () => { location.hash = isNew ? `#/${TAB_FOR[play.side]}` : `#/play/${play.id}`; };
  const ed = mountEditor(view, play, {
    isNew,
    onCancel: back,
    onSave: async (updated) => {
      const coach = state.coach.name;
      if (isNew) updated.author = coach;
      else if (updated.author !== coach) updated.editedBy = coach;
      else delete updated.editedBy;
      await mutate("playbook", (doc) => {
        const i = doc.plays.findIndex((p) => p.id === updated.id);
        if (i >= 0) doc.plays[i] = updated; else doc.plays.push(updated);
      });
      toast("Play saved.");
      location.hash = `#/play/${updated.id}`;
    },
    onDelete: async (p) => {
      try { await mutate("playbook", (doc) => { doc.plays = doc.plays.filter((x) => x.id !== p.id); }); }
      catch (e) { toast("Couldn't delete: " + e.message); return; }
      toast("Play deleted.");
      location.hash = `#/${TAB_FOR[p.side]}`;
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
      <a class="learn-card" href="#/learn/positions"><strong>Positions</strong><span>The main jobs on offense and defense, and who plays them.</span></a>
      <a class="learn-card" href="#/learn/routes"><strong>Routes</strong><span>Slant, Out, Curl and Go, step by step with animations.</span></a>
      <a class="learn-card" href="#/gameday"><strong>Game Day</strong><span>Which play to call in each situation.</span></a>
    </div>`;
}

function renderPositions() {
  const section = (side, title) => `
    <h2 class="section-title">${title}</h2>
    <div class="pos-grid">
      ${POSITION_GROUPS.filter((g) => g.side === side).map((g) => {
        return `<article class="card pos-card" id="${g.id}">
          <h3><span class="dots">${g.ids.map((id) => dot(id, true)).join("")}</span>${esc(g.name)}</h3>
          <p>${esc(g.job)}</p>
          <ul class="tips">${g.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <p class="muted small"><strong>Good fit:</strong> ${esc(g.good)}</p>
          ${g.routesLink ? `<a class="route-link" href="#/learn/routes">Learn the routes ›</a>` : ""}
        </article>`;
      }).join("")}
    </div>`;
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/learn">← Learn</a><h1>Positions</h1>
    <p class="lede">These are the main jobs. In the play diagrams, each player has their own color so you can find your spot and your route.</p></div>
    ${section("offense", "Offense")}
    ${section("defense", "Defense")}`;
  const target = location.hash.split("#")[2];
  if (target) document.getElementById(target)?.scrollIntoView();
}

function routeDemo(r, withQb) {
  const players = [{ id: "RS", start: r.start, path: r.path, kind: "route" }];
  if (!withQb) return { players };
  return {
    players: [{ id: "QB", start: [15, -4.5], path: [], kind: "carry" }, ...players],
    ball: { type: "pass", to: "RS", at: r.throwAt },
    marks: r.marks,
  };
}

function renderRoutes(id) {
  if (id) return renderRouteLesson(id);
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/learn">← Learn</a><h1>Routes</h1>
    <p class="lede">A route is the path you run. Every play tells you which route is yours, so learn these four first. Tap one to learn it step by step.</p></div>
    <div class="route-grid">
      ${ROUTE_LESSONS.map((r) => `
        <a class="card route-card" href="#/learn/routes/${r.id}">
          <svg class="route-svg" data-route="${r.id}" role="img" aria-label="${esc(r.name)} route animation"></svg>
          <div><h3>${esc(r.name)}</h3><p>${esc(r.summary)}</p><span class="route-link">Learn it ›</span></div>
        </a>`).join("")}
    </div>
    <p class="muted small">More routes will be added as the team learns them.</p>`;
  for (const svg of view.querySelectorAll("svg[data-route]")) {
    const r = ROUTE_LESSONS.find((x) => x.id === svg.dataset.route);
    const a = new Animator(svg, routeDemo(r, false), { loop: !reduceMotion });
    a.speed = 0.8;
    if (!reduceMotion) a.start(); else a.setTime(a.tl.tMax);
    onLeave(() => a.destroy());
  }
}

function renderRouteLesson(id) {
  const i = ROUTE_LESSONS.findIndex((r) => r.id === id);
  if (i < 0) { location.hash = "#/learn/routes"; return; }
  const r = ROUTE_LESSONS[i];
  const prev = ROUTE_LESSONS[i - 1], next = ROUTE_LESSONS[i + 1];
  const usedIn = state.playbook.plays.filter((p) => p.players.some((x) => x.route === r.id));
  const list = (items) => items.map((t) => `<li>${esc(t)}</li>`).join("");

  view.innerHTML = `
    <div class="page-head">
      <a class="back" href="#/learn/routes">← Routes</a>
      <h1>${esc(r.name)}</h1>
      <p class="lede">${esc(r.summary)}</p>
    </div>
    <div class="play-layout">
      <section class="card field-card">
        <svg id="field" class="field-svg" role="img" aria-label="${esc(r.name)} route animation"></svg>
        <div class="controls">
          <button type="button" class="btn icon" id="pp" aria-label="Pause">❚❚</button>
          <span class="muted small grow">Watch when the ball comes: that's your timing.</span>
          <button type="button" class="btn small" id="spd">Slow</button>
        </div>
        <p class="status" id="status" aria-live="polite"></p>
      </section>
      <aside class="play-side">
        <section class="card"><h2>Step by step</h2><ol class="steps">${list(r.steps)}</ol></section>
        <section class="card">
          <h2>Coaching tips</h2><ul class="tips">${list(r.tips)}</ul>
          <h3>Common mistakes</h3><ul class="tips">${list(r.mistakes)}</ul>
        </section>
        <section class="card">
          <h2>Why it works</h2><p>${esc(r.beats)}</p>
          <h3>For the QB</h3><p>${esc(r.qbTip)}</p>
        </section>
        <section class="card">
          <h2>Plays that use it</h2>
          ${usedIn.length
            ? `<div class="call-plays">${usedIn.map((p) => `<a class="call-btn" href="#/play/${p.id}">${esc(p.name)}</a>`).join("")}</div>`
            : `<p class="muted">No plays use this route yet.</p>`}
        </section>
      </aside>
    </div>
    <nav class="lesson-nav" aria-label="More routes">
      ${prev ? `<a class="btn" href="#/learn/routes/${prev.id}">← ${esc(prev.name)}</a>` : "<span></span>"}
      ${next ? `<a class="btn" href="#/learn/routes/${next.id}">${esc(next.name)} →</a>` : "<span></span>"}
    </nav>`;

  let a = null;
  a = new Animator($("#field"), routeDemo(r, true), {
    loop: !reduceMotion,
    highlight: "RS",
    onTick: (t, label) => { if (a) $("#status").textContent = label; },
  });
  a.speed = 0.75;
  onLeave(() => a.destroy());
  const pp = $("#pp");
  const setBtn = () => { pp.textContent = a.playing ? "❚❚" : "▶"; pp.setAttribute("aria-label", a.playing ? "Pause" : "Play"); };
  if (!reduceMotion) a.start(); else a.setTime(a.tl.tMax);
  setBtn();
  a.opts.onEnd = setBtn;
  pp.addEventListener("click", () => { if (a.playing) a.pause(); else a.start(); setBtn(); });
  $("#spd").addEventListener("click", (e) => {
    a.speed = a.speed === 0.75 ? 0.35 : 0.75;
    e.target.textContent = a.speed === 0.75 ? "Slow" : "Normal";
  });
}

function renderRules() {
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/learn">← Learn</a><h1>Rules &amp; words</h1></div>
    <section class="card">
      <h2>Our league rules</h2>
      <ol class="rules">${state.settings.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
      ${canEdit() ? `<p class="muted small">Coaches can change these on the Coach tab.</p>` : ""}
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
    const ps = state.playbook.plays.filter((p) => posSide(p.side) === side && p.situations?.includes(s.id));
    return `<div class="call">
      <div><strong>${esc(s.label)}</strong><span class="muted small">${esc(s.hint)}</span></div>
      <div class="call-plays">${ps.length ? ps.map((p) => `<a class="call-btn ${p.group === "Trick" ? "special" : ""}" href="#/play/${p.id}">${p.group === "Trick" ? "★ " : ""}${esc(p.name)}</a>`).join("") : `<span class="muted small">No play tagged yet</span>`}</div>
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
    <section class="card tracker" id="d-tracker">
      <h2>Defense: what to call</h2>
      <div class="row wrap">
        <span class="muted small">Our blitz this set</span>
        <button type="button" class="qb-run ${gd.blitz ? "used" : ""}" id="blitz">${gd.blitz ? "Used" : "Available"}</button>
        <button type="button" class="btn small" id="their-first">They got a first down</button>
      </div>
      <p class="muted small">We get one blitz per set of downs. When they get a first down, the blitz is available again.</p>
      ${callList("defense")}
    </section>`;

  $("#d-tracker").addEventListener("click", (e) => {
    if (e.target.id === "blitz") gd.blitz = !gd.blitz;
    else if (e.target.id === "their-first") gd.blitz = false;
    else return;
    saveGd();
    renderGameDay();
  });
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
  const editable = canEdit();

  view.innerHTML = `
    <div class="page-head"><h1>Coach</h1><p class="lede">${esc(state.settings.teamName)}</p></div>
    <section class="card" id="coach"></section>
    ${editable ? `
    <section class="card">
      <h2>Team settings</h2>
      <label class="field">Team name<input id="team-name-in" maxlength="40" value="${esc(state.settings.teamName)}"></label>
      <label class="field">League rules (one per line)<textarea id="rules-in" rows="8">${esc(state.settings.rules.join("\n"))}</textarea></label>
      <div class="row wrap">
        <button type="button" class="btn primary" id="save-settings">Save settings</button>
      </div>
      <details class="danger-zone">
        <summary>Reset plays</summary>
        <p class="muted small">This deletes every play the team has drawn or changed and brings back the starter playbook, for everyone. Type RESET to confirm.</p>
        <div class="row wrap">
          <input id="reset-confirm" placeholder="Type RESET" aria-label="Type RESET to confirm" autocomplete="off">
          <button type="button" class="btn danger" id="reset-plays">Reset plays</button>
        </div>
      </details>
    </section>` : ""}`;

  renderCoachBox();

  if (!editable) return;
  $("#save-settings").addEventListener("click", async () => {
    const teamName = $("#team-name-in").value.trim() || "Powderpuff Playbook";
    const rules = $("#rules-in").value.split("\n").map((s) => s.trim()).filter(Boolean);
    try { await mutate("settings", (doc) => { doc.teamName = teamName; doc.rules = rules; }); toast("Settings saved."); applyTeamName(); renderTeam(); }
    catch (e) { toast("Couldn't save: " + e.message); }
  });
  const reset = $("#reset-plays");
  reset.addEventListener("click", async () => {
    if ($("#reset-confirm").value.trim().toUpperCase() !== "RESET") { toast("Type RESET to confirm."); $("#reset-confirm").focus(); return; }
    try { await resetToDefault("playbook"); toast("Plays reset to the starter playbook."); renderTeam(); }
    catch (e) { toast("Couldn't reset: " + e.message); }
  });
}

const COACHES = ["Galwin", "Luan", "Wyatt"];

function renderCoachBox() {
  const box = $("#coach");
  if (!box) return;
  const where = cloud.enabled ? "Changes save for the whole team." : "Cloud saving isn't set up, so changes only save on this device.";
  if (state.coach) {
    box.innerHTML = `<h2>Coach mode is on</h2>
      <p>You're coaching as <strong>${esc(state.coach.name)}</strong>. Plays you create will say "${esc(state.coach.name)}'s play". ${where}</p>
      <button type="button" class="btn" id="coach-off">Turn off coach mode</button>`;
    $("#coach-off").addEventListener("click", () => { setCoach(null); toast("Coach mode is off."); route(); });
  } else {
    let last = "";
    try { last = localStorage.getItem("ffp:lastCoach") || ""; } catch { /* storage unavailable */ }
    box.innerHTML = `<h2>Coach mode</h2>
      <p class="muted">Turn on coach mode to draw new plays, change plays, and update the team name and rules. ${where}</p>
      <form id="coach-on" class="row wrap">
        <label class="field grow">Which coach are you?<select id="coach-name" required>
          <option value="">Pick your name</option>
          ${COACHES.map((c) => `<option ${c === last ? "selected" : ""}>${c}</option>`).join("")}
        </select></label>
        <button class="btn primary" type="submit">Turn on coach mode</button>
      </form>`;
    $("#coach-on").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#coach-name").value;
      if (!COACHES.includes(name)) { toast("Pick your name first."); return; }
      try { localStorage.setItem("ffp:lastCoach", name); } catch { /* storage unavailable */ }
      setCoach(name);
      toast(`Coach mode is on. Welcome, ${name}.`);
      route();
    });
  }
  if (cloud.error) box.insertAdjacentHTML("beforeend", `<p class="error">Couldn't reach the team database (${esc(cloud.error)}). Showing the last saved copy.</p>`);
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
    case "special": location.replace("#/plays"); return;
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
  window.addEventListener("hashchange", route);
  route();
}

start();
