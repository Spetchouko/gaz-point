import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services | GazPoints",
  description:
    "Informations sur les services GazPoints : abonnement usager, espace vendeur, support technique, et FAQ.",
}

export default function Services() {
  return (
    <section className="py-12 max-w-md mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-primary-foreground border-b pb-2 border-border">Nos services</h1>

      <ul className="space-y-4 mb-8">
        <li className="text-sm text-primary-foreground/80">
          <strong>Abonnement usager</strong> : compte gratuit à vie, suivi de vos commandes, historique de vos recherches.
        </li>
        <li className="text-sm text-primary-foreground/80">
          <strong>Espace vendeur</strong> : inscription des points de vente, publication d&apos;offres, gestion des disponibilités.
        </li>
        <li className="text-sm text-primary-foreground/80">
          <strong>Support technique</strong> : assistance pour les problèmes de connexion, questions sur l&apos;utilisation du gaz.
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-primary-foreground mb-4">FAQ rapide</h2>
        <ul className="text-sm text-primary-foreground/80 space-y-2">
          <li>Comment m&apos;inscrire ?</li>
          <li>Comment modifier mon annonce ?</li>
          <li>Comment contacter le support ?</li>
        </ul>
      </section>
    </section>
  )
}