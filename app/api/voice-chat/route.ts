import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SNAP_INTERVIEW_SYSTEM_PROMPT } from '@/lib/prompts';
import { chatWithFallback } from '@/lib/openai-util';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { audio, sessionId, messages = [] } = (await request.json()) as {
      audio: string;
      sessionId?: string;
      messages?: ChatMessage[];
    };

    // First, transcribe the audio using Whisper
    const audioBuffer = Buffer.from(audio, 'base64');
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    const userTranscript = transcription.text;

    // Then, generate a response using GPT-4
    const chatMessages = [
      {
        role: 'system' as const,
        content: SNAP_INTERVIEW_SYSTEM_PROMPT + '\n\nIMPORTANT: Keep responses concise and conversational for voice interaction. Ask one question at a time.',
      },
      ...messages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: userTranscript,
      },
    ];

    const { content: assistantResponse } = await chatWithFallback({
      messages: chatMessages,
      temperature: 0.7,
      maxCompletionTokens: 1000,
    });

    return NextResponse.json({
      transcript: userTranscript,
      response: assistantResponse,
      sessionId,
    });
  } catch (error) {
    console.error('Error in voice chat:', error);
    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    );
  }
}