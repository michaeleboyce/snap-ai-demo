"use server";

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type CoverageSections = {
  household: boolean;
  income: boolean;
  expenses: boolean;
  assets: boolean;
  special: boolean;
};

export async function evaluateCoverageAction(transcript: string): Promise<CoverageSections> {
  if (!transcript || transcript.trim().length === 0) {
    return { household: false, income: false, expenses: false, assets: false, special: false };
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
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_completion_tokens: 300,
    });
  } catch {
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
  type AIAssessment = { sections?: Partial<Record<'household' | 'income' | 'expenses' | 'assets' | 'special', boolean>> };
  let parsed: AIAssessment = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    // Return conservative defaults if parsing fails
    return { household: false, income: false, expenses: false, assets: false, special: false };
  }

  const s = parsed.sections ?? {};
  return {
    household: !!s.household,
    income: !!s.income,
    expenses: !!s.expenses,
    assets: !!s.assets,
    special: !!s.special,
  };
}


