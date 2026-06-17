import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store.js";
import { ApiError, sendErr } from "./_http.js";
import type { PlayerSlot } from "../src/game/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    await atomicUpdate(code, (g) => {
      const slot = slotOf(g, playerId);
      if (!slot) return; // nav šajā spēlē - idempotents
      if (g.status === "finished") return; // jau beigusies
      const opp: PlayerSlot = slot === 1 ? 2 : 1;
      g.status = "finished";
      g.abandonedBy = slot;
      g.winner = g.players[opp] ? opp : null;
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    sendErr(res, e);
  }
}
