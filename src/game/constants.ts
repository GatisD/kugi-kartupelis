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
