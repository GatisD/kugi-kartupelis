export type CellState = "empty" | "ship" | "hit" | "miss" | "sunk" | "preview" | "invalid";

export function Cell({ state, onClick }: { state: CellState; onClick?: () => void }) {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`relative aspect-square w-full border border-[#1c3e5a]/15 flex items-center justify-center ${
        interactive ? "cursor-pointer hover:bg-[#1c3e5a]/10 active:bg-[#1c3e5a]/20" : "cursor-default"
      }`}
    >
      {state === "ship" && (
        <span className="absolute inset-0 bg-navy shadow-[inset_0_2px_0_rgba(230,198,107,0.45)]" />
      )}
      {state === "preview" && <span className="absolute inset-0 bg-navy/45" />}
      {state === "invalid" && <span className="absolute inset-0 bg-hit/40" />}
      {state === "miss" && <span className="animate-splash h-1.5 w-1.5 rounded-full bg-[#1c3e5a]/55" />}
      {(state === "hit" || state === "sunk") && (
        <span
          className={`animate-impact absolute inset-0 flex items-center justify-center ${
            state === "sunk" ? "bg-sunk" : "bg-hit"
          }`}
        >
          <span className="text-foam text-[0.62rem] font-bold leading-none">✕</span>
        </span>
      )}
    </button>
  );
}
