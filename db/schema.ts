import { defineRelations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type UserRole = "client" | "vendor" | "admin" | "collaborateur";
export type AvailabilityStatus = "disponible" | "a_confirmer" | "indisponible";
export type AvailabilitySource = "vendeur" | "administration";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  phoneNumberVerified: boolean("phone_number_verified").default(false),
  role: text("role").default("client").notNull(), // 'client' | 'vendor' | 'admin' | 'collaborateur'
  image: text("image"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const pointDeVente = pgTable(
  "point_de_vente",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    district: text("district").notNull(),
    address: text("address").notNull(),
    phone: text("phone"),
    brands: text("brands").array(),
    formats: text("formats").array(),
    vendorId: text("vendor_id").references(() => user.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("point_de_vente_vendor_id_idx").on(table.vendorId)],
);

export const disponibilite = pgTable(
  "disponibilite",
  {
    id: text("id").primaryKey(),
    pointId: text("point_id")
      .notNull()
      .references(() => pointDeVente.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // AvailabilityStatus
    note: text("note"),
    quantity: integer("quantity"), // nombre de bouteilles disponibles
    price: integer("price"), // prix en FCFA (legacy, non utilisé par le dashboard vendeur)
    format: text("format"), // format de bouteille ex: '6 kg', '12,5 kg', '15 kg'
    brand: text("brand"), // marque de la bouteille
    weightKg: text("weight_kg"), // poids en kg ex: '12.5'
    expiresAt: timestamp("expires_at"), // expiration de la disponibilité (jamais affichée active après)
    phone: text("phone"), // téléphone du dépositaire pour cette disponibilité
    reportedBy: text("reported_by").references(() => user.id, { onDelete: "set null" }),
    reportedByName: text("reported_by_name").notNull(),
    source: text("source").notNull(), // AvailabilitySource
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("disponibilite_point_id_idx").on(table.pointId)],
);

export const brand = pgTable(
  "brand",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // libellé affiché (première saisie conservée)
    nameKey: text("name_key").notNull(), // clé normalisée (minuscules + espaces) pour l'unicité
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("brand_name_key_idx").on(table.nameKey)]
);

export const favori = pgTable(
  "favori",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pointId: text("point_id")
      .notNull()
      .references(() => pointDeVente.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("favori_user_id_idx").on(table.userId),
    uniqueIndex("favori_user_point_idx").on(table.userId, table.pointId),
  ],
);

export const recharge = pgTable(
  "recharge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pointId: text("point_id").references(() => pointDeVente.id, {
      onDelete: "set null",
    }),
    pointName: text("point_name").notNull(),
    format: text("format").notNull(), // '6 kg' | '12,5 kg' | '15 kg'
    price: integer("price").notNull(), // FCFA
    purchasedAt: timestamp("purchased_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("recharge_user_id_idx").on(table.userId)],
);

export const adminAction = pgTable(
  "admin_action",
  {
    id: text("id").primaryKey(),
    adminId: text("admin_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type"), // 'user' | 'vendor' | 'disponibilite' | 'point'
    targetId: text("target_id"),
    action: text("action"), // 'create' | 'update' | 'delete' | 'toggle' | 'export'
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_action_admin_id_idx").on(table.adminId),
    index("admin_action_created_at_idx").on(table.createdAt),
  ]
)

export const collaborateurPermission = pgTable(
  "collaborateur_permission",
  {
    id: text("id").primaryKey(),
    collaboratorId: text("collaborator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    module: text("module").notNull(), // 'utilisateurs' | 'vendeurs' | 'disponibilites' | 'marketing' | 'statistiques'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("collaborateur_permission_collab_idx").on(table.collaboratorId),
    uniqueIndex("collaborateur_permission_module_idx").on(
      table.collaboratorId,
      table.module
    ),
  ]
)

export const publicite = pgTable(
  "publicite",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    image: text("image"), // image stockée en data-URL (base64) dans la base
    price: integer("price"), // prix en FCFA
    priceLabel: text("price_label"), // libellé libre du prix
    location: text("location"),
    phone: text("phone"),
    linkUrl: text("link_url"), // destination au clic
    slot: text("slot").notNull().default("home_hero"), // 'home_hero' | 'apropos'
    status: text("status").notNull().default("active"), // 'active' | 'inactive'
    startAt: timestamp("start_at"),
    endAt: timestamp("end_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("publicite_slot_status_idx").on(table.slot, table.status)]
)

export const trafficEvent = pgTable(
  "traffic_event",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(), // 'pageview' | 'signup' | 'signin'
    path: text("path"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    consented: boolean("consented").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("traffic_event_created_at_idx").on(table.createdAt)]
)

export const avis = pgTable(
  "avis",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(), // snapshot du nom au dépôt
    authorRole: text("author_role").notNull(), // 'client' | 'vendor' (rôle réel)
    authorImage: text("author_image"),
    city: text("city"), // ville / quartier (facultatif)
    quote: text("quote").notNull(),
    status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected' | 'hidden'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("avis_status_created_idx").on(table.status, table.createdAt),
    index("avis_user_id_idx").on(table.userId),
  ]
)

export const relations = defineRelations(
  { user, session, account, verification, pointDeVente, disponibilite, favori, recharge, adminAction, collaborateurPermission, publicite, trafficEvent, brand, avis },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      favoris: r.many.favori(),
      recharges: r.many.recharge(),
      adminActions: r.many.adminAction(),
      avis: r.many.avis(),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
    pointDeVente: {
      vendor: r.one.user({
        from: r.pointDeVente.vendorId,
        to: r.user.id,
      }),
      disponibilites: r.many.disponibilite(),
      favoris: r.many.favori(),
      recharges: r.many.recharge(),
    },
    disponibilite: {
      point: r.one.pointDeVente({
        from: r.disponibilite.pointId,
        to: r.pointDeVente.id,
      }),
      reporter: r.one.user({
        from: r.disponibilite.reportedBy,
        to: r.user.id,
      }),
    },
    favori: {
      user: r.one.user({
        from: r.favori.userId,
        to: r.user.id,
      }),
      point: r.one.pointDeVente({
        from: r.favori.pointId,
        to: r.pointDeVente.id,
      }),
    },
    recharge: {
      user: r.one.user({
        from: r.recharge.userId,
        to: r.user.id,
      }),
      point: r.one.pointDeVente({
        from: r.recharge.pointId,
        to: r.pointDeVente.id,
      }),
    },
    adminAction: {
      admin: r.one.user({
        from: r.adminAction.adminId,
        to: r.user.id,
      }),
    },
    collaborateurPermission: {
      collaborator: r.one.user({
        from: r.collaborateurPermission.collaboratorId,
        to: r.user.id,
      }),
    },
    trafficEvent: {
      user: r.one.user({
        from: r.trafficEvent.userId,
        to: r.user.id,
      }),
    },
    avis: {
      author: r.one.user({
        from: r.avis.userId,
        to: r.user.id,
      }),
    },
  })
)