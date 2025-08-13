import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SNAP_INTERVIEW_SYSTEM_PROMPT } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, sessionId } = await request.json();

    // Convert messages to OpenAI format
    const openaiMessages = [
      {
        role: 'system' as const,
        content: SNAP_INTERVIEW_SYSTEM_PROMPT,
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      max_completion_tokens: 500,
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ 
      content,
      sessionId,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}