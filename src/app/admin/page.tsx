import Link from "next/link";

import { uploadPhoto } from "@/app/admin/actions";

type AdminPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const query = await searchParams;
  const errorMessage = query.status === "error" ? query.message || "Upload failed." : null;
  const successMessage = query.status === "uploaded" ? "Post uploaded." : null;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:px-8">
      <div className="backdrop-orb" aria-hidden="true" />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl text-zinc-900 sm:text-5xl">Upload</h1>
        <Link href="/" className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900">
          Back to gallery
        </Link>
      </div>

      {successMessage ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      <form
        action={uploadPhoto}
        className="space-y-5 rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
      >
        <div className="space-y-2">
          <label className="block text-sm text-zinc-700" htmlFor="password">
            Admin password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-zinc-700" htmlFor="photos">
            Images
          </label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            required
            className="w-full rounded-xl border border-zinc-300 px-4 py-3"
          />
          <p className="text-xs text-zinc-500">Select one or more photos for a single carousel post.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-zinc-700" htmlFor="caption">
            Caption
          </label>
          <textarea
            id="caption"
            name="caption"
            rows={4}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
            placeholder="Write the full caption shown in fullscreen mode"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm text-zinc-700" htmlFor="takenAt">
              Taken at
            </label>
            <input
              id="takenAt"
              name="takenAt"
              type="date"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-700" htmlFor="sortOrder">
              Sort order (optional)
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
              placeholder="Lower appears first"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-zinc-700" htmlFor="isPublic">
          <input id="isPublic" name="isPublic" type="checkbox" defaultChecked className="h-4 w-4" />
          Visible in public gallery
        </label>

        <button
          type="submit"
          className="rounded-full bg-stone-900 px-6 py-3 text-sm text-white transition hover:bg-stone-700"
        >
          Upload post
        </button>
      </form>
    </main>
  );
}
