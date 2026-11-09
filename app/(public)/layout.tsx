import { Header } from "@/app/header";
import { Footer } from "@/app/_components/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1">
      <Header />
      {children}
      <Footer />
    </main>
  );
}
