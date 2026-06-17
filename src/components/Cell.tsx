export type CellState = "empty" | "ship" | "hit" | "miss" | "sunk" | "preview" | "invalid";

const STYLES: Record<CellState, string> = {
  empty: "bg-sky-50",
  ship: "bg-slate-600",
  hit: "bg-red-500",
  miss: "bg-sky-200",
  sunk: "bg-red-800",
  preview: "bg-emerald-400",
  invalid: "bg-rose-300",
};

export function Cell({ state, onClick }: { state: CellState; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`aspect-square w-full border border-sky-300 ${STYLES[state]} ${
        onClick ? "active:opacity-70" : "cursor-default"
      } flex items-center justify-center`}
    >
      {state === "miss" ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> : null}
      {state === "hit" || state === "sunk" ? <span className="text-white text-xs font-bold">✕</span> : null}
    </button>
  );
}
