import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "mlb_auth";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value : "";
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const idx = pair.indexOf("=");
      if (idx <= 0) return acc;
      const key = pair.slice(0, idx);
      const value = pair.slice(idx + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function makeSessionToken(secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  const sig = signPayload(payload, secret);
  return `${payload}.${sig}`;
}

function isValidSessionToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expectedSig = signPayload(payload, secret);
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt > Math.floor(Date.now() / 1000);
}

function secureCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method?.toUpperCase();
  const accessCode = getEnv("ACCESS_CODE");
  const sessionSecret = getEnv("AUTH_SESSION_SECRET");

  if (!accessCode || !sessionSecret) {
    res.status(500).json({ error: "Server auth is not configured" });
    return;
  }

  if (method === "GET") {
    const cookies = parseCookies(req.headers.cookie);
    const valid = isValidSessionToken(cookies[COOKIE_NAME], sessionSecret);
    res.status(valid ? 200 : 401).json({ authenticated: valid });
    return;
  }

  if (method === "POST") {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (!secureCompare(code, accessCode)) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const token = makeSessionToken(sessionSecret);
    res.setHeader("Set-Cookie", sessionCookie(token));
    res.status(200).json({ authenticated: true });
    return;
  }

  if (method === "DELETE") {
    res.setHeader("Set-Cookie", clearSessionCookie());
    res.status(200).json({ authenticated: false });
    return;
  }

  res.status(405).json({ error: "Method not allowed", supportedMethods: ["GET", "POST", "DELETE"] });
}
