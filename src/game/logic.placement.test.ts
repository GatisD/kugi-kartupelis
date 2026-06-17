import { describe, it, expect } from "vitest";
import { validatePlacement, canPlace, randomPlacement } from "./logic";
import type { Ship } from "./types";

function ship(size: number, row: number, col: number, orientation: "h" | "v"): Ship {
  return { size, row, col, orientation, hits: new Array(size).fill(false) };
}

// Derīga flote: 1x4, 2x3, 3x2, 4x1, neviens nesaskaras
function validFleet(): Ship[] {
  return [
    ship(4, 0, 0, "h"), // (0,0)-(0,3)
    ship(3, 0, 5, "h"),
    ship(3, 2, 0, "h"),
    ship(2, 4, 0, "h"),
    ship(2, 4, 3, "h"),
    ship(2, 4, 6, "h"),
    ship(1, 6, 0, "h"),
    ship(1, 6, 2, "h"),
    ship(1, 6, 4, "h"),
    ship(1, 6, 6, "h"),
  ];
}

describe("validatePlacement", () => {
  it("pieņem derīgu floti", () => {
    expect(validatePlacement(validFleet())).toEqual({ ok: true });
  });

  it("noraida nepareizu kuģu skaitu", () => {
    const fleet = validFleet().slice(0, 9);
    expect(validatePlacement(fleet).ok).toBe(false);
  });

  it("noraida kuģi ārpus lauka", () => {
    const fleet = validFleet();
    fleet[0] = ship(4, 0, 8, "h"); // (0,8)-(0,11) ārpus
    expect(validatePlacement(fleet).ok).toBe(false);
  });

  it("noraida kuģus, kas saskaras pa malu", () => {
    const fleet = validFleet();
    fleet[1] = ship(3, 0, 4, "h"); // (0,4) blakus 4-niekam, kas beidzas (0,3)
    expect(validatePlacement(fleet).ok).toBe(false);
  });

  it("noraida kuģus, kas saskaras pa diagonāli", () => {
    const fleet = validFleet();
    fleet[1] = ship(3, 1, 4, "h"); // (1,4) ir diagonāli no (0,3)
    expect(validatePlacement(fleet).ok).toBe(false);
  });
});

describe("canPlace", () => {
  it("atļauj brīvā vietā", () => {
    expect(canPlace([ship(4, 0, 0, "h")], ship(2, 2, 0, "h"))).toBe(true);
  });
  it("aizliedz blakus esošu (mala)", () => {
    expect(canPlace([ship(4, 0, 0, "h")], ship(2, 1, 0, "h"))).toBe(false);
  });
  it("aizliedz ārpus lauka", () => {
    expect(canPlace([], ship(3, 9, 9, "h"))).toBe(false);
  });
});

describe("randomPlacement", () => {
  it("vienmēr atgriež derīgu floti (50 reizes)", () => {
    for (let i = 0; i < 50; i++) {
      expect(validatePlacement(randomPlacement())).toEqual({ ok: true });
    }
  });
});
