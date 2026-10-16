import { NextResponse } from "next/server";

/** Small helpers so every route answers errors the same way. */
export function jsonError(status: number, error: string, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Run a handler body and turn thrown HttpErrors into JSON responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message);
    console.error("[api] unhandled:", err);
    return jsonError(500, "Internal server error");
  }
}

export function str(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function strList(value: unknown, max = 50): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => str(v, 60)).filter(Boolean))].slice(0, max);
}
