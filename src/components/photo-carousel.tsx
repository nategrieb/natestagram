"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PhotoCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
  fullScreen?: boolean;
};

// Increase to switch slides earlier while swiping; decrease to require more drag.
const SWIPE_INDEX_ROUNDING = 0.5;

export function PhotoCarousel({ assets, caption, fullScreen = true }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartScrollTopRef = useRef<number>(0);

  const label = useMemo(() => caption || "Photo post", [caption]);

  const getSlideHeight = (_asset: PostAsset) => {
    return fullScreen ? "100vh" : "60vh";
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideHeight = track.clientHeight;
    track.scrollTo({
      top: slideHeight * index,
      behavior,
    });
  };

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
    scrollToIndex(safeIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartScrollTopRef.current = track.scrollTop;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const track = trackRef.current;
    if (!track || touchStartYRef.current === null) return;
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartYRef.current - touchY;
    track.scrollTop = touchStartScrollTopRef.current + deltaY;
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
    settleToNearestSlide("smooth");
  };

  const settleToNearestSlide = (behavior: ScrollBehavior = "auto") => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideHeight = track.clientHeight;
    if (slideHeight <= 0) {
      return;
    }

    const index = Math.round(track.scrollTop / slideHeight);
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    const targetTop = safeIndex * slideHeight;

    setActiveIndex(safeIndex);

    if (Math.abs(track.scrollTop - targetTop) > 1) {
      track.scrollTo({ top: targetTop, behavior });
    }
  };

  const updateIndexFromScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideHeight = track.clientHeight;
    if (slideHeight <= 0) {
      return;
    }

    const index = Math.floor(track.scrollTop / slideHeight + SWIPE_INDEX_ROUNDING);
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);

    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
    }

    // Adds a gentle "gravity" settle after momentum slows down.
    settleTimerRef.current = setTimeout(() => {
      settleToNearestSlide("auto");
    }, 90);
  };

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden bg-transparent ${fullScreen ? 'h-screen w-screen' : 'w-full'}`}>
      <div
        ref={trackRef}
        className={`carousel-track flex flex-col snap-y snap-mandatory overflow-y-auto scroll-smooth ${fullScreen ? 'h-full' : 'h-[60vh]'}`}
        aria-label="Photo carousel"
        onScroll={updateIndexFromScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerUp={() => settleToNearestSlide("smooth")}
      >
        {assets.map((asset, index) => (
          <div
            key={asset.id}
            className="carousel-slide relative h-full shrink-0"
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

      {assets.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="group absolute top-4 left-1/2 -translate-x-1/2 inline-flex h-11 w-11 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 active:scale-95 active:border-zinc-300 active:bg-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous photo"
          >
            <span aria-hidden="true" className="text-xl leading-none">&uarr;</span>
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-600 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
            />
          </button>

          <button
            type="button"
            onClick={() => goToSlide(activeIndex + 1)}
            disabled={activeIndex === assets.length - 1}
            className="group absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex h-11 w-11 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 active:scale-95 active:border-zinc-300 active:bg-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next photo"
          >
            <span aria-hidden="true" className="text-xl leading-none">&darr;</span>
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-600 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
            />
          </button>
        </>
      )}
    </div>
  );
}
