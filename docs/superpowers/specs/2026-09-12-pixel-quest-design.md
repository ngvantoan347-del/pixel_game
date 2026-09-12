# Pixel Quest — Design Spec

> Full-stack top-down action RPG (Zelda-like) — pixel adventure game.

**Date:** 2026-09-12
**Status:** Approved by user (design reviewed in chat on 2026-09-12)

## 1. Goal

Build a deployable full-stack web game: a top-down pixel action RPG playable
in the browser, with accounts, persistent cloud saves, and a leaderboard.
The user deploys to Vercel themselves (via Git import); no Vercel CLI is
used. Local development uses a local SQLite file — no external DB account
required to develop.

## 2. Tech Stack

- **Next.js 15 (App Router) + TypeScript** — single project, frontend + API
  routes (which replace a separate Express server)
- **Phaser 3** — game engine (client only, mounted on the `/game` page)
- **Turso / libSQL** (`@libsql/client`) — serverless SQLite over HTTP.
  Dev uses `file:` local database; prod uses a `libsql://` URL.
- **Auth**: JWT (httpOnly cookie), bcrypt password hashing, `zod` validation
- **Testing**: Vitest for pure logic + API route unit tests

## 3. Architecture

```
src/
├── app/                    # Next.js
│   ├── layout.tsx
│   ├── page.tsx            # Landing/title page
│   ├── game/page.tsx       # Phaser game page (client component)
│   ├── leaderboard/page.tsx
│   └── api/
│       ├── auth/register/route.ts
│       ├── auth/login/route.ts
│       ├── auth/me/route.ts
│       ├── save/route.ts        # GET + PUT (authed)
│       └── leaderboard/route.ts # GET + POST (POST authed)
├── game/                   # Phaser 3 game code
│   ├── config.ts
│   ├── Game.ts             # boot/start helper
│   ├── scenes/             # Boot, Title, Game, Hud, Dialogue, GameOver, Victory
│   ├── entities/           # Player, Enemy (Slime), NPC, Chest, Portal, Boss
│   ├── systems/            # Combat, Inventory, Quest, SaveSync
│   ├── world/maps*/        # Tiled JSON maps
│   └── types/
├── lib/                    # db.ts, auth.ts, validation, api client helper
└── types/                  # Shared types (SaveState, User, LeaderboardEntry...)
```

**Key decisions:**
- Backend = Next.js API routes, not Express (Vercel-friendly single project)
- Dev DB = local SQLite file (`./.data/dev.db`); prod DB = Turso libsql URL.
  Same client library and schema for both — only `DATABASE_URL` changes.
- Server is authoritative for saves and score. Client sends activity; server
  clamps and validates values; server computes/derives score.

## 4. Game Features

**Game name:** "Pixel Quest"

1. **Movement + Collision** — tile-based, 4-direction movement, collision
   with walls (blocked tiles) and map edges.
2. **Combat** — sword attack (hitbox in facing direction), enemies with HP
   and simple chase AI, enemies drop coins, knockback.
3. **Inventory + Items** — chests (coins / health potions), health potion
   (restores HP), sword upgrades (raise sword level → +damage).
4. **NPC + Quest** — NPC near cave gate gives quest "defeat N slimes",
   rewards coins on completion, simple dialogue box.
5. **Multiple maps + teleports** — 4 maps: Village, Forest, Cave, Boss
   Arena; portals between them.
6. **Boss + Win** — boss with lots of HP in arena; defeating it = victory,
   score bonus, end of run.

**HUD:** HP bar, coin counter, quest tracker, item quickbar, sword level
badge, pause/save controls.

**Save (SaveState):**
`map_id, x, y, hp, max_hp, coins, sword_level, items[],
quests[], boss_defeated, score`.

Autosave on map change, boss defeat, run end; manual save from menu.

## 5. Data Model

| table | columns |
|---|---|
| `users` | id INTEGER PK AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL |
| `saves` | user_id INTEGER PK REFERENCES users(id), map_id TEXT NOT NULL, pos_x INTEGER, pos_y INTEGER, hp INTEGER, max_hp INTEGER, coins INTEGER, sword_level INTEGER, items TEXT (JSON array), quests TEXT (JSON object), boss_defeated INTEGER (0/1), score INTEGER, updated_at TEXT NOT NULL |
| `leaderboard` | id INTEGER PK AUTOINCREMENT, user_id INTEGER REFERENCES users(id), username TEXT NOT NULL, score INTEGER, boss_defeated INTEGER, created_at TEXT NOT NULL |

**Leaderboard read** = derived query over `saves` ORDER BY score DESC LIMIT N
(no separate sync needed). POST /api/leaderboard inserts/upserts a row on
run end for the record.

## 6. Auth & Security

- `POST /api/auth/register` — zod-validated `{ username, password }`,
  bcrypt hashed, insert user
- `POST /api/auth/login` — verify, issue JWT in httpOnly cookie (7d)
- `GET /api/auth/me` — returns current user from cookie
- Protected routes (`GET/PUT /api/save`, `POST /api/leaderboard`) require
  valid JWT cookie
- Server clamps save values: `0 ≤ hp ≤ max_hp ≤ 100`, `0 ≤ coins ≤ 99999`,
  `0 ≤ sword_level ≤ 5`, items whitelist `["potion","sword_upgrade"]`,
  map_id from allowed map ids, quest keys whitelist
- zod validation on every request body; JWT_SECRET env var

## 7. Pixel Art Assets (free & open source)

All **CC0 / CC-BY** with licensing in `CREDITS.md`:
- **0x72 DungeonTileset II** (CC0) — tileset, slime/enemy sprites
- **0x72 Character** 16×16 (CC0) — player character
- **Kenney Topdown/Roguelike pack** (CC0) — NPC, chest, items, props
- Boss assembled from 0x72 sprites + tint/scale effects
- `public/assets/` hosts downloads with `CREDITS.md` attribution

If assets cannot be downloaded during implementation (no network at build
time), fall back to procedurally-generated placeholder pixel art (code
drawn) with the same tile size so swap-in is trivial.

## 8. Testing

- Vitest unit tests: combat resolver, inventory/items, quest tracker, save
  validation/clamping, auth (register/login), save route, leaderboard route
- Routes tested against a temp/local SQLite file DB (in-memory `:memory:`)

## 9. Dev & Deploy Workflow

- Dev: `npm install` then `npm run dev` → `http://localhost:3000`
- `.env.example` with `DATABASE_URL` (default `file:./data/dev.db`) and
  `JWT_SECRET`
- Deploy (user does this): push repo → Vercel Git import → set env vars →
  Deploy. README documents this. No `vercel` CLI used in this project.

## 10. Non-Goals (YAGNI)

- No multiplayer/real-time networking
- No crafting, shops, magic, prestige
- No mobile touch controls beyond optional basic support
- No unit/XSS-hardening beyond standard Next.js defaults