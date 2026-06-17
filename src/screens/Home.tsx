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
    <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Kuģi 🥔</h1>
      <p className="text-slate-500 text-center">Spēlē ar otru cilvēku - katrs no sava telefona.</p>

      <button
        onClick={onCreate}
        className="w-full max-w-xs rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-white active:scale-95 transition"
      >
        Izveidot spēli
      </button>

      <div className="w-full max-w-xs flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="KODS"
          className="flex-1 rounded-2xl border border-slate-300 px-4 py-4 text-center text-lg font-mono tracking-widest uppercase"
        />
        <button
          onClick={() => code.length === 4 && onJoin(code)}
          disabled={code.length !== 4}
          className="rounded-2xl bg-sky-500 px-5 py-4 font-bold text-white disabled:opacity-40 active:scale-95 transition"
        >
          Pievienoties
        </button>
      </div>

      {error && <div className="text-rose-600 text-sm">{error}</div>}
    </div>
  );
}
