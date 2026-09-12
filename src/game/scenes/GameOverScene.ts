import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { getGameSession } from "@/game/systems/session";
import { pushSave, submitRun } from "@/game/systems/saveSync";
import { MAPS } from "@/game/world/maps";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(): void {
    this.scene.stop("HudScene");

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

    revive.on("pointerdown", () => {
      const session = getGameSession();
      if (session) {
        const save = session.get();
        const revived = {
          ...save,
          hp: save.max_hp,
          coins: Math.max(0, save.coins - 10),
          map_id: "village" as const,
          pos_x: MAPS.village.spawn.x,
          pos_y: MAPS.village.spawn.y,
        };
        session.update(revived);
        pushSave(session.toSave()).then((saved) => {
          getGameSession()?.update(saved);
        }).catch(() => {});
      }
      this.scene.start("GameScene");
    });
  }
}