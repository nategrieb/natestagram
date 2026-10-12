"use client";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="inline-flex h-10 items-center px-3 text-sm text-zinc-500 transition hover:text-zinc-900"
    >
      Sign out
    </button>
  );
}
