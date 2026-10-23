/**
 * Codemod d'harmonisation visuelle — GazPoints (exécuté avec succès)
 *
 * Remplace les couleurs de palette Tailwind brutes par les tokens
 * sémantiques définis dans app/globals.css :
 *   emerald / green   → success        amber / orange / yellow → warning
 *   blue / sky / cyan / teal → info    purple / indigo / violet / pink → navy
 *   red / rose        → destructive    gray / zinc / slate → neutrals
 *   hsl(var(--x))     → couleurs de marque (syntaxe shadcn v3 invalide en v4)
 *
 * Conservé comme référence d'historique du chantier visuel.
 * Idempotent : ne remplace que ce qui a changé. Usage :
 *   node scripts/harmonize-colors.mjs [--dry]
 */
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const DRY = process.argv.includes("--dry")

/** Table ordonnée : les motifs longs doivent passer avant les courts. */
const replacements = [
  // emerald → success
  [/hover:bg-emerald-700/g, "hover:bg-success-strong"],
  [/bg-emerald-600/g, "bg-success"],
  [/text-emerald-50/g, "text-success-foreground"],
  [/bg-emerald-500\/10/g, "bg-success\/10"],
  [/text-emerald-900/g, "text-success"],
  [/text-emerald-800/g, "text-success"],
  [/text-emerald-700/g, "text-success"],
  [/text-emerald-600\/80/g, "text-success\/80"],
  [/text-emerald-600/g, "text-success"],
  [/text-emerald-500/g, "text-success"],
  [/bg-emerald-50/g, "bg-success\/5"],
  [/bg-emerald-100/g, "bg-success\/10"],
  [/border-emerald-500\/30/g, "border-success\/20"],
  [/border-emerald-500/g, "border-success"],
  [/border-emerald-200/g, "border-success\/20"],
  [/ring-emerald-500\/20/g, "ring-success\/20"],
  [/ring-emerald-200/g, "ring-success\/20"],
  [/hover:border-emerald-400/g, "hover:border-success\/40"],
  // red → destructive
  [/bg-red-500\/10/g, "bg-destructive\/10"],
  [/bg-red-50/g, "bg-destructive\/5"],
  [/bg-red-100/g, "bg-destructive\/10"],
  [/text-red-700/g, "text-destructive"],
  [/text-red-600/g, "text-destructive"],
  [/border-red-500\/30/g, "border-destructive\/20"],
  [/border-red-200/g, "border-destructive\/20"],
  // amber / orange / yellow → warning
  [/border-amber-500\/30/g, "border-warning\/20"],
  [/border-amber-200/g, "border-warning\/20"],
  [/bg-amber-500\/10/g, "bg-warning\/10"],
  [/bg-amber-500/g, "bg-warning"],
  [/bg-amber-50/g, "bg-warning\/5"],
  [/text-amber-700/g, "text-warning"],
  [/text-amber-600/g, "text-warning"],
  [/text-amber-500/g, "text-warning"],
  [/border-orange-500\/30/g, "border-warning\/20"],
  [/border-orange-200/g, "border-warning\/20"],
  [/bg-orange-500\/10/g, "bg-warning\/10"],
  [/bg-orange-100/g, "bg-warning\/10"],
  [/bg-orange-50/g, "bg-warning\/5"],
  [/text-orange-700/g, "text-warning"],
  [/text-orange-600/g, "text-warning"],
  [/border-yellow-500\/30/g, "border-warning\/20"],
  [/bg-yellow-500\/10/g, "bg-warning\/10"],
  [/bg-yellow-100/g, "bg-warning\/10"],
  [/text-yellow-700/g, "text-warning"],
  [/text-yellow-600/g, "text-warning"],
  // blue / sky / teal / cyan → info
  [/hover:bg-sky-700/g, "hover:bg-info-strong"],
  [/border-blue-500\/30/g, "border-info\/20"],
  [/border-blue-200/g, "border-info\/20"],
  [/bg-blue-500\/10/g, "bg-info\/10"],
  [/bg-blue-50/g, "bg-info\/5"],
  [/bg-blue-100/g, "bg-info\/10"],
  [/text-blue-700/g, "text-info"],
  [/text-blue-600/g, "text-info"],
  [/border-sky-500/g, "border-info"],
  [/hover:border-sky-400/g, "hover:border-info\/40"],
  [/ring-sky-500\/20/g, "ring-info\/20"],
  [/ring-sky-200/g, "ring-info\/20"],
  [/bg-sky-600/g, "bg-info"],
  [/bg-sky-500\/10/g, "bg-info\/10"],
  [/bg-sky-50/g, "bg-info\/5"],
  [/bg-sky-100/g, "bg-info\/10"],
  [/text-sky-800/g, "text-info"],
  [/text-sky-700/g, "text-info"],
  [/text-sky-600\/80/g, "text-info\/80"],
  [/text-sky-600/g, "text-info"],
  [/border-teal-500\/30/g, "border-info\/20"],
  [/bg-teal-500\/10/g, "bg-info\/10"],
  [/text-teal-600/g, "text-info"],
  [/border-cyan-500\/30/g, "border-info\/20"],
  [/bg-cyan-500\/10/g, "bg-info\/10"],
  [/text-cyan-600/g, "text-info"],
  // purple / indigo / violet / pink → navy
  [/ring-purple-200/g, "ring-navy\/20"],
  [/border-purple-200/g, "border-navy\/20"],
  [/bg-purple-500\/10/g, "bg-navy\/10"],
  [/bg-purple-100/g, "bg-navy\/10"],
  [/text-purple-700/g, "text-navy"],
  [/text-purple-600/g, "text-navy"],
  [/border-indigo-200/g, "border-navy\/20"],
  [/bg-indigo-500\/10/g, "bg-navy\/10"],
  [/bg-indigo-100/g, "bg-navy\/10"],
  [/text-indigo-700/g, "text-navy"],
  [/text-indigo-600/g, "text-navy"],
  [/border-violet-500\/30/g, "border-navy\/20"],
  [/bg-violet-500\/10/g, "bg-navy\/10"],
  [/text-violet-600/g, "text-navy"],
  [/border-pink-500\/30/g, "border-navy\/20"],
  [/bg-pink-500\/10/g, "bg-navy\/10"],
  [/text-pink-600/g, "text-navy"],
  // Variantes résiduelles détectées lors du second passage
  [/bg-gray-500\/10/g, "bg-muted\/10"],
  [/border-emerald-600\/30/g, "border-success\/20"],
  [/border-green-500\/30/g, "border-success\/20"],
  [/bg-green-500\/10/g, "bg-success\/10"],
  [/text-green-600/g, "text-success"],
  [/border-purple-500\/30/g, "border-navy\/20"],
  [/border-indigo-500\/30/g, "border-navy\/20"],
  [/bg-neutral-500\/10/g, "bg-muted\/10"],
  [/text-neutral-600/g, "text-muted-foreground"],
  [/border-neutral-500\/30/g, "border-border"],
  [/border-sky-200/g, "border-info\/20"],
  // gray / zinc / slate → tokens neutres (après les motifs longs)
  [/bg-gray-100/g, "bg-muted"],
  [/bg-gray-50/g, "bg-muted\/50"],
  [/text-gray-700/g, "text-muted-foreground"],
  [/text-gray-600/g, "text-muted-foreground"],
  [/text-gray-500/g, "text-muted-foreground"],
  [/border-gray-200/g, "border-border"],
  // Syntaxe shadcn v3 invalide en Tailwind v4 (les tokens sont hex, pas HSL).
  // Les attributs SVG (stroke/fill) n'acceptent pas var() : hex littéral.
  [/hsl\(var\(--border\)\)/g, "#dfe8e2"],
  [/hsl\(var\(--muted-foreground\)\)/g, "#5b6b62"],
  [/hsl\(var\(--primary\)\)/g, "#16834a"],
  [/hsl\(var\(--popover\)\)/g, "#ffffff"],
  [/accent-\[hsl\(var\(--primary\)\)\]/g, "accent-primary"],
  // Hex hors marque dans les graphiques
  [/fill="#8884d8"/g, 'fill="#16834a"'],
  [/#0ea5e9/g, "#1f6fb2"],
  [/#f59e0b/g, "#b45309"],
  [/#10b981/g, "#17804a"],
  [/stroke="#e5e7eb"/g, 'stroke="#dfe8e2"'],
  // Palette de marque pour l'image de partage (opengraph-image.tsx — sans ;)
  [/\bconst INK = "#010101"/g, 'const INK = "#17251E"'],
  [/const NAVY = "#19398D"/g, 'const NAVY = "#174A7E"'],
  [/const MUTED = "#454545"/g, 'const MUTED = "#5B6B62"'],
  [/const BORDER = "#E3E3E3"/g, 'const BORDER = "#DFE8E2"'],
  [/const PAPER = "#F5F5F2"/g, 'const PAPER = "#F5F7F6"'],
  [/backgroundColor: "#F3F5FB",/g, 'backgroundColor: "#EFF4FA",'],
  [/rgba\(25, 57, 141, /g, "rgba(23, 74, 126, "],
]

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

/** Collecte récursive des .ts / .tsx du dossier app/. */
function collect(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full, acc)
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const files = collect(path.join(root, "app"), [])

let touched = 0
for (const file of files) {
  const rel = path.relative(root, file)
  let source = fs.readFileSync(file, "utf8")
  const before = source
  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement)
  }
  if (source !== before) {
    touched++
    console.log(rel)
    if (!DRY) fs.writeFileSync(file, source)
  }
}

console.log(`\n${touched} fichier(s) ${DRY ? "serai(en)t" : "modifié(s)"}.`)
