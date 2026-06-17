export function TopBar({
  code,
  active,
  onLeave,
}: {
  code: string;
  active: boolean;
  onLeave: () => void;
}) {
  function handle() {
    // Apstiprina tikai aktīvas spēles laikā, lai nejauši nepamestu
    if (active && !confirm("Pamest spēli?")) return;
    onLeave();
  }
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
      <span className="text-xs font-mono font-bold tracking-widest text-slate-400">{code}</span>
      <button
        onClick={handle}
        className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 active:scale-95 transition"
      >
        Pamest
      </button>
    </div>
  );
}
