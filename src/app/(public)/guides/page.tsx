import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Guides",
  description: "Host-written guides to Central Otago wineries, trails and activities.",
};

export default function LocalGuidesPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 pt-24">
      <div className="text-center">
        <h1 className="font-display text-5xl mb-4">Local Guides</h1>
        <p className="text-muted text-lg">Coming soon — this page is being rebuilt.</p>
      </div>
    </section>
  );
}
