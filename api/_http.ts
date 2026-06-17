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
