import { useState } from "react";

export function Lobby({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/?kods=${code}`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kuģi", text: `Pievienojies spēlei! Kods: ${code}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* lietotājs atcēla dalīšanos - nav kļūda */
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center">
      <h2 className="text-xl font-bold text-slate-700">Spēles kods</h2>
      <div className="text-5xl font-extrabold font-mono tracking-[0.3em] text-slate-900">{code}</div>
      <button
        onClick={share}
        className="rounded-2xl bg-sky-500 px-6 py-4 font-bold text-white active:scale-95 transition"
      >
        {copied ? "Saite nokopēta!" : "Dalīties ar saiti"}
      </button>
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />
        Gaida otru spēlētāju…
      </div>
    </div>
  );
}
