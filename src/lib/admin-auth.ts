import { timingSafeEqual } from "node:crypto";

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

// Best-effort, per-instance throttle. On serverless this resets between cold
// starts, but it still blunts naive brute forcing of the secret code.
const failures = new Map<string, { count: number; resetAt: number }>();

export type AdminAuthResult = "ok" | "missing-config" | "incorrect" | "throttled";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function clientKeyFromHeaders(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export function checkAdminPassword(password: unknown, clientKey: string): AdminAuthResult {
  const expected = process.env.ADMIN_SECRET_CODE ?? process.env.ADMIN_UPLOAD_PASSWORD;
  if (!expected) {
    return "missing-config";
  }

  const now = Date.now();
  const entry = failures.get(clientKey);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
    return "throttled";
  }

  if (typeof password === "string" && password && safeEqual(password, expected)) {
    failures.delete(clientKey);
    return "ok";
  }

  failures.set(clientKey, {
    count: entry && entry.resetAt > now ? entry.count + 1 : 1,
    resetAt: entry && entry.resetAt > now ? entry.resetAt : now + WINDOW_MS,
  });
  return "incorrect";
}
