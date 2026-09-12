### Task 7: Client UI — auth panel, user context, landing + leaderboard pages

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/context/UserContext.tsx`
- Create: `src/components/AuthPanel.tsx`
- Create: `src/components/LeaderboardList.tsx`
- Modify: `src/app/layout.tsx` (wrap Providers + nav)
- Modify: `src/app/page.tsx` (landing with auth + play)
- Create: `src/app/leaderboard/page.tsx`
- Test: none (typecheck/build smoke)

**Interfaces:**
- Consumes: API endpoints from Task 6
- Produces:
  - `apiFetch<T>(path, init?): Promise<T>`
  - `useUser(): { user: PublicUser | null; status: 'loading'|'ready'; login(...); logout(); refresh() }` via `UserProvider`
  - `<AuthPanel />`, `<LeaderboardList />`, `<Providers children? />`

- [ ] **Step 1: Write `src/lib/api.ts`**

```ts
"use client";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : `Lỗi ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}
```

- [ ] **Step 2: Write `src/context/UserContext.tsx`**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { PublicUser } from "@/types";
import { apiFetch } from "@/lib/api";

type AuthResponse = { user: PublicUser };

interface UserContextValue {
  user: PublicUser | null;
  status: "loading" | "ready";
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setUser(res.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, status, login, register, logout, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser phải dùng trong UserProvider");
  return ctx;
}
```

- [ ] **Step 3: Add `POST /api/auth/logout` route**

Create `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/auth";

export async function POST() {
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearCookie() } });
}
```

- [ ] **Step 4: Write `src/components/AuthPanel.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@/context/UserContext";

export default function AuthPanel() {
  const { user, status, login, register, logout } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "loading") return <p>Đang kiểm tra phiên…</p>;

  if (user) {
    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <span>Xin chào, <strong>{user.username}</strong></span>
        <button onClick={() => void logout()}>Đăng xuất</button>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.5rem", maxWidth: 280, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <button type="button" onClick={() => setMode("login")} disabled={mode === "login"}>Đăng nhập</button>
        <button type="button" onClick={() => setMode("register")} disabled={mode === "register"}>Đăng ký</button>
      </div>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Tên người chơi (3-20, a-z 0-9 _)"
        maxLength={20}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu (≥ 6 ký tự)"
        minLength={6}
      />
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      <button type="submit" disabled={busy}>
        {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Write `src/components/LeaderboardList.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/types";
import { apiFetch } from "@/lib/api";

export default function LeaderboardList() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ entries: LeaderboardEntry[] }>("/api/leaderboard")
      .then((r) => setEntries(r.entries))
      .catch(() => setError("Không tải được bảng xếp hạng."));
  }, []);

  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;

  return (
    <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thStyle}>#</th>
          <th style={thStyle}>Người chơi</th>
          <th style={thStyle}>Điểm</th>
          <th style={thStyle}>Boss</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={`${e.rank}-${e.username}`}>
            <td style={tdStyle}>{e.rank}</td>
            <td style={tdStyle}>{e.username}</td>
            <td style={tdStyle}>{e.score}</td>
            <td style={tdStyle}>{e.boss_defeated ? "✔" : "–"}</td>
          </tr>
        ))}
        {entries.length === 0 && (
          <tr><td style={tdStyle} colSpan={4}>Chưa có người chơi nào.</td></tr>
        )}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = { border: "1px solid #333", padding: "0.5rem 1rem" };
const tdStyle: React.CSSProperties = { border: "1px solid #333", padding: "0.4rem 1rem" };
```

- [ ] **Step 6: Update `src/app/layout.tsx` with Providers + nav links**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";

export const metadata: Metadata = {
  title: "Pixel Quest",
  description: "Top-down pixel action RPG",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <UserProvider>
          <nav style={{ display: "flex", gap: "1rem", padding: "1rem", justifyContent: "center" }}>
            <Link href="/">Trang chủ</Link>
            <Link href="/game">Chơi</Link>
            <Link href="/leaderboard">Bảng xếp hạng</Link>
          </nav>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Write landing `src/app/page.tsx`**

```tsx
import Link from "next/link";
import AuthPanel from "@/components/AuthPanel";
import LeaderboardList from "@/components/LeaderboardList";

export default function Home() {
  return (
    <main style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "3rem" }}>Pixel Quest</h1>
      <p style={{ margin: "1rem 0 2rem" }}>
        Cuộc phiêu lưu pixel top-down: diệt slime, nhận quest, vượt mê cung và hạ Boss.
      </p>
      <AuthPanel />
      <p style={{ margin: "2rem 0" }}>
        <Link href="/game">
          <button style={{ fontSize: "1.4rem", padding: "0.8rem 2rem" }}>Bắt đầu chơi</button>
        </Link>
      </p>
      <h2 style={{ margin: "2rem 0 1rem" }}>Bảng xếp hạng</h2>
      <LeaderboardList />
    </main>
  );
}
```

- [ ] **Step 8: Write `src/app/leaderboard/page.tsx`**

```tsx
import LeaderboardList from "@/components/LeaderboardList";

export default function LeaderboardPage() {
  return (
    <main style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <h1>Bảng xếp hạng</h1>
      <LeaderboardList />
    </main>
  );
}
```

- [ ] **Step 9: Verify**

Run: `npm run typecheck; npm run lint; npm run build`
Expected: all exit 0.

- [ ] **Step 10: Commit**

```bash
git add -A; git commit -m "feat: auth panel, user context, landing and leaderboard pages"
```

---
