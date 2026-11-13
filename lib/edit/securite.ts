import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type Police = "fraunces" | "outfit" | "georgia";
type StyleTexte = "normal" | "italic";

export const COOKIE = "__Host-edition";
export const SESSION_MS = 12 * 60 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export type Bucket = { fails: number; until: number; level: number; window: number };
export type SessionPayload = { sid: string; iat: number; exp: number };

export function freshBucket(): Bucket {
  return { fails: 0, until: 0, level: 0, window: 0 };
}

export function b32decode(input: string) {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const value = B32.indexOf(char);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const bin =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!;
  return String(bin % 1_000_000).padStart(6, "0");
}

/** Three windows are always compared. A step already accepted is refused. */
export function verifyTotp(secretB32: string, code: string, lastStep: number, now = Date.now()) {
  const key = b32decode(secretB32);
  const step = Math.floor(now / 30_000);
  const digits = String(code).replace(/\D/g, "");
  const probe = Buffer.from((digits + "000000").slice(0, 6));
  let found = -1;
  if (key.length >= 10) {
    for (const delta of [-1, 0, 1]) {
      const candidate = Buffer.from(hotp(key, step + delta));
      const same = probe.length === candidate.length && timingSafeEqual(probe, candidate);
      if (same) found = step + delta;
    }
  } else {
    const dummy = Buffer.from("000000");
    timingSafeEqual(dummy, dummy);
  }
  if (digits.length !== 6) found = -1;
  if (found !== -1 && found <= lastStep) return { ok: false as const, step: found };
  return { ok: found !== -1, step: found === -1 ? step : found };
}

export function blocked(bucket: Bucket, now: number) {
  return bucket.until > now;
}

export function noteFail(bucket: Bucket, now: number, limit: number) {
  if (bucket.window === 0 || (now > bucket.until && now - bucket.window > WINDOW_MS)) {
    bucket.fails = 0;
    bucket.window = now;
  }
  bucket.fails += 1;
  if (bucket.fails >= limit) {
    bucket.level = Math.min(6, bucket.level + 1);
    bucket.until = now + 15 * 60 * 1000 * 2 ** (bucket.level - 1);
    bucket.fails = 0;
    bucket.window = now;
  }
}

export function noteOk(bucket: Bucket) {
  bucket.fails = 0;
}

export function signSession(payload: SessionPayload, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readSessionToken(token: string, secret: string, now = Date.now()): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload || typeof payload.sid !== "string" || typeof payload.exp !== "number" || typeof payload.iat !== "number") return null;
    if (payload.exp <= now || payload.exp - payload.iat > SESSION_MS + 5_000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAge = SESSION_MS / 1000) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.floor(maxAge)}`;
}

export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function readCookie(header: string | null) {
  if (!header) return "";
  const match = header.match(/(?:^|;\s*)__Host-edition=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export function originAllowed(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    if (url.host !== host) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function sameSiteFetch(value: string | null) {
  return value === null || value === "same-origin" || value === "none";
}

export function randomId(bytes = 18) {
  return randomBytes(bytes).toString("base64url");
}

export function deviceHash(appareil: string, starId: string) {
  const pepper = process.env.EDIT_SESSION_SECRET || "appareil-local";
  return createHash("sha256").update(`${pepper}|${appareil}|${starId}`).digest("hex");
}

const FONTS = new Set<Police>(["fraunces", "outfit", "georgia"]);
const STYLES = new Set<StyleTexte>(["normal", "italic"]);

export function plainText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function choice<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;
}

export function fontOf(value: unknown) {
  return choice(value, FONTS, "fraunces");
}

export function styleOf(value: unknown) {
  return choice(value, STYLES, "normal");
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export type Sniff = { kind: "photo" | "video" | "audio" | "fichier"; ext: string; type: string };

export function sniff(buf: Buffer): Sniff | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: "photo", ext: "jpg", type: "image/jpeg" };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { kind: "photo", ext: "png", type: "image/png" };
  }
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") {
    return { kind: "photo", ext: "webp", type: "image/webp" };
  }
  if (buf.length >= 6 && (buf.subarray(0, 6).toString() === "GIF87a" || buf.subarray(0, 6).toString() === "GIF89a")) {
    return { kind: "photo", ext: "gif", type: "image/gif" };
  }
  if (buf.length >= 12 && buf.subarray(4, 8).toString() === "ftyp") return { kind: "video", ext: "mp4", type: "video/mp4" };
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { kind: "video", ext: "webm", type: "video/webm" };
  }
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WAVE") {
    return { kind: "audio", ext: "wav", type: "audio/wav" };
  }
  if (buf.length >= 3 && buf.subarray(0, 3).toString() === "ID3") return { kind: "audio", ext: "mp3", type: "audio/mpeg" };
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0) return { kind: "audio", ext: "mp3", type: "audio/mpeg" };
  if (buf.length >= 5 && buf.subarray(0, 5).toString() === "%PDF-") return { kind: "fichier", ext: "pdf", type: "application/pdf" };
  return null;
}

export const LIMITS: Record<Sniff["kind"], number> = {
  photo: 4_000_000,
  video: 12_000_000,
  audio: 8_000_000,
  fichier: 4_000_000,
};
