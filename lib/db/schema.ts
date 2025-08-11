import { pgTable, serial, text, timestamp, json, boolean } from 'drizzle-orm/pg-core';

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').unique().notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  transcript: text('transcript'),
  summary: json('summary'),
  status: text('status').default('in_progress').notNull(),
  audioEnabled: boolean('audio_enabled').default(false).notNull(),
});

export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;