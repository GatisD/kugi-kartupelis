import { GRID_SIZE, FLEET, TOTAL_SHIPS } from "./constants.js";
import { cellKey, inBounds, shipCells, parseCell } from "./coords.js";
import type { Ship, Orientation } from "./types.js";

function neighborhood(row: number, col: number): string[] {
  const cells: string[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) cells.push(cellKey(row + dr, col + dc));
  return cells;
}

export function validatePlacement(ships: Ship[]): { ok: boolean; reason?: string } {
  if (ships.length !== TOTAL_SHIPS) return { ok: false, reason: "Nepareizs kuģu skaits" };

  const counts = new Map<number, number>();
  for (const s of ships) counts.set(s.size, (counts.get(s.size) ?? 0) + 1);
  for (const { size, count } of FLEET) {
    if ((counts.get(size) ?? 0) !== count) {
      return { ok: false, reason: `Nepareizs ${size}-rūšu kuģu skaits` };
    }
  }

  const forbidden = new Set<string>(); // noliktās rūtis + to 8-kaimiņu zona
  for (const ship of ships) {
    const cells = shipCells(ship);
    for (const { row, col } of cells) {
      if (!inBounds(row, col)) return { ok: false, reason: "Kuģis ārpus lauka" };
      if (forbidden.has(cellKey(row, col))) {
        return { ok: false, reason: "Kuģi saskaras vai pārklājas" };
      }
    }
    for (const { row, col } of cells) {
      for (const k of neighborhood(row, col)) forbidden.add(k);
    }
  }
  return { ok: true };
}

export function canPlace(placed: Ship[], candidate: Ship): boolean {
  const cells = shipCells(candidate);
  if (cells.some((c) => !inBounds(c.row, c.col))) return false;
  const forbidden = new Set<string>();
  for (const s of placed)
    for (const c of shipCells(s))
      for (const k of neighborhood(c.row, c.col)) forbidden.add(k);
  return !cells.some((c) => forbidden.has(cellKey(c.row, c.col)));
}

function randInt(maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

export function randomPlacement(): Ship[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const ships: Ship[] = [];
    let ok = true;
    for (const { size, count } of FLEET) {
      for (let n = 0; n < count; n++) {
        const ship = tryPlaceOne(size, ships);
        if (!ship) {
          ok = false;
          break;
        }
        ships.push(ship);
      }
      if (!ok) break;
    }
    if (ok && ships.length === TOTAL_SHIPS) return ships;
  }
  throw new Error("Neizdevās izvietot floti");
}

function tryPlaceOne(size: number, placed: Ship[]): Ship | null {
  for (let t = 0; t < 300; t++) {
    const orientation: Orientation = Math.random() < 0.5 ? "h" : "v";
    const maxRow = orientation === "v" ? GRID_SIZE - size : GRID_SIZE - 1;
    const maxCol = orientation === "h" ? GRID_SIZE - size : GRID_SIZE - 1;
    const candidate: Ship = {
      size,
      row: randInt(maxRow),
      col: randInt(maxCol),
      orientation,
      hits: new Array(size).fill(false),
    };
    if (canPlace(placed, candidate)) return candidate;
  }
  return null;
}

export function isShipSunk(ship: Ship): boolean {
  return ship.hits.every(Boolean);
}

export function cellHitsAnyShip(ships: Ship[], cell: string): boolean {
  const { row, col } = parseCell(cell);
  return ships.some((s) => shipCells(s).some((c) => c.row === row && c.col === col));
}

export function surroundingCells(ship: Ship): string[] {
  const own = new Set(shipCells(ship).map((c) => cellKey(c.row, c.col)));
  const out = new Set<string>();
  for (const { row, col } of shipCells(ship)) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (!inBounds(r, c)) continue;
        const k = cellKey(r, c);
        if (!own.has(k)) out.add(k);
      }
  }
  return [...out];
}

export function applyShot(
  defenderShips: Ship[],
  shooterShotsAt: string[],
  cell: string
): { result: "hit" | "miss"; sunkShip: Ship | null; allSunk: boolean; ships: Ship[]; shotsAt: string[] } {
  const shotsAt = shooterShotsAt.includes(cell) ? [...shooterShotsAt] : [...shooterShotsAt, cell];
  const { row, col } = parseCell(cell);
  const ships = defenderShips.map((s) => ({ ...s, hits: [...s.hits] }));

  let result: "hit" | "miss" = "miss";
  let sunkShip: Ship | null = null;

  for (const ship of ships) {
    const cells = shipCells(ship);
    const idx = cells.findIndex((c) => c.row === row && c.col === col);
    if (idx !== -1) {
      ship.hits[idx] = true;
      result = "hit";
      if (isShipSunk(ship)) {
        sunkShip = ship;
        for (const sc of surroundingCells(ship)) {
          if (!shotsAt.includes(sc)) shotsAt.push(sc);
        }
      }
      break;
    }
  }

  const allSunk = ships.every(isShipSunk);
  return { result, sunkShip, allSunk, ships, shotsAt };
}
