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
