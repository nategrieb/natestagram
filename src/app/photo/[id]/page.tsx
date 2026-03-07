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
      <div className="backdrop-orb" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link
          href="/"
          className="rounded-full border border-zinc-300 bg-white/90 px-4 py-2 text-sm text-zinc-700 shadow-sm transition hover:border-zinc-500 hover:text-zinc-900"
        >
          Back to grid
        </Link>
        <div className="flex gap-2 text-sm">
          {previousPost ? (
            <Link
              href={`/photo/${previousPost.id}`}
              className="rounded-full border border-zinc-300 bg-white/90 px-4 py-2 text-zinc-700 shadow-sm transition hover:border-zinc-500 hover:text-zinc-900"
            >
              Previous
            </Link>
          ) : null}
          {nextPost ? (
            <Link
              href={`/photo/${nextPost.id}`}
              className="rounded-full border border-zinc-300 bg-white/90 px-4 py-2 text-zinc-700 shadow-sm transition hover:border-zinc-500 hover:text-zinc-900"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-5 px-4 pb-8 sm:px-8 lg:grid-cols-[2fr_1fr]">
        <PhotoCarousel assets={currentPost.assets} caption={currentPost.caption} />

        <article className="rounded-3xl border border-zinc-200 bg-white/85 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Post caption</p>
          <p className="mt-4 whitespace-pre-wrap font-display text-3xl leading-tight text-zinc-900">
            {currentPost.caption || "No caption provided."}
          </p>
          <p className="mt-8 text-sm text-zinc-600">
            {currentPost.assets.length} {currentPost.assets.length === 1 ? "photo" : "photos"} in this post
          </p>
          {currentPost.taken_at ? (
            <p className="mt-8 text-sm text-zinc-500">
              Taken {new Date(currentPost.taken_at).toLocaleDateString()}
            </p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
