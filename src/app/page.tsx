import Link from "next/link";

import { PhotoGrid } from "@/components/photo-grid";
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
      <div className="backdrop-orb hidden sm:block" aria-hidden="true" />
      <main className="mx-auto flex w-full max-w-7xl flex-col px-5 pt-10 sm:px-8 lg:px-14">
        <header className="mb-8 flex items-center justify-between gap-6 sm:mb-10">
          <h1 className="bg-none text-2xl font-medium tracking-tight text-zinc-500 sm:text-3xl">Natestagram</h1>
          <Link
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-400 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95"
            href="/admin"
            aria-label="Open admin upload"
            title="Upload"
          >
            <span className="text-2xl leading-none">+</span>
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
            />
          </Link>
        </header>

        <PhotoGrid posts={posts} />
      </main>
    </div>
  );
}
