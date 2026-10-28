// Draws plays on an SVG field and animates them.
import { POSITIONS } from "./data.js";

export const FIELD = { w: 30, top: 22, bottom: -8 };
const NS = "http://www.w3.org/2000/svg";
const SPEED = { route: 6, routeBlock: 6, man: 5.5, zone: 3, rush: 6, block: 2.5, blockRelease: 6, carry: 2.5 };
const BALL_SPEED = { pass: 16, pitch: 9 }; // yards per second
const BALL_LABEL = { pass: "Pass!", pitch: "Pitch!" };

const sy = (y) => FIELD.top - y;

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

export function posInfo(id) {
  return POSITIONS[id] || { short: id, name: id, color: "#cccccc" };
}

export function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#14171f" : "#ffffff";
}

export function drawField(svg, { numbers = true } = {}) {
  svg.setAttribute("viewBox", `0 0 ${FIELD.w} ${FIELD.top - FIELD.bottom}`);
  svg.innerHTML = "";
  const g = el("g", { class: "turf" }, svg);
  for (let y = -10, i = 0; y < FIELD.top; y += 5, i++) {
    const y0 = Math.max(y, FIELD.bottom), y1 = Math.min(y + 5, FIELD.top);
    el("rect", { x: 0, y: sy(y1), width: FIELD.w, height: y1 - y0, class: i % 2 ? "turf-a" : "turf-b" }, g);
  }
  for (let y = -5; y < FIELD.top; y += 5) {
    if (y === 0) continue;
    el("line", { x1: 0, x2: FIELD.w, y1: sy(y), y2: sy(y), class: "yard-line" }, g);
    if (numbers) {
      const t = el("text", { x: 0.6, y: sy(y) - 0.4, class: "yard-num" }, g);
      t.textContent = y > 0 ? `${y} yd` : `${y}`;
    }
  }
  el("line", { x1: 0, x2: FIELD.w, y1: sy(0), y2: sy(0), class: "los" }, g);
  return g;
}

function arrowHead(parent, [x0, y0], [x1, y1], color, size) {
  const a = Math.atan2(sy(y1) - sy(y0), x1 - x0);
  const p = (ang, r) => `${x1 + Math.cos(ang) * r},${sy(y1) + Math.sin(ang) * r}`;
  el("polygon", { points: `${p(a, size * 0.4)} ${p(a + 2.5, size)} ${p(a - 2.5, size)}`, fill: color }, parent);
}

function tBar(parent, [x0, y0], [x1, y1], color, w) {
  let dx = x1 - x0, dy = sy(y1) - sy(y0);
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const L = 0.8;
  el("line", { x1: x1 - dy * L, y1: sy(y1) + dx * L, x2: x1 + dy * L, y2: sy(y1) - dx * L, stroke: color, "stroke-width": w * 1.3, "stroke-linecap": "round" }, parent);
}

// Draws the route/assignment line for one player.
function drawRoute(parent, p, color, thumb) {
  const pts = [p.start, ...(p.path || []).map(([x, y]) => [x, y])];
  if (pts.length < 2) return;
  const w = thumb ? 0.45 : 0.3;
  const kind = p.kind || "route";
  const dash = kind === "zone" ? "0.15 0.6" : kind === "rush" || kind === "man" ? "0.9 0.5" : null;
  const attrs = {
    points: pts.map(([x, y]) => `${x},${sy(y)}`).join(" "),
    fill: "none", stroke: color, "stroke-width": w, "stroke-linejoin": "round", "stroke-linecap": "round",
  };
  if (dash) attrs["stroke-dasharray"] = dash;
  el("polyline", attrs, parent);
  const n = pts.length;
  if (kind === "block" || kind === "routeBlock") {
    tBar(parent, pts[n - 2], pts[n - 1], color, w);
  } else if (kind === "blockRelease") {
    tBar(parent, pts[0], pts[1], color, w);
    if (n > 2) arrowHead(parent, pts[n - 2], pts[n - 1], color, thumb ? 1.4 : 1);
  } else if (kind !== "zone" && kind !== "carry") {
    arrowHead(parent, pts[n - 2], pts[n - 1], color, thumb ? 1.4 : 1);
  } else if (kind === "carry" && n > 2) {
    arrowHead(parent, pts[n - 2], pts[n - 1], color, thumb ? 1.4 : 1);
  }
}

function zoneOf(p) {
  if (p.kind !== "zone") return null;
  if (p.zone) return p.zone;
  const end = (p.path && p.path.length ? p.path[p.path.length - 1] : p.start);
  return { x: end[0], y: end[1], rx: 4.5, ry: 3 };
}

// Static drawing of a play. Returns references for animation/interaction.
export function drawPlay(svg, play, { highlight = null, thumb = false, onPlayer = null } = {}) {
  drawField(svg, { numbers: !thumb });
  const zones = el("g", {}, svg);
  const ghosts = el("g", { class: "ghosts" }, svg);
  const routes = el("g", {}, svg);
  const players = el("g", {}, svg);
  const ballLayer = el("g", {}, svg);
  const nodes = {};
  const dim = (id) => highlight && id !== highlight;

  for (const p of play.players) {
    const z = zoneOf(p);
    if (!z) continue;
    const c = posInfo(p.id).color;
    el("ellipse", { cx: z.x, cy: sy(z.y), rx: z.rx, ry: z.ry, fill: c, "fill-opacity": dim(p.id) ? 0.06 : 0.2, stroke: c, "stroke-opacity": dim(p.id) ? 0.25 : 0.8, "stroke-width": 0.15, "stroke-dasharray": "0.5 0.4" }, zones);
  }
  for (const gh of play.ghosts || []) {
    el("circle", { cx: gh.start[0], cy: sy(gh.start[1]), r: 0.9, class: "ghost" }, ghosts);
    const t = el("text", { x: gh.start[0], y: sy(gh.start[1]) + 0.35, class: "ghost-label" }, ghosts);
    t.textContent = gh.label;
  }
  for (const p of play.players) {
    const g = el("g", { opacity: dim(p.id) ? 0.22 : 1 }, routes);
    drawRoute(g, p, posInfo(p.id).color, thumb);
  }
  if (play.ball) {
    const tl = buildTimeline(play);
    for (const ev of tl.events) {
      const to = tl.pos(ev.to, ev.t1);
      el("line", { x1: ev.from[0], y1: sy(ev.from[1]), x2: to[0], y2: sy(to[1]), class: "ball-path" + (thumb ? " thumb" : ""), opacity: highlight ? 0.5 : 1 }, routes);
    }
  }
  for (const m of play.marks || []) {
    const g = el("g", {}, routes);
    el("circle", { cx: m.at[0], cy: sy(m.at[1]), r: 0.45, class: "mark-dot" }, g);
    const left = m.side === "left";
    const t = el("text", { x: m.at[0] + (left ? -0.9 : 0.9), y: sy(m.at[1]) + 0.32, class: "mark-label", "text-anchor": left ? "end" : "start" }, g);
    t.textContent = m.label;
  }
  for (const p of play.players) {
    const info = posInfo(p.id);
    const g = el("g", { class: "player" + (onPlayer ? " tappable" : ""), "data-id": p.id, opacity: dim(p.id) ? 0.45 : 1, transform: `translate(${p.start[0]},${sy(p.start[1])})` }, players);
    if (highlight === p.id) el("circle", { r: 1.9, class: "me-ring" }, g);
    el("circle", { r: thumb ? 1.35 : 1.15, fill: info.color, stroke: "#14171f", "stroke-width": 0.12 }, g);
    const t = el("text", { y: 0.38, "text-anchor": "middle", class: "player-label", fill: inkFor(info.color), "font-size": thumb ? 1.15 : (info.short.length > 2 ? 0.8 : 0.95) }, g);
    t.textContent = info.short;
    if (onPlayer) {
      el("circle", { r: 2, fill: "transparent" }, g);
      g.addEventListener("click", (e) => { e.stopPropagation(); onPlayer(p.id); });
    }
    nodes[p.id] = g;
  }
  return { nodes, ballLayer };
}

// ---------- Timing ----------
function timeline(p) {
  const kind = p.kind || "route";
  const base = p.speed || SPEED[kind] || 6;
  let t = p.delay || 0;
  let [x, y] = p.start;
  const segs = [];
  (p.path || []).forEach((pt, i) => {
    const [nx, ny, wait] = pt;
    const sp = kind === "blockRelease" && i === 0 ? SPEED.block : base;
    const dt = Math.hypot(nx - x, ny - y) / sp;
    segs.push({ t0: t, t1: t + dt, x0: x, y0: y, x1: nx, y1: ny });
    t += dt; x = nx; y = ny;
    if (wait) { segs.push({ t0: t, t1: t + wait, x0: x, y0: y, x1: x, y1: y }); t += wait; }
  });
  return { start: p.delay || 0, end: t, segs, first: p.start, last: [x, y] };
}

function posAt(tl, t) {
  if (t <= tl.start || !tl.segs.length) return tl.first;
  for (const s of tl.segs) {
    if (t <= s.t1) {
      const k = s.t1 > s.t0 ? (t - s.t0) / (s.t1 - s.t0) : 1;
      return [s.x0 + (s.x1 - s.x0) * k, s.y0 + (s.y1 - s.y0) * k];
    }
  }
  return tl.last;
}

// A play's ball moves, in order. Older plays stored a single { type, to, at }.
export function ballEvents(play) {
  const b = play.ball;
  if (!b) return [];
  if (Array.isArray(b.events)) return b.events;
  if (b.type === "pass" || b.type === "pitch") return [{ type: b.type, to: b.to, at: b.at }];
  if (b.type === "handoff") return [{ type: "pitch", to: b.to, at: b.at }];
  return [];
}

export function buildTimeline(play) {
  const tls = {};
  for (const p of play.players) tls[p.id] = timeline(p);
  const pos = (id, t) => (tls[id] ? posAt(tls[id], t) : null);
  const hasBall = Boolean(play.ball && tls.QB);

  // Work out each throw: who has it, where it goes, how long it's in the air.
  const events = [];
  if (hasBall) {
    let holder = "QB", ready = 0.3;
    for (const ev of ballEvents(play)) {
      if (!tls[ev.to] || ev.to === holder) continue;
      const t0 = Math.max(ev.at, ready);
      const from = pos(holder, t0);
      const speed = BALL_SPEED[ev.type] || BALL_SPEED.pass;
      let T = 0.6;
      for (let i = 0; i < 5; i++) {
        const to = pos(ev.to, t0 + T);
        T = Math.max(0.25, Math.hypot(to[0] - from[0], to[1] - from[1]) / speed);
      }
      events.push({ ...ev, from, by: holder, t0, t1: t0 + T });
      holder = ev.to;
      ready = t0 + T + 0.1;
    }
  }

  let tMin = 0, tMax = 0;
  for (const id in tls) { tMin = Math.min(tMin, tls[id].start); tMax = Math.max(tMax, tls[id].end); }
  if (events.length) tMax = Math.max(tMax, events[events.length - 1].t1 + 0.4);
  tMin -= 0.6;
  tMax += 0.6;

  function ball(t) {
    if (!hasBall) return null;
    const c0 = tls.C ? [tls.C.first[0], tls.C.first[1] + 0.6] : tls.QB.first;
    if (t < 0) return { p: c0, air: 0, label: "Set…" };
    if (t < 0.3) {
      const q = pos("QB", t), k = t / 0.3;
      return { p: [c0[0] + (q[0] - c0[0]) * k, c0[1] + (q[1] - c0[1]) * k], air: 0.3, label: "Hike!" };
    }
    let holder = "QB", label = events.length ? "Hike!" : t > 0.8 ? "QB run!" : "Hike!";
    for (const ev of events) {
      if (t < ev.t0) break;
      if (t < ev.t1) {
        const k = (t - ev.t0) / (ev.t1 - ev.t0);
        const to = pos(ev.to, ev.t1);
        const arc = ev.type === "pass" ? 1 : 0.35;
        return { p: [ev.from[0] + (to[0] - ev.from[0]) * k, ev.from[1] + (to[1] - ev.from[1]) * k], air: Math.sin(Math.PI * k) * arc, label: BALL_LABEL[ev.type] || "Pass!" };
      }
      holder = ev.to;
      label = "Caught!";
    }
    return { p: pos(holder, t), air: 0, label };
  }

  return { tMin, tMax, pos, ball, events };
}

// ---------- Animator ----------
export class Animator {
  constructor(svg, play, opts = {}) {
    this.svg = svg;
    this.play = play;
    this.opts = opts;
    this.speed = 1;
    this.playing = false;
    this.loop = Boolean(opts.loop);
    this.onTick = opts.onTick || null;
    this.render();
  }

  render() {
    const view = drawPlay(this.svg, this.play, this.opts);
    this.nodes = view.nodes;
    this.tl = buildTimeline(this.play);
    this.ballEl = null;
    if (this.play.ball) {
      this.ballEl = el("g", { class: "ball" }, view.ballLayer);
      el("ellipse", { rx: 0.55, ry: 0.36, fill: "#8b4513", stroke: "#fff", "stroke-width": 0.08 }, this.ballEl);
      el("line", { x1: -0.22, x2: 0.22, y1: 0, y2: 0, stroke: "#fff", "stroke-width": 0.07 }, this.ballEl);
    }
    this.setTime(this.t ?? this.tl.tMin);
  }

  setHighlight(id) {
    this.opts.highlight = id;
    this.render();
  }

  setTime(t) {
    this.t = Math.max(this.tl.tMin, Math.min(this.tl.tMax, t));
    for (const p of this.play.players) {
      const [x, y] = this.tl.pos(p.id, this.t);
      this.nodes[p.id].setAttribute("transform", `translate(${x},${sy(y)})`);
    }
    let label = "";
    if (this.ballEl) {
      const b = this.tl.ball(this.t);
      if (b) {
        const s = 1 + b.air * 0.6;
        this.ballEl.setAttribute("transform", `translate(${b.p[0] + 0.9},${sy(b.p[1]) - 0.6 - b.air * 1.2}) scale(${s})`);
        label = b.label;
      }
    } else {
      label = this.t < 0 ? "Set…" : "Hike!";
    }
    this.onTick?.(this.t, label);
  }

  start() {
    if (this.playing) return;
    if (this.t >= this.tl.tMax) this.setTime(this.tl.tMin);
    this.playing = true;
    let last = performance.now();
    const step = (now) => {
      if (!this.playing) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.setTime(this.t + dt * this.speed);
      if (this.t >= this.tl.tMax) {
        if (this.loop) { this.setTime(this.tl.tMin); }
        else { this.playing = false; this.opts.onEnd?.(); return; }
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.pause();
  }
}

// Converts a pointer event to field yards.
export function eventToField(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [p.x, FIELD.top - p.y];
}
