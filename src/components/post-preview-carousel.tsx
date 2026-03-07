"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PostPreviewCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
  href?: string;
};

const SWIPE_INDEX_ROUNDING = 0.5;
const TAP_DISTANCE_THRESHOLD = 10;

export function PostPreviewCarousel({ assets, caption, href }: PostPreviewCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
    setActiveIndex(Math.max(0, Math.min(index, assets.length - 1)));
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!href || !touchStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    touchStartRef.current = null;

    const isTap = deltaX < TAP_DISTANCE_THRESHOLD && deltaY < TAP_DISTANCE_THRESHOLD;
    if (isTap) {
      router.push(href);
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="carousel-track relative flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        onScroll={updateIndexFromScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-x" }}
      >
        {assets.map((asset, index) => (
          <div key={asset.id} className="carousel-slide relative w-full shrink-0 bg-white">
            <div className="relative w-full" style={{ aspectRatio: asset.width && asset.height ? `${asset.width}/${asset.height}` : "4/5" }}>
              <Image
                src={asset.imageUrl}
                alt={caption || "Photo post"}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        ))}

        {assets.length > 1 ? (
          <div className="pointer-events-none absolute right-2 top-2 bg-zinc-800/70 px-2 py-0.5 text-[10px] text-zinc-100">
            {activeIndex + 1}/{assets.length}
          </div>
        ) : null}
      </div>

      {assets.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5">
          {assets.map((asset, index) => (
            <span
              key={asset.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? "w-5 bg-zinc-700" : "w-1.5 bg-zinc-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
