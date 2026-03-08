import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dome Rosé",
  description: "40sqm romantic glamping dome with vineyard views and outdoor spa.",
};

export default function DomeRosPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 pt-24">
      <div className="text-center">
        <h1 className="font-display text-5xl mb-4">Dome Rosé</h1>
        <p className="text-muted text-lg">Coming soon — this page is being rebuilt.</p>
      </div>
    </section>
  );
}
