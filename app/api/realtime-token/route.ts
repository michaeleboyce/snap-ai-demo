import { NextResponse } from 'next/server';

// Create an ephemeral Realtime session for the browser to use with WebRTC
export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2025-06-03',
        voice: 'alloy',
        modalities: ['text', 'audio'],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Failed to create realtime session:', r.status, text);
      return NextResponse.json({ error: 'Failed to create realtime session' }, { status: 500 });
    }

    const data = await r.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating realtime session:', error);
    return NextResponse.json(
      { error: 'Failed to create realtime session' },
      { status: 500 }
    );
  }
}