CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_action" (
	"id" text PRIMARY KEY,
	"admin_id" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"action" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avis" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_role" text NOT NULL,
	"author_image" text,
	"city" text,
	"quote" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborateur_permission" (
	"id" text PRIMARY KEY,
	"collaborator_id" text NOT NULL,
	"module" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disponibilite" (
	"id" text PRIMARY KEY,
	"point_id" text NOT NULL,
	"vendor_id" text,
	"status" text NOT NULL,
	"note" text,
	"quantity" integer,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"price" integer,
	"format" text,
	"brand" text,
	"weight_kg" text,
	"expires_at" timestamp,
	"phone" text,
	"reported_by" text,
	"reported_by_name" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favori" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"point_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_de_vente" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"brands" text[],
	"formats" text[],
	"vendor_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publicite" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"description" text,
	"image" text,
	"price" integer,
	"price_label" text,
	"location" text,
	"phone" text,
	"link_url" text,
	"slot" text DEFAULT 'home_hero' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_at" timestamp,
	"end_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publicite_event" (
	"id" text PRIMARY KEY,
	"publicite_id" text NOT NULL,
	"event_type" text NOT NULL,
	"conversion_type" text,
	"slot" text,
	"source_category" text,
	"referrer_host" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"path" text,
	"visitor_id" text,
	"session_id" text,
	"attribution_window_days" integer,
	"consented" boolean DEFAULT false NOT NULL,
	"event_key" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recharge" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"point_id" text,
	"point_name" text NOT NULL,
	"format" text NOT NULL,
	"price" integer NOT NULL,
	"purchased_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text,
	"vendor_id" text NOT NULL,
	"point_id" text NOT NULL,
	"disponibilite_id" text,
	"brand" text NOT NULL,
	"format" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reservation_code" text NOT NULL UNIQUE,
	"amount" integer DEFAULT 1000 NOT NULL,
	"amount_type" text DEFAULT 'reservation' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"reserved_at" timestamp DEFAULT now() NOT NULL,
	"collected_at" timestamp,
	"cancelled_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_event" (
	"id" text PRIMARY KEY,
	"event_type" text NOT NULL,
	"path" text,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"user_id" text,
	"consented" boolean DEFAULT false NOT NULL,
	"user_agent" text,
	"screen_width" integer,
	"screen_height" integer,
	"viewport_width" integer,
	"viewport_height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_number" text,
	"phone_verified" boolean DEFAULT false,
	"phone_number_verified" boolean DEFAULT false,
	"role" text DEFAULT 'client' NOT NULL,
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"approval_status" text DEFAULT 'none' NOT NULL,
	"approval_requested_at" timestamp,
	"approval_processed_at" timestamp,
	"approval_processed_by" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "admin_action_admin_id_idx" ON "admin_action" ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_action_created_at_idx" ON "admin_action" ("created_at");--> statement-breakpoint
CREATE INDEX "avis_status_created_idx" ON "avis" ("status","created_at");--> statement-breakpoint
CREATE INDEX "avis_user_id_idx" ON "avis" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_name_key_idx" ON "brand" ("name_key");--> statement-breakpoint
CREATE INDEX "collaborateur_permission_collab_idx" ON "collaborateur_permission" ("collaborator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collaborateur_permission_module_idx" ON "collaborateur_permission" ("collaborator_id","module");--> statement-breakpoint
CREATE INDEX "disponibilite_point_id_idx" ON "disponibilite" ("point_id");--> statement-breakpoint
CREATE INDEX "disponibilite_vendor_id_idx" ON "disponibilite" ("vendor_id");--> statement-breakpoint
CREATE INDEX "favori_user_id_idx" ON "favori" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favori_user_point_idx" ON "favori" ("user_id","point_id");--> statement-breakpoint
CREATE INDEX "point_de_vente_vendor_id_idx" ON "point_de_vente" ("vendor_id");--> statement-breakpoint
CREATE INDEX "publicite_slot_status_idx" ON "publicite" ("slot","status");--> statement-breakpoint
CREATE INDEX "publicite_event_publicite_id_idx" ON "publicite_event" ("publicite_id");--> statement-breakpoint
CREATE INDEX "publicite_event_created_at_idx" ON "publicite_event" ("created_at");--> statement-breakpoint
CREATE INDEX "publicite_event_type_created_idx" ON "publicite_event" ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "recharge_user_id_idx" ON "recharge" ("user_id");--> statement-breakpoint
CREATE INDEX "reservation_user_id_idx" ON "reservation" ("user_id");--> statement-breakpoint
CREATE INDEX "reservation_vendor_id_idx" ON "reservation" ("vendor_id");--> statement-breakpoint
CREATE INDEX "reservation_point_id_idx" ON "reservation" ("point_id");--> statement-breakpoint
CREATE INDEX "reservation_code_idx" ON "reservation" ("reservation_code");--> statement-breakpoint
CREATE INDEX "reservation_status_idx" ON "reservation" ("status");--> statement-breakpoint
CREATE INDEX "reservation_reserved_at_idx" ON "reservation" ("reserved_at");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "traffic_event_created_at_idx" ON "traffic_event" ("created_at");--> statement-breakpoint
CREATE INDEX "traffic_event_user_agent_idx" ON "traffic_event" ("user_agent");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "admin_action" ADD CONSTRAINT "admin_action_admin_id_user_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collaborateur_permission" ADD CONSTRAINT "collaborateur_permission_collaborator_id_user_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "disponibilite" ADD CONSTRAINT "disponibilite_point_id_point_de_vente_id_fkey" FOREIGN KEY ("point_id") REFERENCES "point_de_vente"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "disponibilite" ADD CONSTRAINT "disponibilite_vendor_id_user_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "disponibilite" ADD CONSTRAINT "disponibilite_reported_by_user_id_fkey" FOREIGN KEY ("reported_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "favori" ADD CONSTRAINT "favori_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favori" ADD CONSTRAINT "favori_point_id_point_de_vente_id_fkey" FOREIGN KEY ("point_id") REFERENCES "point_de_vente"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "point_de_vente" ADD CONSTRAINT "point_de_vente_vendor_id_user_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "publicite_event" ADD CONSTRAINT "publicite_event_publicite_id_publicite_id_fkey" FOREIGN KEY ("publicite_id") REFERENCES "publicite"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recharge" ADD CONSTRAINT "recharge_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recharge" ADD CONSTRAINT "recharge_point_id_point_de_vente_id_fkey" FOREIGN KEY ("point_id") REFERENCES "point_de_vente"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_vendor_id_user_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_point_id_point_de_vente_id_fkey" FOREIGN KEY ("point_id") REFERENCES "point_de_vente"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_disponibilite_id_disponibilite_id_fkey" FOREIGN KEY ("disponibilite_id") REFERENCES "disponibilite"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "traffic_event" ADD CONSTRAINT "traffic_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;