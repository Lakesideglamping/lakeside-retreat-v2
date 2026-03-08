import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cromwell Activities",
  description: "Things to do in Cromwell NZ near Lake Dunstan.",
};

export default function CromwellActivitiesPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 pt-24">
      <div className="text-center">
        <h1 className="font-display text-5xl mb-4">Cromwell Activities</h1>
        <p className="text-muted text-lg">Coming soon — this page is being rebuilt.</p>
      </div>
    </section>
  );
}
