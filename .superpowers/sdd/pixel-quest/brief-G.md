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