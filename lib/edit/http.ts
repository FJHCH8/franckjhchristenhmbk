import { NextResponse } from "next/server";
import {
  clearCookie,
  freshBucket,
  noteFail,
  noteOk,
  originAllowed,
  randomId,
  readCookie,
  readSessionToken,
  sameSiteFetch,
  sessionCookie,
  signSession,
  SESSION_MS,
  verifyTotp,
  blocked,
} from "@/lib/edit/securite";
import { readEtat, updateEtat, type Etat } from "@/lib/etoiles/etat";

export function reponse(body: unknown, status = 200, cookie?: string) {
  const res = NextResponse.json(body, { status });
  res.headers.set("x-robots-tag", "noindex, nofollow");
  res.headers.set("cache-control", "no-store");
  res.headers.set("x-content-type-options", "nosniff");
  if (cookie) res.headers.set("set-cookie", cookie);
  return res;
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 80) || "0";
  return "0";
}

export function secrets() {
  return {
    totp: process.env.EDIT_TOTP_SECRET?.trim() || "",
    session: process.env.EDIT_SESSION_SECRET?.trim() || "",
  };
}

export function origineOk(req: Request) {
  return originAllowed(req.headers.get("origin"), req.headers.get("host")) && sameSiteFetch(req.headers.get("sec-fetch-site"));
}

function prune(etat: Etat, now: number) {
  for (const [sid, row] of Object.entries(etat.sessions)) {
    if (row.exp <= now) delete etat.sessions[sid];
  }
}

export async function ouvrirSession(req: Request, code: string) {
  if (!origineOk(req)) return reponse({ erreur: "Requête refusée." }, 403);
  const { totp, session } = secrets();
  if (!totp || !session) return reponse({ erreur: "Édition indisponible." }, 503);
  const ip = clientIp(req);
  return updateEtat((etat) => {
    const now = Date.now();
    prune(etat, now);
    etat.ip[ip] ??= freshBucket();
    const mine = etat.ip[ip];
    const globe = etat.global;
    const verdict = verifyTotp(totp, code, etat.totpStep, now);
    const locked = blocked(mine, now) || blocked(globe, now);
    if (locked || !verdict.ok) {
      if (!locked) {
        noteFail(mine, now, 5);
        noteFail(globe, now, 20);
      }
      const status = locked || blocked(mine, now) || blocked(globe, now) ? 429 : 401;
      return reponse({ erreur: status === 429 ? "Trop de tentatives. Réessayez plus tard." : "Ce code n’est pas accepté." }, status);
    }
    etat.totpStep = verdict.step;
    noteOk(mine);
    noteOk(globe);
    const sid = randomId();
    const jeton = randomId();
    etat.sessions[sid] = { exp: now + SESSION_MS, iat: now, jeton };
    const token = signSession({ sid, iat: now, exp: now + SESSION_MS }, session);
    return reponse({ ok: true, jeton }, 200, sessionCookie(token));
  });
}

export async function avecEcriture(
  req: Request,
  fn: (etat: Etat, sid: string) => Promise<{ body: unknown; status?: number } | { body: unknown; status?: number }> | { body: unknown; status?: number },
) {
  if (!origineOk(req)) return reponse({ erreur: "Requête refusée." }, 403);
  const { session } = secrets();
  if (!session) return reponse({ erreur: "Édition indisponible." }, 503);
  const payload = readSessionToken(readCookie(req.headers.get("cookie")), session);
  if (!payload) return reponse({ erreur: "Session absente." }, 401);
  const presented = req.headers.get("x-edition-jeton") || "";
  return updateEtat((etat) => {
    const row = etat.sessions[payload.sid];
    if (!row || row.exp <= Date.now() || !presented || presented !== row.jeton) {
      return reponse({ erreur: "Requête refusée." }, 403);
    }
    return Promise.resolve(fn(etat, payload.sid)).then((result) => {
      const status = result.status ?? 200;
      if (status >= 400) return reponse(result.body, status);
      delete etat.sessions[payload.sid];
      const sid = randomId();
      const jeton = randomId();
      etat.sessions[sid] = { exp: row.exp, iat: row.iat, jeton };
      const token = signSession({ sid, iat: row.iat, exp: row.exp }, session);
      const maxAge = Math.max(1, Math.floor((row.exp - Date.now()) / 1000));
      return reponse({ ...(result.body as object), jeton }, status, sessionCookie(token, maxAge));
    });
  });
}

export async function lireSession(req: Request) {
  const { session } = secrets();
  if (!session) return reponse({ ok: false });
  const payload = readSessionToken(readCookie(req.headers.get("cookie")), session);
  if (!payload) return reponse({ ok: false });
  const etat = await readEtat();
  const row = etat.sessions[payload.sid];
  if (!row || row.exp <= Date.now()) return reponse({ ok: false });
  return reponse({ ok: true, jeton: row.jeton });
}

export async function fermerSession(req: Request) {
  if (!origineOk(req)) return reponse({ erreur: "Requête refusée." }, 403);
  const { session } = secrets();
  const payload = session ? readSessionToken(readCookie(req.headers.get("cookie")), session) : null;
  const jeton = req.headers.get("x-edition-jeton") || "";
  if (payload) {
    await updateEtat((etat) => {
      const row = etat.sessions[payload.sid];
      if (row && jeton === row.jeton) delete etat.sessions[payload.sid];
    });
  }
  return reponse({ ok: true }, 200, clearCookie());
}
