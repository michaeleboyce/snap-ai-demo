CREATE TABLE "interview_checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"transcript_snapshot" json NOT NULL,
	"current_section" text,
	"completed_sections" json DEFAULT '[]'::json,
	"metadata" json
);
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "last_updated" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "applicant_name" varchar(255);--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "household_size" integer;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "monthly_income" integer;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "current_section" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "completed_sections" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "save_state" json;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "demo_scenario_id" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "flags" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "interview_checkpoints" ADD CONSTRAINT "interview_checkpoints_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE no action ON UPDATE no action;