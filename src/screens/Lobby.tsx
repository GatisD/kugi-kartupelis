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
    <div className="min-h-full flex flex-col items-center justify-center gap-7 p-6 text-center animate-rise">
      <span className="font-display tracking-[0.35em] text-brass text-[0.7rem]">SPĒLES KODS</span>
      <div className="panel px-9 py-6">
        <div className="font-display text-5xl font-bold tracking-[0.28em] text-ink">{code}</div>
      </div>
      <button onClick={share} className="btn-brass px-6 py-4">
        {copied ? "Saite nokopēta" : "Dalīties ar saiti"}
      </button>
      <div className="flex items-center gap-2 text-foam/60 text-sm">
        <span className="float-buoy text-lg">⚓</span> Gaida otru spēlētāju…
      </div>
    </div>
  );
}
