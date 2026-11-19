import { searchService } from "@/lib/search-service"

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

console.log("Critères transmis à la page de résultats")

const criteria = searchService.normalizeCriteria({
  brand: "Total",
  format: "12,5 kg",
  zone: "Douala",
})
const resultsUrl = searchService.buildResultsUrl(criteria)
expectEq(
  "URL de résultats avec tous les critères",
  resultsUrl,
  "/resultats-recherche?brand=Total&format=12%2C5+kg&zone=Douala"
)

// Simulation du rechargement : la page relit uniquement l'URL.
const params = new URLSearchParams(resultsUrl.split("?")[1] ?? "")
expectEq("marque relue depuis l'URL", params.get("brand"), "Total")
expectEq("format relu depuis l'URL", params.get("format"), "12,5 kg")
expectEq("zone relue depuis l'URL", params.get("zone"), "Douala")

const editUrl = searchService.buildEditSearchUrl(criteria)
expectEq(
  "retour au formulaire avec critères et ancre",
  editUrl,
  "/?brand=Total&format=12%2C5+kg&zone=Douala#recherche-gaz"
)

// « Tous les formats » est une valeur vide qu'il faut conserver.
const allFormats = searchService.normalizeCriteria({ brand: "", format: "", zone: "" })
expectEq("format vide préservé", new URLSearchParams(searchService.buildResultsUrl(allFormats).split("?")[1]).has("format"), true)
expectEq("pas de critère → URL simple", searchService.buildResultsUrl(allFormats), "/resultats-recherche?format=")

console.log(`\n${pass} pass, ${failures.length} fail`)
if (failures.length > 0) process.exit(1)
