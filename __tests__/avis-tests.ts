import {
  AVIS_RATING_MAX,
  AVIS_RATING_MIN,
  AVIS_STATUS_LABELS,
  avisFirstName,
  avisTypeFromRole,
  avisTypeLabel,
  toAvisStatus,
} from "@/lib/avis-shared"

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

console.log("Rôles et libellés d'avis")
expectEq("rôle client", avisTypeFromRole("client"), "client")
expectEq("rôle inconnu traité comme client", avisTypeFromRole(null), "client")
expectEq("rôle vendeur", avisTypeFromRole("vendor"), "vendeur")
expectEq("libellé client", avisTypeLabel("client"), "Client")
expectEq("libellé vendeur", avisTypeLabel("vendeur"), "Vendeur")
expectEq("seul le prénom est public", avisFirstName("Jean-Baptiste Nkoulou"), "Jean-Baptiste")
expectEq("nom vide sécurisé", avisFirstName("   "), "Utilisateur")

console.log("\nStatuts de modération")
expectEq("statut pending", AVIS_STATUS_LABELS.pending, "En attente")
expectEq("statut approved", AVIS_STATUS_LABELS.approved, "Validé")
expectEq("statut rejected", AVIS_STATUS_LABELS.rejected, "Refusé")
expectEq("statut inconnu ramené à pending", toAvisStatus("bizarre"), "pending")
expectEq("statut approved conservé", toAvisStatus("approved"), "approved")

console.log("\nBornes de la note")
expectEq("note minimale", AVIS_RATING_MIN, 1)
expectEq("note maximale", AVIS_RATING_MAX, 5)

console.log(`\n${pass} pass, ${failures.length} fail`)
if (failures.length > 0) process.exit(1)
