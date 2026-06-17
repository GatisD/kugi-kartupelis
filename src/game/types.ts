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
  abandonedBy: PlayerSlot | null;
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
  abandonedBy: PlayerSlot | null;
  opponentJoined: boolean;
  opponentReady: boolean;
  youReady: boolean;
  myShips: Ship[];
  incomingShots: string[]; // pretinieka šāvieni manā laukā
  myShots: ShotResult[]; // mani šāvieni ar rezultātu
  sunkOpponentShips: Ship[]; // tikai nogremdētie pretinieka kuģi
}
