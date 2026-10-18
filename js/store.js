// Loads and saves the team's data.
// - When config.js has Supabase keys: everyone reads from the cloud, logged-in coaches save to it.
// - Without keys: data is saved in this browser only (handy for trying things out).
import { DEFAULT_PLAYBOOK, DEFAULT_ROSTER, DEFAULT_SETTINGS } from "./data.js";

const cfg = window.TEAM_CONFIG || {};
const DEFAULTS = { playbook: DEFAULT_PLAYBOOK, roster: DEFAULT_ROSTER, settings: DEFAULT_SETTINGS };
const LS = "ffp:";

export const bus = new EventTarget();
export const cloud = {
  enabled: Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey),
  client: null,
  user: null,
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
  roster: null,
  settings: null,
  me: lsGet("me"),
  localCoach: lsGet("localCoach") === true,
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Couldn't load " + src));
    document.head.appendChild(s);
  });
}

export async function init() {
  if (cloud.enabled) {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
      cloud.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data: { session } } = await cloud.client.auth.getSession();
      cloud.user = session?.user || null;
      cloud.client.auth.onAuthStateChange((_event, s) => {
        cloud.user = s?.user || null;
        bus.dispatchEvent(new Event("auth"));
      });
      const { data, error } = await cloud.client.from("team_docs").select("key,data");
      if (error) throw error;
      for (const row of data) if (row.key in DEFAULTS) state[row.key] = row.data;
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
  return cloud.enabled ? Boolean(cloud.user) : state.localCoach;
}

export function setLocalCoach(on) {
  state.localCoach = on;
  lsSet("localCoach", on);
}

export async function save(key) {
  if (cloud.enabled) {
    if (!cloud.user) throw new Error("Log in as a coach to save changes.");
    const { error } = await cloud.client
      .from("team_docs")
      .upsert({ key, data: state[key], updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    lsSet("cache:" + key, state[key]);
  } else {
    lsSet(key, state[key]);
  }
}

export async function resetToDefault(key) {
  state[key] = structuredClone(DEFAULTS[key]);
  if (cloud.enabled) await save(key);
  else lsDel(key);
}

export async function login(email, password) {
  const { error } = await cloud.client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function logout() {
  await cloud.client.auth.signOut();
}

export function setMe(me) {
  state.me = me;
  if (me) lsSet("me", me); else lsDel("me");
  bus.dispatchEvent(new Event("me"));
}
