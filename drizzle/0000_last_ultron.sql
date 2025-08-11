CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"transcript" text,
	"summary" json,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"audio_enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "interviews_session_id_unique" UNIQUE("session_id")
);
