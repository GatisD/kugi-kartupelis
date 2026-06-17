import { useCallback, useEffect, useRef, useState } from "react";
import { getState } from "./api";
import type { PlayerView } from "./game/types";

function intervalFor(view: PlayerView | null): number {
  if (!view) return 1500;
  if (view.status === "finished") return 5000;
  if (view.status === "playing" && view.turn === view.you) return 4000; // tavs gājiens - pretinieks neko nemaina
  return 1500;
}

export function useGameState(code: string | null, playerId: string) {
  const [view, setView] = useState<PlayerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!code) return null;
    try {
      const v = await getState(code, playerId);
      setView(v);
      setError(null);
      return v;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [code, playerId]);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    const tick = async () => {
      const v = await refresh();
      if (!alive) return;
      timer.current = setTimeout(tick, intervalFor(v ?? null));
    };
    tick();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [code, refresh]);

  return { view, error, refresh };
}
