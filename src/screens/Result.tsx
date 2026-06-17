export function Result({
  won,
  abandoned,
  onRematch,
  onLeave,
  busy,
}: {
  won: boolean;
  abandoned: boolean;
  onRematch: () => void;
  onLeave: () => void;
  busy: boolean;
}) {
  if (abandoned) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-6xl">🚪</div>
        <h2 className="text-2xl font-extrabold text-slate-800">Pretinieks pameta spēli</h2>
        <button
          onClick={onLeave}
          disabled={busy}
          className="rounded-2xl bg-sky-500 px-6 py-4 text-lg font-bold text-white disabled:opacity-40 active:scale-95 transition"
        >
          Uz sākumu
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">{won ? "🏆" : "🥔"}</div>
      <h2 className="text-3xl font-extrabold text-slate-800">{won ? "Tu uzvarēji!" : "Šoreiz zaudēji"}</h2>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onRematch}
          disabled={busy}
          className="rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-white disabled:opacity-40 active:scale-95 transition"
        >
          {busy ? "…" : "Spēlēt vēlreiz"}
        </button>
        <button
          onClick={onLeave}
          disabled={busy}
          className="rounded-2xl bg-slate-200 px-6 py-3 font-bold text-slate-600 active:scale-95 transition"
        >
          Uz sākumu
        </button>
      </div>
    </div>
  );
}
