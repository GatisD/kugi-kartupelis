import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getPlayerId } from "./playerId";
import { useGameState } from "./useGameState";
import * as api from "./api";
import { Home } from "./screens/Home";
import { Lobby } from "./screens/Lobby";
import { Placement } from "./screens/Placement";
import { Battle } from "./screens/Battle";
import { Result } from "./screens/Result";
import { TopBar } from "./components/TopBar";
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

  const handleLeave = useCallback(async () => {
    if (code) {
      try {
        await api.leaveGame(code, playerId);
      } catch {
        /* pretinieks vai tīkls var būt prom - tik un tā ejam uz sākumu */
      }
    }
    localStorage.removeItem(CODE_KEY);
    window.history.replaceState({}, "", location.pathname);
    setError(null);
    setBusy(false);
    setCode(null);
  }, [code, playerId]);

  // Maršrutēšana pēc stāvokļa
  if (!code) {
    return <Home onCreate={handleCreate} onJoin={handleJoin} error={error} />;
  }

  let content: ReactNode;
  if (!view) {
    content = <div className="min-h-full flex items-center justify-center font-display tracking-wide text-foam/50">Ielādē…</div>;
  } else if (view.status === "waiting") {
    content = <Lobby code={code} />;
  } else if (view.status === "placing") {
    content = view.youReady ? (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-foam/60">
        <span className="float-buoy text-2xl">⚓</span>
        Gaida, kamēr pretinieks izvieto kuģus…
      </div>
    ) : (
      <Placement onReady={handleReady} busy={busy} />
    );
  } else if (view.status === "playing") {
    content = <Battle view={view} onShoot={handleShoot} busy={busy} />;
  } else {
    const abandoned = view.abandonedBy != null && view.abandonedBy !== view.you;
    content = (
      <Result
        won={view.winner === view.you}
        abandoned={abandoned}
        onRematch={handleRematch}
        onLeave={handleLeave}
        busy={busy}
      />
    );
  }

  const active = view?.status === "playing" || view?.status === "placing";
  return (
    <div className="min-h-full flex flex-col">
      <TopBar code={code} active={active} onLeave={handleLeave} />
      <div className="flex-1">{content}</div>
    </div>
  );
}
