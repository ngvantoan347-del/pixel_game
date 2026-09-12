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