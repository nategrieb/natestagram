"use client";

import Image from "next/image";
import { useState } from "react";

import type { PostAsset } from "@/types/photo";

type PostPreviewCarouselProps = {
  assets: PostAsset[];
  caption: string | null;
  onOpenModal?: (initialIndex: number) => void;
  showCaptionOverlay?: boolean;
};

export function PostPreviewCarousel({ assets, caption, onOpenModal, showCaptionOverlay = false }: PostPreviewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentAsset = assets[activeIndex] ?? assets[0];
  const canOpenModal = Boolean(onOpenModal);
  const frameStyle = showCaptionOverlay
    ? undefined
    : currentAsset?.width && currentAsset?.height
      ? { aspectRatio: `${currentAsset.width}/${currentAsset.height}` }
      : { aspectRatio: "4/5" };

  const frameClassName = `relative w-full overflow-hidden bg-neutral-950 ${showCaptionOverlay ? "h-[84svh] sm:h-[88svh]" : ""}`;
  const imageClassName = showCaptionOverlay ? "object-cover" : "object-contain";

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, assets.length - 1));
    setActiveIndex(safeIndex);
  };

  const openModal = () => {
    if (canOpenModal && onOpenModal) {
      onOpenModal(activeIndex);
    }
  };

  return (
    <div className={showCaptionOverlay ? "space-y-0" : "space-y-2"}>
      <div className="relative overflow-hidden">
        {canOpenModal ? (
          <button
            type="button"
            onClick={openModal}
            className="group relative block w-full overflow-hidden text-left transition-transform duration-150 active:scale-[0.992]"
            aria-label="Open post details"
          >
            <div className={frameClassName} style={frameStyle}>
              {currentAsset ? (
                <Image
                  src={currentAsset.imageUrl}
                  alt={caption || "Photo post"}
                  fill
                  priority={activeIndex === 0}
                  sizes="100vw"
                  className={imageClassName}
                />
              ) : null}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-150 group-active:opacity-[0.12]"
            />
            {showCaptionOverlay ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="line-clamp-2 text-sm text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                  {caption || "Untitled post"}
                </p>
              </div>
            ) : null}
          </button>
        ) : (
          <div className="relative block w-full overflow-hidden">
            <div className={frameClassName} style={frameStyle}>
              {currentAsset ? (
                <Image
                  src={currentAsset.imageUrl}
                  alt={caption || "Photo post"}
                  fill
                  priority={activeIndex === 0}
                  sizes="100vw"
                  className={imageClassName}
                />
              ) : null}
            </div>
            {showCaptionOverlay ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="line-clamp-2 text-sm text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                  {caption || "Untitled post"}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {assets.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="group absolute inset-y-0 left-0 z-20 inline-flex w-[18%] max-w-[84px] items-center justify-start bg-gradient-to-r from-black/10 to-transparent pl-2 text-zinc-100 transition-all duration-200 active:bg-black/20 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous photo"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 items-center justify-center border border-zinc-100/50 bg-zinc-900/35 text-xl leading-none"
              >
                &larr;
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-100/90 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
              />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              disabled={activeIndex === assets.length - 1}
              className="group absolute inset-y-0 right-0 z-20 inline-flex w-[18%] max-w-[84px] items-center justify-end bg-gradient-to-l from-black/10 to-transparent pr-2 text-zinc-100 transition-all duration-200 active:bg-black/20 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next photo"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 items-center justify-center border border-zinc-100/50 bg-zinc-900/35 text-xl leading-none"
              >
                &rarr;
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-100/90 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
              />
            </button>

            <div className="pointer-events-none absolute right-2 top-2 bg-zinc-800/70 px-2 py-0.5 text-[10px] text-zinc-100">
              {activeIndex + 1}/{assets.length}
            </div>
          </>
        ) : null}
      </div>

      {assets.length > 1 && !showCaptionOverlay ? (
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
