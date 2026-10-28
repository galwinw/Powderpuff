// Coach play editor: move players, draw routes by tapping, write each player's job.
import { POSITIONS, ROUTES, GROUPS, SITUATIONS, OFFENSE_IDS, DEFENSE_IDS, OFFENSE_TEMPLATE, DEFENSE_TEMPLATE } from "./data.js";
import { drawPlay, Animator, eventToField, FIELD, posInfo, ballEvents } from "./field.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const snap = (v) => Math.round(v * 2) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const KINDS = {
  offense: [["route", "Route (runs a path)"], ["routeBlock", "Run, then block for the runner"], ["block", "Block"], ["blockRelease", "Block, then release"], ["carry", "QB / ball carrier"]],
  defense: [["rush", "Rush the QB"], ["zone", "Guard a zone"], ["man", "Follow a player (man)"]],
};

const TAB_FOR = { offense: "plays", special: "special", defense: "defense" };
const BALL_TYPES = [["pass", "Pass"], ["pitch", "Pitch (toss back/sideways)"]];

export function newPlay(side) {
  const isOff = side !== "defense";
  const ids = isOff ? OFFENSE_IDS : DEFENSE_IDS;
  const tpl = isOff ? OFFENSE_TEMPLATE : DEFENSE_TEMPLATE;
  const kindFor = (id) => side === "defense"
    ? (id === "RC" || id === "RQ" ? "rush" : "zone")
    : id === "QB" ? "carry" : id === "C" || id === "RB" ? "block" : "route";
  const play = {
    id: "play-" + Math.random().toString(36).slice(2, 8),
    side, name: "", group: GROUPS[side][0], situations: [], summary: "", why: "", qbRead: "",
    ball: isOff ? { events: [{ type: "pass", to: "RW", at: 1.2 }] } : null,
    players: ids.map((id) => ({ id, start: [...tpl[id]], path: [], kind: kindFor(id), note: "" })),
  };
  if (side === "defense") {
    play.ghosts = OFFENSE_IDS.map((id) => ({ label: POSITIONS[id].short, start: [...OFFENSE_TEMPLATE[id]] }));
  }
  return play;
}

export function mountEditor(root, original, { onSave, onCancel, onDelete, isNew }) {
  const play = structuredClone(original);
  const side = play.side;
  const isOff = side !== "defense";
  let events = structuredClone(ballEvents(play));
  let sel = play.players[0].id;
  let mode = "route"; // "route" = tap field to add points, "move" = drag players
  let anim = null;
  let dragging = null;

  root.innerHTML = `
    <div class="page-head">
      <a class="back" href="#/${TAB_FOR[side]}">← Back</a>
      <h1>${isNew ? "New play" : "Edit play"}</h1>
    </div>
    <div class="editor">
      <section class="editor-field card">
        <div class="seg" role="group" aria-label="Editing mode">
          <button type="button" data-mode="route" class="seg-btn">✏️ Draw route</button>
          <button type="button" data-mode="move" class="seg-btn">✋ Move players</button>
        </div>
        <p class="hint" id="ed-hint"></p>
        <svg id="ed-svg" class="field-svg editing" role="img" aria-label="Play diagram editor"></svg>
        <div class="row wrap">
          <button type="button" class="btn small" id="ed-undo">Undo last point</button>
          <button type="button" class="btn small" id="ed-clear">Clear route</button>
          <button type="button" class="btn small" id="ed-preview">▶ Preview</button>
        </div>
        <div class="chips" id="ed-pick"></div>
      </section>

      <section class="card" id="ed-player"></section>

      <section class="card">
        <h2>Play details</h2>
        <label class="field">Name<input id="ed-name" maxlength="40" value="${esc(play.name)}" placeholder="e.g. Rocket"></label>
        <label class="field">Type<select id="ed-group">${GROUPS[side].map((g) => `<option ${g === play.group ? "selected" : ""}>${g}</option>`).join("")}</select></label>
        <label class="field">When to use it (one line)<input id="ed-summary" maxlength="140" value="${esc(play.summary)}"></label>
        <label class="field">Why it works<textarea id="ed-why" rows="3">${esc(play.why)}</textarea></label>
        ${isOff ? `<label class="field">QB's reads<textarea id="ed-qb" rows="2">${esc(play.qbRead)}</textarea></label>` : ""}
        <fieldset class="field"><legend>Game Day situations</legend>
          ${SITUATIONS.filter((s) => s.side === (isOff ? "offense" : "defense")).map((s) => `<label class="check"><input type="checkbox" value="${s.id}" ${play.situations?.includes(s.id) ? "checked" : ""}> ${esc(s.label)}</label>`).join("")}
        </fieldset>
        ${isOff ? `
        <fieldset class="field"><legend>The ball, in order</legend>
          <p class="muted small">Add each pass or pitch in the order it happens. No passes or pitches means the QB runs with it. Only one forward pass per play.</p>
          <div id="ed-ball" class="ball-rows"></div>
          <button type="button" class="btn small" id="ed-ball-add">+ Add a pass or pitch</button>
        </fieldset>` : ""}
      </section>

      <div class="editor-actions">
        <p class="error" id="ed-error" role="alert"></p>
        <button type="button" class="btn primary" id="ed-save">Save play</button>
        <button type="button" class="btn" id="ed-cancel">Cancel</button>
        ${isNew ? "" : `<button type="button" class="btn danger" id="ed-delete">Delete play</button>`}
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const svg = $("#ed-svg");
  const player = () => play.players.find((p) => p.id === sel);

  function redraw() {
    anim?.destroy();
    anim = null;
    drawPlay(svg, play, { highlight: sel });
    for (const b of root.querySelectorAll("[data-mode]")) b.classList.toggle("on", b.dataset.mode === mode);
    $("#ed-hint").textContent = mode === "route"
      ? `Tap the field to add points to ${posInfo(sel).name}'s path. Tap a player to switch.`
      : "Drag any player to a new spot. Their route moves with them.";
    $("#ed-preview").textContent = "▶ Preview";
  }

  function renderPicker() {
    $("#ed-pick").innerHTML = play.players.map((p) => {
      const info = posInfo(p.id);
      return `<button type="button" class="chip ${p.id === sel ? "on" : ""}" data-pick="${p.id}"><span class="dot" style="background:${info.color}"></span>${esc(p.label || info.name)}</button>`;
    }).join("");
  }

  function renderPlayerPanel() {
    const p = player();
    const info = posInfo(p.id);
    const last = p.path[p.path.length - 1];
    $("#ed-player").innerHTML = `
      <h2><span class="dot big" style="background:${info.color}"></span>${esc(p.label || info.name)}</h2>
      <label class="field">Assignment<select id="ed-kind">${KINDS[isOff ? "offense" : "defense"].map(([v, l]) => `<option value="${v}" ${p.kind === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      ${isOff ? `<label class="field">Route name (links to the route guide)<select id="ed-route"><option value="">None</option>${ROUTES.map((r) => `<option value="${r.id}" ${p.route === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label>` : ""}
      <label class="field">Their job, in plain words<textarea id="ed-note" rows="3" placeholder="e.g. Run 5 steps, then cut toward the middle.">${esc(p.note)}</textarea></label>
      <div class="row wrap">
        <label class="field inline">Pause at last point (sec)<input id="ed-wait" type="number" min="0" max="5" step="0.1" value="${last?.[2] ?? 0}" ${last ? "" : "disabled"}></label>
        <label class="field inline">Start early (motion, sec)<input id="ed-delay" type="number" min="0" max="3" step="0.1" value="${-(p.delay || 0)}"></label>
      </div>
      ${side === "defense" ? `<label class="field">Label (optional, e.g. "Safety")<input id="ed-label" maxlength="20" value="${esc(p.label || "")}"></label>` : ""}`;

    $("#ed-kind").addEventListener("change", (e) => { p.kind = e.target.value; if (p.kind !== "zone") delete p.zone; else syncZone(p); redraw(); });
    $("#ed-route")?.addEventListener("change", (e) => { p.route = e.target.value || undefined; });
    $("#ed-note").addEventListener("input", (e) => { p.note = e.target.value; });
    $("#ed-wait").addEventListener("change", (e) => {
      const l = p.path[p.path.length - 1];
      if (!l) return;
      const w = clamp(Number(e.target.value) || 0, 0, 5);
      p.path[p.path.length - 1] = w ? [l[0], l[1], w] : [l[0], l[1]];
    });
    $("#ed-delay").addEventListener("change", (e) => {
      const d = clamp(Number(e.target.value) || 0, 0, 3);
      if (d) p.delay = -d; else delete p.delay;
    });
    $("#ed-label")?.addEventListener("input", (e) => { p.label = e.target.value.trim() || undefined; renderPicker(); });
  }

  function syncZone(p) {
    if (p.kind !== "zone") return;
    const end = p.path.length ? p.path[p.path.length - 1] : p.start;
    p.zone = { x: end[0], y: end[1], rx: p.zone?.rx || 4.5, ry: p.zone?.ry || 3 };
  }

  function select(id) {
    sel = id;
    redraw();
    renderPicker();
    renderPlayerPanel();
  }

  // Field interaction
  svg.addEventListener("pointerdown", (e) => {
    if (anim) return;
    const [x, y] = eventToField(svg, e);
    const hitG = e.target.closest?.("[data-id]");
    if (hitG) {
      const id = hitG.dataset.id;
      if (id !== sel) select(id);
      if (mode === "move") {
        dragging = { id, x, y };
        svg.setPointerCapture(e.pointerId);
      }
      e.preventDefault();
      return;
    }
    if (mode === "route") {
      const p = player();
      p.path.push([snap(clamp(x, 0, FIELD.w)), snap(clamp(y, FIELD.bottom + 0.5, FIELD.top - 0.5))]);
      syncZone(p);
      redraw();
      renderPlayerPanel();
    }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const [x, y] = eventToField(svg, e);
    const p = play.players.find((q) => q.id === dragging.id);
    const nx = snap(clamp(x, 0.5, FIELD.w - 0.5)), ny = snap(clamp(y, FIELD.bottom + 0.5, FIELD.top - 0.5));
    const dx = nx - p.start[0], dy = ny - p.start[1];
    if (!dx && !dy) return;
    p.start = [nx, ny];
    p.path = p.path.map(([px, py, w]) => (w ? [px + dx, py + dy, w] : [px + dx, py + dy]));
    if (p.zone) p.zone = { ...p.zone, x: p.zone.x + dx, y: p.zone.y + dy };
    redraw();
  });
  const endDrag = () => { dragging = null; };
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);

  root.addEventListener("click", (e) => {
    const m = e.target.closest("[data-mode]");
    if (m) { mode = m.dataset.mode; redraw(); }
    const pk = e.target.closest("[data-pick]");
    if (pk) select(pk.dataset.pick);
  });

  $("#ed-undo").addEventListener("click", () => { player().path.pop(); syncZone(player()); redraw(); renderPlayerPanel(); });
  $("#ed-clear").addEventListener("click", () => { player().path = []; syncZone(player()); redraw(); renderPlayerPanel(); });
  $("#ed-preview").addEventListener("click", () => {
    if (anim) { redraw(); return; }
    readMeta();
    anim = new Animator(svg, play, { highlight: sel, onEnd: () => { $("#ed-preview").textContent = "Back to editing"; } });
    $("#ed-preview").textContent = "■ Stop preview";
    anim.start();
  });

  function renderBall() {
    const box = $("#ed-ball");
    if (!box) return;
    const holderBefore = (i) => (i === 0 ? "QB" : events[i - 1].to);
    box.innerHTML = events.length ? events.map((ev, i) => `
      <div class="ball-row" data-i="${i}">
        <span class="ball-num">${i + 1}</span>
        <span class="muted small">${esc(posInfo(holderBefore(i)).name)}</span>
        <label class="field inline">Type<select data-k="type">${BALL_TYPES.map(([v, l]) => `<option value="${v}" ${ev.type === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="field inline">To<select data-k="to">${OFFENSE_IDS.map((id) => `<option value="${id}" ${ev.to === id ? "selected" : ""}>${esc(POSITIONS[id].name)}</option>`).join("")}</select></label>
        <label class="field inline">At (seconds)<input data-k="at" type="number" min="0.3" max="6" step="0.1" value="${ev.at}"></label>
        <button type="button" class="btn small danger" data-remove-ev="${i}" aria-label="Remove this step">✕</button>
      </div>`).join("") : `<p class="muted small">The QB keeps it and runs.</p>`;
  }
  $("#ed-ball")?.addEventListener("change", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row) return;
    const ev = events[Number(row.dataset.i)];
    const k = e.target.dataset.k;
    ev[k] = k === "at" ? clamp(Number(e.target.value) || 1, 0.3, 6) : e.target.value;
    renderBall();
  });
  $("#ed-ball")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove-ev]");
    if (!b) return;
    events.splice(Number(b.dataset.removeEv), 1);
    renderBall();
  });
  $("#ed-ball-add")?.addEventListener("click", () => {
    const last = events[events.length - 1];
    events.push({ type: events.length ? "pitch" : "pass", to: "RW", at: last ? Math.round((last.at + 1) * 10) / 10 : 1.2 });
    renderBall();
  });

  function readMeta() {
    play.name = $("#ed-name").value.trim();
    play.group = $("#ed-group").value;
    play.summary = $("#ed-summary").value.trim();
    play.why = $("#ed-why").value.trim();
    if (isOff) {
      play.qbRead = $("#ed-qb").value.trim();
      play.ball = { events: events.map((ev) => ({ type: ev.type, to: ev.to, at: ev.at })) };
    }
    play.situations = [...root.querySelectorAll("fieldset input[type=checkbox]:checked")].map((c) => c.value);
  }

  $("#ed-save").addEventListener("click", async () => {
    readMeta();
    if (!play.name) { $("#ed-error").textContent = "Give the play a name first."; $("#ed-name").focus(); return; }
    $("#ed-save").disabled = true;
    $("#ed-error").textContent = "";
    try { await onSave(play); }
    catch (err) { $("#ed-error").textContent = "Couldn't save: " + err.message; }
    finally { $("#ed-save").disabled = false; }
  });
  $("#ed-cancel").addEventListener("click", onCancel);
  const del = $("#ed-delete");
  if (del) {
    del.addEventListener("click", async () => {
      if (del.dataset.armed) { await onDelete(play); return; }
      del.dataset.armed = "1";
      del.textContent = "Tap again to delete for good";
      setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = "Delete play"; } }, 4000);
    });
  }

  renderBall();
  select(sel);
  return { destroy: () => anim?.destroy() };
}
