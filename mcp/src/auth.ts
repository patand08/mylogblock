/** Returns true if the Authorization header contains the correct Bearer token. */
export function checkApiKey(authHeader: string | undefined, expectedKey: string): boolean {
  if (!authHeader) return false;
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  if (!token) return false;
  return token === expectedKey;
}
