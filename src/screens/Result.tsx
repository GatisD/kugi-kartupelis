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
      <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center animate-rise">
        <div className="text-6xl animate-sway">⚓</div>
        <h2 className="font-display text-3xl font-bold text-foam">Pretinieks pameta spēli</h2>
        <button onClick={onLeave} disabled={busy} className="btn-brass px-6 py-4">
          Uz sākumu
        </button>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center animate-rise">
      {won && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 rounded-full bg-brass/30"
              style={{
                left: `${8 + i * 10}%`,
                width: `${8 + (i % 3) * 7}px`,
                height: `${8 + (i % 3) * 7}px`,
                animation: `bubble ${2.6 + (i % 4) * 0.5}s ease-in ${i * 0.28}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      <div className={`text-7xl ${won ? "animate-sway" : ""}`}>{won ? "🏆" : "🌊"}</div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-display text-4xl font-bold text-foam">{won ? "Uzvara!" : "Nogrimi"}</h2>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-brass to-transparent" />
        <p className="text-foam/60 text-sm">
          {won ? "Visa pretinieka flote jūras dibenā." : "Tava flote ir nogremdēta."}
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={onRematch} disabled={busy} className="btn-brass px-6 py-4 text-lg">
          {busy ? "…" : "Spēlēt vēlreiz"}
        </button>
        <button onClick={onLeave} disabled={busy} className="btn-ghost px-6 py-3">
          Uz sākumu
        </button>
      </div>
    </div>
  );
}
