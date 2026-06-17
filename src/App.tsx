import { useCallback, useEffect, useState } from "react";
import { getPlayerId } from "./playerId";
import { useGameState } from "./useGameState";
import * as api from "./api";
import { Home } from "./screens/Home";
import { Lobby } from "./screens/Lobby";
import { Placement } from "./screens/Placement";
import { Battle } from "./screens/Battle";
import { Result } from "./screens/Result";
import type { Ship } from "./game/types";

const CODE_KEY = "kugi:code";

export default function App() {
  const [playerId] = useState(getPlayerId);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { view, refresh } = useGameState(code, playerId);

  // Sākumā: pārbaudi ?kods= URL vai saglabāto kodu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get("kods")?.toUpperCase();
    const saved = localStorage.getItem(CODE_KEY);
    const target = fromUrl || saved;
    if (!target) return;
    (async () => {
      try {
        const r = await api.joinGame(target, playerId);
        persistCode(r.code);
      } catch (e) {
        // saglabātais kods varētu būt beidzies - notīri
        localStorage.removeItem(CODE_KEY);
        if (fromUrl) setError((e as Error).message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistCode(c: string) {
    localStorage.setItem(CODE_KEY, c);
    setCode(c);
    setError(null);
  }

  const handleCreate = useCallback(async () => {
    setError(null);
    try {
      const r = await api.createGame(playerId);
      persistCode(r.code);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [playerId]);

  const handleJoin = useCallback(
    async (c: string) => {
      setError(null);
      try {
        const r = await api.joinGame(c, playerId);
        persistCode(r.code);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [playerId]
  );

  const handleReady = useCallback(
    async (ships: Ship[]) => {
      if (!code) return;
      setBusy(true);
      try {
        await api.placeShips(code, playerId, ships);
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [code, playerId, refresh]
  );

  const handleShoot = useCallback(
    async (cell: string) => {
      if (!code) return;
      setBusy(true);
      try {
        await api.shoot(code, playerId, cell);
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [code, playerId, refresh]
  );

  const handleRematch = useCallback(async () => {
    if (!code) return;
    setBusy(true);
    try {
      await api.rematch(code, playerId);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [code, playerId, refresh]);

  // Maršrutēšana pēc stāvokļa
  if (!code) {
    return <Home onCreate={handleCreate} onJoin={handleJoin} error={error} />;
  }
  if (!view) {
    return <div className="min-h-full flex items-center justify-center text-slate-400">Ielādē…</div>;
  }
  if (view.status === "waiting") {
    return <Lobby code={code} />;
  }
  if (view.status === "placing") {
    if (!view.youReady) return <Placement onReady={handleReady} busy={busy} />;
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
        <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />
        Gaida, kamēr pretinieks izvieto kuģus…
      </div>
    );
  }
  if (view.status === "playing") {
    return <Battle view={view} onShoot={handleShoot} busy={busy} />;
  }
  // finished
  return <Result won={view.winner === view.you} onRematch={handleRematch} busy={busy} />;
}
