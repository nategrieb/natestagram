import { createServerClient } from "@supabase/ssr";
import { authCookieOptions } from "@/lib/auth-cookie";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getRequiredEnv, getSupabasePublicKey } from "@/lib/env";

/** Supabase client bound to the visitor's auth cookies (not the service role). */
export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getSupabasePublicKey(), {
    cookieOptions: authCookieOptions,
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

/** The shared permission name for this app in platform.apps. */
const APP_KEY = "natestagram";

/**
 * Asks the shared permissions (platform.app_role) what this person may do here:
 * "owner" and "admin" can manage photos. Returns null if the lookup fails.
 */
async function getPlatformRole(supabase: Awaited<ReturnType<typeof createSupabaseAuthClient>>): Promise<string | null> {
  try {
    const { data, error } = await supabase.schema("platform").rpc("app_role", { p_app: APP_KEY });
    return error || typeof data !== "string" ? null : data;
  } catch {
    return null;
  }
}

/**
 * Verifies the session with Supabase (getUser, not the unverified cookie), then allows the
 * person in if the shared permissions make them an owner/admin of this app. ADMIN_EMAILS is kept
 * as a temporary safety net while the shared permissions roll out (remove it afterwards).
 * The database is shared with other apps, so being signed in is not enough.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { status: "anonymous" };
  }

  const email = data.user.email?.toLowerCase();
  if (!email || !data.user.email_confirmed_at) {
    return { status: "forbidden", user: data.user };
  }

  const role = await getPlatformRole(supabase);
  const allowed = role === "owner" || role === "admin" || getAdminEmails().includes(email);

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
