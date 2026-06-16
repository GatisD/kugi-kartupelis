# Spēle "Kuģi - KARTUPELIS" - implementācijas plāns

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Online, turn-based "Kuģi" (Battleship) spēle ar KARTUPELIS režģi, ko divi cilvēki spēlē katrs no sava telefona, hostēts uz Vercel.

**Architecture:** Vite + React SPA statiski uz Vercel; Vercel serverless funkcijas `/api`; spēles stāvoklis Upstash Redis (server-authoritative - šāvienus izšķir serveris, pretinieka kuģus klientam nesūta); klienta polling sinhronizācijai.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v4, Vitest, @upstash/redis, @vercel/node, Vercel hosting.

> **Commit konvencija šim repo:** autors ir Gatis Daugavietis <gatis.design@gmail.com> (jau iestatīts `git config`). NEPIEVIENO "Co-Authored-By: Claude" trailer - Vercel bloķē Claude commitus. Commit ziņojumi latviski.

> **Specifikācija:** `docs/superpowers/specs/2026-06-16-kugi-kartupelis-design.md`

---

## Faila struktūra (decompozīcija)

Koplietotā tīrā logika (importē gan klients, gan `/api`):
- `src/game/constants.ts` - GRID_SIZE, COLUMNS (KARTUPELIS), FLEET
- `src/game/types.ts` - visi tipi
- `src/game/coords.ts` - rūts/koordinātu palīgfunkcijas
- `src/game/logic.ts` - izvietošana, validācija, šāviena izšķiršana (tīras funkcijas)

Serveris (`/api`, Vercel Node funkcijas):
- `api/_http.ts` - ApiError + kļūdu sūtīšana
- `api/_store.ts` - Redis, koda ģenerēšana, atomic update, filtrēšana (redactFor)
- `api/create.ts`, `api/join.ts`, `api/place.ts`, `api/shoot.ts`, `api/state.ts`, `api/rematch.ts`

Klients:
- `src/playerId.ts` - anonīms playerId localStorage
- `src/api.ts` - fetch wrapperi
- `src/useGameState.ts` - polling hook
- `src/components/Cell.tsx`, `src/components/Board.tsx`
- `src/screens/Home.tsx`, `Lobby.tsx`, `Placement.tsx`, `Battle.tsx`, `Result.tsx`
- `src/App.tsx`, `src/main.tsx`, `src/index.css`

Konfigurācija:
- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`

---

## Task 1: Projekta scaffold un konfigurācija

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/index.css`, `src/App.tsx`

- [ ] **Step 1: Izveido `package.json`**

```json
{
  "name": "kugi-kartupelis",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@upstash/redis": "^1.34.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.14.0",
    "@vercel/node": "^3.2.0",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.2",
    "vite": "^5.4.6",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Izveido `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src", "api"]
}
```

- [ ] **Step 3: Izveido `vite.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Izveido `index.html`**

```html
<!doctype html>
<html lang="lv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Kuģi - KARTUPELIS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Izveido `src/index.css`**

```css
@import "tailwindcss";

html, body, #root { height: 100%; }
body { margin: 0; -webkit-tap-highlight-color: transparent; background: #f1f5f9; }
```

- [ ] **Step 6: Izveido `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Izveido pagaidu `src/App.tsx`**

```tsx
export default function App() {
  return <div className="p-6 text-2xl font-bold">Kuģi - KARTUPELIS</div>;
}
```

- [ ] **Step 8: Instalē atkarības**

Run: `cd ~/kugi-kartupelis && npm install`
Expected: instalē bez kļūdām, izveido `node_modules` un `package-lock.json`.

- [ ] **Step 9: Pārbaudi dev serveri**

Run: `cd ~/kugi-kartupelis && npm run dev`
Expected: Vite startē uz http://localhost:5173, lapā redzams "Kuģi - KARTUPELIS". Apstādini ar Ctrl+C.

- [ ] **Step 10: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Projekta scaffold: Vite + React + TS + Tailwind"
```

---

## Task 2: Konstantes, tipi un koordinātas (TDD)

**Files:**
- Create: `src/game/constants.ts`, `src/game/types.ts`, `src/game/coords.ts`
- Test: `src/game/coords.test.ts`

- [ ] **Step 1: Izveido `src/game/constants.ts`**

```ts
export const GRID_SIZE = 10;

// KARTUPELIS - 10 unikāli burti kolonnām (kreisā -> labā)
export const COLUMNS = "KARTUPELIS".split("");

// Flote: kuģa izmērs -> skaits. Kopā 20 rūtis, 10 kuģi.
export const FLEET: { size: number; count: number }[] = [
  { size: 4, count: 1 },
  { size: 3, count: 2 },
  { size: 2, count: 3 },
  { size: 1, count: 4 },
];

export const TOTAL_SHIPS = 10;
export const TOTAL_SHIP_CELLS = 20;
```

- [ ] **Step 2: Izveido `src/game/types.ts`**

```ts
export type Orientation = "h" | "v";
export type Status = "waiting" | "placing" | "playing" | "finished";
export type PlayerSlot = 1 | 2;

export interface Ship {
  size: number;
  row: number; // 0..9, augšējā/kreisā rūts
  col: number; // 0..9
  orientation: Orientation;
  hits: boolean[]; // garums === size
}

export interface PlayerState {
  id: string;
  ready: boolean;
  ships: Ship[];
  shotsAt: string[]; // "r,c" rūtis, kur ŠIS spēlētājs šāvis pret pretinieku
}

export interface GameState {
  code: string;
  status: Status;
  createdAt: number;
  turn: PlayerSlot;
  winner: PlayerSlot | null;
  players: { 1: PlayerState | null; 2: PlayerState | null };
}

export interface ShotResult {
  cell: string;
  result: "hit" | "miss";
}

export interface PlayerView {
  code: string;
  status: Status;
  you: PlayerSlot;
  turn: PlayerSlot;
  winner: PlayerSlot | null;
  opponentJoined: boolean;
  opponentReady: boolean;
  youReady: boolean;
  myShips: Ship[];
  incomingShots: string[]; // pretinieka šāvieni manā laukā
  myShots: ShotResult[]; // mani šāvieni ar rezultātu
  sunkOpponentShips: Ship[]; // tikai nogremdētie pretinieka kuģi
}
```

- [ ] **Step 3: Uzraksti krītošu testu `src/game/coords.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { cellKey, parseCell, inBounds, colLabel, rowLabel, shipCells } from "./coords";

describe("coords", () => {
  it("cellKey un parseCell ir apgriežami", () => {
    expect(cellKey(3, 7)).toBe("3,7");
    expect(parseCell("3,7")).toEqual({ row: 3, col: 7 });
  });

  it("inBounds atpazīst lauka robežas", () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(9, 9)).toBe(true);
    expect(inBounds(-1, 0)).toBe(false);
    expect(inBounds(10, 0)).toBe(false);
    expect(inBounds(0, 10)).toBe(false);
  });

  it("colLabel kartē KARTUPELIS, rowLabel ir 1-bāzes", () => {
    expect(colLabel(0)).toBe("K");
    expect(colLabel(9)).toBe("S");
    expect(rowLabel(0)).toBe("1");
    expect(rowLabel(9)).toBe("10");
  });

  it("shipCells atgriež rūtis horizontāli un vertikāli", () => {
    expect(shipCells({ size: 3, row: 2, col: 4, orientation: "h", hits: [false, false, false] }))
      .toEqual([{ row: 2, col: 4 }, { row: 2, col: 5 }, { row: 2, col: 6 }]);
    expect(shipCells({ size: 2, row: 5, col: 1, orientation: "v", hits: [false, false] }))
      .toEqual([{ row: 5, col: 1 }, { row: 6, col: 1 }]);
  });
});
```

- [ ] **Step 4: Palaiž testu - jākrīt**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: FAIL - "Cannot find module './coords'".

- [ ] **Step 5: Izveido `src/game/coords.ts`**

```ts
import { GRID_SIZE, COLUMNS } from "./constants";
import type { Ship } from "./types";

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCell(key: string): { row: number; col: number } {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function colLabel(col: number): string {
  return COLUMNS[col];
}

export function rowLabel(row: number): string {
  return String(row + 1);
}

export function shipCells(ship: Ship): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < ship.size; i++) {
    const row = ship.orientation === "v" ? ship.row + i : ship.row;
    const col = ship.orientation === "h" ? ship.col + i : ship.col;
    cells.push({ row, col });
  }
  return cells;
}
```

- [ ] **Step 6: Palaiž testu - jāiztur**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: PASS (4 testi).

- [ ] **Step 7: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Konstantes, tipi un koordinātu palīgfunkcijas ar testiem"
```

---

## Task 3: Izvietošanas logika (TDD)

**Files:**
- Create: `src/game/logic.ts`
- Test: `src/game/logic.placement.test.ts`

- [ ] **Step 1: Uzraksti krītošu testu `src/game/logic.placement.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { validatePlacement, canPlace, randomPlacement } from "./logic";
import type { Ship } from "./types";

function ship(size: number, row: number, col: number, orientation: "h" | "v"): Ship {
  return { size, row, col, orientation, hits: new Array(size).fill(false) };
}

// Derīga flote: 1x4, 2x3, 3x2, 4x1, neviens nesaskaras
function validFleet(): Ship[] {
  return [
    ship(4, 0, 0, "h"),                 // (0,0)-(0,3)
    ship(3, 0, 5, "h"), ship(3, 2, 0, "h"),
    ship(2, 4, 0, "h"), ship(2, 4, 3, "h"), ship(2, 4, 6, "h"),
    ship(1, 6, 0, "h"), ship(1, 6, 2, "h"), ship(1, 6, 4, "h"), ship(1, 6, 6, "h"),
  ];
}

describe("validatePlacement", () => {
  it("pieņem derīgu floti", () => {
    expect(validatePlacement(validFleet())).toEqual({ ok: true });
  });

  it("noraida nepareizu kuģu skaitu", () => {
    const fleet = validFleet().slice(0, 9);
    expect(validatePlacement(fleet).ok).toBe(false);
  });

  it("noraida kuģi ārpus lauka", () => {
    const fleet = validFleet();
    fleet[0] = ship(4, 0, 8, "h"); // (0,8)-(0,11) ārpus
    expect(validatePlacement(fleet).ok).toBe(false);
  });

  it("noraida kuģus, kas saskaras pa malu", () => {
    const fleet = validFleet();
    fleet[1] = ship(3, 0, 4, "h"); // (0,4) blakus 4-niekam, kas beidzas (0,3)
    expect(validatePlacement(fleet).ok).toBe(false);
  });

  it("noraida kuģus, kas saskaras pa diagonāli", () => {
    const fleet = validFleet();
    fleet[1] = ship(3, 1, 4, "h"); // (1,4) ir diagonāli no (0,3)
    expect(validatePlacement(fleet).ok).toBe(false);
  });
});

describe("canPlace", () => {
  it("atļauj brīvā vietā", () => {
    expect(canPlace([ship(4, 0, 0, "h")], ship(2, 2, 0, "h"))).toBe(true);
  });
  it("aizliedz blakus esošu (mala)", () => {
    expect(canPlace([ship(4, 0, 0, "h")], ship(2, 1, 0, "h"))).toBe(false);
  });
  it("aizliedz ārpus lauka", () => {
    expect(canPlace([], ship(3, 9, 9, "h"))).toBe(false);
  });
});

describe("randomPlacement", () => {
  it("vienmēr atgriež derīgu floti (50 reizes)", () => {
    for (let i = 0; i < 50; i++) {
      expect(validatePlacement(randomPlacement())).toEqual({ ok: true });
    }
  });
});
```

- [ ] **Step 2: Palaiž testu - jākrīt**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: FAIL - "Cannot find module './logic'".

- [ ] **Step 3: Izveido `src/game/logic.ts` ar izvietošanas funkcijām**

```ts
import { GRID_SIZE, FLEET, TOTAL_SHIPS } from "./constants";
import { cellKey, inBounds, shipCells } from "./coords";
import type { Ship, Orientation } from "./types";

function neighborhood(row: number, col: number): string[] {
  const cells: string[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) cells.push(cellKey(row + dr, col + dc));
  return cells;
}

export function validatePlacement(ships: Ship[]): { ok: boolean; reason?: string } {
  if (ships.length !== TOTAL_SHIPS) return { ok: false, reason: "Nepareizs kuģu skaits" };

  const counts = new Map<number, number>();
  for (const s of ships) counts.set(s.size, (counts.get(s.size) ?? 0) + 1);
  for (const { size, count } of FLEET) {
    if ((counts.get(size) ?? 0) !== count) {
      return { ok: false, reason: `Nepareizs ${size}-rūšu kuģu skaits` };
    }
  }

  const forbidden = new Set<string>(); // noliktās rūtis + to 8-kaimiņu zona
  for (const ship of ships) {
    const cells = shipCells(ship);
    for (const { row, col } of cells) {
      if (!inBounds(row, col)) return { ok: false, reason: "Kuģis ārpus lauka" };
      if (forbidden.has(cellKey(row, col))) {
        return { ok: false, reason: "Kuģi saskaras vai pārklājas" };
      }
    }
    for (const { row, col } of cells) {
      for (const k of neighborhood(row, col)) forbidden.add(k);
    }
  }
  return { ok: true };
}

export function canPlace(placed: Ship[], candidate: Ship): boolean {
  const cells = shipCells(candidate);
  if (cells.some((c) => !inBounds(c.row, c.col))) return false;
  const forbidden = new Set<string>();
  for (const s of placed)
    for (const c of shipCells(s))
      for (const k of neighborhood(c.row, c.col)) forbidden.add(k);
  return !cells.some((c) => forbidden.has(cellKey(c.row, c.col)));
}

function randInt(maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

export function randomPlacement(): Ship[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const ships: Ship[] = [];
    let ok = true;
    for (const { size, count } of FLEET) {
      for (let n = 0; n < count; n++) {
        const ship = tryPlaceOne(size, ships);
        if (!ship) { ok = false; break; }
        ships.push(ship);
      }
      if (!ok) break;
    }
    if (ok && ships.length === TOTAL_SHIPS) return ships;
  }
  throw new Error("Neizdevās izvietot floti");
}

function tryPlaceOne(size: number, placed: Ship[]): Ship | null {
  for (let t = 0; t < 300; t++) {
    const orientation: Orientation = Math.random() < 0.5 ? "h" : "v";
    const maxRow = orientation === "v" ? GRID_SIZE - size : GRID_SIZE - 1;
    const maxCol = orientation === "h" ? GRID_SIZE - size : GRID_SIZE - 1;
    const candidate: Ship = {
      size,
      row: randInt(maxRow),
      col: randInt(maxCol),
      orientation,
      hits: new Array(size).fill(false),
    };
    if (canPlace(placed, candidate)) return candidate;
  }
  return null;
}
```

- [ ] **Step 4: Palaiž testu - jāiztur**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: PASS (visi izvietošanas testi).

- [ ] **Step 5: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Izvietošanas logika: validācija, canPlace, randomPlacement"
```

---

## Task 4: Kaujas logika (TDD)

**Files:**
- Modify: `src/game/logic.ts` (pievieno funkcijas)
- Test: `src/game/logic.combat.test.ts`

- [ ] **Step 1: Uzraksti krītošu testu `src/game/logic.combat.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { applyShot, surroundingCells, isShipSunk, cellHitsAnyShip } from "./logic";
import type { Ship } from "./types";

function ship(size: number, row: number, col: number, orientation: "h" | "v"): Ship {
  return { size, row, col, orientation, hits: new Array(size).fill(false) };
}

describe("isShipSunk", () => {
  it("nogremdēts, kad visas rūtis trāpītas", () => {
    expect(isShipSunk({ ...ship(2, 0, 0, "h"), hits: [true, true] })).toBe(true);
    expect(isShipSunk({ ...ship(2, 0, 0, "h"), hits: [true, false] })).toBe(false);
  });
});

describe("cellHitsAnyShip", () => {
  it("atpazīst kuģa rūti", () => {
    const ships = [ship(3, 1, 1, "h")];
    expect(cellHitsAnyShip(ships, "1,2")).toBe(true);
    expect(cellHitsAnyShip(ships, "0,0")).toBe(false);
  });
});

describe("surroundingCells", () => {
  it("atgriež 8-kaimiņu zonu lauka robežās, bez paša kuģa rūtīm", () => {
    const cells = surroundingCells(ship(1, 0, 0, "h")); // stūris
    expect(cells.sort()).toEqual(["0,1", "1,0", "1,1"].sort());
  });
});

describe("applyShot", () => {
  it("garām, kad nav kuģa", () => {
    const r = applyShot([ship(2, 5, 5, "h")], [], "0,0");
    expect(r.result).toBe("miss");
    expect(r.shotsAt).toContain("0,0");
    expect(r.sunkShip).toBeNull();
    expect(r.allSunk).toBe(false);
  });

  it("trāpījums atzīmē kuģa rūti", () => {
    const r = applyShot([ship(2, 5, 5, "h")], [], "5,5");
    expect(r.result).toBe("hit");
    expect(r.ships[0].hits).toEqual([true, false]);
    expect(r.sunkShip).toBeNull();
  });

  it("nogremdēšana atklāj apkārtni kā šāvienus", () => {
    const ships = [{ ...ship(1, 4, 4, "h"), hits: [false] }];
    const r = applyShot(ships, [], "4,4");
    expect(r.result).toBe("hit");
    expect(r.sunkShip).not.toBeNull();
    // apkārtējās 8 rūtis pievienotas shotsAt
    for (const c of ["3,3", "3,4", "3,5", "4,3", "4,5", "5,3", "5,4", "5,5"]) {
      expect(r.shotsAt).toContain(c);
    }
  });

  it("allSunk, kad visi kuģi nogremdēti", () => {
    const ships = [{ ...ship(1, 0, 0, "h"), hits: [false] }];
    const r = applyShot(ships, [], "0,0");
    expect(r.allSunk).toBe(true);
  });
});
```

- [ ] **Step 2: Palaiž testu - jākrīt**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: FAIL - "applyShot is not a function" / nav eksporta.

- [ ] **Step 3: Atjauno importu un pievieno kaujas funkcijas `src/game/logic.ts`**

Vispirms papildini esošo coords importu ar `parseCell` (sapludini, neatstāj divus importus no tā paša moduļa):

```ts
import { cellKey, inBounds, shipCells, parseCell } from "./coords";
```

Tad pievieno šīs funkcijas faila beigās:

```ts
export function isShipSunk(ship: Ship): boolean {
  return ship.hits.every(Boolean);
}

export function cellHitsAnyShip(ships: Ship[], cell: string): boolean {
  const { row, col } = parseCell(cell);
  return ships.some((s) => shipCells(s).some((c) => c.row === row && c.col === col));
}

export function surroundingCells(ship: Ship): string[] {
  const own = new Set(shipCells(ship).map((c) => cellKey(c.row, c.col)));
  const out = new Set<string>();
  for (const { row, col } of shipCells(ship)) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (!inBounds(r, c)) continue;
        const k = cellKey(r, c);
        if (!own.has(k)) out.add(k);
      }
  }
  return [...out];
}

export function applyShot(
  defenderShips: Ship[],
  shooterShotsAt: string[],
  cell: string
): { result: "hit" | "miss"; sunkShip: Ship | null; allSunk: boolean; ships: Ship[]; shotsAt: string[] } {
  const shotsAt = shooterShotsAt.includes(cell) ? [...shooterShotsAt] : [...shooterShotsAt, cell];
  const { row, col } = parseCell(cell);
  const ships = defenderShips.map((s) => ({ ...s, hits: [...s.hits] }));

  let result: "hit" | "miss" = "miss";
  let sunkShip: Ship | null = null;

  for (const ship of ships) {
    const cells = shipCells(ship);
    const idx = cells.findIndex((c) => c.row === row && c.col === col);
    if (idx !== -1) {
      ship.hits[idx] = true;
      result = "hit";
      if (isShipSunk(ship)) {
        sunkShip = ship;
        for (const sc of surroundingCells(ship)) {
          if (!shotsAt.includes(sc)) shotsAt.push(sc);
        }
      }
      break;
    }
  }

  const allSunk = ships.every(isShipSunk);
  return { result, sunkShip, allSunk, ships, shotsAt };
}
```

- [ ] **Step 4: Palaiž testu - jāiztur**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: PASS (visi kaujas + iepriekšējie testi).

- [ ] **Step 5: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Kaujas logika: applyShot, nogremdēšana, apkārtnes atklāšana"
```

---

## Task 5: Servera krātuve un filtrēšana (TDD daļai)

**Files:**
- Create: `api/_http.ts`, `api/_store.ts`
- Test: `src/game/redact.test.ts`

> `redactFor` ir tīra funkcija (GameState -> PlayerView), tāpēc to testējam bez Redis. Redis I/O ir plāns un to verificē integrācijā (Task 7+).

- [ ] **Step 1: Izveido `api/_http.ts`**

```ts
import type { VercelResponse } from "@vercel/node";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function sendErr(res: VercelResponse, e: unknown) {
  if (e instanceof ApiError) {
    res.status(e.status).json({ error: e.message });
  } else {
    console.error(e);
    res.status(500).json({ error: "Servera kļūda" });
  }
}
```

- [ ] **Step 2: Uzraksti krītošu testu `src/game/redact.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { redactFor } from "../../api/_store";
import type { GameState } from "./types";

function baseGame(): GameState {
  return {
    code: "ABCD",
    status: "playing",
    createdAt: 0,
    turn: 1,
    winner: null,
    players: {
      1: { id: "p1", ready: true, ships: [{ size: 1, row: 0, col: 0, orientation: "h", hits: [false] }], shotsAt: ["5,5"] },
      2: { id: "p2", ready: true, ships: [{ size: 1, row: 5, col: 5, orientation: "h", hits: [true] }], shotsAt: [] },
    },
  };
}

describe("redactFor", () => {
  it("neatklāj pretinieka nenogremdētos kuģus", () => {
    const view = redactFor(baseGame(), "p1");
    expect(view.you).toBe(1);
    expect(view.myShips).toHaveLength(1);
    // pretinieka kuģis (5,5) ir nogremdēts (hits=[true]) -> redzams sunk sarakstā
    expect(view.sunkOpponentShips).toHaveLength(1);
    // mans šāviens 5,5 bija trāpījums
    expect(view.myShots).toEqual([{ cell: "5,5", result: "hit" }]);
  });

  it("nenogremdētus pretinieka kuģus tur slepenus", () => {
    const g = baseGame();
    // pārvieto p2 kuģi prom no 5,5, lai šāviens 5,5 ir reāli garām
    g.players[2]!.ships[0] = { size: 1, row: 9, col: 9, orientation: "h", hits: [false] };
    const view = redactFor(g, "p1");
    expect(view.sunkOpponentShips).toHaveLength(0);
    expect(view.myShots).toEqual([{ cell: "5,5", result: "miss" }]);
  });
});
```

- [ ] **Step 3: Palaiž testu - jākrīt**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: FAIL - "Cannot find module '../../api/_store'".

- [ ] **Step 4: Izveido `api/_store.ts`**

```ts
import { Redis } from "@upstash/redis";
import { ApiError } from "./_http";
import { cellHitsAnyShip, isShipSunk } from "../src/game/logic";
import type { GameState, PlayerSlot, PlayerView, ShotResult } from "../src/game/types";

// Lēna inicializācija: klients tiek izveidots tikai pie pirmā Redis izsaukuma,
// lai tīrās funkcijas (redactFor) būtu importējamas un testējamas bez env mainīgajiem.
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error("Trūkst Upstash Redis env mainīgo");
    _redis = new Redis({ url, token, automaticDeserialization: false });
  }
  return _redis;
}

const TTL_SECONDS = 60 * 60 * 24; // 24h
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez I, O, 0, 1

function gameKey(code: string) {
  return `game:${code}`;
}
function revKey(code: string) {
  return `game:${code}:rev`;
}

export function newCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function loadGame(code: string): Promise<GameState | null> {
  const raw = await getRedis().get<string>(gameKey(code));
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function saveGame(game: GameState): Promise<void> {
  await getRedis().set(gameKey(game.code), JSON.stringify(game), { ex: TTL_SECONDS });
}

export async function createGame(playerId: string): Promise<GameState> {
  let code = newCode();
  for (let i = 0; i < 6; i++) {
    const exists = await getRedis().exists(gameKey(code));
    if (!exists) break;
    code = newCode();
  }
  const game: GameState = {
    code,
    status: "waiting",
    createdAt: Date.now(),
    turn: 1,
    winner: null,
    players: {
      1: { id: playerId, ready: false, ships: [], shotsAt: [] },
      2: null,
    },
  };
  await saveGame(game);
  await getRedis().set(revKey(code), "0", { ex: TTL_SECONDS });
  return game;
}

// Atomic read-modify-write ar optimistic rev (CAS caur Lua, bez cjson atkarības)
const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[2])
if cur and cur ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
redis.call('SET', KEYS[2], ARGV[4], 'EX', tonumber(ARGV[3]))
return 1
`;

export async function atomicUpdate(code: string, mutate: (g: GameState) => void): Promise<GameState> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const game = await loadGame(code);
    if (!game) throw new ApiError(404, "Spēle nav atrasta");
    const revRaw = await getRedis().get<string>(revKey(code));
    const expectedRev = String(revRaw ?? "0");
    mutate(game); // var mest ApiError
    const nextRev = String(Number(expectedRev) + 1);
    const ok = await getRedis().eval(
      CAS_SCRIPT,
      [gameKey(code), revKey(code)],
      [expectedRev, JSON.stringify(game), String(TTL_SECONDS), nextRev]
    );
    if (ok === 1) return game;
  }
  throw new ApiError(409, "Vienlaicīgas izmaiņas, mēģini vēlreiz");
}

export function slotOf(game: GameState, playerId: string): PlayerSlot | null {
  if (game.players[1]?.id === playerId) return 1;
  if (game.players[2]?.id === playerId) return 2;
  return null;
}

export function redactFor(game: GameState, playerId: string): PlayerView {
  const you: PlayerSlot = game.players[2]?.id === playerId ? 2 : 1;
  const oppSlot: PlayerSlot = you === 1 ? 2 : 1;
  const me = game.players[you];
  const opponent = game.players[oppSlot];

  const myShots: ShotResult[] = (me?.shotsAt ?? []).map((cell) => ({
    cell,
    result: opponent && cellHitsAnyShip(opponent.ships, cell) ? "hit" : "miss",
  }));

  const sunkOpponentShips = opponent ? opponent.ships.filter(isShipSunk) : [];

  return {
    code: game.code,
    status: game.status,
    you,
    turn: game.turn,
    winner: game.winner,
    opponentJoined: !!opponent,
    opponentReady: !!opponent?.ready,
    youReady: !!me?.ready,
    myShips: me?.ships ?? [],
    incomingShots: opponent?.shotsAt ?? [],
    myShots,
    sunkOpponentShips,
  };
}
```

- [ ] **Step 5: Palaiž testu - jāiztur**

Run: `cd ~/kugi-kartupelis && npm test`
Expected: PASS. (Tests importē tikai `redactFor`, kas nelieto Redis.)

- [ ] **Step 6: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Servera krātuve: Redis, atomic update, redactFor ar testu"
```

---

## Task 6: Upstash Redis + Vercel projekts + lokālā vide

**Files:**
- Create: `.env.local` (netiek commitēts; jau `.gitignore`)

> Šis ir infrastruktūras solis - vajadzīgs, lai lokāli testētu `/api`. Vajag Vercel kontu un Vercel CLI.

- [ ] **Step 1: Instalē Vercel CLI (ja nav)**

Run: `npm i -g vercel`
Expected: `vercel --version` rāda versiju.

- [ ] **Step 2: Saslēdz projektu ar Vercel**

Run: `cd ~/kugi-kartupelis && vercel link`
Darbība: izvēlies savu scope, izveido jaunu projektu ar nosaukumu `kugi-kartupelis`. Atbildi "no" uz "modify settings" (auto-detect Vite).

- [ ] **Step 3: Pievieno Upstash Redis caur Vercel Marketplace**

Darbība (Vercel dashboard pārlūkā): projekts -> Storage -> Create / Connect -> izvēlies "Upstash for Redis" -> izveido bezmaksas DB -> connect to project. Tas automātiski pievieno env mainīgos (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` vai `KV_REST_API_URL`/`KV_REST_API_TOKEN`) projektam visās vidēs.

- [ ] **Step 4: Ievelc env mainīgos lokāli**

Run: `cd ~/kugi-kartupelis && vercel env pull .env.local`
Expected: izveido `.env.local` ar Upstash REST URL + token.

- [ ] **Step 5: Pārbaudi, ka Redis sasniedzams**

Run:
```bash
cd ~/kugi-kartupelis && node --env-file=.env.local -e "import('@upstash/redis').then(async ({Redis})=>{const r=new Redis({url:process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN});await r.set('ping','ok');console.log('redis:',await r.get('ping'));})"
```
Expected: izvada `redis: ok`.

> Ja env mainīgo nosaukumi atšķiras (piem. tikai `KV_REST_API_*`), `_store.ts` jau lasa abus variantus - nekas nav jāmaina.

---

## Task 7: API galapunkti

**Files:**
- Create: `api/create.ts`, `api/join.ts`, `api/place.ts`, `api/shoot.ts`, `api/state.ts`, `api/rematch.ts`

- [ ] **Step 1: Izveido `api/create.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createGame } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const playerId = String(req.body?.playerId ?? "");
    if (!playerId) throw new ApiError(400, "Trūkst playerId");
    const game = await createGame(playerId);
    res.status(200).json({ code: game.code, playerId, you: 1 });
  } catch (e) {
    sendErr(res, e);
  }
}
```

- [ ] **Step 2: Izveido `api/join.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    const game = await atomicUpdate(code, (g) => {
      if (slotOf(g, playerId)) return; // jau spēlē - idempotents
      if (g.players[2]) throw new ApiError(409, "Istaba ir pilna");
      g.players[2] = { id: playerId, ready: false, ships: [], shotsAt: [] };
      g.status = "placing";
    });
    res.status(200).json({ code, playerId, you: slotOf(game, playerId) });
  } catch (e) {
    sendErr(res, e);
  }
}
```

- [ ] **Step 3: Izveido `api/place.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";
import { validatePlacement } from "../src/game/logic";
import type { Ship } from "../src/game/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    const incoming = (req.body?.ships ?? []) as Ship[];
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    const check = validatePlacement(incoming);
    if (!check.ok) throw new ApiError(422, check.reason ?? "Nederīgs izvietojums");

    // normalizē: serveris pārraksta hits, lai klients nevar sūtīt jau "trāpītus" kuģus
    const ships: Ship[] = incoming.map((s) => ({
      size: s.size,
      row: s.row,
      col: s.col,
      orientation: s.orientation,
      hits: new Array(s.size).fill(false),
    }));

    const game = await atomicUpdate(code, (g) => {
      const slot = slotOf(g, playerId);
      if (!slot) throw new ApiError(403, "Neesi šajā spēlē");
      if (g.status !== "placing") throw new ApiError(409, "Tagad nevar izvietot");
      g.players[slot]!.ships = ships;
      g.players[slot]!.ready = true;
      if (g.players[1]?.ready && g.players[2]?.ready) {
        g.status = "playing";
        g.turn = Math.random() < 0.5 ? 1 : 2;
      }
    });
    res.status(200).json({ ok: true, status: game.status });
  } catch (e) {
    sendErr(res, e);
  }
}
```

- [ ] **Step 4: Izveido `api/shoot.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";
import { applyShot, isShipSunk } from "../src/game/logic";
import { inBounds, parseCell, shipCells, cellKey } from "../src/game/coords";
import type { PlayerSlot } from "../src/game/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    const cell = String(req.body?.cell ?? "");
    if (!code || !playerId || !cell) throw new ApiError(400, "Trūkst datu");

    const game = await atomicUpdate(code, (g) => {
      const slot = slotOf(g, playerId);
      if (!slot) throw new ApiError(403, "Neesi šajā spēlē");
      if (g.status !== "playing") throw new ApiError(409, "Spēle nav aktīva");
      if (g.turn !== slot) throw new ApiError(409, "Nav tavs gājiens");

      const { row, col } = parseCell(cell);
      if (!inBounds(row, col)) throw new ApiError(400, "Nederīga rūts");

      const opp: PlayerSlot = slot === 1 ? 2 : 1;
      const shooter = g.players[slot]!;
      const defender = g.players[opp]!;
      if (shooter.shotsAt.includes(cell)) throw new ApiError(409, "Šeit jau šāvi");

      const r = applyShot(defender.ships, shooter.shotsAt, cell);
      defender.ships = r.ships;
      shooter.shotsAt = r.shotsAt;
      if (r.allSunk) {
        g.status = "finished";
        g.winner = slot;
      } else if (r.result === "miss") {
        g.turn = opp;
      }
    });

    // atvasina atbildi no atjaunotā stāvokļa
    const slot = slotOf(game, playerId)!;
    const opp: PlayerSlot = slot === 1 ? 2 : 1;
    const defender = game.players[opp]!;
    const hitShip = defender.ships.find((s) =>
      shipCells(s).some((c) => cellKey(c.row, c.col) === cell)
    );
    const result = hitShip ? "hit" : "miss";
    const sunk = hitShip && isShipSunk(hitShip) ? hitShip : null;
    res.status(200).json({ result, sunk, win: game.winner === slot, turn: game.turn });
  } catch (e) {
    sendErr(res, e);
  }
}
```

- [ ] **Step 5: Izveido `api/state.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadGame, redactFor, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const code = String(req.query.code ?? "").toUpperCase();
    const playerId = String(req.query.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");
    const game = await loadGame(code);
    if (!game) throw new ApiError(404, "Spēle nav atrasta");
    if (!slotOf(game, playerId)) throw new ApiError(403, "Neesi šajā spēlē");
    res.status(200).json(redactFor(game, playerId));
  } catch (e) {
    sendErr(res, e);
  }
}
```

- [ ] **Step 6: Izveido `api/rematch.ts`**

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atomicUpdate, slotOf } from "./_store";
import { ApiError, sendErr } from "./_http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") throw new ApiError(405, "Tikai POST");
    const code = String(req.body?.code ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    if (!code || !playerId) throw new ApiError(400, "Trūkst datu");

    const game = await atomicUpdate(code, (g) => {
      if (!slotOf(g, playerId)) throw new ApiError(403, "Neesi šajā spēlē");
      for (const slot of [1, 2] as const) {
        const p = g.players[slot];
        if (p) {
          p.ships = [];
          p.shotsAt = [];
          p.ready = false;
        }
      }
      g.winner = null;
      g.status = g.players[2] ? "placing" : "waiting";
    });
    res.status(200).json({ ok: true, status: game.status });
  } catch (e) {
    sendErr(res, e);
  }
}
```

- [ ] **Step 7: Typecheck**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit`
Expected: nav kļūdu.

- [ ] **Step 8: Palaiž `vercel dev` un notestē API ar curl**

Run (1. terminālī): `cd ~/kugi-kartupelis && vercel dev`
Expected: serveris uz http://localhost:3000.

Run (2. terminālī - izveido un pievienojas):
```bash
curl -s -XPOST localhost:3000/api/create -H 'content-type: application/json' -d '{"playerId":"p1"}'
```
Expected: `{"code":"XXXX","playerId":"p1","you":1}` (iegaumē kodu).

```bash
CODE=XXXX
curl -s -XPOST localhost:3000/api/join -H 'content-type: application/json' -d "{\"code\":\"$CODE\",\"playerId\":\"p2\"}"
curl -s "localhost:3000/api/state?code=$CODE&playerId=p1"
```
Expected: join atgriež `you:2`; state atgriež `status:"placing"`, `opponentJoined:true`.

- [ ] **Step 9: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "API galapunkti: create, join, place, shoot, state, rematch"
```

---

## Task 8: Klienta tīkla slānis

**Files:**
- Create: `src/playerId.ts`, `src/api.ts`, `src/useGameState.ts`

- [ ] **Step 1: Izveido `src/playerId.ts`**

```ts
const KEY = "kugi:playerId";

export function getPlayerId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

- [ ] **Step 2: Izveido `src/api.ts`**

```ts
import type { PlayerView, Ship } from "./game/types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Kļūda");
  return data as T;
}

export function createGame(playerId: string) {
  return post<{ code: string; you: 1 }>("create", { playerId });
}
export function joinGame(code: string, playerId: string) {
  return post<{ code: string; you: 1 | 2 }>("join", { code, playerId });
}
export function placeShips(code: string, playerId: string, ships: Ship[]) {
  return post<{ ok: true; status: string }>("place", { code, playerId, ships });
}
export function shoot(code: string, playerId: string, cell: string) {
  return post<{ result: "hit" | "miss"; sunk: Ship | null; win: boolean; turn: 1 | 2 }>(
    "shoot",
    { code, playerId, cell }
  );
}
export function rematch(code: string, playerId: string) {
  return post<{ ok: true; status: string }>("rematch", { code, playerId });
}
export async function getState(code: string, playerId: string): Promise<PlayerView> {
  const r = await fetch(`/api/state?code=${encodeURIComponent(code)}&playerId=${encodeURIComponent(playerId)}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Kļūda");
  return data as PlayerView;
}
```

- [ ] **Step 3: Izveido `src/useGameState.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getState } from "./api";
import type { PlayerView } from "./game/types";

function intervalFor(view: PlayerView | null): number {
  if (!view) return 1500;
  if (view.status === "finished") return 5000;
  if (view.status === "playing" && view.turn === view.you) return 4000; // tavs gājiens - pretinieks neko nemaina
  return 1500;
}

export function useGameState(code: string | null, playerId: string) {
  const [view, setView] = useState<PlayerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const v = await getState(code, playerId);
      setView(v);
      setError(null);
      return v;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [code, playerId]);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    const tick = async () => {
      const v = await refresh();
      if (!alive) return;
      timer.current = setTimeout(tick, intervalFor(v ?? null));
    };
    tick();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [code, refresh]);

  return { view, error, refresh };
}
```

- [ ] **Step 4: Typecheck**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit`
Expected: nav kļūdu.

- [ ] **Step 5: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Klienta tīkla slānis: playerId, api, polling hook"
```

---

## Task 9: Režģa komponentes

**Files:**
- Create: `src/components/Cell.tsx`, `src/components/Board.tsx`

- [ ] **Step 1: Izveido `src/components/Cell.tsx`**

```tsx
export type CellState = "empty" | "ship" | "hit" | "miss" | "sunk" | "preview" | "invalid";

const STYLES: Record<CellState, string> = {
  empty: "bg-sky-50",
  ship: "bg-slate-600",
  hit: "bg-red-500",
  miss: "bg-sky-200",
  sunk: "bg-red-800",
  preview: "bg-emerald-400",
  invalid: "bg-rose-300",
};

export function Cell({ state, onClick }: { state: CellState; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`aspect-square w-full border border-sky-300 ${STYLES[state]} ${
        onClick ? "active:opacity-70" : "cursor-default"
      } flex items-center justify-center`}
    >
      {state === "miss" ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> : null}
      {state === "hit" || state === "sunk" ? <span className="text-white text-xs font-bold">✕</span> : null}
    </button>
  );
}
```

- [ ] **Step 2: Izveido `src/components/Board.tsx`**

```tsx
import { Fragment } from "react";
import { COLUMNS } from "../game/constants";
import { Cell, type CellState } from "./Cell";

export function Board({
  cellState,
  onCell,
}: {
  cellState: (row: number, col: number) => CellState;
  onCell?: (row: number, col: number) => void;
}) {
  const idx = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className="select-none w-full max-w-[26rem] mx-auto">
      <div className="grid" style={{ gridTemplateColumns: `1.4rem repeat(10, 1fr)` }}>
        <div />
        {idx.map((c) => (
          <div key={`h${c}`} className="text-center text-[0.7rem] font-bold leading-5">
            {COLUMNS[c]}
          </div>
        ))}
        {idx.map((r) => (
          <Fragment key={`r${r}`}>
            <div className="flex items-center justify-center text-[0.7rem] font-bold">{r + 1}</div>
            {idx.map((c) => (
              <Cell key={`${r}-${c}`} state={cellState(r, c)} onClick={onCell ? () => onCell(r, c) : undefined} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit`
Expected: nav kļūdu (komponentes vēl netiek importētas - tas ir OK).

- [ ] **Step 4: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Režģa komponentes: Cell un Board ar KARTUPELIS galveni"
```

---

## Task 10: Ekrāni - Home un Lobby

**Files:**
- Create: `src/screens/Home.tsx`, `src/screens/Lobby.tsx`

- [ ] **Step 1: Izveido `src/screens/Home.tsx`**

```tsx
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
```

- [ ] **Step 2: Izveido `src/screens/Lobby.tsx`**

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit`
Expected: nav kļūdu.

- [ ] **Step 4: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Ekrāni: Home un Lobby"
```

---

## Task 11: Ekrāns - Placement (izvietošana)

**Files:**
- Create: `src/screens/Placement.tsx`

- [ ] **Step 1: Izveido `src/screens/Placement.tsx`**

```tsx
import { useMemo, useState } from "react";
import { Board } from "../components/Board";
import type { CellState } from "../components/Cell";
import { FLEET } from "../game/constants";
import { canPlace, randomPlacement, validatePlacement } from "../game/logic";
import { shipCells } from "../game/coords";
import type { Orientation, Ship } from "../game/types";

function countBySize(ships: Ship[]): Record<number, number> {
  const m: Record<number, number> = {};
  for (const s of ships) m[s.size] = (m[s.size] ?? 0) + 1;
  return m;
}

export function Placement({ onReady, busy }: { onReady: (ships: Ship[]) => void; busy: boolean }) {
  const [ships, setShips] = useState<Ship[]>(() => randomPlacement());
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("h");

  const placed = countBySize(ships);
  const remaining = FLEET.map((f) => ({ size: f.size, count: f.count - (placed[f.size] ?? 0) }));
  const allPlaced = remaining.every((r) => r.count === 0);
  const valid = allPlaced && validatePlacement(ships).ok;

  const shipCellSet = useMemo(() => {
    const s = new Set<string>();
    for (const ship of ships) for (const c of shipCells(ship)) s.add(`${c.row},${c.col}`);
    return s;
  }, [ships]);

  function cellState(row: number, col: number): CellState {
    return shipCellSet.has(`${row},${col}`) ? "ship" : "empty";
  }

  function handleCell(row: number, col: number) {
    const hit = ships.find((s) => shipCells(s).some((c) => c.row === row && c.col === col));
    if (hit) {
      setShips(ships.filter((s) => s !== hit));
      setSelectedSize(hit.size);
      return;
    }
    if (selectedSize == null) return;
    const candidate: Ship = { size: selectedSize, row, col, orientation, hits: new Array(selectedSize).fill(false) };
    if (canPlace(ships, candidate)) {
      const next = [...ships, candidate];
      setShips(next);
      const left = (remaining.find((r) => r.size === selectedSize)?.count ?? 0) - 1;
      if (left <= 0) setSelectedSize(null);
    }
  }

  return (
    <div className="min-h-full flex flex-col gap-4 p-4">
      <h2 className="text-center text-lg font-bold text-slate-700">Izvieto savus kuģus</h2>

      <Board cellState={cellState} onCell={handleCell} />

      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((r) => (
          <button
            key={r.size}
            disabled={r.count === 0}
            onClick={() => setSelectedSize(r.size)}
            className={`rounded-xl px-3 py-2 text-sm font-bold border-2 transition ${
              selectedSize === r.size ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
            } disabled:opacity-30`}
          >
            {r.size}-rūšu × {r.count}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setOrientation((o) => (o === "h" ? "v" : "h"))}
          className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold"
        >
          Pagriezt: {orientation === "h" ? "↔" : "↕"}
        </button>
        <button onClick={() => setShips(randomPlacement())} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold">
          Sajaukt
        </button>
        <button onClick={() => setShips([])} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold">
          Notīrīt
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Izvēlies kuģi un uzsit laukā, lai noliktu. Uzsit uz nolikta kuģa, lai paņemtu atpakaļ.
      </p>

      <button
        onClick={() => valid && onReady(ships)}
        disabled={!valid || busy}
        className="mt-auto rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-white disabled:opacity-40 active:scale-95 transition"
      >
        {busy ? "Sūta…" : "Gatavs!"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit`
Expected: nav kļūdu.

- [ ] **Step 3: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Ekrāns: Placement ar auto un manuālu izvietošanu"
```

---

## Task 12: Ekrāni - Battle un Result

**Files:**
- Create: `src/screens/Battle.tsx`, `src/screens/Result.tsx`

- [ ] **Step 1: Izveido `src/screens/Battle.tsx`**

```tsx
import { useMemo } from "react";
import { Board } from "../components/Board";
import type { CellState } from "../components/Cell";
import { shipCells } from "../game/coords";
import type { PlayerView } from "../game/types";

export function Battle({
  view,
  onShoot,
  busy,
}: {
  view: PlayerView;
  onShoot: (cell: string) => void;
  busy: boolean;
}) {
  const myTurn = view.turn === view.you;

  // Pretinieka lauks (mērķis)
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

  // Mans lauks
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

  function handleTarget(row: number, col: number) {
    if (!myTurn || busy) return;
    const key = `${row},${col}`;
    if (myShotMap.has(key)) return;
    onShoot(key);
  }

  return (
    <div className="min-h-full flex flex-col gap-3 p-4">
      <div
        className={`text-center rounded-xl py-2 font-bold ${
          myTurn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {myTurn ? "Tavs gājiens - šauj!" : "Gaida pretinieka gājienu…"}
      </div>

      <div>
        <div className="text-center text-sm font-semibold text-slate-500 mb-1">Pretinieka lauks</div>
        <Board cellState={targetState} onCell={myTurn && !busy ? handleTarget : undefined} />
      </div>

      <div>
        <div className="text-center text-sm font-semibold text-slate-500 mb-1">Tavs lauks</div>
        <Board cellState={ownState} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Izveido `src/screens/Result.tsx`**

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit`
Expected: nav kļūdu.

- [ ] **Step 4: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Ekrāni: Battle un Result"
```

---

## Task 13: App - savieno visu kopā

**Files:**
- Modify: `src/App.tsx` (pilnībā pārraksta)

- [ ] **Step 1: Pārraksti `src/App.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react";
import { getPlayerId } from "./playerId";
import { useGameState } from "./useGameState";
import * as api from "./api";
import { Home } from "./screens/Home";
import { Lobby } from "./screens/Lobby";
import { Placement } from "./screens/Placement";
import { Battle } from "./screens/Battle";
import { Result } from "./screens/Result";
import type { Ship } from "./game/types";

const CODE_KEY = "kugi:code";

export default function App() {
  const [playerId] = useState(getPlayerId);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { view, refresh } = useGameState(code, playerId);

  // Sākumā: pārbaudi ?kods= URL vai saglabāto kodu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get("kods")?.toUpperCase();
    const saved = localStorage.getItem(CODE_KEY);
    const target = fromUrl || saved;
    if (!target) return;
    (async () => {
      try {
        const r = await api.joinGame(target, playerId);
        persistCode(r.code);
      } catch (e) {
        // saglabātais kods varētu būt beidzies - notīri
        localStorage.removeItem(CODE_KEY);
        if (fromUrl) setError((e as Error).message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistCode(c: string) {
    localStorage.setItem(CODE_KEY, c);
    setCode(c);
    setError(null);
  }

  const handleCreate = useCallback(async () => {
    setError(null);
    try {
      const r = await api.createGame(playerId);
      persistCode(r.code);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [playerId]);

  const handleJoin = useCallback(
    async (c: string) => {
      setError(null);
      try {
        const r = await api.joinGame(c, playerId);
        persistCode(r.code);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [playerId]
  );

  const handleReady = useCallback(
    async (ships: Ship[]) => {
      if (!code) return;
      setBusy(true);
      try {
        await api.placeShips(code, playerId, ships);
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [code, playerId, refresh]
  );

  const handleShoot = useCallback(
    async (cell: string) => {
      if (!code) return;
      setBusy(true);
      try {
        await api.shoot(code, playerId, cell);
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [code, playerId, refresh]
  );

  const handleRematch = useCallback(async () => {
    if (!code) return;
    setBusy(true);
    try {
      await api.rematch(code, playerId);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [code, playerId, refresh]);

  // Maršrutēšana pēc stāvokļa
  if (!code) {
    return <Home onCreate={handleCreate} onJoin={handleJoin} error={error} />;
  }
  if (!view) {
    return <div className="min-h-full flex items-center justify-center text-slate-400">Ielādē…</div>;
  }
  if (view.status === "waiting") {
    return <Lobby code={code} />;
  }
  if (view.status === "placing") {
    if (!view.youReady) return <Placement onReady={handleReady} busy={busy} />;
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
        <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />
        Gaida, kamēr pretinieks izvieto kuģus…
      </div>
    );
  }
  if (view.status === "playing") {
    return <Battle view={view} onShoot={handleShoot} busy={busy} />;
  }
  // finished
  return <Result won={view.winner === view.you} onRematch={handleRematch} busy={busy} />;
}
```

- [ ] **Step 2: Typecheck + build**

Run: `cd ~/kugi-kartupelis && npx tsc --noEmit && npm run build`
Expected: nav kļūdu; build izveido `dist/`.

- [ ] **Step 3: Commit**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "App: maršrutēšana un visu ekrānu savienošana"
```

---

## Task 14: Lokālā end-to-end pārbaude

**Files:** nav (verifikācija)

- [ ] **Step 1: Palaiž visu kopā ar `vercel dev`**

Run: `cd ~/kugi-kartupelis && vercel dev`
Expected: serveris uz http://localhost:3000 (apkalpo gan SPA, gan `/api`).

- [ ] **Step 2: Spēlē divos logos**

Darbība:
1. Atver http://localhost:3000 normālā logā -> "Izveidot spēli" -> iegaumē kodu.
2. Atver to pašu URL inkognito logā -> ievadi kodu -> "Pievienoties".
3. Abos logos izvieto kuģus ("Sajaukt" vai manuāli) -> "Gatavs!".
4. Pārbaudi, ka sākas kauja; viens logs rāda "Tavs gājiens".
5. Šauj. Pārbaudi: trāpījums dod vēl gājienu; garām nodod gājienu otram.
6. Nogremdē kuģi -> apkārtnei jāatklājas kā garām.
7. Notrāpi visu -> Result ekrāns; otrā logā "zaudēji".
8. "Spēlēt vēlreiz" -> atgriežas izvietošanā.

Expected: viss notiek, kā aprakstīts; nav konsoles kļūdu.

- [ ] **Step 3: Pārbaudi cheat aizsardzību**

Darbība: kaujas laikā 2. loga DevTools -> Network -> apskati `GET /api/state` atbildi.
Expected: pretinieka nenogremdēto kuģu pozīcijas NEPARĀDĀS atbildē (tikai `sunkOpponentShips` un tavi `myShots`).

- [ ] **Step 4: Commit (ja bija labojumi)**

```bash
cd ~/kugi-kartupelis && git add -A && git commit -m "Labojumi pēc lokālās E2E pārbaudes" || echo "nav izmaiņu"
```

---

## Task 15: Deploy uz Vercel

**Files:** nav (deploy)

- [ ] **Step 1: Production deploy**

Run: `cd ~/kugi-kartupelis && vercel --prod`
Expected: build veiksmīgs; atgriež production URL (piem. https://kugi-kartupelis.vercel.app). Upstash env mainīgie jau ir projektā no Task 6, tāpēc production strādā uzreiz.

- [ ] **Step 2: Pārbaudi production telefonā**

Darbība: atver production URL telefonā -> izveido spēli -> "Dalīties ar saiti" -> atver saiti otrā telefonā -> nospēlē pilnu partiju.
Expected: abi telefoni sinhronizējas; spēle aiziet līdz uzvarai.

- [ ] **Step 3: (Pēc izvēles) GitHub repo + auto-deploy**

> Pēc Gata preferences GitHub repo ir public; commitu autors Gatis. Auto-deploy nav obligāts (CLI deploy pietiek), bet ērts.

Run:
```bash
cd ~/kugi-kartupelis && gh repo create kugi-kartupelis --public --source=. --remote=origin --push
```
Tad Vercel dashboard -> projekts -> Settings -> Git -> connect to the GitHub repo. Turpmāk `git push` uz `main` auto-deployo.

- [ ] **Step 4: Iedod Gatim production URL**

Darbība: paziņo gala production URL, lai Gatis var sākt spēlēt ar meitu.

---

## Self-Review piezīmes

- **Spec coverage:** noteikumi (Task 3-4), izvietošana auto+manuāla (Task 3, 11), server-authoritative + cheat aizsardzība (Task 5, 7, 14 step 3), polling cadence (Task 8), KARTUPELIS režģis (Task 2, 9), API kontrakts (Task 7), bez login playerId (Task 8), rematch (Task 7, 13), TTL 24h (Task 5), testi (Task 2-5).
- **Tipu konsistence:** `Ship`, `PlayerView`, `applyShot` paraksts, `slotOf`, `redactFor` lietoti vienādi visās tasks.
- **LV teksti:** pirms gala pulēšanas UI tekstus laist caur LV gramatikas gate (atsevišķs solis pēc Task 14, ja vēlas vizuālu pulēšanu ar frontend-design skill).
