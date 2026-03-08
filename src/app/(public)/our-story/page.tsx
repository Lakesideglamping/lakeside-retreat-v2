import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Meet your hosts Stephen and Sandy at Lakeside Retreat.",
};

export default function OurStoryPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 pt-24">
      <div className="text-center">
        <h1 className="font-display text-5xl mb-4">Our Story</h1>
        <p className="text-muted text-lg">Coming soon — this page is being rebuilt.</p>
      </div>
    </section>
  );
}
