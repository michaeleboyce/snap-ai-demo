import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { chatWithFallback } from '@/lib/openai-util';

// Define the SNAP interview agent following Connecticut DSS QA best practices
export const snapInterviewAgent = new RealtimeAgent({
  name: 'SNAP Interview Assistant',
  instructions: `You are a Connecticut SNAP benefits eligibility interviewer conducting a structured interview following Quality Assurance best practices.

CRITICAL: When the session starts, IMMEDIATELY begin speaking with: "Hello! I'm here to help you with your SNAP benefits application. This interview will take about 10 to 15 minutes. Everything we discuss is confidential and will only be used to determine your eligibility. Let's start with who lives in your household. Can you tell me who buys and prepares food together in your home?"

DO NOT wait for the user to speak first. DO NOT say hello and wait. Immediately launch into the full introduction and first question as written above.

VOICE INTERVIEW GUIDELINES:
- Speak clearly and at a moderate pace
- Keep responses concise but complete
- Use warm, professional tone
- Pause after questions to allow responses
- Use verbal acknowledgments like "I understand" or "Thank you"
- If you don't catch something, politely ask them to repeat

INTERVIEW STRUCTURE:
1. Introduction: Explain the process (10-15 minutes) and confidentiality
2. Household Composition: Who buys and prepares food together
3. Income: All sources (work, benefits, support)
4. Expenses: Rent/mortgage, utilities, medical, childcare
5. Special Circumstances: Disability, elderly, students
6. Summary: Confirm key information

KEY QUESTIONS TO ASK:
- "Can you tell me who lives in your household and shares meals with you?"
- "What is everyone's monthly income from all sources?"
- "What do you pay for rent or mortgage each month?"
- "Do you pay for electricity, heat, or phone services?"
- "Does anyone have medical expenses, especially those over 60 or with disabilities?"
- "Do you have childcare costs so someone can work or attend training?"

DISCREPANCY DETECTION:
- If income seems low for household size, probe gently
- If expenses exceed income, ask about other support
- If answers are vague, ask for specific amounts
- Flag missing information for follow-up

OPT-OUT HANDLING:
- If the user says "I want to speak to a human", "I need a human", "transfer me", or similar:
  1. Acknowledge their request immediately
  2. Say: "I understand you'd like to speak with a human interviewer. Please call 1-855-6-CONNECT to schedule your interview with a caseworker. Thank you for your time."
  3. End the conversation politely

REQUIRED COVERAGE POLICY:
- You must ensure all required sections are fully covered: Household, Income, Expenses, Assets & Resources.
- After each applicant response, if uncertain, call the assess_coverage tool with the known transcript so far.
- If any required section is not covered, ask targeted, specific follow-up questions for ONLY the missing sections, prioritizing Assets & Resources when incomplete.
- When you believe the interview is finished, call check_interview_complete with the current transcript. If it indicates complete and you have given a friendly closing (e.g., "Thank you for your time!"), then clearly say: "INTERVIEW_COMPLETE" and provide a brief verbal summary. Otherwise, continue asking for the missing required sections.

Remember: You MUST start speaking immediately when connected. Do not wait for any input.`,
  handoffDescription: 'SNAP benefits interview specialist',
});

// Tool for flagging complex cases that need supervisor review
const escalateToSupervisor = tool({
  name: 'escalate_to_supervisor',
  description: 'Escalate complex cases to a supervisor for review',
  parameters: z.object({
    reason: z.string().describe('Reason for escalation'),
    complexityFactors: z.array(z.string()).describe('List of factors making this case complex'),
  }),
  needsApproval: false,
  execute: async ({ reason, complexityFactors }) => {
    // In production, this would notify a supervisor
    console.log('Escalating to supervisor:', { reason, complexityFactors });
    return `Case has been flagged for supervisor review due to: ${reason}. The interview will continue, and a supervisor will review the complete transcript.`;
  },
});

// Tool for calculating estimated benefits (simplified)
const calculateEstimatedBenefit = tool({
  name: 'calculate_estimated_benefit',
  description: 'Calculate rough estimated SNAP benefit amount',
  parameters: z.object({
    householdSize: z.number().min(1).max(20),
    monthlyIncome: z.number().min(0),
    monthlyRent: z.number().min(0),
    hasElderly: z.boolean(),
    hasDisabled: z.boolean(),
  }),
  execute: async ({ householdSize, monthlyIncome, monthlyRent, hasElderly, hasDisabled }) => {
    // Simplified calculation for demo purposes
    // Real calculation would use FNS tables and deduction rules
    const grossIncomeLimit = {
      1: 1580, 2: 2137, 3: 2694, 4: 3250,
      5: 3807, 6: 4364, 7: 4921, 8: 5478,
    }[Math.min(householdSize, 8)] || 5478;

    const maxBenefit = {
      1: 292, 2: 536, 3: 768, 4: 975,
      5: 1158, 6: 1390, 7: 1536, 8: 1756,
    }[Math.min(householdSize, 8)] || 1756;

    if (monthlyIncome > grossIncomeLimit * (hasElderly || hasDisabled ? 2 : 1.3)) {
      return 'Based on the information provided, the household may not qualify for SNAP benefits due to income limits. However, a full review is needed.';
    }

    // Very rough estimate
    const netIncome = monthlyIncome * 0.8 - (monthlyRent * 0.5);
    const thirtyPercentNet = netIncome * 0.3;
    const estimatedBenefit = Math.max(20, Math.min(maxBenefit - thirtyPercentNet, maxBenefit));

    return `Based on preliminary information, the household might qualify for approximately $${Math.round(estimatedBenefit)} per month in SNAP benefits. This is just an estimate - the actual amount will be determined after full verification.`;
  },
});

// Add tools to the agent
snapInterviewAgent.tools = [escalateToSupervisor, calculateEstimatedBenefit];

// Tool: assess coverage of transcript for required sections
const assessCoverage = tool({
  name: 'assess_coverage',
  description: 'Given the transcript so far, return which sections are covered (household, income, expenses, assets, special).',
  parameters: z.object({
    transcript: z.string().describe('The full transcript so far'),
  }),
  execute: async ({ transcript }) => {
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
    return content ?? '{}';
  },
});

snapInterviewAgent.tools = [
  escalateToSupervisor,
  calculateEstimatedBenefit,
  assessCoverage,
];

// Tool: check interview completion by verifying required coverage
const checkInterviewComplete = tool({
  name: 'check_interview_complete',
  description: 'Calls coverage assessment internally. If all required sections (household, income, expenses, assets) are covered AND the transcript includes a friendly closing (e.g., "thank you for your time"), returns { complete: true, sections }, else { complete: false, sections }',
  parameters: z.object({
    transcript: z.string().describe('The full transcript so far'),
  }),
  execute: async ({ transcript }) => {
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

    type Sections = { sections?: Partial<Record<'household'|'income'|'expenses'|'assets'|'special', boolean>> };
    let sections: Sections['sections'] = {};
    try {
      const parsed = JSON.parse(covContent) as Sections;
      sections = parsed.sections ?? {};
    } catch {}

    const requiredCovered = !!sections?.household && !!sections?.income && !!sections?.expenses && !!sections?.assets;
    const hadClosing = /thank you for your time|that is all for now|we will get back to you soon|thank you so much/i.test(transcript);

    return JSON.stringify({
      complete: requiredCovered && hadClosing,
      sections: {
        household: !!sections?.household,
        income: !!sections?.income,
        expenses: !!sections?.expenses,
        assets: !!sections?.assets,
        special: !!sections?.special,
      },
    });
  },
});

snapInterviewAgent.tools = [
  escalateToSupervisor,
  calculateEstimatedBenefit,
  assessCoverage,
  checkInterviewComplete,
];

// Export configuration for the session
export const sessionConfig = {
  model: 'gpt-4o-realtime-preview-2025-06-03',
  config: {
    voice: 'alloy',
    inputAudioFormat: 'pcm16' as const,
    outputAudioFormat: 'pcm16' as const,
    turnDetection: {
      type: 'server_vad' as const,
      threshold: 0.5,
      prefixPaddingMs: 300,
      silenceDurationMs: 500,
      createResponse: true,
      interruptResponse: true,
    },
    inputAudioTranscription: {
      model: 'whisper-1',
    },
    temperature: 0.7,
    maxResponseOutputTokens: 4096,
  },
};