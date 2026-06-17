import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    const game = await atomicUpdate(code, (g) => {
      if (slotOf(g, playerId)) return; // jau spēlē - idempotents
      if (g.players[2]) throw new ApiError(409, "Istaba ir pilna");
      g.players[2] = { id: playerId, ready: false, ships: [], shotsAt: [] };
      g.status = "placing";
    });
    res.status(200).json({ code, playerId, you: slotOf(game, playerId) });
  } catch (e) {
    sendErr(res, e);
  }
}
