"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PostAsset } from "@/types/photo";

type PostPreviewCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
  href?: string;
};

export function PostPreviewCarousel({ assets, caption, href }: PostPreviewCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentAsset = assets[activeIndex] ?? assets[0];

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
  };

  const openPost = () => {
    if (!href) {
      return;
    }

    // Keep a short press-feedback frame before route transition.
    window.setTimeout(() => {
      router.push(href);
    }, 85);
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden">
        <button
          type="button"
          onClick={openPost}
          className="group relative block w-full overflow-hidden text-left transition-transform duration-150 active:scale-[0.992]"
          aria-label="Open post"
        >
          <div
            className="relative w-full"
            style={{
              aspectRatio:
                currentAsset?.width && currentAsset?.height
                  ? `${currentAsset.width}/${currentAsset.height}`
                  : "4/5",
            }}
          >
            {currentAsset ? (
              <Image
                src={currentAsset.imageUrl}
                alt={caption || "Photo post"}
                fill
                priority={activeIndex === 0}
                sizes="100vw"
                className="object-contain"
              />
            ) : null}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-150 group-active:opacity-[0.12]"
          />
        </button>

        {assets.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="group absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-900 active:scale-95 active:border-zinc-300/80 active:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous photo"
            >
              <span aria-hidden="true" className="text-xl leading-none">&larr;</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-600/80 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
              />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              disabled={activeIndex === assets.length - 1}
              className="group absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-900 active:scale-95 active:border-zinc-300/80 active:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next photo"
            >
              <span aria-hidden="true" className="text-xl leading-none">&rarr;</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-600/80 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
              />
            </button>

            <div className="pointer-events-none absolute right-2 top-2 bg-zinc-800/70 px-2 py-0.5 text-[10px] text-zinc-100">
              {activeIndex + 1}/{assets.length}
            </div>
          </>
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
