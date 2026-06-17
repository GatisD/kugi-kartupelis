import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store.js";
import { ApiError, sendErr } from "./_http.js";
import { TURN_MS } from "../src/game/constants.js";
import type { PlayerSlot } from "../src/game/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    await atomicUpdate(code, (g) => {
      if (!slotOf(g, playerId)) throw new ApiError(403, "Neesi šajā spēlē");
      if (g.status !== "playing" || g.turnDeadline == null) return; // nav ko darīt
      if (Date.now() <= g.turnDeadline) return; // vēl nav beidzies - serveris izšķir
      // laiks beidzies: gājiens pāriet pretiniekam, svaigs taimeris
      const opp: PlayerSlot = g.turn === 1 ? 2 : 1;
      g.turn = opp;
      g.turnDeadline = Date.now() + TURN_MS;
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    sendErr(res, e);
  }
}
