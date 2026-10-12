import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getRequiredEnv, getSupabasePublicKey } from "@/lib/env";

/** Supabase client bound to the visitor's auth cookies (not the service role). */
export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getSupabasePublicKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

/** Lower-cased emails allowed to administer the gallery (ADMIN_EMAILS, comma separated). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminSession =
  | { status: "anonymous" }
  | { status: "forbidden"; user: User }
  | { status: "admin"; user: User };

/**
 * Verifies the session with Supabase (getUser, not the unverified cookie) and
 * checks the allowlist. The database is shared with other apps, so being signed
 * in is not enough. Fails closed if ADMIN_EMAILS is empty.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { status: "anonymous" };
  }

  const email = data.user.email?.toLowerCase();
  const allowed = Boolean(email && data.user.email_confirmed_at && getAdminEmails().includes(email));

  return allowed ? { status: "admin", user: data.user } : { status: "forbidden", user: data.user };
}

/** Guard for /api/admin routes. */
export async function requireAdminForApi(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const session = await getAdminSession();

  if (session.status === "admin") {
    return { ok: true };
  }

  const unauthenticated = session.status === "anonymous";
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, message: unauthenticated ? "Please sign in." : "This account is not allowed to manage photos." },
      { status: unauthenticated ? 401 : 403 }
    ),
  };
}
