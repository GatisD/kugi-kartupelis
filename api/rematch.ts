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
      if (!slotOf(g, playerId)) throw new ApiError(403, "Neesi šajā spēlē");
      for (const slot of [1, 2] as const) {
        const p = g.players[slot];
        if (p) {
          p.ships = [];
          p.shotsAt = [];
          p.ready = false;
        }
      }
      g.winner = null;
      g.status = g.players[2] ? "placing" : "waiting";
    });
    res.status(200).json({ ok: true, status: game.status });
  } catch (e) {
    sendErr(res, e);
  }
}
