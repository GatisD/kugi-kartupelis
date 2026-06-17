import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";
import { applyShot, isShipSunk } from "../src/game/logic";
import { inBounds, parseCell, shipCells, cellKey } from "../src/game/coords";
import type { PlayerSlot } from "../src/game/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    const cell = String(req.body?.cell ?? "");
    if (!code || !playerId || !cell) throw new ApiError(400, "Trūkst datu");

    const game = await atomicUpdate(code, (g) => {
      const slot = slotOf(g, playerId);
      if (!slot) throw new ApiError(403, "Neesi šajā spēlē");
      if (g.status !== "playing") throw new ApiError(409, "Spēle nav aktīva");
      if (g.turn !== slot) throw new ApiError(409, "Nav tavs gājiens");

      const { row, col } = parseCell(cell);
      if (!inBounds(row, col)) throw new ApiError(400, "Nederīga rūts");

      const opp: PlayerSlot = slot === 1 ? 2 : 1;
      const shooter = g.players[slot]!;
      const defender = g.players[opp]!;
      if (shooter.shotsAt.includes(cell)) throw new ApiError(409, "Šeit jau šāvi");

      const r = applyShot(defender.ships, shooter.shotsAt, cell);
      defender.ships = r.ships;
      shooter.shotsAt = r.shotsAt;
      if (r.allSunk) {
        g.status = "finished";
        g.winner = slot;
      } else if (r.result === "miss") {
        g.turn = opp;
      }
    });

    // atvasina atbildi no atjaunotā stāvokļa
    const slot = slotOf(game, playerId)!;
    const opp: PlayerSlot = slot === 1 ? 2 : 1;
    const defender = game.players[opp]!;
    const hitShip = defender.ships.find((s) =>
      shipCells(s).some((c) => cellKey(c.row, c.col) === cell)
    );
    const result = hitShip ? "hit" : "miss";
    const sunk = hitShip && isShipSunk(hitShip) ? hitShip : null;
    res.status(200).json({ result, sunk, win: game.winner === slot, turn: game.turn });
  } catch (e) {
    sendErr(res, e);
  }
}
