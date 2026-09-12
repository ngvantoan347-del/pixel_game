import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { getGameSession } from "@/game/systems/session";
import { submitRun } from "@/game/systems/saveSync";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(): void {
    const save = getGameSession()?.get();
    const bossDefeated = save?.boss_defeated ?? false;
    const score = Math.min((save?.coins ?? 0) + (bossDefeated ? 1000 : 0), 99999);

    submitRun(score, bossDefeated).catch(() => {});

    this.cameras.main.setBackgroundColor("#10131a");
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "CHIẾN THẮNG!", {
      fontSize: "44px", fontFamily: "monospace", color: "#f2c14e",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40,
      `Bạn đã hạ Boss và giải cứu vùng đất!\nĐiểm số: ${score}`,
      { fontSize: "18px", fontFamily: "monospace", color: "#e8e8f0", align: "center" },
    ).setOrigin(0.5);

    const again = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "[ CHƠI LẠI ]", {
      fontSize: "22px", fontFamily: "monospace", color: "#7dd3fc",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    again.on("pointerdown", () => {
      window.location.reload();
    });
  }
}