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