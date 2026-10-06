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

export type UserRole = "client" | "vendor" | "admin";
export type AvailabilityStatus = "disponible" | "a_confirmer" | "indisponible";
export type AvailabilitySource = "vendeur" | "administration";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  role: text("role").default("client").notNull(), // 'client' | 'vendor' | 'admin'
  image: text("image"),
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
    price: integer("price"), // prix en FCFA
    format: text("format"), // format de bouteille ex: '6 kg', '12,5 kg', '15 kg'
    reportedBy: text("reported_by").references(() => user.id, { onDelete: "set null" }),
    reportedByName: text("reported_by_name").notNull(),
    source: text("source").notNull(), // AvailabilitySource
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("disponibilite_point_id_idx").on(table.pointId)],
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

export const relations = defineRelations(
  { user, session, account, verification, pointDeVente, disponibilite, favori, recharge },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      favoris: r.many.favori(),
      recharges: r.many.recharge(),
      pointsDeVente: r.many.pointDeVente(),
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
  }),
);
