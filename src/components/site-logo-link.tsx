import Link from "next/link";

type SiteLogoLinkProps = {
  className?: string;
};

export function SiteLogoLink({ className = "" }: SiteLogoLinkProps) {
  return (
    <Link
      href="/"
      aria-label="Go to home gallery"
      className={`inline-flex items-center gap-3 ${className}`.trim()}
    >
      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-800 to-green-600" aria-hidden="true" />
      <span className="font-bold text-sm md:text-base text-zinc-900 tracking-wider">NATESTAGRAM</span>
    </Link>
  );
}
