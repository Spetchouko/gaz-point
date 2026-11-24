import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  VendorEmptyState,
  VendorPageHeader,
  VendorSectionCard,
} from "@/app/_components/vendor/vendor-ui"
import { PackageSearch } from "lucide-react"

export default function DepotNotFound() {
  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Page introuvable"
        description="Cette page n'existe pas dans la gestion de votre dépôt."
      />
      <VendorSectionCard title="Vérifiez l'adresse">
        <VendorEmptyState
          icon={PackageSearch}
          title="Aucune page à cet emplacement"
          description="Le lien est peut-être obsolète. Revenez à la gestion de votre dépôt."
          actions={
            <Button size="sm" render={<Link href="/dashboard/depot">Gérer mon dépôt</Link>} />
          }
        />
      </VendorSectionCard>
    </div>
  )
}
