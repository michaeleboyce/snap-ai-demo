import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { chatWithFallback } from '@/lib/openai-util';

/**
 * Tool for assessing which interview sections have been covered
 * Uses AI to determine if key topics were discussed
 */
export const assessCoverage = tool({
  name: 'assess_coverage',
  description: 'Given the transcript so far, return which sections are covered (household, income, expenses, assets, special).',
  parameters: z.object({
    transcript: z.string().describe('The full transcript so far'),
  }),
  execute: async ({ transcript }) => {
    console.log('[Tool] assess_coverage: called with args →', {
      transcriptPreview: transcript.slice(0, 200) + (transcript.length > 200 ? '…' : '')
    });

    const systemPrompt = `You are assessing a SNAP interview transcript to determine whether key sections were covered.
Return ONLY strict JSON with booleans for each section id.

Sections to assess (true if the interviewer asked and the applicant provided a substantive answer):
- household: household composition (who lives there, sizes/ages/relationships)
- income: work/income sources and amounts or lack thereof
- expenses: housing/utilities/medical/childcare costs
- assets: bank accounts, vehicles, property, savings, retirement accounts
- special: disability, elderly, pregnancy, students

Output JSON:
{"sections":{"household":boolean,"income":boolean,"expenses":boolean,"assets":boolean,"special":boolean}}`;

    const { content } = await chatWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript to assess:\n\n${transcript}` },
      ],
      responseFormat: { type: 'json_object' },
      maxCompletionTokens: 300,
    });

    console.log('[Tool] assess_coverage: result →', content ?? '{}');
    return content ?? '{}';
  },
});