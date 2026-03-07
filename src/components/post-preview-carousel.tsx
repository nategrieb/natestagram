"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import type { PostAsset } from "@/types/photo";

type PostPreviewCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
};

export function PostPreviewCarousel({ assets, caption }: PostPreviewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

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

    track.scrollTo({
      left: safeIndex * slideWidth,
      behavior: "smooth",
    });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) {
      return;
    }

    const index = Math.round(track.scrollLeft / slideWidth);
    setActiveIndex(Math.max(0, Math.min(index, assets.length - 1)));
  };

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="carousel-track flex snap-x snap-mandatory overflow-x-auto"
        onScroll={onScroll}
        onTouchEnd={settleToNearestSlide}
        onPointerUp={settleToNearestSlide}
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
