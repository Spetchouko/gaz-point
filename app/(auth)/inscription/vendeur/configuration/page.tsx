import { Suspense } from "react"
import { ConfigurationProfilVendeur } from "../page"

export default function ConfigurationProfilVendeurPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <ConfigurationProfilVendeur />
    </Suspense>
  )
}
