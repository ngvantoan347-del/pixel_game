import type { ItemType, QuestState, SaveState } from "@/types";
import { events } from "./events";
import { addItem, applySwordUpgrade, usePotion as drinkPotion } from "./inventory";
import { acceptQuest, claimQuestReward, recordSlimeKill } from "./quest";
import { loadSave } from "./saveSync";
import { DEFAULT_SAVE } from "@/lib/saves";

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
    const res = drinkPotion(this.current.hp, this.current.max_hp, this.current.items);
    if (res.used) {
      this.update({ hp: res.hp, items: res.items });
      events.emit("toast", { message: "Uống bình máu (+30 HP)" });
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
    events.emit("quest", this.questProgressPayload(res.quests));
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

let currentSession: GameSession | null = null;

export function getGameSession(): GameSession | null {
  return currentSession;
}

export function setGameSession(session: GameSession): void {
  currentSession = session;
}

export async function loadGameSession(): Promise<GameSession> {
  try {
    const save = await loadSave();
    return new GameSession(save);
  } catch {
    return new GameSession(JSON.parse(JSON.stringify(DEFAULT_SAVE)));
  }
}