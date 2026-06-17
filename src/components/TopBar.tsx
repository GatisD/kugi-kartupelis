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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-brass/20 bg-abyss/40 backdrop-blur-sm">
      <span className="font-display tracking-[0.32em] text-brass/80 text-xs">{code}</span>
      <button onClick={handle} className="btn-ghost px-3 py-1.5 text-xs">
        Pamest
      </button>
    </div>
  );
}
