import { Fragment } from "react";
import { COLUMNS } from "../game/constants";
import { Cell, type CellState } from "./Cell";

function Compass() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-70" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#6a4e16" strokeWidth="1" />
      <path d="M12 3 L13.6 12 L12 21 L10.4 12 Z" fill="#123a5a" />
      <path d="M3 12 L12 10.4 L21 12 L12 13.6 Z" fill="#9a7720" />
      <circle cx="12" cy="12" r="1.2" fill="#6a4e16" />
    </svg>
  );
}

export function Board({
  cellState,
  onCell,
}: {
  cellState: (row: number, col: number) => CellState;
  onCell?: (row: number, col: number) => void;
}) {
  const idx = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className="panel w-full max-w-[27rem] mx-auto p-3 sm:p-4">
      <div className="relative grid" style={{ gridTemplateColumns: "1.5rem repeat(10, 1fr)" }}>
        <div className="flex items-center justify-center">
          <Compass />
        </div>
        {idx.map((c) => (
          <div key={`h${c}`} className="tick text-center text-[0.72rem] leading-6">
            {COLUMNS[c]}
          </div>
        ))}
        {idx.map((r) => (
          <Fragment key={`r${r}`}>
            <div className="tick flex items-center justify-center text-[0.72rem]">{r + 1}</div>
            {idx.map((c) => (
              <Cell key={`${r}-${c}`} state={cellState(r, c)} onClick={onCell ? () => onCell(r, c) : undefined} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
