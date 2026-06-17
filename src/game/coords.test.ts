import { describe, it, expect } from "vitest";
import { cellKey, parseCell, inBounds, colLabel, rowLabel, shipCells } from "./coords";

describe("coords", () => {
  it("cellKey un parseCell ir apgriežami", () => {
    expect(cellKey(3, 7)).toBe("3,7");
    expect(parseCell("3,7")).toEqual({ row: 3, col: 7 });
  });

  it("inBounds atpazīst lauka robežas", () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(9, 9)).toBe(true);
    expect(inBounds(-1, 0)).toBe(false);
    expect(inBounds(10, 0)).toBe(false);
    expect(inBounds(0, 10)).toBe(false);
  });

  it("colLabel kartē KARTUPELIS, rowLabel ir 1-bāzes", () => {
    expect(colLabel(0)).toBe("K");
    expect(colLabel(9)).toBe("S");
    expect(rowLabel(0)).toBe("1");
    expect(rowLabel(9)).toBe("10");
  });

  it("shipCells atgriež rūtis horizontāli un vertikāli", () => {
    expect(shipCells({ size: 3, row: 2, col: 4, orientation: "h", hits: [false, false, false] }))
      .toEqual([{ row: 2, col: 4 }, { row: 2, col: 5 }, { row: 2, col: 6 }]);
    expect(shipCells({ size: 2, row: 5, col: 1, orientation: "v", hits: [false, false] }))
      .toEqual([{ row: 5, col: 1 }, { row: 6, col: 1 }]);
  });
});
