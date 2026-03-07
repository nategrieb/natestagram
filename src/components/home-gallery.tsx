"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PhotoCarousel } from "@/components/photo-carousel";
import { PostPreviewCarousel } from "@/components/post-preview-carousel";
import type { PhotoPost } from "@/types/photo";

type HomeGalleryProps = {
  posts: PhotoPost[];
  selectedId?: string;
};

const MOBILE_SETTLE_DELAY_MS = 110;
const MOBILE_SETTLE_GRAVITY_RADIUS_PX = 30;
const MOBILE_SETTLE_COMMIT_DISTANCE_PX = 40;
const MOBILE_SETTLE_MAX_VELOCITY_PX_PER_MS = 0.4;
const MOBILE_SETTLE_LOCK_MS = 300;

export function HomeGallery({ posts, selectedId }: HomeGalleryProps) {
  const mobileItemRefs = useRef<Array<HTMLElement | null>>([]);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSettlingRef = useRef(false);
  const lastSnappedYRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const lastVelocityRef = useRef(0);

  const [modalPost, setModalPost] = useState<PhotoPost | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const runSettle = () => {
      if (isSettlingRef.current) {
        return;
      }

      const candidates = mobileItemRefs.current.filter(
        (item): item is HTMLElement => item instanceof HTMLElement
      );

      if (candidates.length === 0) {
        return;
      }

      const viewportCenterY = window.innerHeight / 2;
      let bestDelta = Number.POSITIVE_INFINITY;

      for (const item of candidates) {
        const rect = item.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        const delta = itemCenterY - viewportCenterY;

        if (Math.abs(delta) < Math.abs(bestDelta)) {
          bestDelta = delta;
        }
      }

      if (!Number.isFinite(bestDelta)) {
        return;
      }

      if (Math.abs(bestDelta) > MOBILE_SETTLE_GRAVITY_RADIUS_PX) {
        return;
      }

      if (Math.abs(lastVelocityRef.current) > MOBILE_SETTLE_MAX_VELOCITY_PX_PER_MS) {
        return;
      }

      const rawTargetY = Math.max(0, window.scrollY + bestDelta);
      let targetY = rawTargetY;

      // Light roulette-style retraction for short drags near the current centered item.
      if (
        lastSnappedYRef.current !== null &&
        Math.abs(rawTargetY - lastSnappedYRef.current) < MOBILE_SETTLE_COMMIT_DISTANCE_PX
      ) {
        targetY = lastSnappedYRef.current;
      }

      if (Math.abs(targetY - window.scrollY) < 1) {
        return;
      }

      isSettlingRef.current = true;
      window.scrollTo({ top: targetY, behavior: "auto" });
      lastSnappedYRef.current = targetY;
      window.setTimeout(() => {
        isSettlingRef.current = false;
      }, MOBILE_SETTLE_LOCK_MS);
    };

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;

      if (lastScrollTimeRef.current > 0) {
        const elapsed = now - lastScrollTimeRef.current;
        if (elapsed > 0) {
          lastVelocityRef.current = (y - lastScrollYRef.current) / elapsed;
        }
      }

      lastScrollYRef.current = y;
      lastScrollTimeRef.current = now;

      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }

      settleTimerRef.current = setTimeout(runSettle, MOBILE_SETTLE_DELAY_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    lastSnappedYRef.current = window.scrollY;
    lastScrollYRef.current = window.scrollY;
    lastScrollTimeRef.current = performance.now();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

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
      <section className="mobile-feed pb-16">
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-1/2 z-30 -translate-y-1/2">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-2">
            <span className="h-px w-5 bg-zinc-500/55" />
            <span className="h-px w-5 bg-zinc-500/55" />
          </div>
        </div>
        {posts.map((post, index) => (
          <article
            key={post.id}
            ref={(item) => {
              mobileItemRefs.current[index] = item;
            }}
            className="mobile-feed-item py-2"
          >
            <PostPreviewCarousel
              assets={post.assets}
              caption={post.caption}
              onOpenModal={() => setModalPost(post)}
            />
            <div className="mt-2 px-1">
              <p className="line-clamp-1 text-sm text-zinc-500">{post.caption || "Untitled post"}</p>
            </div>
          </article>
        ))}
      </section>

      {modalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="relative max-h-full max-w-full">
            <PhotoCarousel
              assets={modalPost.assets}
              caption={modalPost.caption}
            />
            <button
              type="button"
              onClick={() => setModalPost(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
