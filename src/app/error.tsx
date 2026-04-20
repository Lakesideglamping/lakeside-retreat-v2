"use client";

import type { Metadata } from "next";
import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("root page error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#faf4f5] px-5 py-20">
      <div className="text-center max-w-lg bg-white rounded-2xl shadow-lg p-10">
        <h1 className="font-display text-3xl text-burgundy mb-3">
          Something went wrong
        </h1>
        <p className="text-muted text-base mb-6">
          We&apos;re sorry, an unexpected error has occurred. Please try again
          or return to the homepage.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-5">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 bg-burgundy text-white rounded-full font-semibold hover:bg-burgundy-dark transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border-2 border-burgundy text-burgundy rounded-full font-semibold hover:-translate-y-0.5 transition-transform no-underline"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
