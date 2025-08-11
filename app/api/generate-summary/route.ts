import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GPT5_SUMMARY_PROMPT } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: GPT5_SUMMARY_PROMPT,
        },
        {
          role: 'user',
          content: `Interview Transcript:\n\n${tr}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent summaries
      max_completion_tokens: 2000,
    });

    const summary = JSON.parse(completion.choices[0].message.content || '{}');

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
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: GPT5_SUMMARY_PROMPT,
          },
          {
            role: 'user',
            content: `Interview Transcript:\n\n${tr}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_completion_tokens: 2000,
      });

      const summary = JSON.parse(completion.choices[0].message.content || '{}');

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