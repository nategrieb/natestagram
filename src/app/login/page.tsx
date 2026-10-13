import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { SiteLogoLink } from "@/components/site-logo-link";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata = { title: "Sign in · NATESTAGRAM", robots: { index: false } };

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const session = await getAdminSession();

  if (session.status === "admin") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <SiteLogoLink />
      <LoginForm
        signedInAs={session.status === "forbidden" ? (session.user.email ?? "this account") : null}
        initialError={error === "google" ? "Google sign-in didn't complete. Please try again." : null}
      />
    </main>
  );
}
