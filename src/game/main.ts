import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GAME_STYLE } from "./config";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
import { HudScene } from "./scenes/HudScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { BossIntroScene } from "./scenes/BossIntroScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { GameOverScene } from "./scenes/GameOverScene";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    ...GAME_STYLE,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#10131a",
    scene: [
      BootScene, TitleScene, GameScene, HudScene,
      DialogueScene, BossIntroScene, VictoryScene, GameOverScene,
    ],
  });
}