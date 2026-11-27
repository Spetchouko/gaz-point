"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  VendorEmptyState,
  VendorPageHeader,
  VendorSectionCard,
} from "@/app/_components/vendor/vendor-ui"
import { PackageSearch } from "lucide-react"

export default function VendorNotFound() {
  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Page introuvable"
        description="Cette page n'existe pas dans votre espace vendeur."
      />
      <VendorSectionCard title="Vérifiez l'adresse">
        <VendorEmptyState
          icon={PackageSearch}
          title="Aucune page à cet emplacement"
          description="Le lien est peut-être obsolète. Revenez à votre tableau de bord pour continuer."
          actions={
            <Button size="sm" render={<Link href="/dashboard/vendeur">Tableau de bord</Link>} />
          }
        />
      </VendorSectionCard>
    </div>
  )
}
