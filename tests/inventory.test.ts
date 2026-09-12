import { describe, it, expect } from "vitest";
import type { ItemType } from "@/types";
import { addItem, removeItem, MAX_ITEMS, usePotion, applySwordUpgrade } from "@/game/systems/inventory";

describe("inventory", () => {
  it("adds items up to the cap", () => {
    let items: ItemType[] = [];
    for (let i = 0; i < MAX_ITEMS + 3; i++) {
      items = addItem(items, "potion").items;
    }
    expect(items.length).toBe(MAX_ITEMS);
  });

  it("removes the first matching item only", () => {
    const items: ItemType[] = ["potion", "potion", "sword_upgrade"];
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