import { useMemo } from "react";
import { Board } from "../components/Board";
import type { CellState } from "../components/Cell";
import { shipCells } from "../game/coords";
import type { PlayerView } from "../game/types";

export function Battle({
  view,
  onShoot,
  busy,
}: {
  view: PlayerView;
  onShoot: (cell: string) => void;
  busy: boolean;
}) {
  const myTurn = view.turn === view.you;

  // Pretinieka lauks (mērķis)
  const myShotMap = useMemo(() => new Map(view.myShots.map((s) => [s.cell, s.result])), [view.myShots]);
  const sunkOppCells = useMemo(() => {
    const set = new Set<string>();
    for (const s of view.sunkOpponentShips) for (const c of shipCells(s)) set.add(`${c.row},${c.col}`);
    return set;
  }, [view.sunkOpponentShips]);

  function targetState(row: number, col: number): CellState {
    const key = `${row},${col}`;
    if (sunkOppCells.has(key)) return "sunk";
    const r = myShotMap.get(key);
    if (r === "hit") return "hit";
    if (r === "miss") return "miss";
    return "empty";
  }

  // Mans lauks
  const myShipCells = useMemo(() => {
    const set = new Set<string>();
    for (const s of view.myShips) for (const c of shipCells(s)) set.add(`${c.row},${c.col}`);
    return set;
  }, [view.myShips]);
  const sunkMyCells = useMemo(() => {
    const set = new Set<string>();
    for (const s of view.myShips) {
      if (s.hits.every(Boolean)) for (const c of shipCells(s)) set.add(`${c.row},${c.col}`);
    }
    return set;
  }, [view.myShips]);
  const incoming = useMemo(() => new Set(view.incomingShots), [view.incomingShots]);

  function ownState(row: number, col: number): CellState {
    const key = `${row},${col}`;
    const isShip = myShipCells.has(key);
    const wasShot = incoming.has(key);
    if (isShip && sunkMyCells.has(key)) return "sunk";
    if (isShip && wasShot) return "hit";
    if (isShip) return "ship";
    if (wasShot) return "miss";
    return "empty";
  }

  function handleTarget(row: number, col: number) {
    if (!myTurn || busy) return;
    const key = `${row},${col}`;
    if (myShotMap.has(key)) return;
    onShoot(key);
  }

  return (
    <div className="min-h-full flex flex-col gap-3 p-4">
      <div
        className={`text-center rounded-xl py-2 font-bold ${
          myTurn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {myTurn ? "Tavs gājiens - šauj!" : "Gaida pretinieka gājienu…"}
      </div>

      <div>
        <div className="text-center text-sm font-semibold text-slate-500 mb-1">Pretinieka lauks</div>
        <Board cellState={targetState} onCell={myTurn && !busy ? handleTarget : undefined} />
      </div>

      <div>
        <div className="text-center text-sm font-semibold text-slate-500 mb-1">Tavs lauks</div>
        <Board cellState={ownState} />
      </div>
    </div>
  );
}
