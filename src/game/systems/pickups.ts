import { rollCoinDrop } from "./combat";
import type { GameSession } from "./session";

export function pickupChestReward(session: GameSession): { message: string } {
  const roll = rollCoinDrop(0, 99);
  if (roll < 55) {
    const coins = rollCoinDrop(15, 30);
    session.addCoins(coins);
    return { message: `Hòm kho báu: +${coins} xu` };
  }
  if (roll < 80) {
    const ok = session.gainItem("potion");
    return ok ? { message: "Hòm kho báu: +1 Bình máu" } : { message: "Hòm kho báu: +1 Bình máu (túi đầy, bỏ lại)" };
  }
  const ok = session.gainItem("sword_upgrade");
  if (ok) session.pickupSwordUpgrade();
  return { message: "Hòm kho báu: nâng cấp kiếm!" };
}