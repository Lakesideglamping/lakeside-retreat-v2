import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center text-center px-5 pt-24 pb-20 min-h-[70vh]">
        <div>
          <h1 className="font-display text-5xl mb-4">Page Not Found</h1>
          <p className="text-muted text-lg mb-8 max-w-[500px] mx-auto">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button href="/">Back to Homepage</Button>
            <Link
              href="/stay"
              className="inline-block px-6 py-3 rounded-full border-2 border-burgundy text-burgundy font-semibold hover:-translate-y-0.5 transition-transform no-underline"
            >
              View Accommodation
            </Link>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 rounded-full border-2 border-burgundy text-burgundy font-semibold hover:-translate-y-0.5 transition-transform no-underline"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
