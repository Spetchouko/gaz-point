p = "/home/solomon/gaz-point/app/admin/actions.ts"
s = open(p).read()

needle = """async function resolvePointByName(pointName: string): Promise<{ id: string; name: string } | null> {
  const name = normalizeText(pointName)
  if (!name) return null
  const [point] = await db
    .select({ id: pointDeVente.id, name: pointDeVente.name })
    .from(pointDeVente)
    .where(sql`lower(btrim(${pointDeVente.name})) = ${name.toLowerCase()}`)
    .limit(1)
  return point ?? null
}
"""
addition = needle + """
async function resolveVendorByName(vendorName: string): Promise<string | null> {
  const name = normalizeText(vendorName)
  if (!name) return null
  const [vendor] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(and(eq(userTable.role, "vendor"), sql`lower(btrim(${userTable.name})) = ${name.toLowerCase()}`))
    .limit(1)
  return vendor?.id ?? null
}
"""
assert needle in s
s = s.replace(needle, addition, 1)

s = s.replace(
'''  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null

  if (!pointNameRaw)''',
'''  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorNameRaw = String(formData.get("vendorName") ?? "").trim()

  if (!pointNameRaw)''',
  1)

needle2 = """  const point = await resolvePointByName(pointNameRaw)
  if (!point) {
    return {
      ok: false,
      message: `Point de vente « ${pointNameRaw} » introuvable. Saisissez ou sélectionnez un point de vente existant.`,
    }
  }
  if (!format)"""
addition2 = """  const point = await resolvePointByName(pointNameRaw)
  if (!point) {
    return {
      ok: false,
      message: `Point de vente « ${pointNameRaw} » introuvable. Saisissez ou sélectionnez un point de vente existant.`,
    }
  }
  let resolvedVendorId = vendorNameRaw
    ? await resolveVendorByName(vendorNameRaw)
    : None
  if (!resolvedVendorId) {
    const [pointRow] = await db
      .select({ vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, point.id))
      .limit(1)
    resolvedVendorId = pointRow.vendorId if pointRow else None
  }
  if (!format)"""
# python None -> None invalid for TS; fix placeholders after
addition2 = addition2.replace("None", "null")
assert needle2 in s
s = s.replace(needle2, addition2, 1)

s = s.replace(
"""    reportedBy: admin.id,
    reportedByName: admin.name ?? "Administration",
    vendorId,
    source: "administration",""",
"""    reportedBy: admin.id,
    reportedByName: admin.name ?? "Administration",
    vendorId: resolvedVendorId,
    source: "administration",""",
  1)

# update section
s = s.replace(
'''  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null

  if (!disponibiliteId)''',
'''  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorNameRaw = String(formData.get("vendorName") ?? "").trim()

  if (!disponibiliteId)''',
  1)

needle3 = """  if (!disponibiliteId) return { ok: false, message: "Disponibilité introuvable." }
  if (!pointId) return { ok: false, message: "Point de vente requis." }
  if (!format)"""
addition3 = """  if (!disponibiliteId) return { ok: false, message: "Disponibilité introuvable." }
  if (!pointId) return { ok: false, message: "Point de vente requis." }
  let resolvedVendorId = vendorNameRaw
    ? await resolveVendorByName(vendorNameRaw)
    : null
  if (!vendorNameRaw) {
    const [existingDispo] = await db
      .select({ vendorId: disponibilite.vendorId })
      .from(disponibilite)
      .where(eq(disponibilite.id, disponibiliteId))
      .limit(1)
    resolvedVendorId = existingDispo.vendorId if existingDispo else null
  }
  if (!format)"""
addition3 = addition3.replace("existingDispo.vendorId if existingDispo else null", "existingDispo?.vendorId ?? null")
assert needle3 in s
s = s.replace(needle3, addition3, 1)

s = s.replace(
"""      phone,
      note,
      vendorId,
      updatedAt: new Date(),""",
"""      phone,
      note,
      vendorId: resolvedVendorId,
      updatedAt: new Date(),""",
  1)

open(p, "w").write(s)
print("done")
