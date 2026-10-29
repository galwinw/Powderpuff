// Loads and saves the team's data.
// - When config.js has Supabase settings: everyone reads from the team database, and anyone
//   in coach mode can save to it (honor system, no logins).
// - Without settings: data is saved in this browser only (handy for trying things out).
import { DEFAULT_PLAYBOOK, DEFAULT_SETTINGS } from "./data.js";

const cfg = window.TEAM_CONFIG || {};
const DEFAULTS = { playbook: DEFAULT_PLAYBOOK, settings: DEFAULT_SETTINGS };
const LS = "ffp:";
const API = cfg.supabaseUrl ? cfg.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/team_docs" : "";

export const cloud = {
  enabled: Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey),
  error: null,
};

function lsGet(k) {
  try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : null; } catch { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch { /* storage unavailable */ }
}
function lsDel(k) {
  try { localStorage.removeItem(LS + k); } catch { /* storage unavailable */ }
}

export const state = {
  playbook: null,
  settings: null,
  coach: lsGet("coach"), // { name } while coach mode is on
};

async function request(query, options = {}) {
  const res = await fetch(API + query, {
    ...options,
    headers: { apikey: cfg.supabaseAnonKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const body = await res.json(); msg = body.message || body.error || msg; } catch { /* not JSON */ }
    throw new Error(msg);
  }
  const text = await res.text(); // saves come back empty
  return text ? JSON.parse(text) : null;
}

async function fetchDoc(key) {
  const rows = await request(`?select=data&key=eq.${encodeURIComponent(key)}`);
  return rows[0]?.data ?? null;
}

async function putDoc(key, data) {
  await request("?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, data, updated_at: new Date().toISOString() }),
  });
}

export async function init() {
  if (cloud.enabled) {
    try {
      const rows = await request("?select=key,data");
      for (const row of rows) if (row.key in DEFAULTS) state[row.key] = row.data;
      // Keep a copy so the app still opens with the latest plays if the network drops.
      for (const k of Object.keys(DEFAULTS)) if (state[k]) lsSet("cache:" + k, state[k]);
    } catch (e) {
      console.warn("Cloud load failed", e);
      cloud.error = e.message || String(e);
      for (const k of Object.keys(DEFAULTS)) if (!state[k]) state[k] = lsGet("cache:" + k);
    }
  }
  for (const k of Object.keys(DEFAULTS)) {
    if (!state[k]) state[k] = (!cloud.enabled && lsGet(k)) || structuredClone(DEFAULTS[k]);
  }
}

export function canEdit() {
  return Boolean(state.coach?.name);
}

export function setCoach(name) {
  state.coach = name ? { name } : null;
  if (state.coach) lsSet("coach", state.coach); else lsDel("coach");
}

// Applies a change to the newest saved copy, so two coaches saving close together
// don't wipe out each other's work. `change` edits the document in place.
export async function mutate(key, change) {
  if (cloud.enabled) {
    const latest = (await fetchDoc(key)) ?? state[key] ?? structuredClone(DEFAULTS[key]);
    change(latest);
    await putDoc(key, latest);
    state[key] = latest;
    lsSet("cache:" + key, latest);
  } else {
    const doc = structuredClone(state[key]);
    change(doc);
    lsSet(key, doc);
    state[key] = doc;
  }
}

export async function resetToDefault(key) {
  const fresh = structuredClone(DEFAULTS[key]);
  if (cloud.enabled) {
    await putDoc(key, fresh);
    lsSet("cache:" + key, fresh);
  } else {
    lsDel(key);
  }
  state[key] = fresh;
}
