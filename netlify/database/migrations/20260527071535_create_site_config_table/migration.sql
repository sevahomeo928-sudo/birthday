CREATE TABLE "site_config" (
	"id" serial PRIMARY KEY,
	"person" text NOT NULL,
	"senders" text NOT NULL,
	"theme" text DEFAULT 'classic' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
