import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  account,
  collaborateurPermission,
  adminAction,
} from "@/db/schema"
import { eq, count, desc, ilike, or, and } from "drizzle-orm"
import { requireAdmin, isPrincipalAdmin, canModifyUserRole } from "@/lib/session"
import { hashPassword } from "better-auth/crypto"

export type Collaborator = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  mustChangePassword: boolean
  createdAt: string | null
  updatedAt: string | null
  lastLoginAt: string | null
  permissions: string[]
}

export type CollaboratorStats = {
  total: number
  active: number
  suspended: number
  byModule: Record<string, number>
}

/**
 * GET /api/admin/collaborateurs
 * Liste les collaborateurs avec leurs permissions, filtres et recherche.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const conditions = [eq(user.role, "collaborateur")]

    if (search) {
      conditions.push(
        or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
      )
    }
    if (status === "active") {
      conditions.push(eq(user.isActive, true))
    } else if (status === "inactive") {
      conditions.push(eq(user.isActive, false))
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(user)
      .where(and(...conditions))
      .catch(() => [{ count: 0 }])

    const total = totalResult.count ?? 0

    const collaborators = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      })
      .from(user)
      .where(and(...conditions))
      .orderBy(desc(user.createdAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    // Charger les permissions de chaque collaborateur
    const collabIds = collaborators.map((c) => c.id)
    let permissionsRows: Array<{ collaboratorId: string; module: string }> = []
    if (collabIds.length > 0) {
      permissionsRows = await db
        .select({ collaboratorId: collaborateurPermission.collaboratorId, module: collaborateurPermission.module })
        .from(collaborateurPermission)
        .where(or(...collabIds.map((id) => eq(collaborateurPermission.collaboratorId, id))))
    }

    const permissionsByCollab: Record<string, string[]> = {}
    for (const row of permissionsRows) {
      if (!permissionsByCollab[row.collaboratorId]) {
        permissionsByCollab[row.collaboratorId] = []
      }
      permissionsByCollab[row.collaboratorId].push(row.module)
    }

    const data: Collaborator[] = collaborators.map((c) => ({
      ...c,
      permissions: permissionsByCollab[c.id] ?? [],
    }))

    // Stats
    const [activeCount] = await db
      .select({ count: count() })
      .from(user)
      .where(and(eq(user.role, "collaborateur"), eq(user.isActive, true)))
    const [inactiveCount] = await db
      .select({ count: count() })
      .from(user)
      .where(and(eq(user.role, "collaborateur"), eq(user.isActive, false)))

    return NextResponse.json({
      collaborators: data,
      stats: {
        total,
        active: Number(activeCount.count),
        inactive: Number(inactiveCount.count),
      },
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/collaborateurs GET] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des collaborateurs" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/collaborateurs
 * Crée un compte collaborateur avec ses informations et ses permissions.
 * Le mot de passe temporaire est généré et le compte doit être activé par le
 * collaborateur à sa première connexion (mustChangePassword = true).
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string
      email?: string
      phoneNumber?: string | null
      password?: string
      permissions?: string[]
      isActive?: boolean
    } | null

    if (!body?.name || !body?.email || !body?.password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe sont requis" },
        { status: 400 }
      )
    }

    // Vérifier l'unicité de l'email
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, body.email))
      .limit(1)
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé par un autre compte" },
        { status: 400 }
      )
    }

    // Valider les permissions demandées
    const validModules = [
      "utilisateurs",
      "clients",
      "vendeurs",
      "disponibilites",
      "reservations",
      "publicite",
      "collaborateurs",
      "marketing",
      "avis",
      "statistiques",
    ]
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p) => validModules.includes(p))
      : []
    if (permissions.length === 0) {
      return NextResponse.json(
        { error: "Au moins une permission doit être attribuée" },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()

    // Créer le compte utilisateur avec rôle collaborateur
    await db.insert(user).values({
      id,
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber || null,
      role: "collaborateur",
      isActive: body.isActive !== undefined ? body.isActive : true,
      mustChangePassword: true, // premier changement de mot de passe obligatoire
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Créer le compte better-auth (mot de passe haché)
    const hashedPassword = await hashPassword(body.password)
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: body.email,
      providerId: "credential",
      userId: id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Attribuer les permissions
    for (const module of permissions) {
      await db.insert(collaborateurPermission).values({
        id: crypto.randomUUID(),
        collaboratorId: id,
        module,
        createdAt: new Date(),
      })
    }

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "user",
        targetId: id,
        action: "create",
        details: JSON.stringify({
          name: body.name,
          email: body.email,
          role: "collaborateur",
          permissions,
        }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Collaborateur créé avec succès",
      collaborator: {
        id,
        name: body.name,
        email: body.email,
        role: "collaborateur",
        isActive: true,
        permissions,
      },
    })
  } catch (err) {
    console.error("[admin/collaborateurs POST] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création du collaborateur" },
      { status: 500 }
    )
  }
}
