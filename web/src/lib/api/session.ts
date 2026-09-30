const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
let pending: Promise<string> | null = null;
let expires = 0;
async function token(): Promise<string> {
  if (!pending || (expires > 0 && Date.now() >= expires)) {
    expires = 0;
    pending = fetch(`${API_URL}/api/auth/session`, { method: "POST", signal: AbortSignal.timeout(15_000) }).then(async (response) => {
      if (!response.ok) throw new Error("Session unavailable");
      const session = await response.json();
      expires = Date.now() + (session.expires_in - 30) * 1000;
      return session.token as string;
    }).catch((error) => { pending = null; throw error; });
  }
  return pending;
}
export async function sessionFetch(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-Session-Token", await token());
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    pending = null; expires = 0;
    headers.set("X-Session-Token", await token());
    return fetch(url, { ...init, headers });
  }
  return response;
}
