"use server";

import { db } from '@/lib/db';
import { interviews, interviewCheckpoints, type Interview } from '@/lib/db/schema';
import { eq, desc, or, isNull, and } from 'drizzle-orm';

export async function createInterview(data: {
  sessionId: string;
  audioEnabled?: boolean;
  demoScenarioId?: string;
}) {
  const [interview] = await db.insert(interviews).values({
    sessionId: data.sessionId,
    audioEnabled: data.audioEnabled || false,
    demoScenarioId: data.demoScenarioId,
    status: 'in_progress',
    completedSections: [],
    flags: [],
    lastUpdated: new Date(),
  }).returning();
  
  return interview;
}

export async function updateInterview(sessionId: string, data: Partial<Interview>) {
  const [updated] = await db
    .update(interviews)
    .set({
      ...data,
      lastUpdated: new Date(),
    })
    .where(eq(interviews.sessionId, sessionId))
    .returning();
  
  return updated;
}

export async function saveInterviewCheckpoint(sessionId: string, transcript: Array<{role: 'user' | 'assistant', content: string}>) {
  // Don't save empty sessions
  if (!transcript || transcript.length === 0) {
    return null;
  }
  
  // First find the interview
  const [interview] = await db
    .select()
    .from(interviews)
    .where(eq(interviews.sessionId, sessionId))
    .limit(1);
  
  if (!interview) {
    throw new Error('Interview not found');
  }
  
  // Analyze transcript to determine current section and completed sections
  const sectionAnalysis = analyzeTranscriptSections(transcript);
  
  // Count exchanges (pairs of user/assistant messages)
  const userMessageCount = transcript.filter(t => t.role === 'user').length;
  
  // Update interview with latest state
  await db
    .update(interviews)
    .set({
      transcript: transcript.map(t => `${t.role}: ${t.content}`).join('\n\n'),
      currentSection: sectionAnalysis.currentSection,
      completedSections: sectionAnalysis.completedSections,
      applicantName: sectionAnalysis.applicantName,
      householdSize: sectionAnalysis.householdSize,
      monthlyIncome: sectionAnalysis.monthlyIncome,
      flags: sectionAnalysis.flags,
      lastUpdated: new Date(),
      exchangeCount: userMessageCount,
      saveState: {
        transcript,
        lastSaved: new Date().toISOString(),
      },
    })
    .where(eq(interviews.id, interview.id));
  
  // Create checkpoint
  const [checkpoint] = await db
    .insert(interviewCheckpoints)
    .values({
      interviewId: interview.id,
      transcriptSnapshot: transcript,
      currentSection: sectionAnalysis.currentSection,
      completedSections: sectionAnalysis.completedSections,
      metadata: {
        applicantName: sectionAnalysis.applicantName,
        householdSize: sectionAnalysis.householdSize,
        monthlyIncome: sectionAnalysis.monthlyIncome,
      },
    })
    .returning();
  
  return { interview, checkpoint };
}

export async function getInterview(sessionId: string) {
  try {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.sessionId, sessionId))
      .limit(1);
    
    return interview;
  } catch (error) {
    console.error('[getInterview] Error:', error);
    return null;
  }
}

export async function getInterviewById(id: number) {
  const [interview] = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, id))
    .limit(1);
  
  return interview;
}

export async function listInterviews(status?: string) {
  const query = status 
    ? db.select().from(interviews).where(eq(interviews.status, status))
    : db.select().from(interviews);
  
  const results = await query.orderBy(desc(interviews.lastUpdated));
  return results;
}

export async function getInterviewCheckpoints(interviewId: number) {
  const checkpoints = await db
    .select()
    .from(interviewCheckpoints)
    .where(eq(interviewCheckpoints.interviewId, interviewId))
    .orderBy(desc(interviewCheckpoints.createdAt));
  
  return checkpoints;
}

export async function resumeFromCheckpoint(checkpointId: number) {
  const [checkpoint] = await db
    .select()
    .from(interviewCheckpoints)
    .where(eq(interviewCheckpoints.id, checkpointId))
    .limit(1);
  
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }
  
  return checkpoint;
}

export async function completeInterview(sessionId: string, summary?: unknown) {
  const [updated] = await db
    .update(interviews)
    .set({
      status: 'completed',
      completedAt: new Date(),
      summary,
      lastUpdated: new Date(),
    })
    .where(eq(interviews.sessionId, sessionId))
    .returning();
  
  return updated;
}

export async function abandonInterview(sessionId: string) {
  const [updated] = await db
    .update(interviews)
    .set({
      status: 'abandoned',
      lastUpdated: new Date(),
    })
    .where(eq(interviews.sessionId, sessionId))
    .returning();
  
  return updated;
}

export async function deleteEmptyInterviews() {
  try {
    // Delete interviews that are truly empty:
    // - No exchange count (0 or null)
    // - No transcript
    // - Status is still 'in_progress' with no completed date
    const emptyInterviews = await db
      .select()
      .from(interviews)
      .where(
        or(
          eq(interviews.exchangeCount, 0),
          isNull(interviews.exchangeCount),
          isNull(interviews.transcript),
          and(
            eq(interviews.status, 'in_progress'),
            isNull(interviews.completedAt),
            isNull(interviews.transcript)
          )
        )
      );

    // Delete each empty interview
    const deletedInterviews = [];
    for (const interview of emptyInterviews) {
      // Only delete if it's truly empty (no meaningful content)
      const hasContent = interview.transcript && interview.transcript.length > 50;
      const hasExchanges = interview.exchangeCount && interview.exchangeCount > 0;
      
      if (!hasContent && !hasExchanges) {
        const [deleted] = await db
          .delete(interviews)
          .where(eq(interviews.id, interview.id))
          .returning();
        if (deleted) {
          deletedInterviews.push(deleted);
        }
      }
    }
    
    return deletedInterviews;
  } catch (error) {
    console.error('Error deleting empty interviews:', error);
    return [];
  }
}

// Helper function to analyze transcript and extract information
function analyzeTranscriptSections(transcript: Array<{role: 'user' | 'assistant', content: string}>) {
  const fullText = transcript.map(t => t.content).join(' ').toLowerCase();
  
  const sections = {
    household: false,
    income: false,
    expenses: false,
    assets: false,
    special: false,
  };
  
  // Check for household composition discussion
  if (fullText.includes('household') || fullText.includes('lives with') || fullText.includes('family')) {
    sections.household = true;
  }
  
  // Check for income discussion
  if (fullText.includes('income') || fullText.includes('earn') || fullText.includes('salary') || fullText.includes('wages')) {
    sections.income = true;
  }
  
  // Check for expenses discussion
  if (fullText.includes('rent') || fullText.includes('mortgage') || fullText.includes('utilities') || fullText.includes('expenses')) {
    sections.expenses = true;
  }
  
  // Check for assets discussion
  if (fullText.includes('bank account') || fullText.includes('savings') || fullText.includes('vehicle') || fullText.includes('assets')) {
    sections.assets = true;
  }
  
  // Check for special circumstances
  if (fullText.includes('disability') || fullText.includes('elderly') || fullText.includes('pregnant') || fullText.includes('student')) {
    sections.special = true;
  }
  
  // Determine current section based on what's been completed
  let currentSection = 'household';
  if (sections.household) currentSection = 'income';
  if (sections.income) currentSection = 'expenses';
  if (sections.expenses) currentSection = 'assets';
  if (sections.assets) currentSection = 'special';
  if (sections.special) currentSection = 'summary';
  
  // Extract applicant information (simplified extraction)
  let applicantName: string | undefined;
  let householdSize: number | undefined;
  let monthlyIncome: number | undefined;
  
  // Try to extract household size
  const householdMatch = fullText.match(/(\d+)\s*(?:people|person|members?)/);
  if (householdMatch) {
    householdSize = parseInt(householdMatch[1]);
  }
  
  // Try to extract monthly income
  const incomeMatch = fullText.match(/\$?(\d+(?:,\d{3})*)\s*(?:per month|monthly|\/mo)/);
  if (incomeMatch) {
    monthlyIncome = parseInt(incomeMatch[1].replace(/,/g, ''));
  }
  
  // Identify any flags or issues
  const flags: string[] = [];
  if (fullText.includes('not sure') || fullText.includes("don't know")) {
    flags.push('Incomplete information');
  }
  if (fullText.includes('complex') || fullText.includes('complicated')) {
    flags.push('Complex case');
  }
  
  return {
    currentSection,
    completedSections: Object.entries(sections)
      .filter(([, completed]) => completed)
      .map(([section]) => section),
    applicantName,
    householdSize,
    monthlyIncome,
    flags,
  };
}