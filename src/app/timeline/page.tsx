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
          <h1 className="bg-none text-2xl font-medium tracking-tight text-zinc-500 sm:text-3xl">Natestagram</h1>
          <a
            className="text-3xl leading-none text-zinc-400 transition hover:text-zinc-500"
            href="/admin"
            aria-label="Open admin upload"
            title="Upload"
          >
            +
          </a>
        </header>

        <HomeGallery posts={posts} selectedId={selectedId} />
      </main>
    </div>
  );
}