import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoCarousel } from "@/components/photo-carousel";
import { PhotoGrid } from "@/components/photo-grid";
import { SiteLogoLink } from "@/components/site-logo-link";
import { getPublicPosts } from "@/lib/photos";
import type { PhotoPost } from "@/types/photo";

type PhotoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const posts = await getPublicPosts();
  const currentIndex = posts.findIndex((post) => post.id === id);

  if (currentIndex === -1) {
    notFound();
  }

  const currentPost = posts[currentIndex];
  const previousPost = posts[currentIndex - 1] ?? null;
  const nextPost = posts[currentIndex + 1] ?? null;

  // Filter out the current post for the grid below
  const remainingPosts = posts.filter((post) => post.id !== currentPost.id);

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <SiteLogoLink />
        <div className="hidden gap-2 text-sm md:flex">
          {previousPost ? (
            <Link
              href={`/photo/${previousPost.id}`}
              className="group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-600 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95"
              aria-label="Previous post"
            >
              <span aria-hidden="true" className="text-lg leading-none">&larr;</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
              />
            </Link>
          ) : null}
          {nextPost ? (
            <Link
              href={`/photo/${nextPost.id}`}
              className="group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-600 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95"
              aria-label="Next post"
            >
              <span aria-hidden="true" className="text-lg leading-none">&rarr;</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
              />
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-5 px-4 pb-16 sm:px-8 md:grid-cols-[2fr_1fr] md:pb-8">
        <PhotoCarousel assets={currentPost.assets} caption={currentPost.caption} fullScreen={false} />

        <article className="flex flex-col p-4 sm:p-6 md:justify-center md:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Caption Section */}
            {currentPost.caption ? (
              <div className="space-y-3 md:space-y-4">
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-zinc-800">
                  {currentPost.caption}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 text-zinc-400">
                <p className="text-sm">No caption provided</p>
              </div>
            )}

            {/* Photo Details */}
            <PhotoMetadata post={currentPost} />
          </div>
        </article>
      </section>

      {/* Continue browsing grid */}
      {remainingPosts.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
            <h2 className="mb-6 text-lg font-semibold text-zinc-900">Continue browsing</h2>
            <PhotoGrid posts={remainingPosts} />
          </div>
        </section>
      )}

      {previousPost || nextPost ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-5">
            {previousPost ? (
              <Link
                href={`/photo/${previousPost.id}`}
                className="group relative inline-flex h-12 w-12 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 active:scale-95 active:border-zinc-300/80 active:bg-white active:text-zinc-900"
                aria-label="Previous post"
              >
                <span aria-hidden="true" className="text-2xl leading-none">&larr;</span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-600/80 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
                />
              </Link>
            ) : null}
            {nextPost ? (
              <Link
                href={`/photo/${nextPost.id}`}
                className="group relative inline-flex h-12 w-12 items-center justify-center rounded-none border border-transparent text-zinc-700 transition-all duration-200 active:scale-95 active:border-zinc-300/80 active:bg-white active:text-zinc-900"
                aria-label="Next post"
              >
                <span aria-hidden="true" className="text-2xl leading-none">&rarr;</span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-600/80 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
                />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center text-zinc-400">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-700 break-words">{value}</span>
      </div>
    </div>
  );
}

function PhotoMetadata({ post }: { post: PhotoPost }) {
  const first = post.assets[0];
  const hasCamera = first?.camera_make || first?.camera_model;
  const hasAnyExif = hasCamera || first?.focal_length || first?.aperture || first?.shutter_speed || first?.iso;
  const hasAnyInfo = post.taken_at || post.assets.length > 1 || (first?.width && first?.height) || first?.dominant_color || hasAnyExif;

  if (!hasAnyInfo) return null;

  return (
    <div className="border-t border-zinc-100 pt-4 md:pt-6 space-y-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Details</h3>

      <div className="space-y-3">
        {post.taken_at && (
          <MetaRow
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Date Taken"
            value={new Date(post.taken_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          />
        )}

        {hasCamera && (
          <MetaRow
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Camera"
            value={[first?.camera_make, first?.camera_model].filter(Boolean).join(" ")}
          />
        )}

        {first?.focal_length && (
          <MetaRow
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M3 12h2m14 0h2m-3.22-6.78-1.42 1.42M6.64 17.36l-1.42 1.42M17.36 17.36l-1.42-1.42M6.64 6.64 5.22 5.22" />
              </svg>
            }
            label="Focal Length"
            value={first.focal_length}
          />
        )}

        {(first?.aperture || first?.shutter_speed || first?.iso) && (
          <MetaRow
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.14 12.14.71.71M3 12H4m16 0h1M4.22 19.78l.71-.71m12.14-12.14.71-.71" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            }
            label="Exposure"
            value={
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {first?.aperture && <span>{first.aperture}</span>}
                {first?.shutter_speed && <span>{first.shutter_speed}</span>}
                {first?.iso && <span>ISO&thinsp;{first.iso}</span>}
              </span>
            }
          />
        )}

        {first?.width && first?.height && (
          <MetaRow
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0 5-5m11 5-5-5m5 5v-4m0 4h-4" />
              </svg>
            }
            label="Resolution"
            value={`${first.width.toLocaleString()} × ${first.height.toLocaleString()} px`}
          />
        )}

        {first?.dominant_color && (
          <MetaRow
            icon={
              <span
                className="block h-4 w-4 rounded-sm border border-zinc-200"
                style={{ backgroundColor: first.dominant_color }}
              />
            }
            label="Dominant Color"
            value={
              <span className="flex items-center gap-2">
                <span className="font-mono">{first.dominant_color.toUpperCase()}</span>
              </span>
            }
          />
        )}

        {post.assets.length > 1 && (
          <MetaRow
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Photos"
            value={`${post.assets.length} photos in this post`}
          />
        )}
      </div>
    </div>
  );
}
