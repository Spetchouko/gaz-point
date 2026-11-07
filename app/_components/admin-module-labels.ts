export type AdminModuleUi =
  | "utilisateurs"
  | "vendeurs"
  | "disponibilites"
  | "marketing"
  | "avis"
  | "statistiques"

export const ADMIN_MODULES_UI: AdminModuleUi[] = [
  "utilisateurs",
  "vendeurs",
  "disponibilites",
  "marketing",
  "avis",
  "statistiques",
]

export const ADMIN_MODULE_LABELS: Record<AdminModuleUi, string> = {
  utilisateurs: "Gestion des utilisateurs",
  vendeurs: "Gestion des vendeurs",
  disponibilites: "Gestion des disponibilités",
  marketing: "Marketing & Publicités",
  avis: "Avis & Témoignages",
  statistiques: "Statistiques",
}