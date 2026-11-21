import {
  ALL_BRANDS_LABEL,
  ALL_BRANDS_VALUE,
  OFFICIAL_GAS_BRANDS,
  exactOfficialBrand,
  gasBrandMatches,
  resolveOfficialGasBrand,
  suggestGasBrands,
} from "@/lib/gas-brands"

let pass = 0
const failures: string[] = []

function expectEq(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    pass += 1
    console.log(`  PASS ${name}`)
  } else {
    failures.push(name)
    console.log(
      `  FAIL ${name} — got ${JSON.stringify(actual)} / want ${JSON.stringify(expected)}`
    )
  }
}

function expectList(name: string, actual: readonly string[], expected: string[]) {
  expectEq(name, actual.join(" | "), expected.join(" | "))
}

console.log("Liste officielle des marques")

expectEq(
  "dix marques exactes et ordonnées",
  OFFICIAL_GAS_BRANDS.join(" | "),
  [
    "Tradex Gaz",
    "SCTM Gaz",
    "TotalEnergies",
    "Bocom",
    "Green Oil",
    "AfriGaz",
    "Neptune Gaz",
    "Ola Gaz",
    "MRS",
    "PleinGaz",
  ].join(" | ")
)
expectEq("aucune marque affichée quand le champ est vide", suggestGasBrands("").length, 0)
expectEq("aucune marque affichée pour des espaces", suggestGasBrands("   ").length, 0)
expectEq("libellé sans filtre", ALL_BRANDS_LABEL, "Toutes les marques")
expectEq("valeur sans filtre", ALL_BRANDS_VALUE, "")

console.log("\nSuggestions d'après les premières lettres")

const examples: Array<[string, string[]]> = [
  ["T", ["Tradex Gaz", "TotalEnergies"]],
  ["TR", ["Tradex Gaz"]],
  ["S", ["SCTM Gaz"]],
  ["B", ["Bocom"]],
  ["G", ["Green Oil"]],
  ["A", ["AfriGaz"]],
  ["N", ["Neptune Gaz"]],
  ["O", ["Ola Gaz"]],
  ["M", ["MRS"]],
  ["P", ["PleinGaz"]],
]

for (const [input, expected] of examples) {
  expectList(`saisie « ${input} »`, suggestGasBrands(input), expected)
  expectList(
    `saisie « ${input.toLowerCase()} » en minuscules`,
    suggestGasBrands(input.toLowerCase()),
    expected
  )
}

console.log("\nRecherches partielles et insensibles à la casse")

expectList("t minuscule", suggestGasBrands("t"), ["Tradex Gaz", "TotalEnergies"])
expectList("TOTAL en majuscules", suggestGasBrands("TOTAL"), ["TotalEnergies"])
expectList("trois lettres « tra »", suggestGasBrands("tra"), ["Tradex Gaz"])
expectList("plusieurs mots « green o »", suggestGasBrands("green o"), ["Green Oil"])
expectList("espaces autour de la saisie", suggestGasBrands("  sctm  "), ["SCTM Gaz"])
expectList("aucun résultat pour Z", suggestGasBrands("Z"), [])
expectList("aucun résultat pour une marque inconnue", suggestGasBrands("Butagaz"), [])

console.log("\nChaque marque est retrouvable")

for (const brand of OFFICIAL_GAS_BRANDS) {
  expectList(
    `nom complet « ${brand} »`,
    suggestGasBrands(brand),
    [brand]
  )
  expectEq(
    `première lettre de « ${brand} » propose la marque`,
    suggestGasBrands(brand[0]).includes(brand),
    true
  )
}

console.log("\nSaisie exacte et valeur transmise au moteur")

expectEq("saisie exacte", exactOfficialBrand("Tradex Gaz"), "Tradex Gaz")
expectEq("saisie exacte en minuscules", exactOfficialBrand("tradex gaz"), "Tradex Gaz")
expectEq("saisie partielle non retenue comme marque", exactOfficialBrand("Trad"), null)
expectEq("saisie inconnue non retenue comme marque", exactOfficialBrand("Butagaz"), null)
expectEq(
  "résolution d'une ancienne dénomination",
  resolveOfficialGasBrand("Total"),
  "TotalEnergies"
)

console.log("\nCompatibilité avec les disponibilités enregistrées")

expectEq("sans filtre marque", gasBrandMatches(null, ""), true)
expectEq("Tradex existant retrouvé", gasBrandMatches("Tradex", "Tradex Gaz"), true)
expectEq("Total existant retrouvé", gasBrandMatches("Total", "TotalEnergies"), true)
expectEq("SCTM existant retrouvé", gasBrandMatches("SCTM", "SCTM Gaz"), true)
expectEq("Neptune Oil existant retrouvé", gasBrandMatches("Neptune Oil", "Neptune Gaz"), true)
expectEq("OLA Energy existant retrouvé", gasBrandMatches("OLA Energy", "Ola Gaz"), true)
expectEq(
  "marque personnalisée conservée",
  gasBrandMatches("Camgaz", "camgaz"),
  true
)
expectEq(
  "marque officielle différente exclue",
  gasBrandMatches("Bocom", "Tradex Gaz"),
  false
)
expectEq(
  "marque non reconnue exclue",
  gasBrandMatches("Tradex", "MarqueInconnue"),
  false
)

console.log(`\n${pass} pass, ${failures.length} fail`)
if (failures.length > 0) process.exit(1)
