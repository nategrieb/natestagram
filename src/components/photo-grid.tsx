"use client";

import Image from "next/image";
import Link from "next/link";

import type { PhotoPost } from "@/types/photo";

type PhotoGridProps = {
  posts: PhotoPost[];
};

export function PhotoGrid({ posts }: PhotoGridProps) {
  return (
    <section className="grid grid-cols-3 photo-grid pb-8">
      {posts.map((post, index) => (
        <Link
          key={post.id}
          href={`/timeline?selected=${post.id}`}
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
  );
}