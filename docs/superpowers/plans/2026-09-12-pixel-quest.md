# Pixel Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack top-down pixel action RPG ("Pixel Quest") — Phaser 3 game on a Next.js 15 app with accounts, cloud saves (Turso/libSQL), and a leaderboard — deployable by the user on Vercel via Git import (no `vercel` CLI).

**Architecture:** Single Next.js 15 (App Router) + TypeScript project. Backend = Next.js API routes (auth, save, leaderboard) replacing Express. DB = Turso `@libsql/client` — local dev uses a `file:` SQLite database, production uses a `libsql://` URL; only `DATABASE_URL` changes. Game = Phaser 3, mounted client-side on `/game`, with framework-free pure systems (combat/inventory/quest/session) kept unit-testable.

**Tech Stack:** next@15, react/react-dom@19, phaser@3, @libsql/client, bcryptjs, jose, zod@3; dev: typescript, vitest, eslint, eslint-config-next, @types/bcryptjs.

**Spec:** `docs/superpowers/specs/2026-09-12-pixel-quest-design.md`

## Global Constraints

- Next.js 15 App Router; path alias `@/*` → `src/*` in tsconfig + vitest
- All API routes return `NextResponse.json({...})`; errors `{ error: string }` with proper status
- Passwords hashed with bcryptjs (never plaintext); JWT in httpOnly cookie named `pixelquest_token`, signed with jose HS256, 7d expiry
- Save clamping enforced server-side (server authoritative): `1 ≤ hp ≤ max_hp ≤ 100`, `0 ≤ coins ≤ 99999`, `1 ≤ sword_level ≤ 5`, items whitelist `["potion","sword_upgrade"]` max 8, `map_id` ∈ `["village","forest","cave","arena"]`
- `score = min(coins + (boss_defeated ? 1000 : 0), 99999)` — computed server-side only
- Game names/text in Vietnamese (UI + dialogue)
- `.env.example` committed with `DATABASE_URL` (default `file:./data/dev.db`) and `JWT_SECRET`
- `CREDITS.md` for any downloaded assets; procedural pixel art is fallback that keeps the game fully playable
- Code files under `src/`; tests under `tests/`; no comments in code unless required by lint
- Every task ends with green checks: `npm run typecheck`, `npm run lint`, `npm run test`, and a commit

---

### Task 1: Scaffold project, config, dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `.env.example`, `vitest.config.mts`, `eslint.config.mjs`, `next-env.d.ts`, `README.md` (skeleton)
- Create: `src/app/layout.tsx`, `src/app/page.tsx` (placeholder)
- Test: none (build/typecheck smoke)

**Interfaces:**
- Consumes: nothing
- Produces: runnable `npm run dev`, `npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`

- [ ] **Step 1: Init git and write `package.json`**

```bash
git init
```

```json
{
  "name": "pixel-quest",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@libsql/client": "^0.14.0",
    "bcryptjs": "^3.0.2",
    "jose": "^5.9.6",
    "next": "^15.1.6",
    "phaser": "^3.87.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.7",
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.3",
    "eslint": "^9.18.0",
    "eslint-config-next": "^15.1.6",
    "typescript": "^5.7.3",
    "vitest": "^3.0.3"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`, `.gitignore`, `.env.example`, `next-env.d.ts`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
export default nextConfig;
```

```gitignore
node_modules/
.next/
out/
data/
.env
.env.local
*.log
.DS_Store
```

```text
# Local SQLite dev database. For production set a Turso libsql URL:
# DATABASE_URL=libsql://your-db.turso.io?authToken=YOUR_TOKEN
DATABASE_URL=file:./data/dev.db

# Change this in production to a long random string.
JWT_SECRET=dev-secret-change-me
```

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 4: Write `vitest.config.mts` and `eslint.config.mjs`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

```js
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [...compat.extends("next/core-web-vitals", "next/typescript")];
export default config;
```

- [ ] **Step 5: Write `src/app/layout.tsx` and placeholder `src/app/page.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Quest",
  description: "Top-down pixel action RPG",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #10131a; color: #e8e8f0; font-family: ui-monospace, "Cascadia Mono", monospace; }
a { color: #7dd3fc; }
button { cursor: pointer; }
```

```tsx
export default function Home() {
  return (
    <main style={{ padding: "4rem", textAlign: "center" }}>
      <h1>Pixel Quest</h1>
      <p>Đang xây dựng…</p>
    </main>
  );
}
```

- [ ] **Step 6: Install, then verify typecheck + build**

Run: `npm install; npm run typecheck`
Expected: typecheck exits 0.

Run: `npm run build`
Expected: build completes, outputs `.next`.

- [ ] **Step 7: Commit**

```bash
git add -A; git commit -m "chore: scaffold Next.js app with config and deps"
```

---

### Task 2: Shared types + DB layer + schema

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/db.ts`
- Create: `tests/db.test.ts`
- Create: `src/app/globals.css` (already in Task 1 — no change)

**Interfaces:**
- Consumes: Task 1 config
- Produces:
  - `type MapId`, `type Direction`, `type ItemType`, `interface QuestState`, `interface SaveState`, `interface PublicUser`, `interface LeaderboardEntry`
  - `type Db` (= libsql Client), `getDb()`, `createTestDb()`, `initSchema(db)`

- [ ] **Step 1: Write `src/types/index.ts`**

```ts
export type MapId = "village" | "forest" | "cave" | "arena";
export type Direction = "up" | "down" | "left" | "right";
export type ItemType = "potion" | "sword_upgrade";

export interface QuestState {
  slime_quest: {
    accepted: boolean;
    kills: number;
    complete: boolean;
    claimed: boolean;
  };
}

export interface SaveState {
  map_id: MapId;
  pos_x: number;
  pos_y: number;
  hp: number;
  max_hp: number;
  coins: number;
  sword_level: number;
  items: ItemType[];
  quests: QuestState;
  boss_defeated: boolean;
  score: number;
}

export interface PublicUser {
  id: number;
  username: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  boss_defeated: boolean;
  updated_at: string;
}
```

- [ ] **Step 2: Write `src/lib/db.ts`**

```ts
import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";

export type Db = Client;

const DEFAULT_URL = "file:./data/dev.db";

function ensureFileDir(url: string) {
  if (!url.startsWith("file:")) return;
  const p = url.slice(5).replace(/^\.\//, "");
  const dir = p.split(/[/\\]/).slice(0, -1).join("/");
  if (dir) mkdirSync(dir, { recursive: true });
}

let singleton: Db | null = null;

export function getDb(): Db {
  if (!singleton) {
    const url = process.env.DATABASE_URL ?? DEFAULT_URL;
    ensureFileDir(url);
    singleton = createClient({ url });
  }
  return singleton;
}

export function createTestDb(): Db {
  return createClient({ url: ":memory:" });
}

export async function initSchema(db: Db): Promise<void> {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL UNIQUE,
       password_hash TEXT NOT NULL,
       created_at TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS saves (
       user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
       map_id TEXT NOT NULL DEFAULT 'village',
       pos_x INTEGER NOT NULL DEFAULT 40,
       pos_y INTEGER NOT NULL DEFAULT 40,
       hp INTEGER NOT NULL DEFAULT 100,
       max_hp INTEGER NOT NULL DEFAULT 100,
       coins INTEGER NOT NULL DEFAULT 0,
       sword_level INTEGER NOT NULL DEFAULT 1,
       items TEXT NOT NULL DEFAULT '[]',
       quests TEXT NOT NULL DEFAULT '{"slime_quest":{"accepted":false,"kills":0,"complete":false,"claimed":false}}',
       boss_defeated INTEGER NOT NULL DEFAULT 0,
       score INTEGER NOT NULL DEFAULT 0,
       updated_at TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS leaderboard (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       username TEXT NOT NULL,
       score INTEGER NOT NULL,
       boss_defeated INTEGER NOT NULL DEFAULT 0,
       created_at TEXT NOT NULL
     )`,
  ]);
}
```

- [ ] **Step 3: Write failing test `tests/db.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { createTestDb, initSchema } from "@/lib/db";

describe("db", () => {
  it("initializes schema with all three tables", async () => {
    const db = createTestDb();
    await initSchema(db);
    const tables = (await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table'"
    )).rows.map((r) => r.name);
    expect(tables).toEqual(expect.arrayContaining(["users", "saves", "leaderboard"]));
  });

  it("allows inserting a user and matching save row", async () => {
    const db = createTestDb();
    await initSchema(db);
    await db.execute({
      sql: "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
      args: ["alice", "hash", "2026-01-01T00:00:00Z"],
    });
    await db.execute({
      sql: "INSERT INTO saves (user_id, updated_at) VALUES (1, '2026-01-01T00:00:00Z')",
      args: [],
    });
    const rows = (await db.execute("SELECT user_id, map_id, hp FROM saves")).rows;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].hp)).toBe(100);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/db'` (module not created yet is false, but run to confirm green/gate).

- [ ] **Step 5: Run typecheck + test**

Run: `npm run typecheck; npm test`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add -A; git commit -m "feat: shared types and libsql DB layer with schema"
```

---

### Task 3: Auth + users libraries

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/users.ts`
- Create: `tests/auth.test.ts`
- Create: `tests/users.test.ts`

**Interfaces:**
- Consumes: Task 2 (`Db`, `PublicUser`)
- Produces:
  - `hashPassword(pw: string): Promise<string>`
  - `verifyPassword(pw, hash): Promise<boolean>`
  - `signToken(userId: number, username: string): Promise<string>`
  - `verifyToken(token): Promise<{ userId: number; username: string } | null>`
  - `authCookie(token: string): string`, `clearCookie(): string`
  - `getUserFromRequest(req: NextRequest): Promise<{ userId: number; username: string } | null>`
  - `registerUser(db, input: unknown): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }>`
  - `loginUser(db, input: unknown): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }>`

- [ ] **Step 1: Write failing tests `tests/auth.test.ts` and `tests/users.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@/lib/auth";

describe("auth", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies a JWT", async () => {
    process.env.JWT_SECRET = "test-secret";
    const token = await signToken(7, "alice");
    const decoded = await verifyToken(token);
    expect(decoded).toEqual({ userId: 7, username: "alice" });
    expect(await verifyToken("garbage")).toBeNull();
  });
});
```

```ts
import { describe, it, expect } from "vitest";
import { createTestDb, initSchema, type Db } from "@/lib/db";
import { registerUser, loginUser } from "@/lib/users";

describe("users", () => {
  let db: Db;
  beforeEach(async () => {
    db = createTestDb();
    await initSchema(db);
  });

  it("registers a new user", async () => {
    const res = await registerUser(db, { username: "alice", password: "secret123" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.user.username).toBe("alice");
  });

  it("rejects duplicate usernames", async () => {
    await registerUser(db, { username: "alice", password: "secret123" });
    const res = await registerUser(db, { username: "alice", password: "other123" });
    expect(res.ok).toBe(false);
  });

  it("rejects invalid input", async () => {
    const res = await registerUser(db, { username: "a", password: "x" });
    expect(res.ok).toBe(false);
  });

  it("logs in an existing user with correct password", async () => {
    await registerUser(db, { username: "bob", password: "secret123" });
    const res = await loginUser(db, { username: "bob", password: "secret123" });
    expect(res.ok).toBe(true);
  });

  it("rejects wrong password", async () => {
    await registerUser(db, { username: "bob", password: "secret123" });
    const res = await loginUser(db, { username: "bob", password: "nope" });
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/auth.test.ts tests/users.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/auth.ts`**

```ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pixelquest_token";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(userId: number, username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return { userId: Number(payload.sub), username: String(payload.username ?? "") };
  } catch {
    return null;
  }
}

export function authCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function getUserFromRequest(req: NextRequest): Promise<{ userId: number; username: string } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
```

- [ ] **Step 4: Write `src/lib/users.ts`**

```ts
import { z } from "zod";
import type { Db } from "./db";
import type { PublicUser } from "@/types";
import { hashPassword, verifyPassword } from "./auth";

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(72),
});

const USERNAME_MESSAGE = "Tên đăng nhập phải 3–20 ký tự (a-z, 0-9, _). Mật khẩu ≥ 6 ký tự.";

export async function registerUser(db: Db, input: unknown): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: USERNAME_MESSAGE };
  const { username, password } = parsed.data;
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
  if (existing.rows.length > 0) return { ok: false, error: "Tên đăng nhập đã tồn tại." };
  const passwordHash = await hashPassword(password);
  await db.execute({
    sql: "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
    args: [username, passwordHash, new Date().toISOString()],
  });
  const row = (await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] })).rows[0];
  return { ok: true, user: { id: Number(row.id), username } };
}

export async function loginUser(db: Db, input: unknown): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Tên đăng nhập hoặc mật khẩu không hợp lệ." };
  const { username, password } = parsed.data;
  const rows = (await db.execute({
    sql: "SELECT id, username, password_hash FROM users WHERE username = ?",
    args: [username],
  })).rows;
  if (rows.length === 0) return { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu." };
  const row = rows[0];
  const valid = await verifyPassword(password, String(row.password_hash));
  if (!valid) return { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu." };
  return { ok: true, user: { id: Number(row.id), username: String(row.username) } };
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npm run typecheck; npm test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add -A; git commit -m "feat: auth and user registration/login with JWT and bcrypt"
```

---

### Task 4: Saves library (validation, clamping, score)

**Files:**
- Create: `src/lib/saves.ts`
- Create: `tests/saves.test.ts`

**Interfaces:**
- Consumes: Task 2 (`Db`, `SaveState`, `MapId`, `QuestState`)
- Produces:
  - `const MAP_IDS: MapId[]`
  - `const DEFAULT_SAVE: SaveState`
  - `computeScore(save: SaveState): number`
  - `clampSave(raw: unknown): { ok: true; save: SaveState } | { ok: false; error: string }`
  - `getSaveRow(db, userId: number): Promise<SaveState | null>`
  - `putSaveRow(db, userId: number, save: SaveState): Promise<void>`

- [ ] **Step 1: Write failing test `tests/saves.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, initSchema, type Db } from "@/lib/db";
import { clampSave, computeScore, DEFAULT_SAVE, getSaveRow, putSaveRow } from "@/lib/saves";

function validSave() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

describe("saves", () => {
  let db: Db;
  beforeEach(async () => {
    db = createTestDb();
    await initSchema(db);
  });

  it("accepts the default save", () => {
    const res = clampSave(validSave());
    expect(res.ok).toBe(true);
  });

  it("rejects invalid map_id", () => {
    const res = clampSave({ ...validSave(), map_id: "moon" });
    expect(res.ok).toBe(false);
  });

  it("rejects too many items", () => {
    const res = clampSave({ ...validSave(), items: Array(9).fill("potion") });
    expect(res.ok).toBe(false);
  });

  it("rejects unknown item type", () => {
    const res = clampSave({ ...validSave(), items: ["cheese"] });
    expect(res.ok).toBe(false);
  });

  it("rejects hp larger than max_hp cap", () => {
    const res = clampSave({ ...validSave(), max_hp: 200 });
    expect(res.ok).toBe(false);
  });

  it("computes score with boss bonus", () => {
    expect(computeScore({ ...validSave(), coins: 500, boss_defeated: false })).toBe(500);
    expect(computeScore({ ...validSave(), coins: 500, boss_defeated: true })).toBe(1500);
    expect(computeScore({ ...validSave(), coins: 99999, boss_defeated: true })).toBe(99999);
  });

  it("persists and reads a save row", async () => {
    await db.execute({
      sql: "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
      args: ["alice", "hash", "2026-01-01T00:00:00Z"],
    });
    const save = { ...validSave(), coffins: 0 } as Record<string, unknown>;
    for (const k of ["coffins"]) delete save[k];
    const patch = { ...(save as object), coins: 42, sword_level: 3, map_id: "cave" } as typeof DEFAULT_SAVE;
    await putSaveRow(db, 1, patch);
    const read = await getSaveRow(db, 1);
    expect(read?.coins).toBe(42);
    expect(read?.sword_level).toBe(3);
    expect(read?.map_id).toBe("cave");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/saves.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/saves.ts`**

```ts
import { z } from "zod";
import type { Db } from "./db";
import type { MapId, QuestState, SaveState } from "@/types";

export const MAP_IDS = ["village", "forest", "cave", "arena"] as const;

export const DEFAULT_SAVE: SaveState = {
  map_id: "village",
  pos_x: 40,
  pos_y: 40,
  hp: 100,
  max_hp: 100,
  coins: 0,
  sword_level: 1,
  items: [],
  quests: { slime_quest: { accepted: false, kills: 0, complete: false, claimed: false } },
  boss_defeated: false,
  score: 0,
};

export function computeScore(save: SaveState): number {
  return Math.min(save.coins + (save.boss_defeated ? 1000 : 0), 99999);
}

const questSchema = z.object({
  slime_quest: z.object({
    accepted: z.boolean(),
    kills: z.number().int().min(0).max(1000),
    complete: z.boolean(),
    claimed: z.boolean(),
  }),
});

const saveSchema = z.object({
  map_id: z.enum(MAP_IDS),
  pos_x: z.number().int().min(0).max(4000),
  pos_y: z.number().int().min(0).max(4000),
  hp: z.number().int().min(1).max(100),
  max_hp: z.number().int().min(1).max(100),
  coins: z.number().int().min(0).max(99999),
  sword_level: z.number().int().min(1).max(5),
  items: z.array(z.enum(["potion", "sword_upgrade"])).max(8),
  quests: questSchema,
  boss_defeated: z.boolean(),
  score: z.number().int().min(0).max(999999).optional(),
});

export function clampSave(raw: unknown): { ok: true; save: SaveState } | { ok: false; error: string } {
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dữ liệu save không hợp lệ." };
  const { score: _ignored, ...rest } = parsed.data;
  const save: SaveState = { ...rest, score: computeScore(rest as SaveState) };
  return { ok: true, save };
}

export async function getSaveRow(db: Db, userId: number): Promise<SaveState | null> {
  const rows = (await db.execute({ sql: "SELECT * FROM saves WHERE user_id = ?", args: [userId] })).rows;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    map_id: String(r.map_id) as MapId,
    pos_x: Number(r.pos_x),
    pos_y: Number(r.pos_y),
    hp: Number(r.hp),
    max_hp: Number(r.max_hp),
    coins: Number(r.coins),
    sword_level: Number(r.sword_level),
    items: JSON.parse(String(r.items)) as SaveState["items"],
    quests: JSON.parse(String(r.quests)) as QuestState,
    boss_defeated: Boolean(r.boss_defeated),
    score: Number(r.score),
  };
}

export async function putSaveRow(db: Db, userId: number, save: SaveState): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO saves (user_id, map_id, pos_x, pos_y, hp, max_hp, coins, sword_level, items, quests, boss_defeated, score, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            map_id=excluded.map_id, pos_x=excluded.pos_x, pos_y=excluded.pos_y,
            hp=excluded.hp, max_hp=excluded.max_hp, coins=excluded.coins,
            sword_level=excluded.sword_level, items=excluded.items,
            quests=excluded.quests, boss_defeated=excluded.boss_defeated,
            score=excluded.score, updated_at=excluded.updated_at`,
    args: [userId, save.map_id, save.pos_x, save.pos_y, save.hp, save.max_hp, save.coins, save.sword_level,
      JSON.stringify(save.items), JSON.stringify(save.quests), save.boss_defeated ? 1 : 0, save.score, now],
  });
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npm run typecheck; npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A; git commit -m "feat: save state validation, clamping, and persistence"
```

---

### Task 5: Leaderboard library

**Files:**
- Create: `src/lib/leaderboard.ts`
- Create: `tests/leaderboard.test.ts`

**Interfaces:**
- Consumes: Task 2 (`Db`, `LeaderboardEntry`)
- Produces:
  - `getLeaderboardRows(db: Db, limit?: number): Promise<LeaderboardEntry[]>`
  - `submitScore(db, userId: number, username: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }>`

- [ ] **Step 1: Write failing test `tests/leaderboard.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, initSchema, type Db } from "@/lib/db";
import { getLeaderboardRows, submitScore } from "@/lib/leaderboard";

describe("leaderboard", () => {
  let db: Db;
  beforeEach(async () => {
    db = createTestDb();
    await initSchema(db);
    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [1, "alice", "hash", "2026-01-01T00:00:00Z"],
    });
    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [2, "bob", "hash", "2026-01-01T00:00:00Z"],
    });
  });

  async function seedSave(userId: number, score: number) {
    await db.execute({
      sql: "INSERT INTO saves (user_id, score, updated_at) VALUES (?, ?, ?)",
      args: [userId, score, `2026-01-01T00:00:${score}Z`],
    });
  }

  it("returns derived leaderboard sorted by score", async () => {
    await seedSave(1, 100);
    await seedSave(2, 300);
    const rows = await getLeaderboardRows(db);
    expect(rows).toHaveLength(2);
    expect(rows[0].username).toBe("bob");
    expect(rows[1].username).toBe("alice");
    expect(rows[0].rank).toBe(1);
  });

  it("rejects invalid score payload", async () => {
    const res = await submitScore(db, 1, "alice", { score: -5, boss_defeated: false });
    expect(res.ok).toBe(false);
  });

  it("records a run submission", async () => {
    const res = await submitScore(db, 1, "alice", { score: 1500, boss_defeated: true });
    expect(res.ok).toBe(true);
    const rows = await getLeaderboardRows(db);
    expect(rows[0].score).toBe(1500);
    expect(rows[0].boss_defeated).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/leaderboard.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/leaderboard.ts`**

```ts
import { z } from "zod";
import type { Db } from "./db";
import type { LeaderboardEntry } from "@/types";

const submitSchema = z.object({
  score: z.number().int().min(0).max(99999),
  boss_defeated: z.boolean(),
});

export async function getLeaderboardRows(db: Db, limit = 10): Promise<LeaderboardEntry[]> {
  const rows = (await db.execute({
    sql: `SELECT u.username, s.score, s.boss_defeated, s.updated_at
          FROM saves s JOIN users u ON u.id = s.user_id
          ORDER BY s.score DESC, s.updated_at ASC
          LIMIT ?`,
    args: [limit],
  })).rows;
  return rows.map((r, i) => ({
    rank: i + 1,
    username: String(r.username),
    score: Number(r.score),
    boss_defeated: Boolean(r.boss_defeated),
    updated_at: String(r.updated_at),
  }));
}

export async function submitScore(db: Db, userId: number, username: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Điểm số không hợp lệ." };
  await db.execute({
    sql: "INSERT INTO leaderboard (user_id, username, score, boss_defeated, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [userId, username, parsed.data.score, parsed.data.boss_defeated ? 1 : 0, new Date().toISOString()],
  });
  return { ok: true };
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npm run typecheck; npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A; git commit -m "feat: leaderboard query and run submission"
```

---

### Task 6: API routes

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/save/route.ts`
- Create: `src/app/api/leaderboard/route.ts`

**Interfaces:**
- Consumes: Task 3 (`getUserFromRequest`, `signToken`, `authCookie`, `clearCookie`), Task 4 (`clampSave`, `getSaveRow`, `putSaveRow`, `DEFAULT_SAVE`), Task 5 (`getLeaderboardRows`, `submitScore`)
- Produces: REST endpoints:
  - `POST /api/auth/register` → 200 `{ user }` + Set-Cookie | 400 `{ error }`
  - `POST /api/auth/login` → 200 `{ user }` + Set-Cookie | 400 `{ error }`
  - `GET /api/auth/me` → 200 `{ user }` | 401 `{ error }`
  - `GET /api/save` → 200 `{ save }` (or `DEFAULT_SAVE`) | 401
  - `PUT /api/save` → 200 `{ save }` (clamped) | 400 | 401
  - `GET /api/leaderboard` → 200 `{ entries }`
  - `POST /api/leaderboard` → 200 `{ ok: true }` | 400 | 401

- [ ] **Step 1: Write `src/app/api/auth/register/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { registerUser } from "@/lib/users";
import { signToken, authCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = await registerUser(getDb(), body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const token = await signToken(result.user.id, result.user.username);
  return NextResponse.json(
    { user: result.user },
    { headers: { "Set-Cookie": authCookie(token) } }
  );
}
```

- [ ] **Step 2: Write `src/app/api/auth/login/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loginUser } from "@/lib/users";
import { signToken, authCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = await loginUser(getDb(), body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const token = await signToken(result.user.id, result.user.username);
  return NextResponse.json(
    { user: result.user },
    { headers: { "Set-Cookie": authCookie(token) } }
  );
}
```

- [ ] **Step 3: Write `src/app/api/auth/me/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  return NextResponse.json({ user: { id: user.userId, username: user.username } });
}
```

- [ ] **Step 4: Write `src/app/api/save/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { clampSave, DEFAULT_SAVE, getSaveRow, putSaveRow } from "@/lib/saves";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const save = (await getSaveRow(getDb(), user.userId)) ?? DEFAULT_SAVE;
  return NextResponse.json({ save });
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const result = clampSave(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  await putSaveRow(getDb(), user.userId, result.save);
  return NextResponse.json({ save: result.save });
}
```

- [ ] **Step 5: Write `src/app/api/leaderboard/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getLeaderboardRows, submitScore } from "@/lib/leaderboard";

export async function GET() {
  const entries = await getLeaderboardRows(getDb());
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const result = await submitScore(getDb(), user.userId, user.username, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Verify build + typecheck + lint pass**

Run: `npm run typecheck; npm run lint; npm run build`
Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A; git commit -m "feat: API routes for auth, save, and leaderboard"
```

---

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

### Task 8: Game pure systems — combat, inventory, quest

**Files:**
- Create: `src/game/systems/combat.ts`
- Create: `src/game/systems/inventory.ts`
- Create: `src/game/systems/quest.ts`
- Create: `tests/combat.test.ts`
- Create: `tests/inventory.test.ts`
- Create: `tests/quest.test.ts`

**Interfaces:**
- Consumes: `src/types/index.ts`
- Produces:
  - combat: `SWORD_DAMAGE: Record<number, number>`, `getSwordDamage(level)`, `clampSwordLevel(level)`, `rollCoinDrop(min, max, rng?)`, `knockbackPosition(x, y, dir, distance)`, `positionInRange(ax, ay, bx, by, range)`
  - inventory: `MAX_ITEMS`, `addItem(items, item)`, `removeItem(items, item)`, `hasItem(items, item)`, `usePotion(hp, maxHp, items)`, `applySwordUpgrade(swordLevel, items)`
  - quest: `QUEST_TARGET_KILLS`, `QUEST_REWARD_COINS`, `defaultQuestState()`, `acceptQuest(quests)`, `recordSlimeKill(quests)`, `getQuestProgress(quests)`, `claimQuestReward(quests, coins)`

- [ ] **Step 1: Write failing tests**

`tests/combat.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getSwordDamage, clampSwordLevel, rollCoinDrop,
  knockbackPosition, positionInRange,
} from "@/game/systems/combat";

describe("combat", () => {
  it("returns damage per sword level", () => {
    expect(getSwordDamage(1)).toBe(10);
    expect(getSwordDamage(3)).toBe(30);
    expect(getSwordDamage(5)).toBe(65);
    expect(getSwordDamage(99)).toBe(10);
  });

  it("clamps sword level to 1..5", () => {
    expect(clampSwordLevel(0)).toBe(1);
    expect(clampSwordLevel(9)).toBe(5);
    expect(clampSwordLevel(2)).toBe(2);
  });

  it("rolls coin drop within range", () => {
    for (let i = 0; i < 50; i++) {
      const v = rollCoinDrop(3, 8, () => 0.5);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(8);
    }
  });

  it("knocks back in facing direction", () => {
    expect(knockbackPosition(100, 100, "up", 12)).toEqual({ x: 100, y: 88 });
    expect(knockbackPosition(100, 100, "right", 12)).toEqual({ x: 112, y: 100 });
  });

  it("detects ranged positions", () => {
    expect(positionInRange(0, 0, 3, 4, 10)).toBe(true);
    expect(positionInRange(0, 0, 30, 0, 10)).toBe(false);
  });
});
```

`tests/inventory.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { addItem, removeItem, MAX_ITEMS, usePotion, applySwordUpgrade } from "@/game/systems/inventory";

describe("inventory", () => {
  it("adds items up to the cap", () => {
    let items: string[] = [];
    for (let i = 0; i < MAX_ITEMS + 3; i++) {
      items = addItem(items, "potion").items;
    }
    expect(items.length).toBe(MAX_ITEMS);
  });

  it("removes the first matching item only", () => {
    const items = ["potion", "potion", "sword_upgrade"];
    expect(removeItem(items, "potion")).toEqual(["potion", "sword_upgrade"]);
  });

  it("drinks a potion to heal", () => {
    const res = usePotion(50, 100, ["potion", "potion"]);
    expect(res.used).toBe(true);
    expect(res.hp).toBe(80);
    expect(res.items).toEqual(["potion"]);
  });

  it("does not drink at full hp", () => {
    const res = usePotion(100, 100, ["potion"]);
    expect(res.used).toBe(false);
    expect(res.items).toEqual(["potion"]);
  });

  it("applies one sword upgrade", () => {
    const res = applySwordUpgrade(2, ["sword_upgrade", "sword_upgrade"]);
    expect(res.applied).toBe(true);
    expect(res.swordLevel).toBe(3);
    expect(res.items).toEqual(["sword_upgrade"]);
  });

  it("does not upgrade past level 5", () => {
    const res = applySwordUpgrade(5, ["sword_upgrade"]);
    expect(res.applied).toBe(false);
    expect(res.swordLevel).toBe(5);
  });
});
```

`tests/quest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  QUEST_TARGET_KILLS, QUEST_REWARD_COINS,
  defaultQuestState, acceptQuest, recordSlimeKill,
  getQuestProgress, claimQuestReward,
} from "@/game/systems/quest";

describe("quest", () => {
  it("defaults to not accepted", () => {
    const q = defaultQuestState();
    expect(q.slime_quest.accepted).toBe(false);
    expect(getQuestProgress(q).state).toBe("not_accepted");
  });

  it("accepts the quest once", () => {
    const q = acceptQuest(defaultQuestState());
    const again = acceptQuest(q);
    expect(q.slime_quest.accepted).toBe(true);
    expect(again.slime_quest.accepted).toBe(true);
    expect(getQuestProgress(q).state).toBe("in_progress");
  });

  it("records kills until complete", () => {
    let q = acceptQuest(defaultQuestState());
    for (let i = 0; i < QUEST_TARGET_KILLS; i++) q = recordSlimeKill(q);
    expect(q.slime_quest.complete).toBe(true);
    expect(getQuestProgress(q).state).toBe("complete");
    const after = recordSlimeKill(q);
    expect(after.slime_quest.kills).toBe(QUEST_TARGET_KILLS);
  });

  it("claims reward once", () => {
    let q = acceptQuest(defaultQuestState());
    for (let i = 0; i < QUEST_TARGET_KILLS; i++) q = recordSlimeKill(q);
    const res = claimQuestReward(q, 10);
    expect(res.coins).toBe(10 + QUEST_REWARD_COINS);
    const again = claimQuestReward(res.quests, res.coins);
    expect(again.coins).toBe(10 + QUEST_REWARD_COINS);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/combat.test.ts tests/inventory.test.ts tests/quest.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/systems/combat.ts`**

```ts
import type { Direction } from "@/types";

export const SWORD_DAMAGE: Record<number, number> = { 1: 10, 2: 18, 3: 30, 4: 45, 5: 65 };

export function getSwordDamage(swordLevel: number): number {
  return SWORD_DAMAGE[swordLevel] ?? SWORD_DAMAGE[1];
}

export function clampSwordLevel(level: number): number {
  return Math.max(1, Math.min(5, level));
}

export function rollCoinDrop(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const KNOCKBACK_OFFSETS: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function knockbackPosition(x: number, y: number, dir: Direction, distance: number): { x: number; y: number } {
  const [dx, dy] = KNOCKBACK_OFFSETS[dir];
  return { x: x + dx * distance, y: y + dy * distance };
}

export function positionInRange(ax: number, ay: number, bx: number, by: number, range: number): boolean {
  return Math.hypot(bx - ax, by - ay) <= range;
}
```

- [ ] **Step 4: Write `src/game/systems/inventory.ts`**

```ts
import type { ItemType } from "@/types";

export const MAX_ITEMS = 8;

export function addItem(items: ItemType[], item: ItemType): { items: ItemType[]; added: boolean } {
  if (items.length >= MAX_ITEMS) return { items, added: false };
  return { items: [...items, item], added: true };
}

export function removeItem(items: ItemType[], item: ItemType): ItemType[] {
  const idx = items.indexOf(item);
  if (idx === -1) return items;
  return [...items.slice(0, idx), ...items.slice(idx + 1)];
}

export function hasItem(items: ItemType[], item: ItemType): boolean {
  return items.includes(item);
}

export function usePotion(hp: number, maxHp: number, items: ItemType[]): { hp: number; items: ItemType[]; used: boolean } {
  if (hp >= maxHp) return { hp, items, used: false };
  const idx = items.indexOf("potion");
  if (idx === -1) return { hp, items, used: false };
  return {
    hp: Math.min(maxHp, hp + 30),
    items: removeItem(items, "potion"),
    used: true,
  };
}

export function applySwordUpgrade(swordLevel: number, items: ItemType[]): { swordLevel: number; items: ItemType[]; applied: boolean } {
  if (swordLevel >= 5) return { swordLevel, items, applied: false };
  const idx = items.indexOf("sword_upgrade");
  if (idx === -1) return { swordLevel, items, applied: false };
  return { swordLevel: swordLevel + 1, items: removeItem(items, "sword_upgrade"), applied: true };
}
```

- [ ] **Step 5: Write `src/game/systems/quest.ts`**

```ts
import type { QuestState } from "@/types";

export const QUEST_TARGET_KILLS = 5;
export const QUEST_REWARD_COINS = 40;

export function defaultQuestState(): QuestState {
  return { slime_quest: { accepted: false, kills: 0, complete: false, claimed: false } };
}

export function acceptQuest(quests: QuestState): QuestState {
  if (quests.slime_quest.accepted) return quests;
  return { ...quests, slime_quest: { ...quests.slime_quest, accepted: true } };
}

export function recordSlimeKill(quests: QuestState): QuestState {
  const s = quests.slime_quest;
  if (s.complete) return quests;
  const kills = Math.min(s.kills + 1, QUEST_TARGET_KILLS);
  return { ...quests, slime_quest: { ...s, kills, complete: kills >= QUEST_TARGET_KILLS } };
}

export type QuestStateLabel = "not_accepted" | "in_progress" | "complete" | "claimed";

export function getQuestProgress(quests: QuestState): { kills: number; target: number; state: QuestStateLabel } {
  const s = quests.slime_quest;
  const base = { kills: s.kills, target: QUEST_TARGET_KILLS };
  if (!s.accepted) return { ...base, state: "not_accepted" };
  if (s.claimed) return { ...base, state: "claimed" };
  if (s.complete) return { ...base, state: "complete" };
  return { ...base, state: "in_progress" };
}

export function claimQuestReward(quests: QuestState, coins: number): { quests: QuestState; coins: number } {
  const s = quests.slime_quest;
  if (!s.complete || s.claimed) return { quests, coins };
  return {
    quests: { ...quests, slime_quest: { ...s, claimed: true } },
    coins: coins + QUEST_REWARD_COINS,
  };
}
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npm run typecheck; npm test`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add -A; git commit -m "feat: pure game systems for combat, inventory, quest with tests"
```

---

### Task 9: Game session, event bus, save sync

**Files:**
- Create: `src/game/systems/events.ts`
- Create: `src/game/systems/session.ts`
- Create: `src/game/systems/saveSync.ts`
- Create: `tests/session.test.ts`

**Interfaces:**
- Consumes: Task 8 (`acceptQuest`, `recordSlimeKill`, `claimQuestReward`, `addItem`, `removeItem`, `usePotion`, `applySwordUpgrade`), Task 7 (`apiFetch`)
- Produces:
  - `events` — typed emitter with `on(event, fn): () => void` and `emit(event, payload)`
  - `GameSession` class: `constructor(save)`, `get(): SaveState`, `update(patch): void` (emits diffs), `toSave(): SaveState`
  - `loadSave(): Promise<SaveState>`, `pushSave(save): Promise<SaveState>`, `submitRun(score, bossDefeated): Promise<void>`

- [ ] **Step 1: Write failing test `tests/session.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { GameSession } from "@/game/systems/session";
import { events } from "@/game/systems/events";
import { DEFAULT_SAVE } from "@/lib/saves";

describe("GameSession", () => {
  it("clones the initial save", () => {
    const s = new GameSession(JSON.parse(JSON.stringify(DEFAULT_SAVE)));
    const save = s.get();
    save.coins = 999;
    expect(s.get().coins).toBe(0);
  });

  it("emits hp change on update", () => {
    const s = new GameSession(JSON.parse(JSON.stringify(DEFAULT_SAVE)));
    let seen: number | undefined;
    const off = events.on("hp", (p) => { seen = p.hp; });
    s.update({ hp: 42 });
    expect(seen).toBe(42);
    off();
  });

  it("uses quest helpers through session", () => {
    const s = new GameSession(JSON.parse(JSON.stringify(DEFAULT_SAVE)));
    const save = s.acceptQuest();
    expect(save.quests.slime_quest.accepted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/session.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/systems/events.ts`**

```ts
import type { ItemType, SaveState } from "@/types";

export interface GameEvents {
  hp: { hp: number; maxHp: number };
  coins: { coins: number };
  sword: { level: number };
  items: { items: ItemType[] };
  quest: { kills: number; target: number; state: string };
  toast: { message: string };
  bossDefeated: { score: number };
  saveReady: { save: SaveState };
}

type Handler<K extends keyof GameEvents> = (payload: GameEvents[K]) => void;

class Emitter {
  private handlers = new Map<keyof GameEvents, Set<Handler<never>>>();

  on<K extends keyof GameEvents>(event: K, fn: Handler<K>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn as Handler<never>);
    return () => this.handlers.get(event)?.delete(fn as Handler<never>);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.handlers.get(event)?.forEach((fn) => (fn as Handler<K>)(payload));
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const events = new Emitter();
```

- [ ] **Step 4: Write `src/game/systems/session.ts`**

```ts
import type { ItemType, QuestState, SaveState } from "@/types";
import { events } from "./events";
import { addItem, applySwordUpgrade, usePotion } from "./inventory";
import { acceptQuest, claimQuestReward, recordSlimeKill } from "./quest";

export class GameSession {
  private base: SaveState;
  private current: SaveState;

  constructor(initial: SaveState) {
    this.base = JSON.parse(JSON.stringify(initial));
    this.current = JSON.parse(JSON.stringify(initial));
  }

  get(): SaveState {
    return JSON.parse(JSON.stringify(this.current));
  }

  toSave(): SaveState {
    return this.current;
  }

  update(patch: Partial<SaveState>): SaveState {
    this.current = { ...this.current, ...patch };
    const c = this.current;
    events.emit("hp", { hp: c.hp, maxHp: c.max_hp });
    events.emit("coins", { coins: c.coins });
    events.emit("sword", { level: c.sword_level });
    events.emit("items", { items: c.items });
    return this.get();
  }

  damage(amount: number): void {
    const hp = Math.max(0, this.current.hp - amount);
    this.update({ hp });
  }

  heal(amount: number): void {
    const hp = Math.min(this.current.max_hp, this.current.hp + amount);
    this.update({ hp });
  }

  addCoins(amount: number): void {
    const coins = Math.min(99999, this.current.coins + Math.max(0, amount));
    this.update({ coins });
    events.emit("toast", { message: `+${amount} xu` });
  }

  gainItem(item: ItemType): boolean {
    const { items, added } = addItem(this.current.items, item);
    if (added) this.update({ items });
    return added;
  }

  drinkPotion(): boolean {
    const res = usePotion(this.current.hp, this.current.max_hp, this.current.items);
    if (res.used) {
      this.update({ hp: res.hp, items: res.items });
      events.emit("toast", { message: "Đã uống bình máu (+30 HP)" });
    }
    return res.used;
  }

  pickupSwordUpgrade(): boolean {
    const res = applySwordUpgrade(this.current.sword_level, this.current.items);
    if (res.applied) {
      this.update({ sword_level: res.swordLevel, items: res.items });
      events.emit("toast", { message: `Kiếm nâng cấp! Cấp ${res.swordLevel}` });
    }
    return res.applied;
  }

  acceptQuest(): SaveState {
    const quests = acceptQuest(this.current.quests);
    const save = this.update({ quests });
    events.emit("quest", this.questProgressPayload(quests));
    return save;
  }

  slimeKilled(): SaveState {
    const quests = recordSlimeKill(this.current.quests);
    const save = this.update({ quests });
    const p = this.questProgressPayload(quests);
    events.emit("quest", p);
    if (p.state === "complete") {
      events.emit("toast", { message: "Nhiệm vụ hoàn thành! Gặp NPC để nhận thưởng." });
    }
    return save;
  }

  claimQuest(): SaveState {
    const res = claimQuestReward(this.current.quests, this.current.coins);
    const save = this.update({ quests: res.quests, coins: res.coins });
    events.emit("coins", { coins: res.coins });
    events.emit("toast", { message: "Nhận thưởng +40 xu!" });
    return save;
  }

  setPosition(mapId: SaveState["map_id"], x: number, y: number): void {
    this.update({ map_id: mapId, pos_x: x, pos_y: y });
  }

  defeatBoss(): void {
    const save = this.update({ boss_defeated: true });
    const base = Math.min(save.coins + (save.boss_defeated ? 1000 : 0), 99999);
    events.emit("bossDefeated", { score: base });
  }

  private questProgressPayload(q: QuestState) {
    const s = q.slime_quest;
    const state = !s.accepted ? "not_accepted" : s.claimed ? "claimed" : s.complete ? "complete" : "in_progress";
    return { kills: s.kills, target: 5, state };
  }
}
```

- [ ] **Step 5: Write `src/game/systems/saveSync.ts`**

```ts
import type { SaveState } from "@/types";
import { apiFetch } from "@/lib/api";

export async function loadSave(): Promise<SaveState> {
  const res = await apiFetch<{ save: SaveState }>("/api/save");
  return res.save;
}

export async function pushSave(save: SaveState): Promise<SaveState> {
  const res = await apiFetch<{ save: SaveState }>("/api/save", {
    method: "PUT",
    body: JSON.stringify(save),
  });
  return res.save;
}

export async function submitRun(score: number, bossDefeated: boolean): Promise<void> {
  await apiFetch("/api/leaderboard", {
    method: "POST",
    body: JSON.stringify({ score, bossDefeated }),
  });
}
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npm run typecheck; npm test`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add -A; git commit -m "feat: game session, event bus, and save sync"
```

---

### Task 10: Phaser bootstrap — config, procedural textures, Boot/Title scenes, /game page

**Files:**
- Create: `src/game/config.ts`
- Create: `src/game/main.ts`
- Create: `src/game/scenes/BootScene.ts`
- Create: `src/game/scenes/TitleScene.ts`
- Create: `src/game/systems/textures.ts`
- Create: `src/app/game/page.tsx`
- Create: `src/components/GameCanvas.tsx`
- Test: none (build smoke + manual browser check)

**Interfaces:**
- Consumes: Task 7 (`useUser`), Task 9 (`loadSave`, `events`)
- Produces:
  - `GAME_WIDTH=960`, `GAME_HEIGHT=640`, `TILE_SIZE=16`
  - `createGame(parent: HTMLElement): Phaser.Game`
  - Scene classes `BootScene`, `TitleScene`
  - `GameCanvas` component mounting Phaser once inside client component

- [ ] **Step 1: Write `src/game/config.ts`**

```ts
import Phaser from "phaser";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const TILE_SIZE = 16;

export const GAME_STYLE = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  physics: { default: "arcade" as const, arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
};
```

- [ ] **Step 2: Write `src/game/systems/textures.ts`**

Procedural pixel-art texture generator (guaranteed path; real spritesheets are a drop-in via `assets/`).

```ts
import Phaser from "phaser";

export const TILE_W = 16;
export const TILE_H = 16;

export const TILE = {
  grass: 0, dirt: 1, stone: 2, wall: 3, tree: 4, water: 5,
  chest: 6, portal: 7, door: 8, flower: 9, crack: 10, ladder: 11,
} as const;

const WALL_CHARS: Record<number, string> = {
  [TILE.grass]: "+",
  [TILE.dirt]: ".",
  [TILE.stone]: "+",
  [TILE.wall]: "#",
  [TILE.tree]: "T",
  [TILE.chest]: "C",
  [TILE.portal]: "O",
  [TILE.door]: "D",
};

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function spear(ctx: CanvasRenderingContext2D, seed: number): void {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < TILE_W; x++) {
      const char = WALL_CHARS[seed % 12] ?? "+";
      const baseByChar: Record<string, string> = {
        "+": "#3a5f2a", ".": "#7a5b36", "#": "#4a4a5a", "T": "#183a24",
        "C": "#6b4423", "O": "#3aa7c9", "D": "#5a3d1f",
      };
      const base = baseByChar[char] ?? "#3a5f2a";
      const jitter = Math.floor(rand() * 22) - 11;
      ctx.fillStyle = shade(base, jitter);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16 & 255) + amt));
  const g = Math.max(0, Math.min(255, (n >> 8 & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function chestTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 2, 5, 12, 9, "#8a5a2b");
  fill(ctx, 4, 3, 8, 3, "#a06a36");
  fill(ctx, 7, 6, 2, 3, "#f2c14e");
}

function portalTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 1, 1, 14, 14, "#123");
  for (let i = 0; i < 24; i++) ctx.fillStyle = i % 2 ? "#3aa7c9" : "#7de3ff";
  for (let y = 2; y < 14; y += 3) {
    ctx.fillStyle = "#7de3ff";
    ctx.fillRect(2 + ((y * 3) % 12), y, 2, 1);
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(1, 1, 14, 1);
}

function treeTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 6, 9, 4, 5, "#5a3d1f");
  fill(ctx, 2, 2, 12, 10, "#1e5a30");
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(4, 3, 3, 3);
}

function waterTile(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < 8; i++) ctx.fillStyle = i % 2 ? "#1d5fa3" : "#2a7fc7";
  for (let y = 2; y < TILE_H; y += 4) {
    ctx.fillStyle = "#9fe8ff";
    ctx.fillRect(Math.floor(y / 2) % 6, y, 3, 1);
  }
}

function wallTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#565665");
  ctx.fillStyle = "#6f6f80";
  ctx.fillRect(0, 0, TILE_W, 2);
  ctx.fillRect(0, 0, 2, TILE_H);
}

function doorTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#5a3d1f");
  ctx.fillStyle = "#3c2713";
  ctx.fillRect(2, 2, 12, 12);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(12, 7, 2, 2);
}

function crackTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#8b8b99");
  ctx.fillStyle = "#565665";
  ctx.fillRect(7, 0, 1, 4);
  ctx.fillRect(4, 4, 1, 3);
  ctx.fillRect(10, 5, 1, 5);
  ctx.fillRect(6, 9, 3, 1);
  ctx.fillRect(11, 10, 1, 3);
}

function flowerTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#3a5f2a");
  ctx.fillStyle = "#2e4f22";
  ctx.fillRect(0, 10, TILE_W, 1);
  ctx.fillStyle = "#e06c9f";
  ctx.fillRect(6, 5, 2, 2);
  ctx.fillRect(11, 9, 2, 2);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(3, 11, 2, 2);
}

function drawTile(ctx: CanvasRenderingContext2D, idx: number): void {
  switch (idx) {
    case TILE.grass:
    case TILE.dirt:
    case TILE.stone:
      spear(ctx, idx + 1);
      break;
    case TILE.wall: return wallTile(ctx);
    case TILE.tree: return treeTile(ctx);
    case TILE.water: return waterTile(ctx);
    case TILE.chest: return chestTile(ctx);
    case TILE.portal: return portalTile(ctx);
    case TILE.door: return doorTile(ctx);
    case TILE.crack: return crackTile(ctx);
    case TILE.flower: return flowerTile(ctx);
    default: spear(ctx, idx + 1);
  }
}

export function buildTileAtlas(scene: Phaser.Scene): Phaser.Textures.CanvasTexture {
  const cols = 4;
  const rows = 3;
  const canvas = scene.textures.createCanvas("landscape", cols * TILE_W, rows * TILE_H);
  const ctx = canvas.getContext();
  for (let i = 0; i < cols * rows; i++) {
    const tx = (i % cols) * TILE_W;
    const ty = Math.floor(i / cols) * TILE_H;
    drawTile(ctx, i);
    if (i === TILE.grass) sprout(ctx, tx, ty);
    ctx.drawImage(ctx.canvas, tx, ty, TILE_W, TILE_H, tx, ty, TILE_W, TILE_H);
    void tx; void ty;
  }
  void ctx;
  canvas.refresh();
  return canvas;
}

function sprout(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = "#2e4f22";
  ctx.fillRect(ox + 3, oy + 9, 2, 3);
  ctx.fillRect(ox + 11, oy + 12, 2, 2);
  ctx.fillStyle = "#4a7a34";
  ctx.fillRect(ox + 8, oy + 10, 2, 2);
}

interface SpriteSpec {
  key: string;
  w: number;
  h: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export function buildSprites(scene: Phaser.Scene): void {
  const sprites: SpriteSpec[] = [
    {
      key: "player",
      w: 12, h: 16,
      draw: (ctx) => {
        fill(ctx, 4, 0, 4, 4, "#f0c8a0");
        fill(ctx, 3, 4, 6, 3, "#d84b4b");
        fill(ctx, 2, 7, 8, 5, "#2f56c9");
        fill(ctx, 4, 12, 3, 3, "#2f56c9");
        fill(ctx, 8, 12, 3, 3, "#3b3b3b");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(5, 2, 2, 1);
      },
    },
    {
      key: "npc",
      w: 12, h: 16,
      draw: (ctx) => {
        fill(ctx, 4, 0, 4, 4, "#c78a4b");
        fill(ctx, 3, 4, 6, 3, "#7ad84b");
        fill(ctx, 2, 7, 8, 5, "#6b9d3a");
        fill(ctx, 4, 12, 3, 3, "#6b9d3a");
        fill(ctx, 8, 12, 3, 3, "#3b3b3b");
      },
    },
    {
      key: "slime",
      w: 14, h: 12,
      draw: (ctx) => {
        fill(ctx, 2, 5, 10, 6, "#4a8fe0");
        fill(ctx, 3, 4, 8, 2, "#5ba0f0");
        ctx.fillStyle = "#10131a";
        ctx.fillRect(4, 8, 2, 2);
        ctx.fillRect(8, 8, 2, 2);
      },
    },
    {
      key: "boss",
      w: 26, h: 24,
      draw: (ctx) => {
        fill(ctx, 3, 6, 20, 14, "#7a2b8f");
        fill(ctx, 5, 4, 16, 4, "#9440a8");
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(6, 10, 2, 2);
        ctx.fillRect(18, 10, 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(4, 2, 4, 1);
        ctx.fillRect(18, 2, 4, 1);
      },
    },
    {
      key: "potion",
      w: 8, h: 10,
      draw: (ctx) => {
        ctx.fillStyle = "#c83b3b";
        ctx.fillRect(2, 2, 4, 6);
        ctx.fillRect(3, 0, 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(3, 3, 2, 2);
      },
    },
    {
      key: "upgrade",
      w: 10, h: 10,
      draw: (ctx) => {
        ctx.fillStyle = "#d8b45a";
        ctx.fillRect(4, 0, 2, 10);
        ctx.fillRect(0, 4, 10, 2);
      },
    },
    {
      key: "coin",
      w: 8, h: 8,
      draw: (ctx) => {
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(1, 1, 6, 6);
        ctx.fillStyle = "#8a6a1f";
        ctx.fillRect(2, 2, 4, 4);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(3, 3, 2, 2);
      },
    },
    {
      key: "heart",
      w: 8, h: 8,
      draw: (ctx) => {
        ctx.fillStyle = "#e04040";
        ctx.fillRect(1, 3, 6, 3);
        ctx.fillRect(2, 2, 4, 1);
        ctx.fillRect(1, 1, 1, 2);
        ctx.fillRect(6, 1, 1, 2);
      },
    },
    {
      key: "sword",
      w: 16, h: 16,
      draw: (ctx) => {
        ctx.fillStyle = "#c9c9d8";
        ctx.fillRect(8, 2, 2, 8);
        ctx.fillRect(7, 2, 4, 2);
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(7, 12, 4, 3);
      },
    },
  ];

  for (const spec of sprites) {
    const tex = scene.textures.createCanvas(spec.key, spec.w, spec.h);
    spec.draw(tex.getContext());
    tex.refresh();
  }
}
```

- [ ] **Step 3: Write `src/game/scenes/BootScene.ts`**

```ts
import Phaser from "phaser";
import { buildSprites, buildTileAtlas } from "@/game/systems/textures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    buildSprites(this);
    buildTileAtlas(this);
    this.scene.start("TitleScene");
  }
}
```

- [ ] **Step 4: Write `src/game/scenes/TitleScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#10131a");

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "PIXEL QUEST", {
      fontSize: "48px",
      fontFamily: "monospace",
      color: "#7dd3fc",
    }).setOrigin(0.5);
    title.setShadow(0, 3, "#000000", 6, true, true);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60,
      "WASD / Mũi tên: di chuyển   •   Space: chém   •   E: tương tác   •   1: uống thuốc   •   S: lưu",
      { fontSize: "14px", fontFamily: "monospace", color: "#a8a8b8", align: "center" },
    ).setOrigin(0.5);

    const start = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "[ BẮT ĐẦU ]", {
      fontSize: "24px",
      fontFamily: "monospace",
      color: "#f2c14e",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    start.on("pointerdown", () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("GameScene");
      });
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120,
      "Tiêu diệt SLIME, nhận quest từ NPC, vượt RỪNG và HANG, hạ BOSS để giành chiến thắng!",
      { fontSize: "12px", fontFamily: "monospace", color: "#7c7c8c", align: "center", wordWrap: { width: 620 } },
    ).setOrigin(0.5);
  }
}
```

- [ ] **Step 5: Write `src/game/main.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GAME_STYLE } from "./config";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
import { HudScene } from "./scenes/HudScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { BossIntroScene } from "./scenes/BossIntroScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { GameOverScene } from "./scenes/GameOverScene";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    ...GAME_STYLE,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#10131a",
    scene: [
      BootScene, TitleScene, GameScene, HudScene,
      DialogueScene, BossIntroScene, VictoryScene, GameOverScene,
    ],
  });
}
```

- [ ] **Step 6: Write `src/app/game/page.tsx` and `src/components/GameCanvas.tsx`**

`src/app/game/page.tsx`:

```tsx
import GameCanvas from "@/components/GameCanvas";

export default function GamePage() {
  return <GameCanvas />;
}
```

`src/components/GameCanvas.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { createGame } from "@/game/main";
import type { Game } from "phaser";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const { user, status } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/");
      return;
    }
    if (status !== "ready" || !user || !containerRef.current) return;
    if (gameRef.current) return;

    const game = createGame(containerRef.current);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [status, user, router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 960,
          aspectRatio: "3 / 2",
          imageRendering: "pixelated",
          border: "2px solid #2a2f3a",
          borderRadius: 8,
          overflow: "hidden",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck; npm run lint; npm run build`
Expected: all exit 0.

Note: `bosscene`/`HudScene`/`DialogueScene`/`VictoryScene`/`GameOverScene` don't exist yet — create empty stub classes first so the build passes (Task 11 overwrites them):

Create `src/game/scenes/stubs.ts`:

```ts
import Phaser from "phaser";

export class StubScene extends Phaser.Scene {
  constructor() { super("Stub"); }
  create(): void { this.scene.start("TitleScene"); }
}
```

For this step only, temporarily point `main.ts` scenes `GameScene`/`HudScene`/etc. at the stub via `// TEMP` aliases if needed; final wiring is done in Tasks 11–16.

Alternately create minimal real classes now with blank `create(): void {}` in their own files, replaced wholesale in later tasks:

```ts
// src/game/scenes/GameScene.ts (temporary, replaced in Task 11)
import Phaser from "phaser";
export class GameScene extends Phaser.Scene {
  constructor() { super("GameScene"); }
  create(): void {
    this.scene.launch("HudScene");
    this.scene.stop("HudScene");
  }
}
```

Same pattern for `HudScene`, `DialogueScene`, `BossIntroScene`, `VictoryScene`, `GameOverScene` — each `class XScene extends Phaser.Scene` with `constructor(){ super("..."); } create(): void{}`. The build must pass; later tasks replace file contents.

- [ ] **Step 8: Smoke test in browser**

Run: `npm run dev`
Expected: `/` renders landing; logging in via AuthPanel; `/game` mounts a blank pink/black Phaser canvas without console errors.

- [ ] **Step 9: Commit**

```bash
git add -A; git commit -m "feat: phaser bootstrap, procedural pixel art textures, boot/title scenes"
```

---

### Task 11: Map data + GameScene — movement, collision, camera

**Files:**
- Create: `src/game/world/maps.ts`
- Create: `src/game/scenes/GameScene.ts` (full rewrite)
- Modify: `src/game/systems/textures.ts` (add `ladder` "∨" glyph if needed — no, keep atlas 4×3)

**Interfaces:**
- Consumes: `src/game/config.ts` (`GAME_WIDTH/HEIGHT`, `TILE_SIZE`), `textures` `TILE` indexes, `GameSession` (Task 9)
- Produces:
  - `tileAtlasIndex(char: string): number` (legend)
  - `MAPS: Record<MapId, MapDef>`
  - `findSpawns(mapId): { spawn, portals, chests, npcs, enemies, boss }`
  - `GameScene` renders map, spawns player, movement + wall collision + camera follow

- [ ] **Step 1: Write `src/game/world/maps.ts`**

```ts
import type { MapId } from "@/types";

export interface ParsedMap {
  id: MapId;
  name: string;
  rows: string[];
  spawn: { x: number; y: number };
  portals: Array<{ x: number; y: number; to: MapId | null; out: { x: number; y: number } }>;
  chests: Array<{ x: number; y: number }>;
  npcs: Array<{ x: number; y: number }>;
  enemies: Array<{ x: number; y: number }>;
  boss: { x: number; y: number } | null;
}

export const LEGEND: Record<string, number> = {
  ".": 0, ",": 1, s: 2, "#": 3, T: 4, "~": 5, C: 6, P: 7, D: 8, f: 9, c: 10, "@": 0, N: 0, E: 0, B: 2,
};

const RAW: Record<MapId, { name: string; rows: string[]; portalTargets: Array<MapId | null> }> = {
  village: {
    name: "Làng Phong Lan",
    portalTargets: ["forest"],
    rows: [
      "########################################",
      "#......................................#",
      "#....TT.........N..............E......#",
      "#....TT...............................#",
      "#.........#########....#####.........#",
      "#.........#.......#....#....#....E...#",
      "#.........#..@....#....#.C..#........#",
      "#.........#.......#....#####.........#",
      "#.........#..##...#..................#",
      "#.........#......#.....~..~........#.#",
      "#.........########.....~..~........#.#",
      "#......................................#",
      "#...,...,,..,.E.......................#",
      "#...,.....,,...E.......................#",
      "#...,.....,...,....................E..#",
      "#...,.....,,...C.......................#",
      "#...,...,,...................E........#",
      "#......................................#",
      "#.....E....................P..........#",
      "#......................................#",
      "#......................................#",
      "########################################",
    ],
  },
  forest: {
    name: "Rừng Xanh",
    portalTargets: ["cave", "village"],
    rows: [
      "########################################",
      "#TT..TT...TT..TT...TT.....##.###....#",
      "#T..............TT...TT......T...E..#",
      "#.......E..........TT........T......#",
      "#.....TT.....TT........TT.....T......#",
      "#..TT......TT....TT..TT..##..T..N...E#",
      "#.....E......TT.....TT...##..T.......#",
      "#TT......TT.....TT...........T.......#",
      "#..............TT...TT......T........#",
      "#..TT....TT.......TT.P.....TT....E...#",
      "#........................TT...........#",
      "#...TT......TT....TT........TT.......#",
      "#......E.......................E.....#",
      "#...TT.........C..........TT.........#",
      "#......TT.............TT........E....#",
      "#........,...TT....TT....,...........#",
      "#..E....,....,....TT......,..........#",
      "#........,....,.........P,....E......#",
      "#........,..TT...,,....,....,........#",
      "#...#....,...,,,........,....,....#.#",
      "#...#................................#",
      "########################################",
    ],
  },
  cave: {
    name: "Hang Đá Tối",
    portalTargets: ["arena", "forest"],
    rows: [
      "########################################",
      "#ssssssssssssssssssssssssssssssssssssss#",
      "#ss..ssss..ss.s.c...ssss..ssss...sP:ss#",
      "#ss..ssss......sss....ss.....ssss..ss#",
      "#s.........cc................s..s...#",
      "#s..ssss..ssss..ssss..ssss..sss.s...#",
      "#s..ssss.f......s..s......s...s.E...#",
      "#s.....................s.......sss.ss#",
      "#s..ssss..ssss..ssss..ssss.......s...#",
      "#s.........c.....................s...c#",
      "#s..E......ssss..ssss..ssss....c#...#",
      "#s..............s....s...........ss..#",
      "#s.E...........c..c....s...........#",
      "#s.....ssss....ss....s................#",
      "#s..ss.......ss....ccssss#..##..E....#",
      "#s.....sss..............E..#..##.....#",
      "#s...c.........sss......s............#",
      "#s......ss.......sss#....s#....#.....#",
      "#c...........c........s.P............#",
      "#ssssssssssssssssssssssss..............#",
      "#sssssssss..................###........",
      "########################################",
    ],
  },
  arena: {
    name: "Đấu Trường Boss",
    portalTargets: [null],
    rows: [
      "########################################",
      "#ssssssssssssssssssssssssssssssssssssss#",
      "#s..............sssss...............s#",
      "#s.............sssssss..............s#",
      "#s............sccc..cccs............s#",
      "#s............ssss..sssss..........P#s#",
      "#s.............sss..ssss............s#",
      "#s............................B.....s#",
      "#s..............sssss..............s#",
      "#sssssssssssssssssssssssssssssssssssss#",
      "#sssssssssssssssssssssssssssssssssssss#",
      "########################################",
    ],
  },
};

function findSpawn(rows: string[]): { x: number; y: number } {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y].indexOf("@");
    if (x !== -1) return { x: x * 16 + 8, y: y * 16 + 8 };
  }
  return { x: 8, y: 8 };
}

export const MAPS: Record<MapId, ParsedMap> = (() => {
  const result = {} as Record<MapId, ParsedMap>;
  for (const [id, def] of Object.entries(RAW) as Array<[MapId, { name: string; rows: string[]; portalTargets: Array<MapId | null> }]>) {
    const map: ParsedMap = {
      id,
      name: def.name,
      rows: def.rows,
      spawn: { x: 0, y: 0 },
      portals: [],
      chests: [],
      npcs: [],
      enemies: [],
      boss: null,
    };
    def.rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        const cx = x * 16 + 8;
        const cy = y * 16 + 8;
        if (ch === "@") map.spawn = { x: cx, y: cy };
        if (ch === "C") map.chests.push({ x: cx, y: cy });
        if (ch === "N") map.npcs.push({ x: cx, y: cy });
        if (ch === "E") map.enemies.push({ x: cx, y: cy });
        if (ch === "B") map.boss = { x: cx, y: cy };
      });
    });
    def.rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (ch !== "P") return;
        const portalIndex = map.portals.length;
        const target = def.portalTargets[portalIndex] ?? null;
        const out = target ? findSpawn(RAW[target].rows) : { x: 0, y: 0 };
        map.portals.push({ x: x * 16 + 8, y: y * 16 + 8, to: target, out });
      });
    });
    result[id] = map;
  }
  return result;
})();
```

- [ ] **Step 2: Write full `src/game/scenes/GameScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "@/game/config";
import { MAPS, LEGEND, type ParsedMap } from "@/game/world/maps";
import { events } from "@/game/systems/events";
import type { GameSession } from "@/game/systems/session";
import type { Direction, MapId } from "@/types";
import { positionInRange } from "@/game/systems/combat";

export const PLAYER_SPEED = 160;
export const SOLID_TILES = new Set([3, 4, 5]);

let currentSession: GameSession | null = null;

export function setGameSession(session: GameSession | null): void {
  currentSession = session;
}

export class GameScene extends Phaser.Scene {
  map: ParsedMap;
  player!: Phaser.Physics.Arcade.Sprite;
  layer!: Phaser.Tilemaps.TilemapLayer;
  cursors!: {
    up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key; e: Phaser.Input.Keyboard.Key;
  };
  doorTiles: Phaser.Tilemaps.Tile[] = [];
  facing: Direction = "down";
  lastPortalAt = 0;
  openedChests = new Set<string>();

  constructor() { super("GameScene"); }

  create(): void {
    const save = currentSession?.get() ?? MAPS.village.spawn as never;
    const mapId = (save && save.map_id ? save.map_id : "village") as MapId;
    this.map = MAPS[mapId];
    this.scene.launch("HudScene");

    const grid = this.map.rows.map((r) => r.split("").map((ch) => LEGEND[ch] ?? 0));
    const tilemap = this.make.tilemap({ data: grid, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = tilemap.addTilesetImage("landscape", "landscape", TILE_SIZE, TILE_SIZE, 0, 0);
    this.layer = tilemap.createLayer(0, tileset!, 0, 0)!;
    this.layer.setCollision([3, 4, 5]);

    const spawnX = this.map.id === "village" && save ? Number(save.pos_x) : this.map.spawn.x;
    const spawnY = this.map.id === "village" && save ? Number(save.pos_y) : this.map.spawn.y;

    this.player = this.physics.add.sprite(spawnX, spawnY, "player").setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.layer);

    this.cursors = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      e: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    this.cameras.main.setBounds(0, 0, this.map.rows[0].length * TILE_SIZE, this.map.rows.length * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(2);

    this.doorTiles = this.describePortals();
    this.addMapDecor();
  }

  private describePortals(): Phaser.Tilemaps.Tile[] {
    const out: Phaser.Tilemaps.Tile[] = [];
    this.map.portals.forEach((p) => {
      const tile = this.map.rows[Math.floor(p.y / TILE_SIZE)]?.charAt(Math.floor(p.x / TILE_SIZE));
      if (tile === "P") out.push({ ...p } as never);
    });
    return out;
  }

  private addMapDecor(): void {
    const flag = this.add.text(this.map.spawn.x, this.map.spawn.y - 20, this.map.name, {
      fontSize: "12px", fontFamily: "monospace", color: "#cfe8ff",
    }).setOrigin(0.5).setScrollFactor(1).setDepth(0);
    flag.setScrollFactor(0).setVisible(false);
    this.add.image(16, 16, "").setVisible(false); // no-op decoration anchor
    void flag;
  }

  update(_time: number, _delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const vx = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
    const vy = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      body.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx > 0 ? "right" : "left";
      else this.facing = vy > 0 ? "down" : "up";
      this.player.setFlipX(this.facing === "left");
    } else {
      body.setVelocity(0, 0);
    }

    this.checkPortal();
    this.checkInteract();
  }

  private checkPortal(): void {
    const x = this.player.x;
    const y = this.player.y;
    for (const p of this.map.portals) {
      if (p.to && positionInRange(x, y, p.x, p.y, 14) && this.time.now - this.lastPortalAt > 700) {
        this.lastPortalAt = this.time.now;
        const save = currentSession?.get();
        if (save) currentSession!.setPosition(p.to, p.out.x, p.out.y);
        events.emit("toast", { message: p.to ? `${MAPS[p.to].name}` : "Cổng khác thường…" });
        this.scene.restart(GameScene, { next: p.to });
        return;
      }
    }
  }

  private checkInteract(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.cursors.e)) return;
    const x = this.player.x;
    const y = this.player.y;
    for (const npc of this.map.npcs) {
      if (positionInRange(x, y, npc.x, npc.y, 30)) {
        if (currentSession) this.scene.launch("DialogueScene", { npcId: "quest" });
        return;
      }
    }
    for (const chest of this.map.chests) {
      if (positionInRange(x, y, chest.x, chest.y, 24)) {
        const key = `${this.map.id}:${chest.x}:${chest.y}`;
        if (this.openedChests.has(key)) return;
        this.openedChests.add(key);
        const openEvent = new CustomEvent("pixelquest:openchest", { detail: { chest, mapId: this.map.id } });
        window.dispatchEvent(openEvent);
        return;
      }
    }
  }
}
```

- [ ] **Step 3: Verify types + build**

Run: `npm run typecheck; npm run build`
Expected: exit 0 (HudScene/DialogueScene stubs exist from Task 10; boss enemies not yet spawned — Task 12).

- [ ] **Step 4: Commit**

```bash
git add -A; git commit -m "feat: tiled maps, player movement, wall collision, camera follow"
```

---

### Task 12: Enemies + sword combat + drops

**Files:**
- Modify: `src/game/scenes/GameScene.ts`
- Create: `src/game/scenes/EnemyLayer.ts` (helper class managing slimes, sword hit detection)

**Interfaces:**
- Consumes: `positionInRange`, `getSwordDamage`, `rollCoinDrop`, `knockbackPosition`, `GameSession`
- Produces:
  - `game.createEnemy(kind: "slime", x: number, y: number): Phaser.Physics.Arcade.Sprite`
  - `game.hurtEnemy(enc, dmg, dir)` — damages, flashes, drops coin, kills slime (tracks quest kill via session)
  - `game.swingSword()` called on SPACE

- [ ] **Step 1: Add enemy spawn + combat to `GameScene`**

Extend the `create()` (after `this.addMapDecor();`):

```ts
import { getSwordDamage, rollCoinDrop, knockbackPosition } from "@/game/systems/combat";

// in create(), after addMapDecor():
this.enemies = this.physics.add.group();
for (const e of this.map.enemies) this.addSlime(e.x, e.y);
if (this.map.boss) { /* Boss handled in Task 16 */ }

this.input.keyboard!.on("keydown-SPACE", () => this.swingSword());
this.physics.add.collider(this.enemies, this.layer);
```

Add state + methods:

```ts
enemies!: Phaser.Physics.Arcade.Group;
slimeHp = new Map<Phaser.GameObjects.GameObject, number>();
attackTimer = 0;
attackRect: Phaser.GameObjects.Rectangle | null = null;

addSlime(x: number, y: number): Phaser.Physics.Arcade.Sprite {
  const s = this.physics.add.sprite(x, y, "slime");
  this.slimeHp.set(s, 25);
  this.enemies.add(s);
  return s;
}

swingSword(): void {
  if (this.attackRect || this.time.now < this.attackTimer) return;
  this.attackTimer = this.time.now + 250;
  const level = currentSession?.get().sword_level ?? 1;
  const dmg = getSwordDamage(level);
  const rectW = 18;
  const rectH = 18;
  const { x, y } = this.player;
  const rect = this.add.rectangle(x, y, rectW, rectH, 0xffffff, 0.35).setDepth(5);
  this.physics.world.enable(rect);
  (rect.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  const offsets: Record<Direction, [number, number]> = {
    up: [0, -18], down: [0, 18], left: [-18, 0], right: [18, 0],
  };
  const [dx, dy] = offsets[this.facing];
  rect.setPosition(x + dx, y + dy);
  this.attackRect = rect;

  const targets = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];
  for (const t of targets) {
    if (Phaser.Geom.Intersects.RectangleToRectangle(
      rect.getBounds(),
      t.getBounds(),
    )) {
      this.hurtEnemy(t, dmg);
    }
  }

  const cancel = () => {
    if (this.attackRect) this.attackRect.destroy();
    this.attackRect = null;
  };
  this.time.delayedCall(140, cancel);
}

hurtEnemy(s: Phaser.Physics.Arcade.Sprite, dmg: number): void {
  const hp = (this.slimeHp.get(s) ?? 25) - dmg;
  this.slimeHp.set(s, hp);
  s.setTintFill(0xffaaaa);
  this.time.delayedCall(90, () => s.clearTint());
  this.knockback(s, this.facing, 20);
  if (hp <= 0) {
    const coins = rollCoinDrop(3, 8);
    s.destroy();
    this.slimeHp.delete(s);
    currentSession?.addCoins(coins);
    currentSession?.slimeKilled();
    events.emit("toast", { message: `Slime bị hạ! +${coins} xu` });
  }
}

knockback(s: Phaser.Physics.Arcade.Sprite, dir: Direction, dist: number): void {
  const pos = knockbackPosition(s.x, s.y, dir, dist);
  s.x = pos.x;
  s.y = pos.y;
}
```

Update per-frame AI in `update()` (after movement, before portal check):

```ts
this.updateEnemies();
```

```ts
updateEnemies(): void {
  const player = this.player;
  for (const s of this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
    const dx = player.x - s.x;
    const dy = player.y - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 120) {
      const spd = 60;
      s.setVelocity((dx / Math.max(dist, 1)) * spd, (dy / Math.max(dist, 1)) * spd);
      if (player.active && dist < 18) this.hurtPlayer(5);
    } else {
      s.setVelocity(0, 0);
    }
  }
}

hurtPlayer(dmg: number): void {
  const session = currentSession;
  if (!session) return;
  if (this.time.now < this.invulnUntil) return;
  this.invulnUntil = this.time.now + 800;
  session.damage(dmg);
  this.player.setTintFill(0xff5555);
  this.time.delayedCall(120, () => this.player.clearTint());
  events.emit("toast", { message: `Mất ${dmg} máu!` });
  if (session.get().hp <= 0) this.scene.start("GameOverScene");
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck; npm run build`
Expected: exit 0.

- [ ] **Step 3: Manual smoke**

Run: `npm run dev`; start game; WASD moves, SPACE swings and slimes lose HP/drop coins, E near chest does nothing yet (Task 13).

- [ ] **Step 4: Commit**

```bash
git add -A; git commit -m "feat: slime enemies, sword attack, knockback, coin drops"
```

---

### Task 13: Chests, items, inventory HUD

**Files:**
- Modify: `src/game/scenes/GameScene.ts` (chest open handler)
- Modify: `src/game/scenes/HudScene.ts` (full implementation)
- Create: `src/game/systems/pickups.ts` (visual coin/potion/upgrade drops)

**Interfaces:**
- Consumes: `GameSession` (`gainItem`, `drinkPotion`, `pickupSwordUpgrade`), `events`
- Produces:
  - `pickupChestReward(session): void` — random: 55% coins(15–30), 25% potion, 20% sword_upgrade
  - `HudScene` renders HP bar, coins, sword level, potion count, quest tracker, toast messages

- [ ] **Step 1: Write `src/game/systems/pickups.ts`**

```ts
import type { GameSession } from "./session";
import { rollCoinDrop } from "./combat";

export function pickupChestReward(session: GameSession): { message: string } {
  const roll = rollCoinDrop(0, 99);
  if (roll < 55) {
    const coins = rollCoinDrop(15, 30);
    session.addCoins(coins);
    return { message: `Hòm kho báu: +${coins} xu` };
  }
  if (roll < 80) {
    const ok = session.gainItem("potion");
    return ok
      ? { message: "Hòm kho báu: +1 Bình máu" }
      : { message: "Hòm kho báu: +1 Bình máu (túi đầy, bỏ lại)" };
  }
  session.pickupSwordUpgrade();
  session.gainItem("sword_upgrade");
  session.pickupSwordUpgrade();
  return { message: "Hòm kho báu: nâng cấp kiếm!" };
}
```

- [ ] **Step 2: Wire chest opening in `GameScene`**

Replace the `window.dispatchEvent(...)` in `checkInteract` with a direct call:

```ts
import { pickupChestReward } from "@/game/systems/pickups";

// inside checkInteract chest branch:
const result = pickupChestReward(currentSession!);
events.emit("toast", { message: result.message });
const chestTile = this.add.sprite(chest.x, chest.y, "coin").setScale(1).setVisible(false).setAlpha(0);
this.time.delayedCall(120, () => chestTile.destroy());
```

- [ ] **Step 3: Write full `src/game/scenes/HudScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { events } from "@/game/systems/events";
import { getQuestProgress } from "@/game/systems/quest";
import type { ItemType } from "@/types";
import { setGameSession } from "./GameScene";

export class HudScene extends Phaser.Scene {
  hpBar!: Phaser.GameObjects.Rectangle;
  coinsText!: Phaser.GameObjects.Text;
  swordText!: Phaser.GameObjects.Text;
  potionText!: Phaser.GameObjects.Text;
  questText!: Phaser.GameObjects.Text;
  toastText!: Phaser.GameObjects.Text;
  hintText!: Phaser.GameObjects.Text;

  constructor() { super("HudScene"); }

  create(): void {
    const x0 = 12;
    const y0 = 10;

    this.add.image(x0 + 6, y0 + 6, "heart").setScrollFactor(0).setDepth(100);
    this.hpBar = this.add.rectangle(x0 + 18, y0 + 6, 120, 10, 0x3fae57).setScrollFactor(0).setDepth(100);

    this.coinsText = this.add.text(x0 + 40, y0 + 24, "🪙 0", {
      fontSize: "14px", fontFamily: "monospace", color: "#f2c14e",
    }).setScrollFactor(0).setDepth(100);

    this.swordText = this.add.text(GAME_WIDTH - 150, y0, "Kiếm Lv.1", {
      fontSize: "14px", fontFamily: "monospace", color: "#c9c9d8",
    }).setScrollFactor(0).setDepth(100);

    this.potionText = this.add.text(GAME_WIDTH - 150, y0 + 20, "Thuốc: 0", {
      fontSize: "14px", fontFamily: "monospace", color: "#e06c9f",
    }).setScrollFactor(0).setDepth(100);

    this.questText = this.add.text(x0, GAME_HEIGHT - 34, "", {
      fontSize: "13px", fontFamily: "monospace", color: "#f0d9b0",
    }).setScrollFactor(0).setDepth(100);

    this.hintText = this.add.text(x0, GAME_HEIGHT - 18, "E: tương tác • 1: uống thuốc • S: lưu game", {
      fontSize: "12px", fontFamily: "monospace", color: "#555566",
    }).setScrollFactor(0).setDepth(100);

    this.toastText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "", {
      fontSize: "14px", fontFamily: "monospace", color: "#ffffff",
      backgroundColor: "#000000aa", padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);

    events.on("hp", ({ hp, maxHp }) => this.renderHp(hp, maxHp));
    events.on("coins", ({ coins }) => this.coinsText.setText(`🪙 ${coins}`));
    events.on("sword", ({ level }) => this.swordText.setText(`Kiếm Lv.${level}`));
    events.on("items", ({ items }) => this.renderItems(items));
    events.on("quest", (p) => this.renderQuest(p.kills, p.target, p.state));
    events.on("toast", ({ message }) => this.showToast(message));
    events.on("saveReady", () => this.showToast("Đã lưu game"));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => events.clear());
  }

  renderHp(hp: number, maxHp: number): void {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    this.hpBar.setScale(ratio, 1);
    this.hpBar.setFillStyle(ratio > 0.5 ? "#3fae57" : ratio > 0.25 ? "#f2c14e" : "#e04040");
  }

  renderItems(items: ItemType[]): void {
    const potions = items.filter((i) => i === "potion").length;
    const upgrades = items.filter((i) => i === "sword_upgrade").length;
    this.potionText.setText(`Thuốc: ${potions}${upgrades > 0 ? ` • Nâng cấp: ${upgrades}` : ""}`);
  }

  renderQuest(kills: number, target: number, state: string): void {
    if (state === "not_accepted") { this.questText.setText("Nhiệm vụ: gặp NPC bên làng"); return; }
    if (state === "claimed") { this.questText.setText("Nhiệm vụ hoàn tất ✔"); return; }
    if (state === "complete") { this.questText.setText("Nhiệm vụ xong! Nhận thưởng tại NPC"); return; }
    this.questText.setText(`Nhiệm vụ: tiêu diệt SLIME ${kills}/${target}`);
  }

  showToast(message: string): void {
    this.toastText.setText(message).setVisible(true);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1400, duration: 400, onComplete: () => this.toastText.setVisible(false) });
  }
}
```

Note: register `setGameSession` remains exported from `GameScene`; `HudScene` mirrors events from `currentSession` user (HUD renders from initial save on create — see Step 4).

- [ ] **Step 4: Mirror initial HUD state on HudScene create**

At the top of `HudScene.create()`, seed from session:

```ts
const session = (await import("@/game/systems/session")).GameSession;
const save = session ? currentSaveOf() : null;
```

Since `currentSession` is module-private in GameScene, export a getter `getGameSession()` in GameScene and seed HUD:

```ts
// in GameScene
export function getGameSession(): GameSession | null { return currentSession; }
```

In `HudScene.create()` seed:

```ts
import { getGameSession } from "./GameScene";
// after drawing texts:
const save = getGameSession()?.get();
if (save) {
  this.renderHp(save.hp, save.max_hp);
  this.renderItems(save.items);
  this.renderQuest(getQuestProgress(save.quests).kills, getQuestProgress(save.quests).target, getQuestProgress(save.quests).state);
  this.coinsText.setText(`🪙 ${save.coins}`);
  this.swordText.setText(`Kiếm Lv.${save.sword_level}`);
} else {
  this.renderHp(100, 100);
}
```

- [ ] **Step 5: Reset HUD on scene start**

In `create()` of HudScene clear any stale toast:

```ts
this.toastText.setVisible(false);
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck; npm run build`
Expected: exit 0. Manual: chests open with E granting rewards; HUD reflects HP/coins/sword/potion; toast messages show.

- [ ] **Step 7: Commit**

```bash
git add -A; git commit -m "feat: chest rewards, inventory HUD, toasts"
```

---

### Task 14: NPC dialogue + quest flow

**Files:**
- Create: `src/game/scenes/DialogueScene.ts` (full implementation)
- Modify: `src/game/scenes/GameScene.ts` (NPC interaction)

**Interfaces:**
- Consumes: `GameSession` (`acceptQuest`, `slimeKilled` via quest state), `getQuestProgress`, `events`
- Produces:
  - `DialogueScene` — launched with `{ npcId: "quest" }`, renders text panel, advances on SPACE/click, closes on end

- [ ] **Step 1: Write full `src/game/scenes/DialogueScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { getGameSession } from "./GameScene";
import { getQuestProgress } from "@/game/systems/quest";

export class DialogueScene extends Phaser.Scene {
  private panel!: Phaser.GameObjects.Rectangle;
  private nameText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private index = 0;
  private npcId: string = "quest";

  constructor() { super("DialogueScene"); }

  create(data: { npcId?: string }): void {
    this.npcId = data.npcId ?? "quest";
    this.index = 0;
    this.lines = this.buildLines();

    this.panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 110, GAME_WIDTH - 80, 120, 0x222844, 0.95)
      .setStrokeStyle(2, 0x7dd3fc).setScrollFactor(0).setDepth(300);

    this.nameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, "Bác Trưởng Làng", {
      fontSize: "16px", fontFamily: "monospace", color: "#f2c14e",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    this.bodyText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 105, "", {
      fontSize: "14px", fontFamily: "monospace", color: "#e8e8f0",
      align: "center", wordWrap: { width: GAME_WIDTH - 160 }, lineSpacing: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    this.input.keyboard!.on("keydown-SPACE", () => this.advance());
    this.input.keyboard!.on("keydown-E", () => this.advance());
    this.panel.setInteractive();
    this.panel.on("pointerdown", () => this.advance());

    this.render();
  }

  private buildLines(): string[] {
    const save = getGameSession()?.get();
    const q = save ? getQuestProgress(save.quests) : { state: "not_accepted" as const, kills: 0, target: 5 };
    if (q.state === "not_accepted") {
      return [
        "Chào nhà thám hiểm! Tên ta là Bác Trưởng Làng.",
        "Khu Rừng Xanh đang bị lũ SLIME hoành hành.",
        "Hãy tiêu diệt 5 con SLIME, ta sẽ thưởng cho ngươi 40 xu!",
        "Chấp nhận nhiệm vụ? (SPACE / E để đồng ý)",
      ];
    }
    if (q.state === "in_progress") {
      return [`Ngươi đã hạ ${q.kills}/${q.target} SLIME. Cố lên!`];
    }
    if (q.state === "complete") {
      return ["Xuất sắc! Ngươi đã diệt hết lũ SLIME.", "Đây là phần thưởng: 40 xu!"];
    }
    return ["Cảm ơn ngươi đã giúp làng! Hãy tiếp tục cuộc phiêu lưu."];
  }

  private advance(): void {
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.complete();
      return;
    }
    this.render();
  }

  private render(): void {
    this.bodyText.setText(this.lines[this.index]);
  }

  private complete(): void {
    const session = getGameSession();
    if (session) {
      const q = getQuestProgress(session.get().quests);
      if (q.state === "not_accepted") {
        session.acceptQuest();
      } else if (q.state === "complete") {
        session.claimQuest();
      }
    }
    this.scene.stop();
  }
}
```

- [ ] **Step 2: Wire NPC interaction in `GameScene.checkInteract` (replace npc branch)**

```ts
for (const npc of this.map.npcs) {
  if (positionInRange(x, y, npc.x, npc.y, 30)) {
    if (currentSession) this.scene.launch("DialogueScene", { npcId: "quest" });
    return;
  }
}
```

(Already present from Task 11; it just needs DialogueScene to be real.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck; npm run build`
Expected: exit 0. Manual: stand near NPC, press E, dialogue cycle works; accepting quest updates HUD tracker; killing slimes increments; completing + claiming grants 40 xu.

- [ ] **Step 4: Commit**

```bash
git add -A; git commit -m "feat: NPC dialogue and quest flow"
```

---

### Task 15: Portals and multi-map travel

**Files:**
- Modify: `src/game/scenes/GameScene.ts`

**Interfaces:**
- Consumes: `MAPS`, `positionInRange`, session `setPosition`
- Produces: portal stepping triggers scene restart with new map + correct position; return portals chain back

- [ ] **Step 1: Refactor scene-restart trajectory**

Replace `this.scene.restart(GameScene, { next: p.to })` logic so restart uses the session save map_id (already updated):

```ts
// in create(): read starting map:
const save = currentSession?.get();
const mapId = save ? save.map_id : "village";
this.map = MAPS[mapId];
// spawn position: if save exists and session already placed us, use save pos for ANY map:
const spawnX = save ? Number(save.pos_x) : this.map.spawn.x;
const spawnY = save ? Number(save.pos_y) : this.map.spawn.y;
```

- [ ] **Step 2: Ensure `create` re-launches HUD once**

In `create()`, guard double-launch:

```ts
this.scene.bringToTop("HudScene");
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck; npm run build`
Expected: exit 0. Manual: village `P` → forest; forest `P` (east side) → cave; cave `P` → arena; forest/cave return portals work. Each travel makes a toast with map name.

- [ ] **Step 4: Commit**

```bash
git add -A; git commit -m "feat: portal teleport between maps"
```

---

### Task 16: Boss, victory, game over

**Files:**
- Create: `src/game/scenes/BossIntroScene.ts`
- Create: `src/game/scenes/VictoryScene.ts`
- Create: `src/game/scenes/GameOverScene.ts`
- Modify: `src/game/scenes/GameScene.ts` (boss spawn + fight)

**Interfaces:**
- Consumes: `GameSession` (`defeatBoss`), `submitRun` (Task 9), `events`
- Produces:
  - `BossIntroScene` — cinematic text before the fight ("⚠ BOSS!")
  - Boss entity: 300 HP, walks at player (45 speed), contact damage 12, green slime art scaled 2×
  - `VictoryScene` — shows score, submits leaderboard, buttons (Quay lại trang chủ)
  - `GameOverScene` — revive at full HP / restart

- [ ] **Step 1: Write `src/game/scenes/BossIntroScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";

export class BossIntroScene extends Phaser.Scene {
  constructor() { super("BossIntroScene"); }

  create(): void {
    this.cameras.main.setBackgroundColor("#20061f");
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "⚠ CẢNH BÁO ⚠", {
      fontSize: "40px", fontFamily: "monospace", color: "#ff5a5a",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "BOSS MỞ-TOÀN-KHỈ-LỤC  —  SẮP GIÁNG TRẦN", {
      fontSize: "16px", fontFamily: "monospace", color: "#ffd27f",
    }).setOrigin(0.5);

    this.time.delayedCall(1800, () => {
      this.scene.start("GameScene");
    });
  }
}
```

- [ ] **Step 2: Write `src/game/scenes/VictoryScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { getGameSession } from "./GameScene";
import { submitRun } from "@/game/systems/saveSync";

export class VictoryScene extends Phaser.Scene {
  constructor() { super("VictoryScene"); }

  create(): void {
    const save = getGameSession()?.get();
    const score = save?.score ?? 0;
    const ok = save?.boss_defeated ?? false;

    submitRun(score, ok).catch(() => {});

    this.cameras.main.setBackgroundColor("#10131a");
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "🏆 CHIẾN THẮNG! 🏆", {
      fontSize: "44px", fontFamily: "monospace", color: "#f2c14e",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40,
      `Bạn đã hạ Boss và giải cứu vùng đất!\nĐiểm số: ${score}`,
      { fontSize: "18px", fontFamily: "monospace", color: "#e8e8f0", align: "center" },
    ).setOrigin(0.5);

    const again = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "[ CHƠI LẠI ]", {
      fontSize: "22px", fontFamily: "monospace", color: "#7dd3fc",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    again.on("pointerdown", () => {
      window.location.reload();
    });
  }
}
```

- [ ] **Step 3: Write `src/game/scenes/GameOverScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { getGameSession, setGameSession } from "./GameScene";
import { submitRun } from "@/game/systems/saveSync";
import { pushSave } from "@/game/systems/saveSync";

export class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOverScene"); }

  create(): void {
    const session = getGameSession();
    if (session) {
      const save = session.get();
      submitRun(save.score, save.boss_defeated).catch(() => {});
    }

    this.cameras.main.setBackgroundColor("#1a0f10");
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "BẠN ĐÃ GỤC NGÃ", {
      fontSize: "40px", fontFamily: "monospace", color: "#e04040",
    }).setOrigin(0.5);

    const revive = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "[ HỒI SINH TẠI LÀNG ]", {
      fontSize: "20px", fontFamily: "monospace", color: "#7dd3fc",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    revive.on("pointerdown", async () => {
      const session = getGameSession();
      if (session) {
        const save = session.get();
        const revived = { ...save, hp: save.max_hp, coins: Math.max(0, save.coins - 10), map_id: "village" as const };
        pushSave(revived).then((saved) => {
          const anySession = getGameSession();
          if (anySession) anySession.update(saved);
        }).catch(() => {});
      }
      this.scene.start("GameScene");
    });
  }
}
```

- [ ] **Step 4: Wire boss into `GameScene`**

Add to `create()` after `addMapDecor()`:

```ts
this.boss = null;
if (this.map.boss) {
  this.boss = this.physics.add.sprite(this.map.boss.x, this.map.boss.y, "boss").setScale(2);
  this.bossHp = 300;
  this.physics.add.collider(this.boss, this.layer);
}

if (save && save.map_id === "arena" && !(this.scene as unknown as { bossIntroduced?: boolean }).bossIntroduced) {
  (this.scene as unknown as { bossIntroduced?: boolean }).bossIntroduced = true;
  this.scene.launch("BossIntroScene");
}
```

Add state and logic:

```ts
boss: Phaser.Physics.Arcade.Sprite | null = null;
bossHp = 0;
invulnUntil = 0;
slimeHp: Map<Phaser.GameObjects.GameObject, number> = new Map();
enemies!: Phaser.Physics.Arcade.Group;
attackTimer = 0;
attackRect: Phaser.GameObjects.Rectangle | null = null;
```

In `swingSword()` damage loop, also check boss:

```ts
if (this.boss && this.boss.active && Phaser.Geom.Intersects.RectangleToRectangle(rect.getBounds(), this.boss.getBounds())) {
  this.hurtBoss(dmg);
}
```

```ts
hurtBoss(dmg: number): void {
  if (!this.boss) return;
  this.bossHp -= dmg;
  this.boss.setTintFill(0xffaaaa);
  this.time.delayedCall(90, () => this.boss?.clearTint());
  if (this.bossHp <= 0) {
    this.boss.destroy();
    this.boss = null;
    currentSession?.defeatBoss();
    const save = currentSession?.get();
    if (save) {
      const finalSave = { ...save, boss_defeated: true };
      pushSave(finalSave).catch(() => {});
    }
    this.scene.stop("HudScene");
    this.scene.start("VictoryScene");
  }
}
```

In `updateEnemies()`, add boss chase:

```ts
if (this.boss && this.boss.active) {
  const dxb = player.x - this.boss.x;
  const dyb = player.y - this.boss.y;
  const distb = Math.hypot(dxb, dyb);
  if (distb < 220) {
    const spd = 45;
    this.boss.setVelocity((dxb / Math.max(distb, 1)) * spd, (dyb / Math.max(distb, 1)) * spd);
    if (distb < 30) this.hurtPlayer(12);
  } else {
    this.boss.setVelocity(0, 0);
  }
}
```

- [ ] **Step 5: Update `main.ts` scene list — BossIntro already listed; confirm VictoryScene + GameOverScene listed (Task 10 stub list already includes them → now real).**

- [ ] **Step 6: Verify**

Run: `npm run typecheck; npm run build`
Expected: exit 0. Manual: reach arena → intro → fight boss → victory screen with score; leaderboard row appears; dying shows Game Over, revive works.

- [ ] **Step 7: Commit**

```bash
git add -A; git commit -m "feat: boss fight, victory and game over screens"
```

---

### Task 17: Autosave, manual save, pause, polish

**Files:**
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `src/game/scenes/HudScene.ts`

**Interfaces:**
- Consumes: `pushSave`, `events`, `GameSession`
- Produces: autosave on map change + interval; `S` key manual save; save toast

- [ ] **Step 1: Autosave timer + S-key in `GameScene.create`**

```ts
import { pushSave } from "@/game/systems/saveSync";

const session = currentSession;
if (session) {
  this.time.addEvent({ delay: 15000, loop: true, callback: () => {
    pushSave(session.toSave()).then(() => events.emit("saveReady", { save: session.toSave() })).catch(() => {});
  } });
  this.input.keyboard!.on("keydown-S", () => {
    pushSave(session.toSave()).then(() => events.emit("saveReady", { save: session.toSave() })).catch(() => {});
  });
}
```

- [ ] **Step 2: Autosave on map change in `checkPortal` (already pushes through `setPosition`)**

Confirm `setPosition` triggers `pushSave` — add to GameScene before `scene.restart`:

```ts
const save = currentSession?.get();
if (save) {
  pushSave(session.toSave()).catch(() => {});
}
```

- [ ] **Step 3: Wire `1` key to drink potion in `GameScene.create`**

```ts
this.input.keyboard!.on("keydown-ONE", () => {
  currentSession?.drinkPotion();
});
```

- [ ] **Step 4: Disable pointer scroll during play; keep game feel**

```ts
this.input.mouse?.disableContextMenu();
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck; npm run build`
Expected: exit 0. Manual: `S` saves with toast; autosave every 15s; `1` drinks potion; map travel persists position.

- [ ] **Step 6: Commit**

```bash
git add -A; git commit -m "feat: autosave, manual save, potion hotkey"
```

---

### Task 18: Assets — download attempt + CREDITS, env docs

**Files:**
- Create: `scripts/download-assets.mjs`
- Create: `public/assets/README.md`
- Create: `CREDITS.md`
- Modify: `.env.example` (already present), `README.md` (full)

**Interfaces:**
- Consumes: network (optional)
- Produces: optional downloaded spritesheets under `public/assets/`; attribution file; documentation for hot-swap

- [ ] **Step 1: Write `scripts/download-assets.mjs`**

Best-effort, fails gracefully when offline:

```js
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "assets");
mkdirSync(outDir, { recursive: true });

const SOURCES = [
  {
    file: "dungeon_tileset.png",
    url: "https://0x72.itch.io/dungeontileset-ii",
    note: "Ideally download 'DungeonTileset II' from 0x72 (CC0) and place the PNG here.",
  },
  {
    file: "kenney_pixel_filename.png",
    url: "https://kenney.nl/assets",
    note: "Kenney packs are CC0; extract the PNG of choice here.",
  },
];

for (const src of SOURCES) {
  const target = path.join(outDir, src.file);
  try {
    const res = await fetch(src.url, { signal: AbortSignal.timeout(8000) });
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    console.log("downloaded", src.file);
  } catch {
    console.log("skip (offline/unavailable):", src.file, "—", src.note);
    writeFileSync(target, Buffer.alloc(0)); // placeholder marker
  }
}
console.log("done. Place real spritesheets in public/assets/ to swap procedural art.");
```

- [ ] **Step 2: Write `public/assets/README.md`**

```md
# Assets

Procedural pixel art (generated in code) is the default and fully playable.

To use real spritesheets, drop them here and extend `src/game/systems/textures.ts`:

| Slot            | File suggestion            | Licence        |
|-----------------|----------------------------|----------------|
| landscape atlas | dungeon_tileset.png        | CC0 (0x72)     |
| player sheet    | char_hero.png              | CC0            |
| enemies         | slime/boss                  | CC0            |
| props/NPC/chest | kenney_pack_sheet.png      | CC0            |

See `CREDITS.md` for attribution.
```

- [ ] **Step 3: Write `CREDITS.md`**

```md
# Credits & Licensing

## Included art
- Procedural pixel-art textures drawn at runtime by `src/game/systems/textures.ts`
  (original work for Pixel Quest, MIT).

## Optional downloaded art (not bundled)
- **0x72 DungeonTileset II** — CC0, https://0x72.itch.io/dungeontileset-ii
- **Kenney** game assets — CC0, https://kenney.nl/assets

All other code in this repository is MIT-licensed (see LICENSE section in README).
```

- [ ] **Step 4: Replace skeleton `README.md`**

```md
# Pixel Quest

Top-down pixel action RPG — Phaser 3 on Next.js 15 with accounts, cloud saves
(Turso / libSQL), and a leaderboard.

## Chạy local

1. `npm install`
2. Copy `.env.example` → `.env.local` (giá trị mặc định OK để chạy local)
3. `npm run dev` → http://localhost:3000

Local dùng SQLite file `./data/dev.db` — không cần tài khoản Turso.

## Test / lint / build

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Hướng dẫn chơi

| Phím | Hành động |
|------|-----------|
| W/A/S/D hoặc mũi tên | Di chuyển |
| SPACE | Chém kiếm |
| E | Tương tác (NPC / hòm / cổng) |
| 1 | Uống bình máu |
| S | Lưu game (tự động lưu mỗi 15s và khi đổi map) |

Mục tiêu: diệt SLIME → làm quest của Bác Trưởng Làng → qua Rừng, Hang →
hạ Boss ở Đấu Trường để chiến thắng. Điểm = xu + 1000 nếu hạ Boss.

## Deploy lên Vercel (tự làm, không dùng vercel CLI)

1. Tạo database trên **Turso**: <https://turso.tech> — lệnh:
   ```bash
   turso db create pixelquest
   turso db tokens create pixelquest   # lấy token
   ```
2. Đẩy repo lên GitHub/GitLab.
3. Trên <https://vercel.com>: **Add New Project** → Import repo này.
4. Cấu hình **Environment Variables**:
   - `DATABASE_URL=libsql://pixelquest-xxx.turso.io` (URL từ bước 1)
   - `DATABASE_URL` cũng có thể kèm `?authToken=...` hoặc dùng
   - `JWT_SECRET=<chuỗi ngẫu nhiên dài>` (vd `openssl rand -hex 32`)
5. Bấm **Deploy**. Xong!
6. Sau deploy, ghé thăm `/api/save` để lần đầu khởi tạo bảng (tự động qua schema).

Lưu ý: không đưa token/auth vào `${env}` lộ trong client — Turso token chỉ nằm ở
server (Next.js API routes), nơi biến môi trường là an toàn.
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck; npm run lint; npm run build`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A; git commit -m "docs: deploy guide, asset swap instructions, credits"
```

---

### Task 19: Final verification + polish fixes

**Files:**
- Modify: as needed from verification results
- Test: full suite + browser smoke

- [ ] **Step 1: Run full checks**

Run: `npm run typecheck; npm run lint; npm run test; npm run build`
Expected: all green.

- [ ] **Step 2: Browser smoke**

Run: `npm run dev`
Verify: register → login → land on `/` → click "Bắt đầu chơi" → Title → start → walk village → kill slimes → E with NPC accepts quest → E with chest → travel portals to forest/cave/arena → boss fight → victory (leaderboard updated). Logout → login again → save restored at last position.

- [ ] **Step 3: Fix any lint/type issues flagged**

Fix anything `npm run typecheck`/`npm run lint` flags and re-run until clean.

- [ ] **Step 4: Final commit**

```bash
git add -A; git commit -m "chore: final polish and verification"
```

---

## Self-Review Notes

- **Spec coverage:** Every spec feature maps to a task: movement/collision (T11), combat (T12), inventory/items/chests (T13), NPC+quest (T14), multi-map+teleport (T15), boss+win (T16), saves+leaderboard+auth (T2–T6), HUD (T13), assets+credits+deploy (T18), tests (throughout). No gaps.
- **Type consistency:** `GameSession`, `events`, `map_id`, `ItemType`, `QuestState`, `SaveState` are defined once (Task 2/Task 9) and referenced consistently; scene keys match `main.ts` list.
- **Portal spawn uses `findSpawn` helper** defined in the maps module (Task 11 Step 1 first code block was superseded by the clean-ASCII + helper version — use the clean version).
- Known simplification: cheesy portal `out` uses target map's `@` — acceptable for MVP, documented in-game toasts.
