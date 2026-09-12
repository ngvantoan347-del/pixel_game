import * as Phaser from "phaser";
import { TILE_SIZE } from "@/game/config";
import { MAPS, LEGEND, type ParsedMap } from "@/game/world/maps";
import { events } from "@/game/systems/events";
import { GameSession, getGameSession, setGameSession } from "@/game/systems/session";
import { DEFAULT_SAVE } from "@/lib/saves";
import { positionInRange } from "@/game/systems/combat";
import type { Direction } from "@/types";

export const PLAYER_SPEED = 160;
export const SOLID_TILES = new Set([3, 4, 5]);

export class GameScene extends Phaser.Scene {
  map!: ParsedMap;
  player!: Phaser.Physics.Arcade.Sprite;
  layer!: Phaser.Tilemaps.TilemapLayer;
  cursors!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
  };
  facing: Direction = "down";
  lastPortalAt = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    let session = getGameSession();
    if (!session) {
      session = new GameSession(JSON.parse(JSON.stringify(DEFAULT_SAVE)));
      setGameSession(session);
    }
    const save = session.get();
    this.map = MAPS[save.map_id];
    if (!this.scene.isActive("HudScene")) this.scene.launch("HudScene");

    const grid = this.map.rows.map((r) => r.split("").map((ch) => LEGEND[ch] ?? 0));
    const tilemap = this.make.tilemap({ data: grid, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = tilemap.addTilesetImage("landscape", "landscape", TILE_SIZE, TILE_SIZE, 0, 0);
    this.layer = tilemap.createLayer(0, tileset!, 0, 0)!;
    this.layer.setCollision([...SOLID_TILES]);

    const mapWidth = this.map.rows[0].length * TILE_SIZE;
    const mapHeight = this.map.rows.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    const spawnX = this.map.id === "village" ? Number(save.pos_x) : this.map.spawn.x;
    const spawnY = this.map.id === "village" ? Number(save.pos_y) : this.map.spawn.y;

    this.player = this.physics.add.sprite(spawnX, spawnY, "player").setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.layer);

    this.cursors = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      e: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(2);

    this.addMapDecor();
  }

  private addMapDecor(): void {
    this.add.text(8, 8, this.map.name, {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#cfe8ff",
      backgroundColor: "#00000066",
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(10).setOrigin(0, 0);
  }

  private checkPortal(): void {
    const x = this.player.x;
    const y = this.player.y;
    for (const p of this.map.portals) {
      if (p.to && positionInRange(x, y, p.x, p.y, 14) && this.time.now - this.lastPortalAt > 700) {
        this.lastPortalAt = this.time.now;
        const session = getGameSession();
        if (session) session.setPosition(p.to, p.out.x, p.out.y);
        events.emit("toast", { message: MAPS[p.to].name });
        this.scene.restart();
        return;
      }
    }
  }

  private checkInteract(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.cursors.e)) return;
    const x = this.player.x;
    const y = this.player.y;
    for (const npc of this.map.npcs) {
      if (positionInRange(x, y, npc.x, npc.y, 30)) {
        const session = getGameSession();
        if (session) this.scene.launch("DialogueScene", { npcId: "quest" });
        return;
      }
    }
  }

  update(_time: number, _delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const vx = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
    const vy = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      body.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx > 0 ? "right" : "left";
      else this.facing = vy > 0 ? "down" : "up";
      this.player.setFlipX(this.facing === "left");
    } else {
      body.setVelocity(0, 0);
    }

    this.checkPortal();
    this.checkInteract();
  }
}