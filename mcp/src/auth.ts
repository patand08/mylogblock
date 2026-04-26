import { timingSafeEqual } from "node:crypto";

/** Returns true if the Authorization header contains the correct Bearer token. */
export function checkApiKey(authHeader: string | undefined, expectedKey: string): boolean {
  if (!authHeader) return false;
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  if (!token) return false;

  const tokenBuf = Buffer.from(token, "utf8");
  const expectedBuf = Buffer.from(expectedKey, "utf8");
  if (tokenBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(tokenBuf, expectedBuf);
}
