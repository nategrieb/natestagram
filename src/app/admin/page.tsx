import Link from "next/link";

import { AdminUploadForm } from "@/components/admin-upload-form";

type AdminPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const query = await searchParams;
  const errorMessage = query.status === "error" ? query.message || "Upload failed." : null;
  const successMessage = query.status === "uploaded" ? "Post uploaded." : null;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-medium text-zinc-700 sm:text-4xl">Upload</h1>
        <Link href="/" className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900">
          Back to gallery
        </Link>
      </div>

      {successMessage ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      <AdminUploadForm />
    </main>
  );
}
