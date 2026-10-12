"use client";

import { useState } from "react";

type ShareButtonProps = {
  title?: string;
  className?: string;
  label?: string;
};

export function ShareButton({ title = "NATESTAGRAM", className = "", label = "Share" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Uses the live URL so a ?i= photo index is included.
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-medium transition-all active:scale-95 ${className}`.trim()}
      aria-label="Share link to this photo"
    >
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12L8 7m4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : label}</span>
    </button>
  );
}
