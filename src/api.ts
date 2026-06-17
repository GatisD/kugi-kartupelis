import type { PlayerView, Ship } from "./game/types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Kļūda");
  return data as T;
}

export function createGame(playerId: string) {
  return post<{ code: string; you: 1 }>("create", { playerId });
}
export function joinGame(code: string, playerId: string) {
  return post<{ code: string; you: 1 | 2 }>("join", { code, playerId });
}
export function placeShips(code: string, playerId: string, ships: Ship[]) {
  return post<{ ok: true; status: string }>("place", { code, playerId, ships });
}
export function shoot(code: string, playerId: string, cell: string) {
  return post<{ result: "hit" | "miss"; sunk: Ship | null; win: boolean; turn: 1 | 2 }>(
    "shoot",
    { code, playerId, cell }
  );
}
export function rematch(code: string, playerId: string) {
  return post<{ ok: true; status: string }>("rematch", { code, playerId });
}
export function leaveGame(code: string, playerId: string) {
  return post<{ ok: true }>("leave", { code, playerId });
}
export function timeoutTurn(code: string, playerId: string) {
  return post<{ ok: true }>("timeout", { code, playerId });
}
export async function getState(code: string, playerId: string): Promise<PlayerView> {
  const r = await fetch(`/api/state?code=${encodeURIComponent(code)}&playerId=${encodeURIComponent(playerId)}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Kļūda");
  return data as PlayerView;
}
