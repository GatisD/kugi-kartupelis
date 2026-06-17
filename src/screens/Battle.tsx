import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "../components/Board";
import type { CellState } from "../components/Cell";
import { shipCells } from "../game/coords";
import type { PlayerView } from "../game/types";

export function Battle({
  view,
  onShoot,
  onTimeout,
  busy,
}: {
  view: PlayerView;
  onShoot: (cell: string) => void;
  onTimeout: () => void;
  busy: boolean;
}) {
  const myTurn = view.turn === view.you;

  const myShotMap = useMemo(() => new Map(view.myShots.map((s) => [s.cell, s.result])), [view.myShots]);
  const sunkOppCells = useMemo(() => {
    const set = new Set<string>();
    for (const s of view.sunkOpponentShips) for (const c of shipCells(s)) set.add(`${c.row},${c.col}`);
    return set;
  }, [view.sunkOpponentShips]);

  function targetState(row: number, col: number): CellState {
    const key = `${row},${col}`;
    if (sunkOppCells.has(key)) return "sunk";
    const r = myShotMap.get(key);
    if (r === "hit") return "hit";
    if (r === "miss") return "miss";
    return "empty";
  }

  const myShipCells = useMemo(() => {
    const set = new Set<string>();
    for (const s of view.myShips) for (const c of shipCells(s)) set.add(`${c.row},${c.col}`);
    return set;
  }, [view.myShips]);
  const sunkMyCells = useMemo(() => {
    const set = new Set<string>();
    for (const s of view.myShips) {
      if (s.hits.every(Boolean)) for (const c of shipCells(s)) set.add(`${c.row},${c.col}`);
    }
    return set;
  }, [view.myShips]);
  const incoming = useMemo(() => new Set(view.incomingShots), [view.incomingShots]);

  function ownState(row: number, col: number): CellState {
    const key = `${row},${col}`;
    const isShip = myShipCells.has(key);
    const wasShot = incoming.has(key);
    if (isShip && sunkMyCells.has(key)) return "sunk";
    if (isShip && wasShot) return "hit";
    if (isShip) return "ship";
    if (wasShot) return "miss";
    return "empty";
  }

  // Screenshake: skaita redzamos trāpījumus + nogremdētos kuģus, trīc, kad pieaug
  const hitCount = useMemo(() => {
    let n = 0;
    for (const s of view.myShots) if (s.result === "hit") n++;
    for (const cell of incoming) if (myShipCells.has(cell)) n++;
    return n;
  }, [view.myShots, incoming, myShipCells]);
  const sunkCount = view.sunkOpponentShips.length + sunkMyCells.size;

  const prevHits = useRef(hitCount);
  const prevSunk = useRef(sunkCount);
  const [shakeClass, setShakeClass] = useState("");
  useEffect(() => {
    let cls = "";
    if (sunkCount > prevSunk.current) cls = "shake-strong";
    else if (hitCount > prevHits.current) cls = "shake";
    prevHits.current = hitCount;
    prevSunk.current = sunkCount;
    if (cls) {
      setShakeClass(cls);
      const t = setTimeout(() => setShakeClass(""), 560);
      return () => clearTimeout(t);
    }
  }, [hitCount, sunkCount]);

  // Gājiena taimeris: atpakaļskaitīšana + automātiska gājiena nodošana, kad beidzas
  const [secLeft, setSecLeft] = useState<number | null>(null);
  const timeoutReq = useRef(false);
  useEffect(() => {
    timeoutReq.current = false;
  }, [view.turn, view.turnDeadline]);
  useEffect(() => {
    if (view.status !== "playing" || view.turnDeadline == null) {
      setSecLeft(null);
      return;
    }
    const deadline = view.turnDeadline;
    const tick = () => {
      const ms = deadline - Date.now();
      setSecLeft(Math.max(0, Math.ceil(ms / 1000)));
      const grace = myTurn ? 0 : -2000; // gaidītājs dod 2s buferi (ja pretinieks pazudis)
      if (ms <= grace && !timeoutReq.current) {
        timeoutReq.current = true;
        onTimeout();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [view.status, view.turnDeadline, myTurn, onTimeout]);

  function handleTarget(row: number, col: number) {
    if (!myTurn || busy) return;
    const key = `${row},${col}`;
    if (myShotMap.has(key)) return;
    onShoot(key);
  }

  return (
    <div className={`min-h-full flex flex-col gap-4 p-4 animate-rise ${shakeClass}`}>
      <div
        key={myTurn ? "me" : "opp"}
        className={`animate-turn text-center rounded-xl py-2.5 font-display tracking-wide border ${
          myTurn ? "bg-brass/15 border-brass/50 text-brass-2 pulse-ring" : "bg-foam/5 border-foam/10 text-foam/50"
        }`}
      >
        {myTurn ? "Tavs gājiens - šauj!" : "Gaida pretinieka gājienu…"}
        {secLeft != null && <span className={secLeft <= 10 ? "text-hit-2" : ""}> · {secLeft}s</span>}
      </div>

      <div>
        <div className="text-center font-display text-xs tracking-[0.25em] text-foam/55 mb-1.5">PRETINIEKA ŪDEŅI</div>
        <Board cellState={targetState} onCell={myTurn && !busy ? handleTarget : undefined} />
      </div>

      <div>
        <div className="text-center font-display text-xs tracking-[0.25em] text-foam/55 mb-1.5">TAVA FLOTE</div>
        <Board cellState={ownState} />
      </div>
    </div>
  );
}
