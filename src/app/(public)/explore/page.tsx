import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Central Otago",
  description: "Things to do near Lakeside Retreat in Cromwell and Central Otago.",
};

export default function ExploreCentralOtagoPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 pt-24">
      <div className="text-center">
        <h1 className="font-display text-5xl mb-4">Explore Central Otago</h1>
        <p className="text-muted text-lg">Coming soon — this page is being rebuilt.</p>
      </div>
    </section>
  );
}
