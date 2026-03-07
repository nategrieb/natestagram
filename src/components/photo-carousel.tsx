"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PhotoCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
};

export function PhotoCarousel({ assets, caption }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  const label = useMemo(() => caption || "Photo post", [caption]);

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
    slideRefs.current[safeIndex]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
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
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          aria-label="Photo carousel"
          onScroll={updateIndexFromScroll}
        >
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              ref={(element) => {
                slideRefs.current[index] = element;
              }}
              className="relative h-[52vh] w-full shrink-0 snap-center sm:h-[64vh]"
              onFocus={() => setActiveIndex(index)}
            >
              <Image
                src={asset.imageUrl}
                alt={label}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 67vw"
                className="object-contain"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-300 bg-white/90 px-3 py-2 text-sm text-zinc-700 shadow-sm disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              disabled={activeIndex === assets.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-300 bg-white/90 px-3 py-2 text-sm text-zinc-700 shadow-sm disabled:opacity-40"
            >
              Next
            </button>
          </>
        ) : null}
      </div>

      {assets.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
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
