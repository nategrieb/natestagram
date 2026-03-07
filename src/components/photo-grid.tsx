"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import type { PhotoPost } from "@/types/photo";

type PhotoGridProps = {
  posts: PhotoPost[];
};

export function PhotoGrid({ posts }: PhotoGridProps) {
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);
  const router = useRouter();

  const handlePhotoClick = (post: PhotoPost) => {
    if (isTouchDevice) {
      // Mobile: go to timeline feed focused on the selected post.
      router.push(`/timeline?selected=${post.id}`);
    } else {
      // Desktop: navigate to individual photo page
      router.push(`/photo/${post.id}`);
    }
  };

  return (
    <>
      <section className="photo-grid -mx-5 grid grid-cols-2 gap-px pb-8 sm:mx-0 sm:grid-cols-3">
        {posts.map((post, index) => (
          <button
            key={post.id}
            type="button"
            onClick={() => handlePhotoClick(post)}
            className="photo-tile relative overflow-hidden"
            style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }}
          >
            <Image
              src={post.coverImageUrl}
              alt={post.caption || "Photo post"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 33vw"
              className="object-cover"
            />
            {post.assets.length > 1 ? (
              <span className="absolute right-2 top-2 rounded-full bg-zinc-800/75 px-2 py-0.5 text-[10px] text-zinc-100">
                {post.assets.length} photos
              </span>
            ) : null}
          </button>
        ))}
      </section>
    </>
  );
}