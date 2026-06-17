import { useState } from "react";

export function Home({
  onCreate,
  onJoin,
  error,
}: {
  onCreate: () => void;
  onJoin: (code: string) => void;
  error: string | null;
}) {
  const [code, setCode] = useState("");
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-8 p-6 text-center animate-rise">
      <div className="flex flex-col items-center gap-3">
        <span className="font-display tracking-[0.4em] text-brass text-[0.7rem]">K A R T U P E L I S</span>
        <h1 className="font-display text-6xl font-bold text-foam leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          Kuģi
        </h1>
        <div className="h-px w-28 bg-gradient-to-r from-transparent via-brass to-transparent" />
        <p className="text-foam/70 text-sm max-w-[17rem]">
          Divi spēlētāji, divi telefoni, viena jūra. Nogremdē pretinieka floti pirmais.
        </p>
      </div>

      <button onClick={onCreate} className="btn-brass w-full max-w-xs px-6 py-4 text-lg">
        Izveidot spēli
      </button>

      <div className="w-full max-w-xs">
        <div className="flex items-center gap-3 text-foam/40 text-xs mb-3">
          <span className="h-px flex-1 bg-foam/15" /> vai pievienojies <span className="h-px flex-1 bg-foam/15" />
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="KODS"
          inputMode="text"
          className="w-full rounded-xl bg-foam/5 border border-brass/30 px-4 py-4 text-center text-2xl font-display tracking-[0.4em] text-foam uppercase placeholder:text-foam/25 outline-none focus:border-brass/70 transition-colors"
        />
        <button
          onClick={() => code.length === 4 && onJoin(code)}
          disabled={code.length !== 4}
          className="btn-ghost w-full mt-2 px-5 py-3.5"
        >
          Pievienoties
        </button>
      </div>

      {error && <div className="text-hit-2 text-sm">{error}</div>}
    </div>
  );
}
