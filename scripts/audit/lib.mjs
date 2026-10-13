import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { neon } from "@neondatabase/serverless";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BASE = process.env.AUDIT_BASE || "http://localhost:3000";

const ENV_PATH = path.join(ROOT, ".env");
export const env = fs.readFileSync(ENV_PATH, "utf8");

function envValue(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

export const DB_URL = envValue("DATABASE_URL");
export const TEST_USER_EMAIL = "test-client@example.com";
export const TEST_VENDOR_EMAIL = "test-vendeur@example.com";
export const TEST_ADMIN_EMAIL = "test-admin@example.com";
export const TEST_USER_PASSWORD = envValue("TEST_USER_PASSWORD");
export const TEST_VENDOR_PASSWORD = envValue("TEST_VENDOR_PASSWORD");
export const TEST_ADMIN_PASSWORD = envValue("TEST_ADMIN_PASSWORD");

export function genPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

export function appendEnv(key, value) {
  let content = fs.readFileSync(ENV_PATH, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (re.test(content)) content = content.replace(re, line);
  else content = content.replace(/\s*$/, "") + "\n" + line + "\n";
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

const sql = neon(DB_URL);
const rows = (r) => (Array.isArray(r) ? r : r.rows || []);

export async function db(query, params = []) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return rows(await sql.query(query, params));
    } catch (err) {
      lastErr = err;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastErr;
}

export async function dbOne(query, params = []) {
  const r = await db(query, params);
  return r[0] ?? null;
}

// ---- action ids depuis les manifests Next (dev: .next/dev, sinon .next) ----
// Next 16 écrit un manifest global ET des manifests par page ; on fusionne tout.
export function loadActionIds() {
  const roots = [
    path.join(ROOT, ".next", "dev", "server"),
    path.join(ROOT, ".next", "server"),
  ];
  let manifestFiles = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    manifestFiles = fs
      .readdirSync(root, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith("server-reference-manifest.json"))
      .map((f) => path.join(root, f));
    if (manifestFiles.length > 0) break;
  }
  if (manifestFiles.length === 0) throw new Error("server-reference-manifest introuvable");
  const byExport = {};
  for (const file of manifestFiles) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const nodeMap = raw.node || raw;
    for (const [id, entry] of Object.entries(nodeMap)) {
      if (entry && entry.exportedName && !byExport[entry.exportedName]) {
        byExport[entry.exportedName] = id;
      }
    }
  }
  byExport.__manifest = manifestFiles.length + " fichier(s)";
  return byExport;
}

// ---- encodage React (encodeReply) ----
const requireCJS = createRequire(path.join(ROOT, "package.json"));
const encodeReplyPath = path.join(
  ROOT,
  "node_modules",
  "next",
  "dist",
  "compiled",
  "react-server-dom-turbopack",
  "cjs",
  "react-server-dom-turbopack-client.browser.development.js"
);
const { encodeReply } = requireCJS(encodeReplyPath);
export { encodeReply };

// ---- HTTP ----
function cookiesFrom(res) {
  const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return set
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

export async function signIn(email, password) {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  const cookie = cookiesFrom(res);
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, cookie, body };
}

export async function signUp(profile) {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify(profile),
  });
  const cookie = cookiesFrom(res);
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, cookie, body };
}

export async function signOut(cookie) {
  const res = await fetch(`${BASE}/api/auth/sign-out`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json", Origin: BASE },
    body: "{}",
  });
  return { status: res.status, setCookie: cookiesFrom(res) };
}

export async function getSession(cookie) {
  const res = await fetch(`${BASE}/api/auth/get-session`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, body };
}

export async function getPage(pathname, cookie, { redirect = "manual", retries = 3 } = {}) {
  let last;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${pathname}`, {
        redirect,
        headers: cookie ? { Cookie: cookie } : {},
      });
      const text = await res.text();
      last = { status: res.status, location: res.headers.get("location"), text };
      // Neon serverless peut échouer transitoirement (fetch failed) → 500.
      if (res.status < 500) return last;
    } catch (err) {
      last = { status: 0, location: null, text: "", error: String(err?.message || err) };
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return last;
}

export async function callAction(cookie, actionId, args, pathname = "/dashboard/pro") {
  const body = await encodeReply(args);
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: {
      "next-action": actionId,
      Cookie: cookie,
      Origin: BASE,
      Accept: "text/x-component, */*",
    },
    body,
  });
  const text = await res.text();
  return {
    status: res.status,
    notFound: res.headers.get("x-nextjs-action-not-found"),
    redirect: res.headers.get("x-action-redirect"),
    text,
    result: extractActionResult(text),
  };
}

export function extractActionResult(text) {
  const m = text.match(/\{"ok":(true|false),"message":"((?:[^"\\]|\\.)*)"\}/);
  if (!m) return null;
  return {
    ok: m[1] === "true",
    message: m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
  };
}

// ---- fragments HTML ----
export function fragmentBetween(text, start, endMarkers = []) {
  const i = text.indexOf(start);
  if (i < 0) return null;
  let end = text.length;
  for (const marker of endMarkers) {
    const j = text.indexOf(marker, i + start.length);
    if (j >= 0 && j < end) end = j;
  }
  return text.slice(i, end);
}
