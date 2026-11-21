import "dotenv/config"

/**
 * Vérifie le comportement de Drizzle quand le schéma n'a plus de colonnes
 * latitude/longitude mais que les routes envoient encore ces clés.
 */
async function main() {
  const { db } = await import("../db")
  const { pointDeVente } = await import("../db/schema")
  const { eq } = await import("drizzle-orm")

  // 1. select avec champ undefined (cas de /api/recherche)
  try {
    const rows = await db
      .select({
        id: pointDeVente.id,
        latitude: pointDeVente.latitude,
        longitude: pointDeVente.longitude,
      })
      .from(pointDeVente)
      .limit(1)
    console.log("1. select latitude/longitude OK ->", JSON.stringify(rows))
  } catch (error) {
    console.log(
      "1. select latitude/longitude ÉCHEC ->",
      error instanceof Error ? error.message.slice(0, 300) : String(error)
    )
  }

  // 2. insert avec clés inconnues (cas de /api/depot/create)
  const probeId = `probe-should-not-exist-${Date.now()}`
  try {
    await db
      .insert(pointDeVente)
      .values({
        id: probeId,
        name: "probe",
        district: "probe",
        address: "probe",
        latitude: 4.05,
        longitude: 9.7,
      })
      .onConflictDoNothing()
    console.log("2. insert avec latitude/longitude OK (clé ignorée)")
    await db.delete(pointDeVente).where(eq(pointDeVente.id, probeId))
    console.log("   (ligne de test supprimée)")
  } catch (error) {
    console.log(
      "2. insert avec latitude/longitude ÉCHEC ->",
      error instanceof Error ? error.message.slice(0, 300) : String(error)
    )
  }

  // 3. update avec clés inconnues (cas de /api/depot/[id])
  try {
    await db
      .update(pointDeVente)
      .set({ latitude: 4.05, longitude: 9.7, updatedAt: new Date() })
      .where(eq(pointDeVente.id, "probe-nonexistent"))
    console.log("3. update avec latitude/longitude OK (clé ignorée)")
  } catch (error) {
    console.log(
      "3. update avec latitude/longitude ÉCHEC ->",
      error instanceof Error ? error.message.slice(0, 300) : String(error)
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FATAL", error)
    process.exit(1)
  })
