/**
 * Patch — corrections des erreurs TypeScript bloquant `pnpm build`
 * (imports manquants, état message d'erreur, textarea au lieu d'input,
 * remote pattern pour l'icône Google).
 * Idempotent : chaque remplacement ne s'applique que s'il correspond.
 */
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

const edits = [
  {
    file: "app/(auth)/connexion/page.tsx",
    desc: "Importer Image depuis next/image",
    find: `import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"`,
    replace: `import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"`,
  },
  {
    file: "app/(auth)/inscription/usager/page.tsx",
    desc: "Importer Loader2 et Image",
    find: `import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"`,
    replace: `import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"`,
  },
  {
    file: "app/(auth)/inscription/usager/page.tsx",
    desc: "Bouton imbriqué invalide → spinner inline (pattern de connexion)",
    find: `                {loading
                  ? <Button
                      render={<Loader2 className="size-4 mr-2 animate-spin" />}
                      nativeButton={false}
                    >
                      Création en cours...
                    </Button>
                  : "Créer mon compte usager"}`,
    replace: `                {loading ? (<><Loader2 className="size-4 mr-2 animate-spin" />Création en cours...</>) : "Créer mon compte usager"}`,
  },
  {
    file: "app/(auth)/inscription/vendeur/page.tsx",
    desc: "Textarea import",
    find: `import { Input } from "@/components/ui/input"`,
    replace: `import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"`,
  },
  {
    file: "app/(auth)/inscription/vendeur/page.tsx",
    desc: "Helper module-scopé pour le message d'erreur de l'adresse",
    find: `// === Mode de confirmation email ===
const MODE_EMAIL = "email"`,
    replace: `// === Mode de confirmation email ===
const MODE_EMAIL = "email"

/** Message d'erreur de l'adresse du dépôt (vide si valide). */
function getBusinessAddressError(address: string): string | null {
  return address.trim() ? null : "L'adresse du dépôt est requise."
}`,
  },
  {
    file: "app/(auth)/inscription/vendeur/page.tsx",
    desc: "validateConfigForm réutilise le helper",
    find: `    const businessAddressError = businessAddress.trim()
      ? null
      : "L'adresse du dépôt est requise."`,
    replace: `    const businessAddressError = getBusinessAddressError(businessAddress)`,
  },
  {
    file: "app/(auth)/inscription/vendeur/page.tsx",
    desc: "Erreur d'adresse : source unique pour l'affichage",
    find: `                {error && businessAddressError && (
                  <p className="text-sm text-destructive" role="alert">
                    {businessAddressError}
                  </p>
                )}`,
    replace: `                {error && getBusinessAddressError(businessAddress) && (
                  <p className="text-sm text-destructive" role="alert">
                    {getBusinessAddressError(businessAddress)}
                  </p>
                )}`,
  },
  {
    file: "app/(auth)/inscription/vendeur/page.tsx",
    desc: "Description : champ texte → Textarea (rows n'existe pas sur input)",
    find: `                  <Input
                    id="businessDescription"
                    type="text"
                    autoComplete="textarea"
                    placeholder="Décrivez votre point de vente (horaires, spécialités...)"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                    className="pl-10 h-24 resize-y"
                    disabled={loading}
                  />`,
    replace: `                  <Textarea
                    id="businessDescription"
                    placeholder="Décrivez votre point de vente (horaires, spécialités...)"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                    className="pl-10 h-24 resize-y"
                    disabled={loading}
                  />`,
  },
  {
    file: "next.config.ts",
    desc: "Pattern distant pour l'icône Google (svgrepo)",
    find: `const nextConfig: NextConfig = {
  experimental: {`,
    replace: `const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.svgrepo.com",
      },
    ],
  },
  experimental: {`,
  },
]

let failures = 0
for (const edit of edits) {
  const file = path.join(root, edit.file)
  const source = fs.readFileSync(file, "utf8")
  if (source.includes(edit.replace)) {
    console.log(`SKIP (déjà appliqué) ${edit.file} — ${edit.desc}`)
    continue
  }
  if (!source.includes(edit.find)) {
    console.error(`ÉCHEC : introuvable dans ${edit.file} — ${edit.desc}`)
    failures++
    continue
  }
  fs.writeFileSync(file, source.replace(edit.find, edit.replace))
  console.log(`OK  ${edit.file} — ${edit.desc}`)
}

if (failures > 0) process.exit(1)
console.log("\nPatch terminé.")
