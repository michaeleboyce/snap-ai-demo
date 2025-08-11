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
  try {
    const { sessionId, transcript } = await request.json();

    if (!sessionId || !transcript) {
      return NextResponse.json(
        { error: 'Session ID and transcript are required' },
        { status: 400 }
      );
    }

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
          content: `Interview Transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent summaries
      max_tokens: 2000,
    });

    const summary = JSON.parse(completion.choices[0].message.content || '{}');

    // Update the interview with the summary
    await db.update(interviews)
      .set({
        summary,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(interviews.sessionId, sessionId));

    return NextResponse.json({ 
      success: true, 
      summary,
      sessionId 
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Fallback to GPT-4.1 if GPT-5 fails
    try {
      const { sessionId, transcript } = await request.json();
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: GPT5_SUMMARY_PROMPT,
          },
          {
            role: 'user',
            content: `Interview Transcript:\n\n${transcript}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const summary = JSON.parse(completion.choices[0].message.content || '{}');

      await db.update(interviews)
        .set({
          summary,
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(interviews.sessionId, sessionId));

      return NextResponse.json({ 
        success: true, 
        summary,
        sessionId,
        model: 'gpt-4-turbo-preview' // Indicate fallback was used
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