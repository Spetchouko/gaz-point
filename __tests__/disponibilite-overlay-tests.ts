import {
  CLOSED_OVERLAY,
  closeOverlay,
  normalizeReservationQuantity,
  openDetails,
  openReservation,
  setOverlayStep,
  setReservationQuantity,
} from "@/lib/disponibilite-overlay"
import {
  buildDisponibiliteView,
  listDisponibiliteServices,
  phoneHref,
  type DisponibiliteApiData,
} from "@/lib/disponibilite-view"
import { formatPrice } from "@/lib/gaz"
import { calculateReservationAmount } from "@/lib/reservation-amount"
import { copyReservationCode } from "@/lib/reservation-clipboard"
import type { SearchResultItem } from "@/lib/search-service"

let pass = 0
const failures: string[] = []

function expectEq(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    pass += 1
    console.log(`  PASS ${name}`)
  } else {
    failures.push(name)
    console.log(`  FAIL ${name} — got ${String(actual)} / want ${String(expected)}`)
  }
}

function makeItem(overrides: Partial<SearchResultItem> = {}): SearchResultItem {
  return {
    id: "point-1",
    name: "Dépôt Bonamoussadi",
    district: "Bonamoussadi",
    address: "Rond-point",
    phone: "+237 600 000 001",
    brands: ["Tradex"],
    formats: ["12,5 kg"],
    status: "disponible",
    note: null,
    quantity: 5,
    price: null,
    format: "12,5 kg",
    brand: "Tradex",
    expiresAt: null,
    updatedAt: null,
    updatedBy: "vendeur",
    source: "vendeur",
    stale: false,
    expired: false,
    disponibiliteId: "dispo-1",
    hasDelivery: true,
    hasExchange: true,
    hasGasSale: false,
    deliveryFee: 500,
    distanceKm: 1.2,
    ...overrides,
  }
}

function makeDetail(
  overrides: Partial<DisponibiliteApiData["disponibilite"]> = {},
  pointOverrides: Partial<DisponibiliteApiData["pointDeVente"]> = {}
): DisponibiliteApiData {
  return {
    disponibilite: {
      id: "dispo-1",
      status: "disponible",
      note: null,
      quantity: 5,
      reservedQuantity: 1,
      availableQuantity: 4,
      price: 3500,
      brand: "Tradex",
      format: "12,5 kg",
      weightKg: "12,5 kg",
      expiresAt: null,
      phone: null,
      reportedByName: "Vendeur A",
      source: "vendeur",
      delivery: true,
      exchange: true,
      gasSale: false,
      stale: false,
      expired: false,
      updatedAt: null,
      ...overrides,
    },
    pointDeVente: {
      id: "point-1",
      name: "Dépôt Bonamoussadi",
      district: "Bonamoussadi",
      address: "Rond-point",
      phone: "+237 600 000 009",
      deliveryEnabled: true,
      deliveryFee: 500,
      exchangeEnabled: true,
      gasSaleEnabled: false,
      ...pointOverrides,
    },
  }
}

console.log("État partagé de la fenêtre superposée")

const firstCard = makeItem({ disponibiliteId: "dispo-A", brand: "Tradex" })
const secondCard = makeItem({
  id: "point-2",
  disponibiliteId: "dispo-B",
  brand: "Total",
  name: "Dépôt Bonapriso",
  quantity: 2,
})

let state = openDetails(CLOSED_OVERLAY, firstCard.disponibiliteId)
expectEq("première carte sélectionnée", state.disponibiliteId, "dispo-A")
expectEq("étape initiale", state.step, "details")

// Ouvrir une seconde carte remplace la sélection : jamais deux fenêtres.
state = openDetails(state, secondCard.disponibiliteId)
expectEq("sélection unique (carte B)", state.disponibiliteId, "dispo-B")
expectEq("aucune fenêtre A restante", state.step === "details" && state.disponibiliteId === "dispo-B", true)

// Le bouton Réserver d'une carte ouvre directement l'étape réservation.
state = openReservation(state, secondCard.disponibiliteId, secondCard.quantity)
expectEq("réservation ouverte pour la carte B", state.step, "reservation")
expectEq("disponibilité conservée", state.disponibiliteId, "dispo-B")

state = setReservationQuantity(state, 2, secondCard.quantity)
expectEq("quantité saisie", state.quantity, 2)
state = setOverlayStep(state, "details")
expectEq("retour aux détails", state.step, "details")
state = setOverlayStep(state, "reservation")
expectEq("quantité conservée après retour", state.quantity, 2)
expectEq("disponibilité conservée après retour", state.disponibiliteId, "dispo-B")

state = setOverlayStep(state, "confirmation")
expectEq("confirmation après réservation", state.step, "confirmation")
state = closeOverlay()
expectEq("fermeture réinitialise la disponibilité", state.disponibiliteId, null)
expectEq("fermeture réinitialise l'étape", state.step, "details")
expectEq("fermeture réinitialise la quantité", state.quantity, 1)

// Réouvrir une autre carte après fermeture ne garde aucun état précédent.
state = openDetails(state, firstCard.disponibiliteId)
expectEq("réouverture sur la carte A", state.disponibiliteId, "dispo-A")
expectEq("quantité neuve", state.quantity, 1)

console.log("\nQuantité de réservation")
expectEq("quantité minimale", normalizeReservationQuantity(0, 5), 1)
expectEq("quantité non numérique", normalizeReservationQuantity(Number.NaN, 5), 1)
expectEq("plafond par le stock", normalizeReservationQuantity(9, 4), 4)
expectEq("plafond API", normalizeReservationQuantity(50, null), 20)
expectEq("stock inconnu", normalizeReservationQuantity(3, null), 3)

console.log("\nDonnées affichées par disponibilité")

const viewA = buildDisponibiliteView(firstCard, makeDetail())
const viewB = buildDisponibiliteView(
  secondCard,
  makeDetail({
    id: "dispo-B",
    brand: "Total",
    format: "6 kg",
    price: null,
    availableQuantity: 2,
    exchange: false,
    gasSale: true,
    reportedByName: "Vendeur B",
  }, {
    exchangeEnabled: false,
    gasSaleEnabled: true,
  })
)
expectEq("vue A : identifiant propre", viewA.disponibiliteId, "dispo-A")
expectEq("vue B : identifiant propre", viewB.disponibiliteId, "dispo-B")
expectEq("vue A : marque propre", viewA.brand, "Tradex")
expectEq("vue B : marque propre", viewB.brand, "Total")
expectEq("vue A : grammage propre", viewA.format, "12,5 kg")
expectEq("vue B : grammage propre", viewB.format, "6 kg")
expectEq("vue A : prix renseigné", viewA.priceLabel, formatPrice(3500))
expectEq("vue B : prix non renseigné", viewB.priceLabel, null)
expectEq("vue A : téléphone du dépôt", viewA.phone, "+237 600 000 009")
expectEq("vue A : quantité disponible", viewA.availableQuantity, 4)
expectEq("vue A : réservable", viewA.isReservable, true)
expectEq("vue B : échange désactivé", viewB.services.exchange, false)
expectEq("vue B : vente de gaz activée", viewB.services.gasSale, true)
expectEq("vue A : livraison activée", viewA.services.delivery, true)
expectEq("vue A : frais de livraison", viewA.services.deliveryFeeLabel, "500 FCFA")
expectEq("vue A : conditions contient le prix", viewA.conditions.some((c) => c.includes(formatPrice(3500))), true)
expectEq("vue B : pas de prix inventé", viewB.conditions.some((c) => c.includes("Prix affiché")), false)
expectEq("numéro de téléphone normalisé", phoneHref("+237 6 00 00 00 01"), "tel:+237600000001")
expectEq("numéro absent", phoneHref(null), null)

const servicesOnView = buildDisponibiliteView(
  makeItem(),
  makeDetail(
    { delivery: false, exchange: false, gasSale: false },
    { deliveryEnabled: true, exchangeEnabled: true, gasSaleEnabled: true }
  )
)
expectEq(
  "services activés affichés depuis le point de vente",
  listDisponibiliteServices(servicesOnView).map((service) => service.key).join(","),
  "delivery,exchange,gasSale"
)
expectEq(
  "aucun service fictif de consigne",
  listDisponibiliteServices(servicesOnView).some((service) => service.key === "consigne"),
  false
)

const servicesOffView = buildDisponibiliteView(
  makeItem({ hasDelivery: true, hasExchange: true, hasGasSale: true }),
  makeDetail({}, {
    deliveryEnabled: false,
    exchangeEnabled: false,
    gasSaleEnabled: false,
  })
)
expectEq("aucun service activé", listDisponibiliteServices(servicesOffView).length, 0)

const phoneView = buildDisponibiliteView(
  makeItem({ phone: "+237 600 000 001" }),
  makeDetail({}, { phone: "+237 600 000 009" })
)
expectEq("téléphone réel du dépôt", phoneView.phone, "+237 600 000 009")
expectEq("lien d'appel du dépôt", phoneHref(phoneView.phone), "tel:+237600000009")

const noPhoneView = buildDisponibiliteView(
  makeItem({ phone: null }),
  makeDetail({}, { phone: null })
)
expectEq("téléphone absent du dépôt", noPhoneView.phone, null)
expectEq("aucun lien d'appel", phoneHref(noPhoneView.phone), null)

console.log("\nMontant à payer au dépôt")
expectEq("1 bouteille", calculateReservationAmount(1), 1000)
expectEq("2 bouteilles", calculateReservationAmount(2), 2000)
expectEq("3 bouteilles", calculateReservationAmount(3), 3000)
expectEq("4 bouteilles", calculateReservationAmount(4), 4000)
expectEq("5 bouteilles", calculateReservationAmount(5), 5000)
expectEq("quantité nulle refusée", calculateReservationAmount(0), null)
expectEq("quantité non entière refusée", calculateReservationAmount(1.5), null)

const expiredView = buildDisponibiliteView(makeItem(), makeDetail({ expired: true, status: "indisponible" }))
expectEq("disponibilité expirée non réservable", expiredView.isReservable, false)

async function testClipboard() {
  console.log("\nCopie du numéro de réservation")
  let copiedText: string | null = null
  const clipboard = {
    writeText: async (text: string) => {
      copiedText = text
    },
  }
  const copied = await copyReservationCode("GP221126DB4K7", clipboard)
  expectEq("copie réussie", copied, true)
  expectEq("code copié", copiedText, "GP221126DB4K7")

  const failingClipboard = {
    writeText: async () => {
      throw new Error("clipboard indisponible")
    },
  }
  expectEq(
    "échec de copie visible",
    await copyReservationCode("GP221126DB4K7", failingClipboard),
    false
  )
}

void testClipboard().then(() => {
  console.log(`\n${pass} pass, ${failures.length} fail`)
  if (failures.length > 0) process.exit(1)
})
