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
