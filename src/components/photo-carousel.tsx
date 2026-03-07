"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PhotoCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
};

// Increase to switch slides earlier while swiping; decrease to require more drag.
const SWIPE_INDEX_ROUNDING = 0.5;

export function PhotoCarousel({ assets, caption }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

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

  const updateIndexFromScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) {
      return;
    }

    const index = Math.floor(track.scrollLeft / slideWidth + SWIPE_INDEX_ROUNDING);
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
  };

  return (
    <div className="space-y-4">
      <div className="group relative overflow-hidden bg-transparent">
        <div
          ref={trackRef}
          className="carousel-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          aria-label="Photo carousel"
          onScroll={updateIndexFromScroll}
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
              className="group absolute left-3 top-1/2 hidden -translate-y-1/2 items-center rounded-none border border-transparent px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-zinc-600 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
              aria-label="Previous photo"
            >
              <span>PREV</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-3 right-3 h-px origin-left scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100"
              />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              disabled={activeIndex === assets.length - 1}
              className="group absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-none border border-transparent px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-zinc-600 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
              aria-label="Next photo"
            >
              <span>NEXT</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-3 right-3 h-px origin-left scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100"
              />
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
