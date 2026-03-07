import Link from "next/link";
import { HomeGallery } from "@/components/home-gallery";
import { getPublicPosts } from "@/lib/photos";

type TimelinePageProps = {
  searchParams: Promise<{ selected?: string }>;
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const postsPromise = getPublicPosts();
  const params = await searchParams;

  return <Timeline postsPromise={postsPromise} selectedId={params.selected} />;
}

async function Timeline({
  postsPromise,
  selectedId,
}: {
  postsPromise: ReturnType<typeof getPublicPosts>;
  selectedId?: string;
}) {
  const posts = await postsPromise;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <div className="backdrop-orb hidden sm:block" aria-hidden="true" />
      <main className="mx-auto flex w-full max-w-7xl flex-col px-5 pt-10 sm:px-8 lg:px-14">
        <header className="mb-8 flex items-center justify-between gap-6 sm:mb-10">
          <Link
            className="text-3xl leading-none text-zinc-400 transition hover:text-zinc-500"
            href="/"
            aria-label="Back to grid"
            title="Grid"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-800 to-green-600" aria-hidden="true" />
            <h1 className="font-bold text-sm md:text-base text-zinc-900 tracking-wider">NATESTAGRAM</h1>
          </div>
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

        <HomeGallery posts={posts} selectedId={selectedId} />
      </main>
    </div>
  );
}