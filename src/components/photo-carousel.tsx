"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PhotoCarouselProps = {
  assets: PostAsset[];
  caption?: string | null;
  captions?: (string | null)[];
  fullScreen?: boolean;
  vertical?: boolean;
  initialIndex?: number;
};

// Increase to switch slides earlier while swiping; decrease to require more drag.
const SWIPE_INDEX_ROUNDING = 0.5;

export function PhotoCarousel({ assets, caption, captions, fullScreen = true, vertical = false, initialIndex = 0 }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartScrollTopRef = useRef<number>(0);

  const label = useMemo(() => {
    if (captions && captions[activeIndex]) {
      return captions[activeIndex] || "Photo post";
    }
    return caption || "Photo post";
  }, [caption, captions, activeIndex]);

  const getSlideHeight = () => {
    return fullScreen ? "100vh" : "60vh";
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    if (vertical) {
      const slideHeight = track.clientHeight;
      track.scrollTo({
        top: slideHeight * index,
        behavior,
      });
    } else {
      const slideWidth = track.clientWidth;
      track.scrollTo({
        left: slideWidth * index,
        behavior,
      });
    }
  };

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
    scrollToIndex(safeIndex);
  };

  useEffect(() => {
    const safeIndex = Math.max(0, Math.min(initialIndex, assets.length - 1));

    // Wait one frame so dimensions are available before initial scroll.
    const frame = requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      if (vertical) {
        const slideHeight = track.clientHeight;
        if (slideHeight > 0) {
          track.scrollTo({ top: slideHeight * safeIndex, behavior: "auto" });
        }
      } else {
        const slideWidth = track.clientWidth;
        if (slideWidth > 0) {
          track.scrollTo({ left: slideWidth * safeIndex, behavior: "auto" });
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [initialIndex, assets.length, vertical]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return;

    // Horizontal mode uses native touch scrolling for smoother swipes.
    if (!vertical) return;

    touchStartYRef.current = e.touches[0].clientY;
    touchStartScrollTopRef.current = track.scrollTop;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return;

    if (!vertical) return;

    if (touchStartYRef.current === null) return;
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartYRef.current - touchY;
    track.scrollTop = touchStartScrollTopRef.current + deltaY;
  };

  const handleTouchEnd = () => {
    if (!vertical) return;

    touchStartYRef.current = null;
    settleToNearestSlide("smooth");
  };

  const settleToNearestSlide = (behavior: ScrollBehavior = "auto") => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    if (vertical) {
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
    } else {
      const slideWidth = track.clientWidth;
      if (slideWidth <= 0) {
        return;
      }

      const index = Math.round(track.scrollLeft / slideWidth);
      const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
      const targetLeft = safeIndex * slideWidth;

      setActiveIndex(safeIndex);

      if (Math.abs(track.scrollLeft - targetLeft) > 1) {
        track.scrollTo({ left: targetLeft, behavior });
      }
    }
  };

  const updateIndexFromScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    if (vertical) {
      const slideHeight = track.clientHeight;
      if (slideHeight <= 0) {
        return;
      }

      const index = Math.floor(track.scrollTop / slideHeight + SWIPE_INDEX_ROUNDING);
      const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
      setActiveIndex(safeIndex);
    } else {
      const slideWidth = track.clientWidth;
      if (slideWidth <= 0) {
        return;
      }

      const index = Math.floor(track.scrollLeft / slideWidth + SWIPE_INDEX_ROUNDING);
      const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
      setActiveIndex(safeIndex);
    }

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
        className={`carousel-track flex scroll-smooth ${fullScreen ? 'h-full' : 'h-[60vh]'} ${
          vertical
            ? 'flex-col snap-y snap-mandatory overflow-y-auto overflow-x-hidden touch-pan-y'
            : 'snap-x snap-mandatory overflow-x-auto overflow-y-hidden touch-pan-x'
        }`}
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
            className={`carousel-slide relative ${vertical ? 'h-full' : 'w-full h-full'} shrink-0`}
            style={{ height: getSlideHeight() }}
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
            className={`group absolute z-20 inline-flex h-11 w-11 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 active:scale-95 active:border-zinc-300 active:bg-white disabled:cursor-not-allowed disabled:opacity-30 ${
              vertical ? 'top-4 left-1/2 -translate-x-1/2' : 'left-4 top-1/2 -translate-y-1/2'
            }`}
            aria-label="Previous photo"
          >
            <span aria-hidden="true" className="text-xl leading-none">{vertical ? "↑" : "←"}</span>
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-600 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
            />
          </button>

          <button
            type="button"
            onClick={() => goToSlide(activeIndex + 1)}
            disabled={activeIndex === assets.length - 1}
            className={`group absolute z-20 inline-flex h-11 w-11 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 active:scale-95 active:border-zinc-300 active:bg-white disabled:cursor-not-allowed disabled:opacity-30 ${
              vertical ? 'bottom-4 left-1/2 -translate-x-1/2' : 'right-4 top-1/2 -translate-y-1/2'
            }`}
            aria-label="Next photo"
          >
            <span aria-hidden="true" className="text-xl leading-none">{vertical ? "↓" : "→"}</span>
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-600 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
            />
          </button>
        </>
      )}

      {vertical && (caption || (captions && captions[activeIndex])) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white z-10">
          <p className="text-sm">{caption || captions?.[activeIndex]}</p>
        </div>
      )}
    </div>
  );
}
