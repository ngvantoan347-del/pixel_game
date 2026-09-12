import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "assets");
mkdirSync(outDir, { recursive: true });

writeFileSync(path.join(outDir, "placeholders.txt"), `Optional asset slots for Pixel Quest.

The game ships with fully playable procedural pixel art generated at runtime.
To swap in real spritesheets, drop the files below into public/assets/ and
extend src/game/systems/textures.ts to load them.

| Slot            | File suggestion       | Licence
|-----------------|-----------------------|------------
| landscape atlas | dungeon_tileset.png   | CC0 (0x72)
| player sheet    | char_hero.png         | CC0
| enemies         | slime / boss          | CC0
| props/NPC/chest | kenney_pack_sheet.png | CC0

See public/assets/README.md and CREDITS.md for sources and attribution.

Drop real spritesheets here, then extend src/game/systems/textures.ts to load them.
`);

console.log("Created public/assets/ with placeholders.txt (no network download).");
console.log("Hot-swap instructions:");
console.log("  1. Download spritesheets from the links in public/assets/README.md");
console.log("  2. Copy the PNGs into public/assets/ (e.g. dungeon_tileset.png)");
console.log("  3. Extend src/game/systems/textures.ts to load and use them");
console.log("  4. Restart the dev server / rebuild; the game then uses real art.");