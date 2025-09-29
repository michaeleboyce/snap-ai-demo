import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { chatWithFallback } from '@/lib/openai-util';

type Sections = {
  sections?: Partial<Record<'household' | 'income' | 'expenses' | 'assets' | 'special', boolean>>;
};

/**
 * Tool for checking if interview is complete
 * Verifies all required sections are covered and a closing was given
 */
export const checkInterviewComplete = tool({
  name: 'check_interview_complete',
  description: 'Calls coverage assessment internally. If all required sections (household, income, expenses, assets) are covered AND the transcript includes a friendly closing (e.g., "thank you for your time"), returns { complete: true, sections }, else { complete: false, sections }',
  parameters: z.object({
    transcript: z.string().describe('The full transcript so far'),
  }),
  execute: async ({ transcript }) => {
    console.log('[Tool] check_interview_complete: called with args →', {
      transcriptPreview: transcript.slice(0, 200) + (transcript.length > 200 ? '…' : '')
    });

    // First: assess coverage
    const covSystem = `Return ONLY strict JSON {"sections":{"household":boolean,"income":boolean,"expenses":boolean,"assets":boolean,"special":boolean}}`;
    const { content: covContent } = await chatWithFallback({
      messages: [
        { role: 'system', content: covSystem },
        { role: 'user', content: `Transcript to assess:\n\n${transcript}` },
      ],
      responseFormat: { type: 'json_object' },
      maxCompletionTokens: 200,
    });

    let sections: Sections['sections'] = {};
    try {
      const parsed = JSON.parse(covContent) as Sections;
      sections = parsed.sections ?? {};
    } catch {
      // Failed to parse, leave sections empty
    }

    const requiredCovered = !!sections?.household && !!sections?.income && !!sections?.expenses && !!sections?.assets;
    const hadClosing = /thank you for your time|that is all for now|we will get back to you soon|thank you so much/i.test(transcript);

    const result = JSON.stringify({
      complete: requiredCovered && hadClosing,
      sections: {
        household: !!sections?.household,
        income: !!sections?.income,
        expenses: !!sections?.expenses,
        assets: !!sections?.assets,
        special: !!sections?.special,
      },
    });

    console.log('[Tool] check_interview_complete: result →', result);
    return result;
  },
});