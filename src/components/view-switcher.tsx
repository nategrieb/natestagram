"use client";

import { useState } from "react";

import { HomeGallery } from "@/components/home-gallery";
import { PhotoGrid } from "@/components/photo-grid";
import type { PhotoPost } from "@/types/photo";

type ViewSwitcherProps = {
  posts: PhotoPost[];
};

export function ViewSwitcher({ posts }: ViewSwitcherProps) {
  const [view, setView] = useState<'grid' | 'timeline'>('grid');

  return (
    <>
      <div className="mb-6 flex justify-center gap-4 sm:mb-8">
        <button
          type="button"
          onClick={() => setView('grid')}
          className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-400 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95 ${
            view === 'grid' ? 'border-zinc-300/80 bg-white/70 text-zinc-800' : ''
          }`}
          aria-label="Switch to grid view"
          title="Grid"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
          />
        </button>
        <button
          type="button"
          onClick={() => setView('timeline')}
          className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-400 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95 ${
            view === 'timeline' ? 'border-zinc-300/80 bg-white/70 text-zinc-800' : ''
          }`}
          aria-label="Switch to timeline view"
          title="Timeline"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
          />
        </button>
      </div>

      {view === 'grid' ? (
        <PhotoGrid posts={posts} />
      ) : (
        <HomeGallery posts={posts} />
      )}
    </>
  );
}