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