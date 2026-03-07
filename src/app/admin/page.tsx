import { AdminPostGrid } from "@/components/admin-post-grid";
import { AdminUploadForm } from "@/components/admin-upload-form";
import { SiteLogoLink } from "@/components/site-logo-link";
import { getAdminPosts } from "@/lib/photos";

type AdminPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const postsPromise = getAdminPosts();
  const query = await searchParams;
  const errorMessage = query.status === "error" ? query.message || "Upload failed." : null;
  const successMessage = query.status === "uploaded" ? "Post uploaded." : null;
  const posts = await postsPromise;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <div className="backdrop-orb hidden sm:block" aria-hidden="true" />
      <main className="mx-auto flex w-full max-w-7xl flex-col px-5 pt-10 sm:px-8 lg:px-14">
        <header className="mb-8 flex items-center justify-between gap-6 sm:mb-10">
          <SiteLogoLink />

          <div className="h-10 w-10" aria-hidden="true" />
        </header>

        <div aria-hidden="true" className="mb-6 h-px w-full bg-zinc-300/40 sm:mb-8" />

        {successMessage ? (
          <p className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{successMessage}</p>
        ) : null}

        {errorMessage ? (
          <p className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{errorMessage}</p>
        ) : null}

        <AdminUploadForm />

        <div className="mt-6">
          <AdminPostGrid posts={posts} />
        </div>
      </main>
    </div>
  );
}
