import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are assessing a SNAP interview transcript to determine whether key sections were covered.
Return ONLY strict JSON with booleans for each section id.

Sections to assess (true if the interviewer asked and the applicant provided a substantive answer):
- household: household composition (who lives there, sizes/ages/relationships)
- income: work/income sources and amounts or lack thereof
- expenses: housing/utilities/medical/childcare costs
- assets: bank accounts, vehicles, property, savings
- special: special circumstances like disability, elderly, pregnancy, students

Output JSON schema:
{
  "sections": {
    "household": boolean,
    "income": boolean,
    "expenses": boolean,
    "assets": boolean,
    "special": boolean
  }
}`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcript to assess:\n\n${transcript}` },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 300,
      });
    } catch {
      // Fallback to GPT-4.1 if GPT-5 is unavailable or rejects params
      completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcript to assess:\n\n${transcript}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_completion_tokens: 300,
      });
    }

    const content = completion.choices[0].message.content ?? '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 502 }
      );
    }

    type AIAssessment = { sections?: Partial<Record<'household' | 'income' | 'expenses' | 'assets' | 'special', boolean>> };
    const sections = (parsed as AIAssessment)?.sections ?? {};

    return NextResponse.json({
      sections: {
        household: !!sections.household,
        income: !!sections.income,
        expenses: !!sections.expenses,
        assets: !!sections.assets,
        special: !!sections.special,
      },
      model: completion.model,
    });
  } catch (error) {
    console.error('Error evaluating coverage:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate coverage' },
      { status: 500 }
    );
  }
}


