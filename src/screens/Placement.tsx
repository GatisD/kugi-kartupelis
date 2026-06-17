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
    <div className="min-h-full flex flex-col gap-4 p-4 animate-rise">
      <h2 className="text-center font-display text-xl font-bold text-foam tracking-wide">Izvieto savu floti</h2>

      <Board cellState={cellState} onCell={handleCell} />

      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((r) => (
          <button
            key={r.size}
            disabled={r.count === 0}
            onClick={() => setSelectedSize(r.size)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition disabled:opacity-25 ${
              selectedSize === r.size ? "border-brass bg-brass/15" : "border-foam/15 bg-foam/5"
            }`}
          >
            <span className="flex gap-0.5">
              {Array.from({ length: r.size }).map((_, i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-[2px] bg-foam/85" />
              ))}
            </span>
            <span className="text-foam/75 text-xs font-semibold">×{r.count}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <button onClick={() => setOrientation((o) => (o === "h" ? "v" : "h"))} className="btn-ghost px-4 py-2 text-sm">
          Pagriezt {orientation === "h" ? "↔" : "↕"}
        </button>
        <button onClick={() => setShips(randomPlacement())} className="btn-ghost px-4 py-2 text-sm">
          Sajaukt
        </button>
        <button onClick={() => setShips([])} className="btn-ghost px-4 py-2 text-sm">
          Notīrīt
        </button>
      </div>

      <p className="text-center text-xs text-foam/45 max-w-sm mx-auto">
        Izvēlies kuģi un uzsit kartē, lai noliktu. Uzsit uz nolikta kuģa, lai paņemtu atpakaļ.
      </p>

      <button
        onClick={() => valid && onReady(ships)}
        disabled={!valid || busy}
        className="btn-brass mt-auto px-6 py-4 text-lg"
      >
        {busy ? "Sūta…" : "Gatavs!"}
      </button>
    </div>
  );
}
