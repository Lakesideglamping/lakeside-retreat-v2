import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lakeside Cottage",
  description: "Pet-friendly family cottage on Lake Dunstan from $295/night.",
};

export default function LakesideCottagePage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 pt-24">
      <div className="text-center">
        <h1 className="font-display text-5xl mb-4">Lakeside Cottage</h1>
        <p className="text-muted text-lg">Coming soon — this page is being rebuilt.</p>
      </div>
    </section>
  );
}
