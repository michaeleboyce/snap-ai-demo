import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { sessionId, transcript, status = 'in_progress', audioEnabled = false } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if interview exists
    const existing = await db.select()
      .from(interviews)
      .where(eq(interviews.sessionId, sessionId))
      .limit(1);

    let result;
    
    if (existing.length > 0) {
      // Update existing interview
      result = await db.update(interviews)
        .set({
          transcript,
          status,
          completedAt: status === 'completed' ? new Date() : null,
        })
        .where(eq(interviews.sessionId, sessionId))
        .returning();
    } else {
      // Create new interview
      result = await db.insert(interviews)
        .values({
          sessionId,
          transcript,
          status,
          audioEnabled,
        })
        .returning();
    }

    return NextResponse.json({ 
      success: true, 
      interview: result[0] 
    });
  } catch (error) {
    console.error('Error saving interview:', error);
    return NextResponse.json(
      { error: 'Failed to save interview' },
      { status: 500 }
    );
  }
}