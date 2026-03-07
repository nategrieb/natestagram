"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { PostPreviewCarousel } from "@/components/post-preview-carousel";
import type { PhotoPost } from "@/types/photo";

type HomeGalleryProps = {
  posts: PhotoPost[];
};

const MOBILE_SETTLE_DELAY_MS = 110;
const MOBILE_SETTLE_COMMIT_DISTANCE_PX = 140;
const MOBILE_SETTLE_LOCK_MS = 280;

export function HomeGallery({ posts }: HomeGalleryProps) {
  const mobileItemRefs = useRef<Array<HTMLElement | null>>([]);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSettlingRef = useRef(false);
  const lastSnappedYRef = useRef<number | null>(null);

  const [mode, setMode] = useState<"grid" | "scroll">(() => {
    if (typeof window === "undefined") {
      return "scroll";
    }

    const stored = sessionStorage.getItem("natestagram:return-home");
    if (!stored) {
      return "scroll";
    }

    try {
      const parsed = JSON.parse(stored) as { mode?: "grid" | "scroll" };
      if (parsed.mode === "grid" || parsed.mode === "scroll") {
        return parsed.mode;
      }
    } catch {
      // Ignore malformed persisted mode and use default.
    }

    return "scroll";
  });

  const hasPosts = useMemo(() => posts.length > 0, [posts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = sessionStorage.getItem("natestagram:return-home");
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { y?: number };

      const targetY = typeof parsed.y === "number" ? parsed.y : 0;
      requestAnimationFrame(() => {
        window.scrollTo(0, Math.max(0, targetY));
      });
    } catch {
      // Ignore malformed persisted position.
    }

    sessionStorage.removeItem("natestagram:return-home");
  }, []);

  useEffect(() => {
    if (mode !== "scroll") {
      return;
    }

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
      window.scrollTo({ top: targetY, behavior: "smooth" });
      lastSnappedYRef.current = targetY;
      window.setTimeout(() => {
        isSettlingRef.current = false;
      }, MOBILE_SETTLE_LOCK_MS);
    };

    const onScroll = () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }

      settleTimerRef.current = setTimeout(runSettle, MOBILE_SETTLE_DELAY_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    lastSnappedYRef.current = window.scrollY;

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, [mode]);

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
              href={`/photo/${post.id}`}
            />
            <div className="mt-2 px-1">
              <p className="line-clamp-1 text-sm text-zinc-500">{post.caption || "Untitled post"}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
