"use client";

import Image from "next/image";
import { useState } from "react";

import { PhotoCarousel } from "@/components/photo-carousel";
import type { PhotoPost } from "@/types/photo";

type PhotoGridProps = {
  posts: PhotoPost[];
};

export function PhotoGrid({ posts }: PhotoGridProps) {
  const [modalPost, setModalPost] = useState<PhotoPost | null>(null);

  return (
    <>
      <section className="grid grid-cols-3 gap-1 photo-grid pb-8">
        {posts.map((post, index) => (
          <button
            key={post.id}
            type="button"
            onClick={() => setModalPost(post)}
            className="photo-tile relative overflow-hidden"
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
          </button>
        ))}
      </section>

      {modalPost && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            type="button"
            onClick={() => setModalPost(null)}
            className="absolute left-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white"
            aria-label="Back to grid"
          >
            {/* Grid icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <PhotoCarousel
            assets={modalPost.assets}
            caption={modalPost.caption}
          />
          {modalPost.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              <p className="text-sm">{modalPost.caption}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}