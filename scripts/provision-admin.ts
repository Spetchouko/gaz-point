/**
 * PROVISIONNEMENT DU PREMIER COMPTE ADMINISTRATEUR GAZPOINTS
 *
 * Ce script crée le premier compte administrateur de manière sécurisée.
 * Il doit être exécuté UNE SEULE FOIS, après le déploiement initial.
 *
 * Utilisation :
 *   npx tsx scripts/provision-admin.ts --email admin@gazpoints.com
 *
 * Le mot de passe est généré aléatoirement et affiché UNE SEULE FOIS.
 * Le compte est créé avec :
 *   - rôle "admin"
 *   - emailVerified = true (pas d'OTP requis pour l'admin)
 *   - mustChangePassword = true (changement obligatoire à la 1ère connexion)
 *
 * Aucune donnée n'est codée en dur. L'e-mail est passé en argument.
 */

import { db } from "@/db"
import { user, account } from "@/db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import * as crypto from "crypto"
import { auth } from "@/lib/auth"

// Fonction de génération de mot de passe sécurisé (crypto du Node.js)
function generateSecurePassword(length = 16): string {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  const bytes = crypto.randomBytes(length)
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length]
  }
  return password
}

async function main() {
  const args = process.argv.slice(2)
  const emailArg = args.find((a) => a.startsWith("--email="))
  const email = emailArg ? emailArg.split("=")[1] : null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(
      "Usage: npx tsx scripts/provision-admin.ts --email=admin@gazpoints.com"
    )
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Vérifier qu'aucun admin n'existe déjà (éviter le double provisionnement)
  const [existingAdmin] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1)

  if (existingAdmin) {
    console.error(
      `ERREUR : Un compte administrateur existe déjà (ID: ${existingAdmin.id}). ` +
        "Le provisionnement du premier admin a déjà été effectué."
    )
    process.exit(1)
  }

  // Vérifier que l'email n'est pas déjà utilisé
  const [existingUser] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1)

  if (existingUser) {
    console.error(
      `ERREUR : L'e-mail ${normalizedEmail} est déjà utilisé par un autre compte.`
    )
    process.exit(1)
  }

  // Générer un mot de passe aléatoire sécurisé
  const temporaryPassword = generateSecurePassword()

  try {
    // 1. Créer le compte via better-auth (gère le hashage du mot de passe)
    // Le hook user.create.before forcera le rôle à "client", nous le corrigeons après.
    const result = await auth.api.signUpEmail({
      body: {
        name: "Administrateur",
        email: normalizedEmail,
        password: temporaryPassword,
      },
    })

    const userId = result.user.id

    // 2. Corriger le rôle en "admin" directement en base
    // Le hook d'inscription publique interdit le rôle "admin", donc on le met à jour après création.
    await db
      .update(user)
      .set({
        role: "admin",
        emailVerified: true, // L'admin n'a pas besoin de vérification OTP
        mustChangePassword: true, // Changement obligatoire à la 1ère connexion
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    // 3. Journaliser la création dans adminAction
    const { adminAction } = await import("@/db/schema")
    await db.insert(adminAction).values({
      id: randomUUID(),
      adminId: userId,
      targetType: "user",
      targetId: userId,
      action: "create",
      details: `Premier compte administrateur provisionné : ${normalizedEmail}`,
      createdAt: new Date(),
    })

    console.log("\n" + "=".repeat(60))
    console.log(" COMPTE ADMINISTRATEUR CRÉÉ AVEC SUCCÈS ")
    console.log("=".repeat(60))
    console.log(` E-mail    : ${normalizedEmail}`)
    console.log(` Rôle      : administrateur`)
    console.log(` Mot de passe temporaire : ${temporaryPassword}`)
    console.log("\n ⚠️  CE MOT DE PASSE N'AFFICHERA JAMAIS PLUS. Notez-le immédiatement.")
    console.log(" ⚠️  L'administrateur devra le changer à sa première connexion.")
    console.log("=".repeat(60) + "\n")
  } catch (error) {
    console.error("ERREUR lors du provisionnement :", error)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("ERREUR fatale :", err)
  process.exit(1)
})
