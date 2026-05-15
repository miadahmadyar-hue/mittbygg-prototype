export interface User {
  name: string;
  initial: string;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("mittbygg_user");
    if (!stored) return null;
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function setUser(name: string): User {
  const words = name.trim().split(/\s+/);
  const initial = words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const user: User = { name, initial };
  localStorage.setItem("mittbygg_user", JSON.stringify(user));
  return user;
}

export function clearUser() {
  localStorage.removeItem("mittbygg_user");
}
