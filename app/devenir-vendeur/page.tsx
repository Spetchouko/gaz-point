import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, ShieldCheck, TrendingUp, BarChart3 } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "Devenir Vendeur | GazPoints" },
}

export default function DevenirVendeurPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-sky-50 to-background py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Devenez Vendeur GazPoints
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transformez votre dépôt de gaz en point de distribution fiable et 
              gagnez en visibilité auprès des centaines de clients recherchant du gaz 
              près de chez eux.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-center mb-12">
            À quoi ça vous rapporte ?
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">
                  Badge Vendeur Certifié
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Apparaissez en priorité dans les résultats de recherche des usagers.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">
                  Suivi en Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Consultez les disponibilités et les réservations depuis votre espace.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">
                  Augmentez vos Ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Soyez visible par des clients qui ont besoin de gaz immédiatement.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Store className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">
                  Gestion Simple
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mettez à jour vos stocks en 2 clics. Pas de complexité.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-mint py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-center mb-12">
            Comment ça marche ?
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Créer un compte</h3>
              <p className="text-muted-foreground text-sm">
                Inscrivez-vous en 2 minutes. C'est gratuit.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Confirmer votre dépôt</h3>
              <p className="text-muted-foreground text-sm">
                Ajoutez votre adresse, téléphone et description.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Publier vos stocks</h3>
              <p className="text-muted-foreground text-sm">
                Commencez à recevoir des réservations immédiatement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Créez votre compte vendeur et commencez à publier vos disponibilités 
            aujourd’hui. Aucun engagement mensuel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button render={<Link href="/inscription/vendeur">Créer mon compte vendeur</Link>} size="lg" />
            <Button render={<Link href="/a-propos">En savoir plus</Link>} variant="outline" size="lg" />
          </div>
        </div>
      </section>
    </div>
  )
}