"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { PhotoPost } from "@/types/photo";

type AdminPostGridProps = {
  posts: PhotoPost[];
};

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    if (payload?.message) {
      return payload.message;
    }
  }

  const text = await response.text().catch(() => "");
  return text || "Delete failed.";
}

export function AdminPostGrid({ posts }: AdminPostGridProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCount = selectedIds.length;
  const allSelected = posts.length > 0 && selectedCount === posts.length;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const togglePost = (postId: string) => {
    setSelectedIds((current) => {
      if (current.includes(postId)) {
        return current.filter((id) => id !== postId);
      }
      return [...current, postId];
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(posts.map((post) => post.id));
  };

  const handleDelete = async () => {
    setError(null);

    if (!password) {
      setError("Enter admin password to delete posts.");
      return;
    }

    if (selectedIds.length === 0) {
      setError("Select one or more posts to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected post${selectedIds.length === 1 ? "" : "s"}? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/posts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          postIds: selectedIds,
        }),
      });

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      setSelectedIds([]);
      window.location.reload();
    } catch {
      setError("Delete failed unexpectedly. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (posts.length === 0) {
    return (
      <section className="border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase">Manage Posts</h2>
        <p className="mt-3 text-sm text-zinc-500">No uploaded posts yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase">Manage Posts</h2>
        <button
          type="button"
          onClick={toggleSelectAll}
          className="border border-zinc-300 px-3 py-2 text-xs text-zinc-700 transition hover:bg-zinc-50"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="flex flex-col gap-3 border border-zinc-200 p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="deletePassword" className="block text-xs font-medium text-zinc-700 uppercase tracking-wide">
            Admin password
          </label>
          <input
            id="deletePassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
            placeholder="Required for delete"
          />
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || selectedCount === 0}
          className="border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : `Delete selected (${selectedCount})`}
        </button>
      </div>

      {error ? <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => {
          const isSelected = selectedSet.has(post.id);

          return (
            <button
              key={post.id}
              type="button"
              onClick={() => togglePost(post.id)}
              className={`group relative overflow-hidden border text-left transition ${
                isSelected ? "border-emerald-500 ring-2 ring-emerald-300" : "border-zinc-200 hover:border-zinc-400"
              }`}
              aria-pressed={isSelected}
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={post.coverImageUrl}
                  alt={post.caption || "Post"}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>

              <div className="absolute left-2 top-2 border border-white/75 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                {isSelected ? "Selected" : "Select"}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-black/45 px-2 py-1 text-[11px] text-white">
                {post.assets.length} photo{post.assets.length === 1 ? "" : "s"}
                {post.is_public ? " - public" : " - private"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
