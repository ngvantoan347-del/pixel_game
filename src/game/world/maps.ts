import { TILE_SIZE } from "@/game/config";
import type { MapId } from "@/types";

export interface ParsedMap {
  id: MapId;
  name: string;
  rows: string[];
  spawn: { x: number; y: number };
  portals: Array<{ x: number; y: number; to: MapId | null; out: { x: number; y: number } }>;
  chests: Array<{ x: number; y: number }>;
  npcs: Array<{ x: number; y: number }>;
  enemies: Array<{ x: number; y: number }>;
  boss: { x: number; y: number } | null;
}

export const LEGEND: Record<string, number> = {
  ".": 0, ",": 1, s: 2, "#": 3, T: 4, "~": 5, C: 6, P: 7, D: 8, f: 9, c: 10, "@": 0, N: 0, E: 0, B: 2,
};

const SOLID_TILES = new Set([3, 4, 5]);

interface RawMap {
  name: string;
  rows: string[];
  portalTargets: Array<MapId | null>;
}

const RAW: Record<MapId, RawMap> = {
  village: {
    name: "Làng Phong Lan",
    portalTargets: ["forest"],
    rows: [
      "########################################",
      "#......................................#",
      "#....TT.........N..............E......#",
      "#....TT...............................#",
      "#.........#########....#####.........#",
      "#.........#.......#....#....#....E...#",
      "#.........#..@....#....#.C..#........#",
      "#.........#.......#....#####.........#",
      "#.........#..##...#..................#",
      "#.........#......#.....~..~........#.#",
      "#.........########.....~..~........#.#",
      "#......................................#",
      "#...,...,,..,.E.......................#",
      "#...,.....,,...E.......................#",
      "#...,.....,...,....................E..#",
      "#...,.....,,...C.......................#",
      "#...,...,,...................E........#",
      "#......................................#",
      "#.....E....................P..........#",
      "#......................................#",
      "#......................................#",
      "########################################",
    ],
  },
  forest: {
    name: "Rừng Xanh",
    portalTargets: ["cave", "village"],
    rows: [
      "########################################",
      "#TT..TT...TT..TT...TT.....##.###....#",
      "#T..............TT...TT......T...E..#",
      "#.......E..........TT........T......#",
      "#.....TT.....TT........TT.....T......#",
      "#..TT......TT....TT..TT..##..T..N...E#",
      "#.....E......TT.....TT...##..T.......#",
      "#TT......TT.....TT...........T.......#",
      "#..............TT...TT......T........#",
      "#..TT....TT.......TT.P.....TT....E...#",
      "#........................TT...........#",
      "#...TT......TT....TT........TT.......#",
      "#......E.......................E.....#",
      "#...TT.........C..........TT.........#",
      "#......TT.............TT........E....#",
      "#........,...TT....TT....,...........#",
      "#..E....,....,....TT......,..........#",
      "#........,....,.........P,....E......#",
      "#........,..TT...,,....,....,........#",
      "#...#....,...,,,........,....,....#.#",
      "#...#................................#",
      "########################################",
    ],
  },
  cave: {
    name: "Hang Đá Tối",
    portalTargets: ["arena", "forest"],
    rows: [
      "########################################",
      "#ssssssssssssssssssssssssssssssssssssss#",
      "#ss..ssss..ss.s.c...ssss..ssss...sP:ss#",
      "#ss..ssss......sss....ss.....ssss..ss#",
      "#s.........cc................s..s...#",
      "#s..ssss..ssss..ssss..ssss..sss.s...#",
      "#s..ssss.f......s..s......s...s.E...#",
      "#s.....................s.......sss.ss#",
      "#s..ssss..ssss..ssss..ssss.......s...#",
      "#s.........c.....................s...c#",
      "#s..E......ssss..ssss..ssss....c#...#",
      "#s..............s....s...........ss..#",
      "#s.E...........c..c....s...........#",
      "#s.....ssss....ss....s................#",
      "#s..ss.......ss....ccssss#..##..E....#",
      "#s.....sss..............E..#..##.....#",
      "#s...c.........sss......s............#",
      "#s......ss.......sss#....s#....#.....#",
      "#c...........c........s.P............#",
      "#ssssssssssssssssssssssss..............#",
      "#sssssssss..................###........#",
      "########################################",
    ],
  },
  arena: {
    name: "Đấu Trường Boss",
    portalTargets: [null],
    rows: [
      "########################################",
      "#ssssssssssssssssssssssssssssssssssssss#",
      "#s..............sssss...............s#",
      "#s.............sssssss..............s#",
      "#s............sccc..cccs............s#",
      "#s............ssss..sssss..........P#s#",
      "#s.............sss..ssss............s#",
      "#s............................B.....s#",
      "#s..............sssss..............s#",
      "#sssssssssssssssssssssssssssssssssssss#",
      "#sssssssssssssssssssssssssssssssssssss#",
      "########################################",
    ],
  },
};

function normalizeRows(rows: string[]): string[] {
  if (rows.length === 0) throw new Error("map data contains no rows");
  const maxWidth = Math.max(...rows.map((r) => r.length));
  for (const row of rows) {
    if (row.length === 0) throw new Error("map data contains an empty row");
    if (row.charAt(0) !== "#") throw new Error("map row is missing its left # border");
  }
  return rows.map((row) => {
    if (row.length === maxWidth) return row;
    if (row.charAt(row.length - 1) !== "#") {
      throw new Error("map row is missing its right # border — padding would break the # rim");
    }
    return row.padEnd(maxWidth, "#");
  });
}

function findSpawn(rows: string[]): { x: number; y: number } {
  const half = TILE_SIZE / 2;
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y].indexOf("@");
    if (x !== -1) return { x: x * TILE_SIZE + half, y: y * TILE_SIZE + half };
  }
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row.charAt(x);
      if (ch === "P") continue;
      if (!SOLID_TILES.has(LEGEND[ch] ?? 0)) {
        return { x: x * TILE_SIZE + half, y: y * TILE_SIZE + half };
      }
    }
  }
  const cols = rows[0]?.length ?? 0;
  return {
    x: Math.floor(cols / 2) * TILE_SIZE + half,
    y: Math.floor(rows.length / 2) * TILE_SIZE + half,
  };
}

export const MAPS: Record<MapId, ParsedMap> = (() => {
  const result = {} as Record<MapId, ParsedMap>;
  const normalized = {} as Record<MapId, string[]>;
  for (const [id, def] of Object.entries(RAW) as Array<[MapId, RawMap]>) {
    normalized[id] = normalizeRows(def.rows);
  }
  for (const [id, def] of Object.entries(RAW) as Array<[MapId, RawMap]>) {
    const rows = normalized[id];
    const map: ParsedMap = {
      id,
      name: def.name,
      rows,
      spawn: { x: 0, y: 0 },
      portals: [],
      chests: [],
      npcs: [],
      enemies: [],
      boss: null,
    };
    rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cy = y * TILE_SIZE + TILE_SIZE / 2;
        if (ch === "@") map.spawn = { x: cx, y: cy };
        if (ch === "C") map.chests.push({ x: cx, y: cy });
        if (ch === "N") map.npcs.push({ x: cx, y: cy });
        if (ch === "E") map.enemies.push({ x: cx, y: cy });
        if (ch === "B") map.boss = { x: cx, y: cy };
      });
    });
    rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (ch !== "P") return;
        const portalIndex = map.portals.length;
        const target = def.portalTargets[portalIndex] ?? null;
        const out = target ? findSpawn(normalized[target]) : findSpawn(rows);
        map.portals.push({
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
          to: target,
          out,
        });
      });
    });
    result[id] = map;
  }
  return result;
})();