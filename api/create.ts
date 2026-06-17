import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createGame, rateLimit } from "./_store.js";
import { ApiError, sendErr } from "./_http.js";

function clientIp(req: VercelRequest): string {
  // x-real-ip iestata Vercel edge (klients nevar viltot); x-forwarded-for ir rezerves variants
  const real = String(req.headers["x-real-ip"] ?? "").trim();
  if (real) return real;
  const fwd = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  return fwd || "unknown";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const playerId = String(req.body?.playerId ?? "");
    if (!playerId) throw new ApiError(400, "Trūkst playerId");
    await rateLimit("create", clientIp(req), 20, 3600); // maks. 20 jaunas spēles stundā uz IP
    const game = await createGame(playerId);
    res.status(200).json({ code: game.code, playerId, you: 1 });
  } catch (e) {
    sendErr(res, e);
  }
}
