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
          <h1 className="bg-none text-2xl font-medium tracking-tight text-zinc-500 sm:text-3xl">Natestagram</h1>
          <Link
            className="text-3xl leading-none text-zinc-400 transition hover:text-zinc-500"
            href="/admin"
            aria-label="Open admin upload"
            title="Upload"
          >
            +
          </Link>
        </header>

        <HomeGallery posts={posts} selectedId={selectedId} />
      </main>
    </div>
  );
}