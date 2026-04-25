import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getRequiredEnv, getSupabasePublicKey } from "@/lib/env";

export function createSupabaseServerClient() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getSupabasePublicKey();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
    db: { schema: 'natestagram' },
  });
}

export function createSupabaseBrowserClient() {
  // `getRequiredEnv` uses `process.env` and throws if the value is missing.
  // that function is meant for server code; on the client the env values are
  // inlined at build-time and we don't want to crash the bundle if something
  // is accidentally undefined. read the vars directly and throw a clearer
  // message if we still don't have a URL.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    // This error will surface in the browser console, which makes debugging
    // client-side env issues easier without affecting server rendering.
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error(
      "Missing Supabase public key: set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return createBrowserClient(url, anonKey, { db: { schema: 'natestagram' } });
}

export function createSupabaseAdminClient() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
