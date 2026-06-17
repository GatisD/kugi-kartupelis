export function Result({ won, onRematch, busy }: { won: boolean; onRematch: () => void; busy: boolean }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">{won ? "🏆" : "🥔"}</div>
      <h2 className="text-3xl font-extrabold text-slate-800">{won ? "Tu uzvarēji!" : "Šoreiz zaudēji"}</h2>
      <button
        onClick={onRematch}
        disabled={busy}
        className="rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-white disabled:opacity-40 active:scale-95 transition"
      >
        {busy ? "…" : "Spēlēt vēlreiz"}
      </button>
    </div>
  );
}
