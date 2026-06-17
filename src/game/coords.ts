import { GRID_SIZE, COLUMNS } from "./constants";
import type { Ship } from "./types";

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCell(key: string): { row: number; col: number } {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function colLabel(col: number): string {
  return COLUMNS[col];
}

export function rowLabel(row: number): string {
  return String(row + 1);
}

export function shipCells(ship: Ship): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < ship.size; i++) {
    const row = ship.orientation === "v" ? ship.row + i : ship.row;
    const col = ship.orientation === "h" ? ship.col + i : ship.col;
    cells.push({ row, col });
  }
  return cells;
}
