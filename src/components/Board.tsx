import { Fragment } from "react";
import { COLUMNS } from "../game/constants";
import { Cell, type CellState } from "./Cell";

export function Board({
  cellState,
  onCell,
}: {
  cellState: (row: number, col: number) => CellState;
  onCell?: (row: number, col: number) => void;
}) {
  const idx = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className="select-none w-full max-w-[26rem] mx-auto">
      <div className="grid" style={{ gridTemplateColumns: `1.4rem repeat(10, 1fr)` }}>
        <div />
        {idx.map((c) => (
          <div key={`h${c}`} className="text-center text-[0.7rem] font-bold leading-5">
            {COLUMNS[c]}
          </div>
        ))}
        {idx.map((r) => (
          <Fragment key={`r${r}`}>
            <div className="flex items-center justify-center text-[0.7rem] font-bold">{r + 1}</div>
            {idx.map((c) => (
              <Cell key={`${r}-${c}`} state={cellState(r, c)} onClick={onCell ? () => onCell(r, c) : undefined} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
