import { useMemo, useState } from "react";
import { Board } from "../components/Board";
import type { CellState } from "../components/Cell";
import { FLEET } from "../game/constants";
import { canPlace, randomPlacement, validatePlacement } from "../game/logic";
import { shipCells } from "../game/coords";
import type { Orientation, Ship } from "../game/types";

function countBySize(ships: Ship[]): Record<number, number> {
  const m: Record<number, number> = {};
  for (const s of ships) m[s.size] = (m[s.size] ?? 0) + 1;
  return m;
}

export function Placement({ onReady, busy }: { onReady: (ships: Ship[]) => void; busy: boolean }) {
  const [ships, setShips] = useState<Ship[]>(() => randomPlacement());
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("h");

  const placed = countBySize(ships);
  const remaining = FLEET.map((f) => ({ size: f.size, count: f.count - (placed[f.size] ?? 0) }));
  const allPlaced = remaining.every((r) => r.count === 0);
  const valid = allPlaced && validatePlacement(ships).ok;

  const shipCellSet = useMemo(() => {
    const s = new Set<string>();
    for (const ship of ships) for (const c of shipCells(ship)) s.add(`${c.row},${c.col}`);
    return s;
  }, [ships]);

  function cellState(row: number, col: number): CellState {
    return shipCellSet.has(`${row},${col}`) ? "ship" : "empty";
  }

  function handleCell(row: number, col: number) {
    const hit = ships.find((s) => shipCells(s).some((c) => c.row === row && c.col === col));
    if (hit) {
      setShips(ships.filter((s) => s !== hit));
      setSelectedSize(hit.size);
      return;
    }
    if (selectedSize == null) return;
    const candidate: Ship = { size: selectedSize, row, col, orientation, hits: new Array(selectedSize).fill(false) };
    if (canPlace(ships, candidate)) {
      const next = [...ships, candidate];
      setShips(next);
      const left = (remaining.find((r) => r.size === selectedSize)?.count ?? 0) - 1;
      if (left <= 0) setSelectedSize(null);
    }
  }

  return (
    <div className="min-h-full flex flex-col gap-4 p-4">
      <h2 className="text-center text-lg font-bold text-slate-700">Izvieto savus kuģus</h2>

      <Board cellState={cellState} onCell={handleCell} />

      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((r) => (
          <button
            key={r.size}
            disabled={r.count === 0}
            onClick={() => setSelectedSize(r.size)}
            className={`rounded-xl px-3 py-2 text-sm font-bold border-2 transition ${
              selectedSize === r.size ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
            } disabled:opacity-30`}
          >
            {r.size}-rūšu × {r.count}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setOrientation((o) => (o === "h" ? "v" : "h"))}
          className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold"
        >
          Pagriezt: {orientation === "h" ? "↔" : "↕"}
        </button>
        <button onClick={() => setShips(randomPlacement())} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold">
          Sajaukt
        </button>
        <button onClick={() => setShips([])} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold">
          Notīrīt
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Izvēlies kuģi un uzsit laukā, lai noliktu. Uzsit uz nolikta kuģa, lai paņemtu atpakaļ.
      </p>

      <button
        onClick={() => valid && onReady(ships)}
        disabled={!valid || busy}
        className="mt-auto rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-white disabled:opacity-40 active:scale-95 transition"
      >
        {busy ? "Sūta…" : "Gatavs!"}
      </button>
    </div>
  );
}
