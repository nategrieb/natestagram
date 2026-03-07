import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoCarousel } from "@/components/photo-carousel";
import { PhotoGrid } from "@/components/photo-grid";
import { getPublicPosts } from "@/lib/photos";

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
        <Link
          href="/"
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-600 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95"
          aria-label="Go to gallery"
        >
          <img
            src="/square-4-grid.svg"
            alt=""
            className="h-4 w-4"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
          />
        </Link>
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
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-green-800 to-green-600"></div>
                  <div className="font-bold text-sm md:text-base text-zinc-900 tracking-wider">
                    NATESTAGRAM
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-zinc-800">
                  {currentPost.caption}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 text-zinc-400">
                <p className="text-sm">No caption provided</p>
              </div>
            )}

            {/* Photo Info Section */}
            <div className="border-t border-zinc-100 pt-4 md:pt-6 space-y-3 md:space-y-4">
              <h3 className="text-xs md:text-sm font-semibold text-zinc-900 uppercase tracking-wide">Photo Details</h3>

              {currentPost.taken_at && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs md:text-sm text-zinc-600">
                    Taken on {new Date(currentPost.taken_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs md:text-sm text-zinc-600">
                  {currentPost.assets.length} photo{currentPost.assets.length !== 1 ? 's' : ''} in this post
                </p>
              </div>
            </div>
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
