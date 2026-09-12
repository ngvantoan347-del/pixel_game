import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { events } from "@/game/systems/events";
import { getQuestProgress } from "@/game/systems/quest";
import { getGameSession } from "@/game/systems/session";
import type { ItemType } from "@/types";

export class HudScene extends Phaser.Scene {
  hpBar!: Phaser.GameObjects.Rectangle;
  coinsText!: Phaser.GameObjects.Text;
  swordText!: Phaser.GameObjects.Text;
  potionText!: Phaser.GameObjects.Text;
  questText!: Phaser.GameObjects.Text;
  toastText!: Phaser.GameObjects.Text;
  hintText!: Phaser.GameObjects.Text;

  constructor() {
    super("HudScene");
  }

  create(): void {
    const x0 = 12;
    const y0 = 10;

    this.add.image(x0 + 6, y0 + 6, "heart").setScrollFactor(0).setDepth(100);
    this.hpBar = this.add.rectangle(x0 + 18, y0 + 6, 120, 10, 0x3fae57).setScrollFactor(0).setDepth(100);

    this.coinsText = this.add.text(x0 + 40, y0 + 24, "Xu: 0", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#f2c14e",
    }).setScrollFactor(0).setDepth(100);

    this.swordText = this.add.text(GAME_WIDTH - 150, y0, "Kiếm Lv.1", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#c9c9d8",
    }).setScrollFactor(0).setDepth(100);

    this.potionText = this.add.text(GAME_WIDTH - 150, y0 + 20, "Thuốc: 0", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#e06c9f",
    }).setScrollFactor(0).setDepth(100);

    this.questText = this.add.text(x0, GAME_HEIGHT - 34, "", {
      fontSize: "13px",
      fontFamily: "monospace",
      color: "#f0d9b0",
    }).setScrollFactor(0).setDepth(100);

    this.hintText = this.add.text(x0, GAME_HEIGHT - 18, "E: tương tác • 1: uống thuốc • S: lưu game", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#555566",
    }).setScrollFactor(0).setDepth(100);

    this.toastText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);

    const save = getGameSession()?.get();
    if (save) {
      this.renderHp(save.hp, save.max_hp);
      this.renderItems(save.items);
      const progress = getQuestProgress(save.quests);
      this.renderQuest(progress.kills, progress.target, progress.state);
      this.coinsText.setText(`Xu: ${save.coins}`);
      this.swordText.setText(`Kiếm Lv.${save.sword_level}`);
    } else {
      this.renderHp(100, 100);
    }

    events.on("hp", ({ hp, maxHp }) => this.renderHp(hp, maxHp));
    events.on("coins", ({ coins }) => this.coinsText.setText(`Xu: ${coins}`));
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
    this.hpBar.setFillStyle(ratio > 0.5 ? 0x3fae57 : ratio > 0.25 ? 0xf2c14e : 0xe04040);
  }

  renderItems(items: ItemType[]): void {
    const potions = items.filter((i) => i === "potion").length;
    const upgrades = items.filter((i) => i === "sword_upgrade").length;
    this.potionText.setText(`Thuốc: ${potions}${upgrades > 0 ? ` • Nâng cấp: ${upgrades}` : ""}`);
  }

  renderQuest(kills: number, target: number, state: string): void {
    if (state === "not_accepted") {
      this.questText.setText("Nhiệm vụ: gặp NPC bên làng");
      return;
    }
    if (state === "claimed") {
      this.questText.setText("Nhiệm vụ hoàn tất ✔");
      return;
    }
    if (state === "complete") {
      this.questText.setText("Nhiệm vụ xong! Nhận thưởng tại NPC");
      return;
    }
    this.questText.setText(`Nhiệm vụ: tiêu diệt SLIME ${kills}/${target}`);
  }

  showToast(message: string): void {
    this.toastText.setText(message).setVisible(true);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(1);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1400,
      duration: 400,
      onComplete: () => this.toastText.setVisible(false),
    });
  }
}