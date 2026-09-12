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