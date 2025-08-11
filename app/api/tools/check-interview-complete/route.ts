import { NextResponse } from 'next/server';
import { chatWithFallback } from '@/lib/openai-util';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Assess coverage first
    const coverageSystem = 'Return ONLY strict JSON {"sections":{"household":boolean,"income":boolean,"expenses":boolean,"assets":boolean,"special":boolean}}';
    const { content: covContent } = await chatWithFallback({
      messages: [
        { role: 'system', content: coverageSystem },
        { role: 'user', content: `Transcript to assess:\n\n${transcript}` },
      ],
      responseFormat: { type: 'json_object' },
      maxCompletionTokens: 200,
    });

    type Sections = { sections?: Partial<Record<'household'|'income'|'expenses'|'assets'|'special', boolean>> };
    let sections: Sections['sections'] = {};
    try {
      const parsed = JSON.parse(covContent || '{}') as Sections;
      sections = parsed.sections ?? {};
    } catch {}

    const requiredCovered = !!sections?.household && !!sections?.income && !!sections?.expenses && !!sections?.assets;
    const hadClosing = /thank you for your time|that is all for now|we will get back to you soon|thank you so much/i.test(transcript);

    return NextResponse.json({
      complete: requiredCovered && hadClosing,
      sections: {
        household: !!sections?.household,
        income: !!sections?.income,
        expenses: !!sections?.expenses,
        assets: !!sections?.assets,
        special: !!sections?.special,
      },
    });
  } catch (error) {
    console.error('Error in check-interview-complete:', error);
    return NextResponse.json({ error: 'Failed to check interview completion' }, { status: 500 });
  }
}


