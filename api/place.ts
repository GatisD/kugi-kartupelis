import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store.js";
import { ApiError, sendErr } from "./_http.js";
import { validatePlacement } from "../src/game/logic.js";
import type { Ship } from "../src/game/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    const incoming = (req.body?.ships ?? []) as Ship[];
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    const check = validatePlacement(incoming);
    if (!check.ok) throw new ApiError(422, check.reason ?? "Nederīgs izvietojums");

    // normalizē: serveris pārraksta hits, lai klients nevar sūtīt jau "trāpītus" kuģus
    const ships: Ship[] = incoming.map((s) => ({
      size: s.size,
      row: s.row,
      col: s.col,
      orientation: s.orientation,
      hits: new Array(s.size).fill(false),
    }));

    const game = await atomicUpdate(code, (g) => {
      const slot = slotOf(g, playerId);
      if (!slot) throw new ApiError(403, "Neesi šajā spēlē");
      if (g.status !== "placing") throw new ApiError(409, "Tagad nevar izvietot");
      g.players[slot]!.ships = ships;
      g.players[slot]!.ready = true;
      if (g.players[1]?.ready && g.players[2]?.ready) {
        g.status = "playing";
        g.turn = Math.random() < 0.5 ? 1 : 2;
      }
    });
    res.status(200).json({ ok: true, status: game.status });
  } catch (e) {
    sendErr(res, e);
  }
}
