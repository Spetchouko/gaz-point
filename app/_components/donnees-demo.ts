export const brands = ["Tradex", "Total", "SCTM", "Bocom"] as const
export const formats = ["6 kg", "12,5 kg", "15 kg"] as const

export type Availability = "disponible" | "à_confirmer" | "indisponible"

export type GasSource = "vendeur" | "administration"

export type GasPoint = {
  id: string
  vendor: string
  brands: readonly string[]
  formats: readonly string[]
  status: Availability
  district: string
  address: string
  distanceKm: number
  updatedMinutesAgo: number
  updatedBy: GasSource
  verified: boolean
  phone: string
}

export const availabilityLabel: Record<Availability, string> = {
  disponible: "Disponible",
  à_confirmer: "À confirmer",
  indisponible: "Indisponible",
}

export function formatAge(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return `${hours} h`
}

//jeu de données fictif, uniquement pour la démonstration visuelle — à remplacer par la vraie source de données
export const demoPoints: GasPoint[] = [
  {
    id: "demo-1",
    vendor: "Tradex Bonamoussadi",
    brands: ["Tradex"],
    formats: ["12,5 kg"],
    status: "disponible",
    district: "Bonamoussadi",
    address: "Rond-point Bonamoussadi",
    distanceKm: 1.2,
    updatedMinutesAgo: 15,
    updatedBy: "vendeur",
    verified: true,
    phone: "+237 6 99 12 34 56",
  },
  {
    id: "demo-2",
    vendor: "Tradex Akwa",
    brands: ["Tradex"],
    formats: ["12,5 kg", "15 kg"],
    status: "disponible",
    district: "Akwa",
    address: "Carrefour Ndobo",
    distanceKm: 2.4,
    updatedMinutesAgo: 8,
    updatedBy: "vendeur",
    verified: true,
    phone: "+237 6 77 45 88 21",
  },
  {
    id: "demo-3",
    vendor: "Total Bonapriso",
    brands: ["Total"],
    formats: ["6 kg", "12,5 kg"],
    status: "à_confirmer",
    district: "Bonapriso",
    address: "Face pharmacie du carrefour",
    distanceKm: 3.1,
    updatedMinutesAgo: 180,
    updatedBy: "administration",
    verified: true,
    phone: "+237 6 55 09 71 03",
  },
  {
    id: "demo-4",
    vendor: "SCTM Ndokotti",
    brands: ["SCTM"],
    formats: ["15 kg", "6 kg"],
    status: "à_confirmer",
    district: "Ndokotti",
    address: "Face station Tradex",
    distanceKm: 4.0,
    updatedMinutesAgo: 240,
    updatedBy: "vendeur",
    verified: false,
    phone: "+237 6 90 32 10 44",
  },
  {
    id: "demo-5",
    vendor: "Bocom Deïdo",
    brands: ["Bocom"],
    formats: ["6 kg"],
    status: "indisponible",
    district: "Deïdo",
    address: "Marché Deïdo",
    distanceKm: 5.3,
    updatedMinutesAgo: 360,
    updatedBy: "vendeur",
    verified: false,
    phone: "+237 6 98 60 22 17",
  },
]