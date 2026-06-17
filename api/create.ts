import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createGame } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const playerId = String(req.body?.playerId ?? "");
    if (!playerId) throw new ApiError(400, "Trūkst playerId");
    const game = await createGame(playerId);
    res.status(200).json({ code: game.code, playerId, you: 1 });
  } catch (e) {
    sendErr(res, e);
  }
}
