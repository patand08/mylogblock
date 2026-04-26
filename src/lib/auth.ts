type AuthResponse = { authenticated?: boolean };

async function readAuthResponse(res: Response): Promise<AuthResponse | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;

  try {
    return (await res.json()) as AuthResponse;
  } catch {
    return null;
  }
}

export async function verifyPassword(input: string): Promise<boolean> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code: input }),
  });
  if (!res.ok) return false;
  const body = await readAuthResponse(res);
  return body?.authenticated === true;
}

export async function isAuthenticated(): Promise<boolean> {
  const res = await fetch("/api/auth", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return false;
  const body = await readAuthResponse(res);
  return body?.authenticated === true;
}

export async function clearAuth(): Promise<void> {
  await fetch("/api/auth", {
    method: "DELETE",
    credentials: "include",
  });
}
