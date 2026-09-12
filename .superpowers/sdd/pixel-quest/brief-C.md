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
