import Link from "next/link";

import { HomeGallery } from "@/components/home-gallery";
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
            className="text-3xl leading-none text-zinc-500 transition hover:text-zinc-700"
            href="/admin"
            aria-label="Open admin upload"
            title="Upload"
          >
            +
          </Link>
        </header>

        <HomeGallery posts={posts} />
      </main>
    </div>
  );
}
