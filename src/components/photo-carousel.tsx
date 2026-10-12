"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PhotoCarouselProps = {
  assets: PostAsset[];
  caption?: string | null;
  /** Tailwind sizing classes for the viewer, e.g. "h-[100dvh] md:h-[75vh]". */
  className?: string;
  /** Overlay content (e.g. a top bar) rendered above the slides. */
  children?: React.ReactNode;
  /** Keep ?i=<n> in the URL in sync with the visible photo so it can be shared. */
  syncUrl?: boolean;
};

const URL_PARAM = "i";

function readIndexFromUrl(max: number) {
  const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(parsed - 1, max));
}

export function PhotoCarousel({ assets, caption, className = "h-[60vh]", children, syncUrl = true }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const trackRef = useRef<HTMLDivElement | null>(null);
  const syncedIndexRef = useRef(0);
  const lastIndex = assets.length - 1;

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollTo({ left: track.clientWidth * index, behavior });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      scrollToIndex(Math.max(0, Math.min(index, lastIndex)), "smooth");
    },
    [lastIndex, scrollToIndex]
  );

  // Jump to the photo named in the URL (?i=3) on first mount.
  useEffect(() => {
    if (!syncUrl) {
      return;
    }
    const initial = readIndexFromUrl(lastIndex);
    if (initial > 0) {
      syncedIndexRef.current = initial;
      // The resulting scroll event updates activeIndex.
      scrollToIndex(initial, "instant");
    }
  }, [lastIndex, scrollToIndex, syncUrl]);

  // Reflect the visible photo in the URL without adding history entries.
  const syncUrlToIndex = (index: number) => {
    if (!syncUrl || syncedIndexRef.current === index) {
      return;
    }
    syncedIndexRef.current = index;
    const url = new URL(window.location.href);
    if (index === 0) {
      url.searchParams.delete(URL_PARAM);
    } else {
      url.searchParams.set(URL_PARAM, String(index + 1));
    }
    window.history.replaceState(window.history.state, "", url);
  };

  // Arrow keys on desktop.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) {
        return;
      }
      if (event.key === "ArrowLeft") {
        goTo(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        goTo(activeIndex + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, goTo]);

  // Native scroll-snap does the swiping; we only observe which slide is showing.
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0) {
      return;
    }
    const index = Math.round(track.scrollLeft / track.clientWidth);
    const safeIndex = Math.max(0, Math.min(index, lastIndex));
    setActiveIndex(safeIndex);
    syncUrlToIndex(safeIndex);
  };

  const markLoaded = (id: string) => {
    setLoaded((current) => (current.has(id) ? current : new Set(current).add(id)));
  };

  const arrowClass =
    "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/40 text-xl text-white transition-opacity hover:bg-black/60 active:scale-95 disabled:opacity-0 md:inline-flex";

  return (
    <div className={`relative w-full overflow-hidden bg-zinc-950 ${className}`}>
      <div
        ref={trackRef}
        className="carousel-track flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden touch-pan-x"
        role="region"
        aria-roledescription="carousel"
        aria-label="Photos in this post"
        onScroll={handleScroll}
      >
        {assets.map((asset, index) => (
          <div
            key={asset.id}
            className="carousel-slide relative h-full w-full shrink-0"
            style={{ backgroundColor: loaded.has(asset.id) ? undefined : (asset.dominant_color ?? undefined) }}
            role="group"
            aria-roledescription="slide"
            aria-label={`Photo ${index + 1} of ${assets.length}`}
          >
            <Image
              src={asset.imageUrl}
              alt={caption || "Photo post"}
              fill
              priority={index === 0}
              loading={index === 0 ? undefined : Math.abs(index - activeIndex) <= 2 ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, 67vw"
              onLoad={() => markLoaded(asset.id)}
              className="pointer-events-none select-none object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {children}

      {assets.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={`${arrowClass} left-3`}
            aria-label="Previous photo"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === lastIndex}
            className={`${arrowClass} right-3`}
            aria-label="Next photo"
          >
            &rarr;
          </button>

          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
            {activeIndex + 1} / {assets.length}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-1.5">
            {assets.map((asset, index) => (
              <span
                key={asset.id}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
