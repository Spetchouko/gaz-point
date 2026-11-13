import { Footer } from "@/app/_components/footer";
import { ScrollToDirection } from "@/app/_components/scroll-to-direction";
import { FloatingSearchButton } from "@/app/_components/search-floating-button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col min-h-screen">
      {/* flex-1 permet de pousser le footer en bas de la viewport quand le
          contenu est court, et de le laisser en fin de contenu sinon. Pas de
          flottaison au milieu de la page, pas de recouvrement. */}
      <div className="flex-1">{children}</div>
      <Footer />
      <ScrollToDirection />
      <FloatingSearchButton />
    </main>
  );
}
