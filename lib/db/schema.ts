import { pgTable, serial, text, timestamp, json, boolean, integer, varchar } from 'drizzle-orm/pg-core';

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').unique().notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  transcript: text('transcript'),
  summary: json('summary'),
  status: text('status').default('in_progress').notNull(), // in_progress, completed, abandoned, error
  audioEnabled: boolean('audio_enabled').default(false).notNull(),
  // Save/resume fields
  applicantName: varchar('applicant_name', { length: 255 }),
  householdSize: integer('household_size'),
  monthlyIncome: integer('monthly_income'),
  currentSection: text('current_section'), // household, income, expenses, assets, special, summary
  completedSections: json('completed_sections').$type<string[]>().default([]),
  saveState: json('save_state'), // Full conversation state for resuming
  demoScenarioId: text('demo_scenario_id'), // Reference to demo scenario if applicable
  flags: json('flags').$type<string[]>().default([]), // Issues detected during interview
  exchangeCount: integer('exchange_count').default(0), // Number of message exchanges
});

export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;

// Checkpoint saves for resuming interviews
export const interviewCheckpoints = pgTable('interview_checkpoints', {
  id: serial('id').primaryKey(),
  interviewId: integer('interview_id').references(() => interviews.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  transcriptSnapshot: json('transcript_snapshot').$type<Array<{role: 'user' | 'assistant', content: string}>>().notNull(),
  currentSection: text('current_section'),
  completedSections: json('completed_sections').$type<string[]>().default([]),
  metadata: json('metadata'), // Additional state information
});

export type InterviewCheckpoint = typeof interviewCheckpoints.$inferSelect;
export type NewInterviewCheckpoint = typeof interviewCheckpoints.$inferInsert;