"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PostPreviewCarousel } from "@/components/post-preview-carousel";
import type { PhotoPost } from "@/types/photo";

type HomeGalleryProps = {
  posts: PhotoPost[];
};

export function HomeGallery({ posts }: HomeGalleryProps) {
  const [mode, setMode] = useState<"grid" | "scroll">("grid");

  const hasPosts = useMemo(() => posts.length > 0, [posts]);

  if (!hasPosts) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white/85 px-6 py-14 text-center shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
        <h2 className="text-2xl font-medium text-zinc-700">No photos yet</h2>
        <p className="mt-3 text-zinc-600">Upload your first post in the admin page to populate this grid.</p>
      </section>
    );
  }

  return (
    <>
      <div className="mb-4 flex md:hidden">
        <div className="inline-flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMode("grid")}
            className={`text-sm transition ${
              mode === "grid" ? "text-zinc-500 underline underline-offset-4" : "text-zinc-400"
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setMode("scroll")}
            className={`text-sm transition ${
              mode === "scroll" ? "text-zinc-500 underline underline-offset-4" : "text-zinc-400"
            }`}
          >
            Scroll
          </button>
        </div>
      </div>

      <section className={`${mode === "scroll" ? "hidden md:grid" : "grid"} grid-cols-3 md:grid-cols-3 photo-grid pb-8`}>
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/photo/${post.id}`}
            className="photo-tile"
            style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }}
          >
            <Image
              src={post.coverImageUrl}
              alt={post.caption || "Photo post"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
            {post.assets.length > 1 ? (
              <span className="absolute right-2 top-2 rounded-full bg-zinc-800/75 px-2 py-0.5 text-[10px] text-zinc-100">
                {post.assets.length} photos
              </span>
            ) : null}
          </Link>
        ))}
      </section>

      <section className={`${mode === "scroll" ? "block" : "hidden"} md:hidden mobile-feed pb-16`}>
        {posts.map((post) => (
          <article key={post.id} className="mobile-feed-item py-2">
            <PostPreviewCarousel assets={post.assets} caption={post.caption} />
            <div className="mt-2 flex items-center justify-between px-1">
              <p className="line-clamp-1 text-sm text-zinc-500">{post.caption || "Untitled post"}</p>
              <Link href={`/photo/${post.id}`} className="text-sm text-zinc-400">
                Open
              </Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
