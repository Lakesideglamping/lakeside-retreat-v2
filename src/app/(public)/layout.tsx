import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { StickyBookBar } from "@/components/sticky-book-bar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <StickyBookBar />
    </>
  );
}
