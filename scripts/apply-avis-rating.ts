import { neon } from "@neondatabase/serverless"

/**
 * Applique la migration additive de la note sur la table `avis`.
 * Idempotent : peut être relancé sans risque. Aucune donnée existante n'est
 * modifiée ni supprimée.
 */
async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")

  const sql = neon(url)

  await sql.query(
    `ALTER TABLE public.avis ADD COLUMN IF NOT EXISTS rating integer`
  )

  await sql.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.avis GROUP BY user_id HAVING COUNT(*) > 1) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS avis_user_id_unique_idx ON public.avis (user_id);
      END IF;
    END $$;
  `)

  const columns = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'avis'
    order by ordinal_position
  `

  console.log("Colonnes avis:", JSON.stringify(columns))

  const indexes = await sql`
    select indexname from pg_indexes
    where schemaname = 'public' and tablename = 'avis'
    order by indexname
  `
  console.log("Index avis:", JSON.stringify(indexes))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Échec de la migration avis rating:", (error as Error).message)
    process.exit(1)
  })
