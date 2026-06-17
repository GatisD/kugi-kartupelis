import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store.js";
import { ApiError, sendErr } from "./_http.js";
import { applyShot, isShipSunk } from "../src/game/logic.js";
import { inBounds, parseCell, shipCells, cellKey } from "../src/game/coords.js";
import { TURN_MS } from "../src/game/constants.js";
import type { PlayerSlot } from "../src/game/types.js";

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
        g.turnDeadline = null;
      } else if (r.result === "miss") {
        g.turn = opp;
        g.turnDeadline = Date.now() + TURN_MS;
      } else {
        // trāpījums - tas pats spēlētājs šauj vēlreiz, svaigs taimeris
        g.turnDeadline = Date.now() + TURN_MS;
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
