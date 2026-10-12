import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoCarousel } from "@/components/photo-carousel";
import { PhotoGrid } from "@/components/photo-grid";
import { ShareButton } from "@/components/share-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogoLink } from "@/components/site-logo-link";
import { getPublicPostWithNeighbors } from "@/lib/photos";
import type { PhotoPost } from "@/types/photo";

// Photos change rarely; uploads also call revalidatePath.
export const revalidate = 60;

// Render photo pages on first request, then serve them from the ISR cache.
export function generateStaticParams() {
  return [];
}

type PhotoPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicPostWithNeighbors(id);

  if (!result) {
    return {};
  }

  const { post } = result;
  const cover = post.assets[0];
  const description =
    post.caption?.trim() ||
    (post.assets.length > 1 ? `${post.assets.length} photos` : "A photo on NATESTAGRAM");
  const title = "○ NATESTAGRAM";
  const images = cover
    ? [{ url: cover.imageUrl, width: cover.width ?? undefined, height: cover.height ?? undefined, alt: description }]
    : undefined;

  return {
    description,
    alternates: { canonical: `/photo/${post.id}` },
    openGraph: { title, description, siteName: title, type: "article", url: `/photo/${post.id}`, images },
    twitter: { card: "summary_large_image", title, description, images: cover ? [cover.imageUrl] : undefined },
  };
}

const postNavClass =
  "inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 active:scale-95";

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const result = await getPublicPostWithNeighbors(id);

  if (!result) {
    notFound();
  }

  const { post: currentPost, previousId, nextId, more } = result;

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Desktop header; on phones the viewer fills the screen and has its own overlay bar. */}
      <div className="mx-auto hidden w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8 md:flex">
        <SiteLogoLink />
        <div className="flex items-center gap-1">
          <ShareButton className="text-zinc-700 hover:text-zinc-950" />
          {previousId ? (
            <Link href={`/photo/${previousId}`} className={postNavClass} aria-label="Newer post">
              <span aria-hidden="true">&larr;</span> Newer
            </Link>
          ) : null}
          {nextId ? (
            <Link href={`/photo/${nextId}`} className={postNavClass} aria-label="Older post">
              Older <span aria-hidden="true">&rarr;</span>
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-5 md:grid-cols-[2fr_1fr] md:px-8 md:pb-8">
        <PhotoCarousel
          assets={currentPost.assets}
          caption={currentPost.caption}
          className="h-[100dvh] md:h-[78vh]"
        >
          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-2 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))] text-white md:hidden">
            <Link href="/" aria-label="Back to gallery" className="inline-flex h-11 w-11 items-center justify-center text-2xl active:scale-95">
              &larr;
            </Link>
            <ShareButton className="text-white" />
          </div>
        </PhotoCarousel>

        <article className="flex flex-col px-4 pb-4 sm:px-6 md:justify-center md:p-8">
          <div className="space-y-4 md:space-y-6">
            {currentPost.caption ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 md:text-base">
                {currentPost.caption}
              </p>
            ) : null}

            <nav aria-label="Other posts" className="flex items-center justify-between border-y border-zinc-200/70 py-1">
              {previousId ? (
                <Link href={`/photo/${previousId}`} className={postNavClass}>
                  <span aria-hidden="true">&larr;</span> Newer post
                </Link>
              ) : (
                <span />
              )}
              {nextId ? (
                <Link href={`/photo/${nextId}`} className={postNavClass}>
                  Older post <span aria-hidden="true">&rarr;</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>

            <PhotoMetadata post={currentPost} />
          </div>
        </article>
      </section>

      {more.length > 0 && (
        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
            <h2 className="mb-6 text-lg font-semibold text-zinc-900">Continue browsing</h2>
            <PhotoGrid posts={more} />
            <Link href="/" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-zinc-700 hover:text-zinc-950">
              View all photos &rarr;
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
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
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-400 [&::-webkit-details-marker]:hidden">
        Details
        <span aria-hidden="true" className="text-base transition-transform group-open:rotate-45">+</span>
      </summary>

      <div className="space-y-3 pt-2">
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
    </details>
  );
}
