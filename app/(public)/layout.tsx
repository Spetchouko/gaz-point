import { Footer } from "@/app/_components/footer";
import { ScrollToDirection } from "@/app/_components/scroll-to-direction";
import { FloatingSearchButton } from "@/app/_components/search-floating-button";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/app/_components/json-ld";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col min-h-screen">
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <div className="flex-1">{children}</div>
      <Footer />
      <ScrollToDirection />
      <FloatingSearchButton />
    </main>
  );
}
