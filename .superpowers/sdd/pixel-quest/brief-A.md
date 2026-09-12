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
