import Image from "next/image";
import Link from "next/link";

import { getPublicPosts } from "@/lib/photos";

export default function Home() {
  const postsPromise = getPublicPosts();

  return <Gallery postsPromise={postsPromise} />;
}

async function Gallery({
  postsPromise,
}: {
  postsPromise: ReturnType<typeof getPublicPosts>;
}) {
  const posts = await postsPromise;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <div className="backdrop-orb" aria-hidden="true" />
      <main className="mx-auto flex w-full max-w-7xl flex-col px-5 pt-10 sm:px-8 lg:px-14">
        <header className="mb-8 flex items-center justify-between gap-6 sm:mb-10">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-700 sm:text-3xl">Natestagram</h1>
          <Link
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-xl leading-none text-zinc-700 shadow-sm transition hover:border-zinc-500 hover:text-zinc-900"
            href="/admin"
            aria-label="Open admin upload"
            title="Upload"
          >
            +
          </Link>
        </header>

        {posts.length === 0 ? (
          <section className="rounded-3xl border border-zinc-200 bg-white/85 px-6 py-14 text-center shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-medium text-zinc-700">No photos yet</h2>
            <p className="mt-3 text-zinc-600">
              Upload your first post in the admin page to populate this grid.
            </p>
          </section>
        ) : (
          <section className="photo-grid pb-8">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/photo/${post.id}`}
                className="photo-tile"
                style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }}
              >
                <Image
                  src={post.coverImageUrl}
                  alt={post.caption || "Photo post"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
                {post.assets.length > 1 ? (
                  <span className="absolute right-3 top-3 rounded-full bg-zinc-900/75 px-3 py-1 text-xs text-zinc-100">
                    {post.assets.length} photos
                  </span>
                ) : null}
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
