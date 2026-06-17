import { describe, it, expect } from "vitest";
import { redactFor } from "../../api/_store";
import type { GameState } from "./types";

function baseGame(): GameState {
  return {
    code: "ABCD",
    status: "playing",
    createdAt: 0,
    turn: 1,
    winner: null,
    abandonedBy: null,
    players: {
      1: { id: "p1", ready: true, ships: [{ size: 1, row: 0, col: 0, orientation: "h", hits: [false] }], shotsAt: ["5,5"] },
      2: { id: "p2", ready: true, ships: [{ size: 1, row: 5, col: 5, orientation: "h", hits: [true] }], shotsAt: [] },
    },
  };
}

describe("redactFor", () => {
  it("nogremdētu pretinieka kuģi rāda un trāpījumu atzīmē", () => {
    const view = redactFor(baseGame(), "p1");
    expect(view.you).toBe(1);
    expect(view.myShips).toHaveLength(1);
    expect(view.sunkOpponentShips).toHaveLength(1); // p2 kuģis (5,5) ir nogremdēts
    expect(view.myShots).toEqual([{ cell: "5,5", result: "hit" }]);
  });

  it("nenogremdētu pretinieka kuģi tur slepenu", () => {
    const g = baseGame();
    // pārvieto p2 kuģi prom no 5,5, lai šāviens 5,5 ir reāli garām
    g.players[2]!.ships[0] = { size: 1, row: 9, col: 9, orientation: "h", hits: [false] };
    const view = redactFor(g, "p1");
    expect(view.sunkOpponentShips).toHaveLength(0);
    expect(view.myShots).toEqual([{ cell: "5,5", result: "miss" }]);
  });
});
