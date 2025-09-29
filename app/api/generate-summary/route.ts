/**
 * DEPRECATED: Use /api/generate-summary-v2 instead
 *
 * This endpoint provides basic summary generation using GPT.
 * The v2 endpoint includes:
 * - Structured data extraction (extractInterviewData)
 * - Eligibility calculations (calculateSNAPEligibility)
 * - Enhanced summary format for UI components
 * - Better error handling
 *
 * Kept for backwards compatibility but should not be used for new features.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GPT5_SUMMARY_PROMPT } from '@/lib/prompts';
import { chatWithFallback } from '@/lib/openai-util';

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, transcript } = body as { sessionId?: string; transcript?: string };
  if (!sessionId || !transcript) {
    return NextResponse.json(
      { error: 'Session ID and transcript are required' },
      { status: 400 }
    );
  }
  const sid: string = sessionId;
  const tr: string = transcript;
  try {

    // Generate summary using GPT-5
    const { content } = await chatWithFallback({
      messages: [
        { role: 'system', content: GPT5_SUMMARY_PROMPT },
        { role: 'user', content: `Interview Transcript:\n\n${tr}` },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.3,
      maxCompletionTokens: 3000,
    });

    const summary = JSON.parse(content || '{}');

    // Update the interview with the summary
    await db.update(interviews)
      .set({
        summary,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(interviews.sessionId, sid));

    return NextResponse.json({ 
      success: true, 
      summary,
      sessionId: sid 
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fallback to GPT-4.1 if GPT-5 fails, using already-read body
    try {
      const { content: fbContent } = await chatWithFallback({
        messages: [
          { role: 'system', content: GPT5_SUMMARY_PROMPT },
          { role: 'user', content: `Interview Transcript:\n\n${tr}` },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.3,
        maxCompletionTokens: 3000,
      });

      const summary = JSON.parse(fbContent || '{}');

      await db.update(interviews)
        .set({
          summary,
          status: 'completed',
          completedAt: new Date(),
        })
      .where(eq(interviews.sessionId, sid));

      return NextResponse.json({ 
        success: true, 
        summary,
        sessionId: sid,
        model: 'gpt-4.1' // Indicate fallback was used
      });
    } catch (fallbackError) {
      console.error('Fallback to GPT-4 also failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }
  }
}