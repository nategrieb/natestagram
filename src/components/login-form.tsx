"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm({ signedInAs }: { signedInAs: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-lg font-semibold text-zinc-900">Sign in</h1>

      {signedInAs ? (
        <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {signedInAs} is signed in but isn&apos;t allowed to manage photos.{" "}
          <button type="button" onClick={signOut} className="underline">
            Sign out
          </button>
        </p>
      ) : null}

      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          required
          className="w-full border border-zinc-300 px-4 py-3 text-base outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm text-zinc-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full border border-zinc-300 px-4 py-3 text-base outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-stone-900 px-6 py-3 text-sm text-white transition hover:bg-stone-700 disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
