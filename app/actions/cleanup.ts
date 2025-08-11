"use server";

import { deleteEmptyInterviews } from './interviews';

export async function cleanupEmptyInterviews() {
  const deleted = await deleteEmptyInterviews();
  console.log(`Deleted ${deleted.length} empty interview sessions`);
  return {
    success: true,
    deletedCount: deleted.length,
    deletedSessions: deleted.map(i => i.sessionId)
  };
}