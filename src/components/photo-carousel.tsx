"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PhotoCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
};

export function PhotoCarousel({ assets, caption }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  const label = useMemo(() => caption || "Photo post", [caption]);

  const getSlideHeight = (asset: PostAsset) => {
    if (asset.width && asset.height) {
      return asset.height > asset.width ? "80vh" : "68vh";
    }

    return "72vh";
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideWidth = track.clientWidth;
    track.scrollTo({
      left: slideWidth * index,
      behavior,
    });
  };

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
    scrollToIndex(safeIndex);
  };

  const settleToNearestSlide = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) {
      return;
    }

    const index = Math.round(track.scrollLeft / slideWidth);
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
    scrollToIndex(safeIndex, "smooth");
  };

  const updateIndexFromScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) {
      return;
    }

    const index = Math.round(track.scrollLeft / slideWidth);
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);

    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(() => {
      settleToNearestSlide();
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="group relative overflow-hidden bg-transparent">
        <div
          ref={trackRef}
          className="carousel-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          aria-label="Photo carousel"
          onScroll={updateIndexFromScroll}
          onTouchEnd={settleToNearestSlide}
          onPointerUp={settleToNearestSlide}
          style={{ touchAction: "pan-x" }}
        >
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              className="carousel-slide relative w-full shrink-0"
              style={{ height: getSlideHeight(asset) }}
              onFocus={() => setActiveIndex(index)}
            >
              <Image
                src={asset.imageUrl}
                alt={label}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 67vw"
                className="pointer-events-none select-none object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {assets.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center gap-1.5 rounded-full border border-zinc-200/0 bg-white/0 px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-zinc-500/0 opacity-0 transition-all duration-200 group-hover:text-zinc-500/95 group-hover:opacity-100 hover:border-zinc-300/80 hover:bg-white/75 hover:text-zinc-700 disabled:opacity-0 md:inline-flex"
              aria-label="Previous photo"
            >
              <span aria-hidden="true">&larr;</span>
              <span>PREV</span>
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              disabled={activeIndex === assets.length - 1}
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1.5 rounded-full border border-zinc-200/0 bg-white/0 px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-zinc-500/0 opacity-0 transition-all duration-200 group-hover:text-zinc-500/95 group-hover:opacity-100 hover:border-zinc-300/80 hover:bg-white/75 hover:text-zinc-700 disabled:opacity-0 md:inline-flex"
              aria-label="Next photo"
            >
              <span>NEXT</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </>
        ) : null}
      </div>

      {assets.length > 1 ? (
        <div className="flex w-full items-center justify-center gap-2">
          {assets.map((asset, index) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex ? "w-8 bg-zinc-700" : "w-2.5 bg-zinc-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
