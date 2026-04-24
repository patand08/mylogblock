const SESSION_KEY = "vs_authed";

export function verifyPassword(input: string): boolean {
  const expected = import.meta.env.VITE_ACCESS_CODE as string;
  if (!expected) return true; // no code set → open (dev convenience)
  return input === expected;
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function setAuthenticated(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearAuth(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
