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
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Use GPT-4 for text-based chat
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500,
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