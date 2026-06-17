import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadGame, redactFor, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const code = String(req.query.code ?? "").toUpperCase();
    const playerId = String(req.query.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");
    const game = await loadGame(code);
    if (!game) throw new ApiError(404, "Spēle nav atrasta");
    if (!slotOf(game, playerId)) throw new ApiError(403, "Neesi šajā spēlē");
    res.status(200).json(redactFor(game, playerId));
  } catch (e) {
    sendErr(res, e);
  }
}
