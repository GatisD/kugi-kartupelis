import { describe, it, expect } from "vitest";
import { applyShot, surroundingCells, isShipSunk, cellHitsAnyShip } from "./logic";
import type { Ship } from "./types";

function ship(size: number, row: number, col: number, orientation: "h" | "v"): Ship {
  return { size, row, col, orientation, hits: new Array(size).fill(false) };
}

describe("isShipSunk", () => {
  it("nogremdēts, kad visas rūtis trāpītas", () => {
    expect(isShipSunk({ ...ship(2, 0, 0, "h"), hits: [true, true] })).toBe(true);
    expect(isShipSunk({ ...ship(2, 0, 0, "h"), hits: [true, false] })).toBe(false);
  });
});

describe("cellHitsAnyShip", () => {
  it("atpazīst kuģa rūti", () => {
    const ships = [ship(3, 1, 1, "h")];
    expect(cellHitsAnyShip(ships, "1,2")).toBe(true);
    expect(cellHitsAnyShip(ships, "0,0")).toBe(false);
  });
});

describe("surroundingCells", () => {
  it("atgriež 8-kaimiņu zonu lauka robežās, bez paša kuģa rūtīm", () => {
    const cells = surroundingCells(ship(1, 0, 0, "h")); // stūris
    expect(cells.sort()).toEqual(["0,1", "1,0", "1,1"].sort());
  });
});

describe("applyShot", () => {
  it("garām, kad nav kuģa", () => {
    const r = applyShot([ship(2, 5, 5, "h")], [], "0,0");
    expect(r.result).toBe("miss");
    expect(r.shotsAt).toContain("0,0");
    expect(r.sunkShip).toBeNull();
    expect(r.allSunk).toBe(false);
  });

  it("trāpījums atzīmē kuģa rūti", () => {
    const r = applyShot([ship(2, 5, 5, "h")], [], "5,5");
    expect(r.result).toBe("hit");
    expect(r.ships[0].hits).toEqual([true, false]);
    expect(r.sunkShip).toBeNull();
  });

  it("nogremdēšana atklāj apkārtni kā šāvienus", () => {
    const ships = [{ ...ship(1, 4, 4, "h"), hits: [false] }];
    const r = applyShot(ships, [], "4,4");
    expect(r.result).toBe("hit");
    expect(r.sunkShip).not.toBeNull();
    for (const c of ["3,3", "3,4", "3,5", "4,3", "4,5", "5,3", "5,4", "5,5"]) {
      expect(r.shotsAt).toContain(c);
    }
  });

  it("allSunk, kad visi kuģi nogremdēti", () => {
    const ships = [{ ...ship(1, 0, 0, "h"), hits: [false] }];
    const r = applyShot(ships, [], "0,0");
    expect(r.allSunk).toBe(true);
  });
});
