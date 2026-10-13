"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const params  = useSearchParams();
  const message = params.get("message") ?? "An unknown error occurred.";
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c101a]">
      <div className="max-w-md w-full mx-4 p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Authentication Error</h1>
        <p className="text-sm text-white/50 leading-relaxed">{message}</p>
        <a
          href="/"
          className="inline-block mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}