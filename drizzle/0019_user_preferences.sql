CREATE TABLE IF NOT EXISTS "user_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"notify_reservations" boolean DEFAULT true NOT NULL,
	"notify_availability" boolean DEFAULT true NOT NULL,
	"notify_system" boolean DEFAULT true NOT NULL,
	"notify_marketing" boolean DEFAULT false NOT NULL,
	"theme_preference" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
