# Batch A Report — Tasks 1–6

## Status: DONE_WITH_CONCERNS

All 6 tasks implemented, tested, verified, and committed. All gates run green at the end: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Environment

- Node v24.19.0, npm 11.17.0, Windows PowerShell 5.1.
- Repo already had an empty initial commit (`0327583`), so `git init` was skipped per instructions.
- `npm install` succeeded; no peer-dep conflicts.

## Commits created

| SHA | Subject |
|-----|---------|
| `b2beb1d` | chore: scaffold Next.js app with config and deps |
| `f23e6a7` | feat: shared types and libsql DB layer with schema |
| `cab79c3` | feat: auth and user registration/login with JWT and bcrypt |
| `a46e70b` | feat: save state validation, clamping, and persistence |
| `8a2771a` | feat: leaderboard query and run submission |
| `748cfdb` | feat: API routes for auth, save, and leaderboard |

## Per-task notes

### Task 1 — Scaffold
- Created all config files from brief: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `.env.example`, `vitest.config.mts`, `eslint.config.mjs`, `next-env.d.ts`, `README.md`, `src/app/globals.css`, `layout.tsx`, placeholder `page.tsx`.
- **Lint fixes required (allowed by instructions):**
  - ESLint 9 flat config was linting the `.next/` build output (4008 warnings + 140 errors from generated JS). Added `ignores: [".next/**", "node_modules/**", "out/**", "data/**"]` to `eslint.config.mjs`.
  - Next.js regenerated `next-env.d.ts` to include a triple-slash reference to `.next/types/routes.d.ts`; disabled `@typescript-eslint/triple-slash-reference` for that generated file.
- Removed the generated `tsconfig.tsbuildinfo` from git (was committed accidentally due to `incremental: true`) and added `*.tsbuildinfo` to `.gitignore`.
- Task 1 expected "typecheck + build" smoke; typecheck exit 0, build produced `.next` successfully.

### Task 2 — Types + DB layer
- `src/types/index.ts`, `src/lib/db.ts`, `tests/db.test.ts` written exactly per brief.
- Schema initializes `users`, `saves`, `leaderboard` tables; `getDb()` with singleton + `ensureFileDir` for `file:` URLs; `createTestDb()` uses `:memory:`.
- typecheck + tests green.

### Task 3 — Auth + users
- `src/lib/auth.ts` (`hashPassword`, `verifyPassword`, `signToken`, `verifyToken`, `authCookie`, `clearCookie`, `getUserFromRequest`) and `src/lib/users.ts` (`registerUser`, `loginUser`) written exactly per brief.
- bcryptjs hashing, jose HS256 JWT (7d), httpOnly `pixelquest_token` cookie.
- `tests/auth.test.ts`, `tests/users.test.ts` all pass.

### Task 4 — Saves
- `src/lib/saves.ts` and `tests/saves.test.ts` written per brief.
- `clampSave` validates map_id, item types (max 8), hp/max_hp ≤ 100, then computes `score` server-side via `computeScore` (`min(coins + boss 1000, 99999)`).
- All 7 save tests pass. Note: brief schema allows hp up to 100 and max_hp ≤ 100 but does not enforce `hp ≤ max_hp` (that constraint is enforced by the game's max_hp clamp); test only checks max_hp=200 rejection, which passes.

### Task 5 — Leaderboard (deviation from plan — see Concerns)
- `src/lib/leaderboard.ts`, `tests/leaderboard.test.ts`.
- The brief's test `"records a run submission"` asserts that after `submitScore`, `getLeaderboardRows` returns the submitted score. The brief's `getLeaderboardRows` reads from the `saves` table (derived leaderboard) while the brief's `submitScore` only inserted a row into the `leaderboard` history table — so the test failed (`Cannot read properties of undefined`).
- **Resolution:** `submitScore` now also upserts the derived score into the `saves` table (score, boss_defeated, updated_at) in addition to inserting the `leaderboard` history row. This keeps the brief's derived-read design and makes the brief's own test pass as written. Documented as a deliberate deviation.

### Task 6 — API routes
- Created all five routes per brief: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/save`, `/api/leaderboard`.
- Build shows all routes registered as dynamic (`ƒ`).
- typecheck + lint + build all exit 0.

## Final gate results

- `npm run typecheck` → exit 0
- `npm run lint` → exit 0 (strict, `--max-warnings=0`)
- `npm run test` → 5 files, 19 tests, all passed
- `npm run build` → exit 0, all routes rendered
- `git status` → clean

## Concerns

1. **Leaderboard deviation:** `submitScore` (src/lib/leaderboard.ts) writes to both `leaderboard` (history) and `saves` (derived standings) because the brief's own test required the submission to appear in the saves-derived leaderboard GET. If the intended design was for `leaderboard` to be a pure run-history log and the leaderboard GET to read there instead, this should be reconciled in a later batch. Note: submitScore upserts into `saves` with only score/boss_defeated, so other save fields fall back to DB defaults on a fresh row — in normal game flow the client already PUTs the full save, so this is idempotent.

2. **ESLint config changes beyond brief:** `.next/` ignores, `next-env.d.ts` triple-slash exemption, and underscore-pattern `no-unused-vars` were required to get `npm run lint` to exit 0 on Windows/Node 24 with ESLint 9 flat config (permitted by the task instructions).

3. **Hash ordering in `putSaveRow` args:** verified against the SQL columns — all 13 args match column order.