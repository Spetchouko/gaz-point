import "dotenv/config"

/**
 * Mesure la fiabilité de la connexion Neon (driver HTTP) dans les mêmes
 * conditions que le serveur dev : requêtes simples répétées et concurrentes.
 */
async function main() {
  const { db } = await import("../db")
  const { user, session } = await import("../db/schema")
  const { eq, sql } = await import("drizzle-orm")

  let ok = 0
  const failures: string[] = []

  // 1. 60 requêtes séquentielles
  for (let i = 0; i < 60; i++) {
    try {
      await db.select({ id: user.id }).from(user).limit(1)
      ok++
    } catch (error) {
      const err = error as Error & { cause?: unknown }
      failures.push(
        `seq#${i} ${err.name}: ${err.message.slice(0, 160)} | cause: ${
          err.cause instanceof Error ? `${err.cause.name}: ${err.cause.message}` : String(err.cause)
        }`
      )
    }
  }

  // 2. 30 requêtes concurrentes (charge type d'une page dashboard)
  const concurrent = await Promise.allSettled(
    Array.from({ length: 30 }, () =>
      db
        .select({ token: session.token })
        .from(session)
        .where(eq(session.token, "probe-nonexistent-token"))
        .limit(1)
    )
  )
  let concOk = 0
  concurrent.forEach((result, index) => {
    if (result.status === "fulfilled") {
      concOk++
    } else {
      const err = result.reason as Error & { cause?: unknown }
      failures.push(
        `conc#${index} ${err.name}: ${err.message.slice(0, 160)} | cause: ${
          err.cause instanceof Error ? `${err.cause.name}: ${err.cause.message}` : String(err.cause)
        }`
      )
    }
  })

  // 3. Requête SQL brute pour vérifier la latence
  const started = Date.now()
  await db.execute(sql`select 1`)
  const latency = Date.now() - started

  console.log(`séquentielles OK : ${ok}/60`)
  console.log(`concurrentes OK  : ${concOk}/30`)
  console.log(`latence select 1 : ${latency} ms`)
  if (failures.length) {
    console.log(`\nÉCHECS (${failures.length}) :`)
    ;[...new Set(failures)].slice(0, 10).forEach((line) => console.log(` - ${line}`))
  } else {
    console.log("\nAucun échec")
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FATAL", error)
    process.exit(1)
  })
