import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoCarousel } from "@/components/photo-carousel";
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

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link
          href="/"
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-600 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95"
          aria-label="Go to gallery"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="M3.5 3.5h5v5h-5zm8 0h5v5h-5zm-8 8h5v5h-5zm8 0h5v5h-5z"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
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
                className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
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
                className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
              />
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-5 px-4 pb-8 sm:px-8 lg:grid-cols-[2fr_1fr]">
        <PhotoCarousel assets={currentPost.assets} caption={currentPost.caption} />

        <article className="p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Caption</p>
          <p className="mt-4 whitespace-pre-wrap text-2xl leading-snug text-zinc-600 sm:text-[1.65rem]">
            {currentPost.caption || "No caption provided."}
          </p>
          {currentPost.taken_at ? (
            <p className="mt-8 text-sm text-zinc-500">
              Taken {new Date(currentPost.taken_at).toLocaleDateString()}
            </p>
          ) : null}
        </article>
      </section>

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
                className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-600/80 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
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
                className="absolute bottom-1.5 left-2 right-2 h-px origin-left scale-x-0 bg-zinc-600/80 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
              />
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
