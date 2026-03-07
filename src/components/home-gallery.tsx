"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { PostPreviewCarousel } from "@/components/post-preview-carousel";
import type { PhotoPost } from "@/types/photo";

type HomeGalleryProps = {
  posts: PhotoPost[];
  selectedId?: string;
};

export function HomeGallery({ posts, selectedId }: HomeGalleryProps) {
  const router = useRouter();
  const mobileItemRefs = useRef<Array<HTMLElement | null>>([]);

  const hasPosts = useMemo(() => posts.length > 0, [posts]);

  useEffect(() => {
    if (!selectedId || typeof window === "undefined") {
      return;
    }

    const selectedIndex = posts.findIndex((post) => post.id === selectedId);
    if (selectedIndex === -1) {
      return;
    }

    const item = mobileItemRefs.current[selectedIndex];
    if (!item) {
      return;
    }

    requestAnimationFrame(() => {
      const rect = item.getBoundingClientRect();
      const viewportCenterY = window.innerHeight / 2;
      const itemCenterY = rect.top + rect.height / 2;
      const delta = itemCenterY - viewportCenterY;
      const targetY = Math.max(0, window.scrollY + delta);
      window.scrollTo(0, targetY);
    });
  }, [selectedId, posts]);

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
      <section className="mobile-feed space-y-1 pb-6">
        {posts.map((post, index) => (
          <article
            key={post.id}
            ref={(item) => {
              mobileItemRefs.current[index] = item;
            }}
            className="mobile-feed-item py-0"
          >
            <PostPreviewCarousel
              assets={post.assets}
              caption={post.caption}
              onOpenModal={() => router.push(`/photo/${post.id}`)}
              showCaptionOverlay={true}
            />
          </article>
        ))}
      </section>
    </>
  );
}
