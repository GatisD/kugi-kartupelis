import { Redis } from "@upstash/redis";
import { ApiError } from "./_http.js";
import { cellHitsAnyShip, isShipSunk } from "../src/game/logic.js";
import type { GameState, PlayerSlot, PlayerView, ShotResult } from "../src/game/types.js";

// Lēna inicializācija: klients tiek izveidots tikai pie pirmā Redis izsaukuma,
// lai tīrās funkcijas (redactFor) būtu importējamas un testējamas bez env mainīgajiem.
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error("Trūkst Upstash Redis env mainīgo");
    _redis = new Redis({ url, token, automaticDeserialization: false });
  }
  return _redis;
}

const TTL_SECONDS = 60 * 60 * 24; // 24h
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez I, O, 0, 1

function gameKey(code: string) {
  return `game:${code}`;
}
function revKey(code: string) {
  return `game:${code}:rev`;
}

export function newCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function loadGame(code: string): Promise<GameState | null> {
  const raw = await getRedis().get<string>(gameKey(code));
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function saveGame(game: GameState): Promise<void> {
  await getRedis().set(gameKey(game.code), JSON.stringify(game), { ex: TTL_SECONDS });
}

export async function createGame(playerId: string): Promise<GameState> {
  let code = newCode();
  for (let i = 0; i < 6; i++) {
    const exists = await getRedis().exists(gameKey(code));
    if (!exists) break;
    code = newCode();
  }
  const game: GameState = {
    code,
    status: "waiting",
    createdAt: Date.now(),
    turn: 1,
    winner: null,
    abandonedBy: null,
    players: {
      1: { id: playerId, ready: false, ships: [], shotsAt: [] },
      2: null,
    },
  };
  await saveGame(game);
  await getRedis().set(revKey(code), "0", { ex: TTL_SECONDS });
  return game;
}

// Atomic read-modify-write ar optimistic rev (CAS caur Lua, bez cjson atkarības)
const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[2])
if cur and cur ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
redis.call('SET', KEYS[2], ARGV[4], 'EX', tonumber(ARGV[3]))
return 1
`;

export async function atomicUpdate(code: string, mutate: (g: GameState) => void): Promise<GameState> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const game = await loadGame(code);
    if (!game) throw new ApiError(404, "Spēle nav atrasta");
    const revRaw = await getRedis().get<string>(revKey(code));
    const expectedRev = String(revRaw ?? "0");
    mutate(game); // var mest ApiError
    const nextRev = String(Number(expectedRev) + 1);
    const ok = await getRedis().eval(
      CAS_SCRIPT,
      [gameKey(code), revKey(code)],
      [expectedRev, JSON.stringify(game), String(TTL_SECONDS), nextRev]
    );
    if (ok === 1) return game;
  }
  throw new ApiError(409, "Vienlaicīgas izmaiņas, mēģini vēlreiz");
}

export function slotOf(game: GameState, playerId: string): PlayerSlot | null {
  if (game.players[1]?.id === playerId) return 1;
  if (game.players[2]?.id === playerId) return 2;
  return null;
}

// Vienkāršs skaitītāja rate-limit: INCR ar TTL. Met 429, ja pārsniegts.
export async function rateLimit(bucket: string, id: string, limit: number, windowSec: number): Promise<void> {
  const key = `rl:${bucket}:${id}`;
  const n = Number(await getRedis().incr(key));
  if (n === 1) await getRedis().expire(key, windowSec);
  if (n > limit) throw new ApiError(429, "Pārāk daudz jaunu spēļu. Pamēģini pēc brīža.");
}

export function redactFor(game: GameState, playerId: string): PlayerView {
  const you: PlayerSlot = game.players[2]?.id === playerId ? 2 : 1;
  const oppSlot: PlayerSlot = you === 1 ? 2 : 1;
  const me = game.players[you];
  const opponent = game.players[oppSlot];

  const myShots: ShotResult[] = (me?.shotsAt ?? []).map((cell) => ({
    cell,
    result: opponent && cellHitsAnyShip(opponent.ships, cell) ? "hit" : "miss",
  }));

  const sunkOpponentShips = opponent ? opponent.ships.filter(isShipSunk) : [];

  return {
    code: game.code,
    status: game.status,
    you,
    turn: game.turn,
    winner: game.winner,
    abandonedBy: game.abandonedBy ?? null,
    opponentJoined: !!opponent,
    opponentReady: !!opponent?.ready,
    youReady: !!me?.ready,
    myShips: me?.ships ?? [],
    incomingShots: opponent?.shotsAt ?? [],
    myShots,
    sunkOpponentShips,
  };
}
