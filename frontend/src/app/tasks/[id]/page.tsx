import { Suspense } from "react";
import { QuestDetailClient } from "./QuestDetailClient";

export default function QuestDetailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="h-96 rounded-2xl bg-surface border border-white/8 animate-pulse" />
      </div>
    }>
      <QuestDetailClient />
    </Suspense>
  );
}