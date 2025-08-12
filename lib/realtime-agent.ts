import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { chatWithFallback } from '@/lib/openai-util';

// Define the SNAP interview agent following Connecticut DSS QA best practices
export const snapInterviewAgent = new RealtimeAgent({
  name: 'SNAP Interview Assistant',
  instructions: `You are a Connecticut SNAP benefits eligibility interviewer conducting a structured interview following Quality Assurance best practices.

CRITICAL: When the session starts, IMMEDIATELY begin speaking. Provide a brief disclosure and ask for verbal consent BEFORE proceeding with the interview questions.

Say this first, verbatim:
"Hello! I'm here to help you with your SNAP benefits application. This interview will take about 10 to 15 minutes. Everything we discuss is confidential and will only be used to determine your eligibility. You can ask to speak to a human at any time by saying 'I want to speak to a human' or by calling 1-855-6-CONNECT. Before we begin, do you consent to speak with an AI assistant?"

Then WAIT for a yes/no response:
- If the applicant clearly consents (yes/okay/sure), acknowledge and continue: "Thank you. Let's start with who lives in your household. Can you tell me who buys and prepares food together in your home?"
- If the applicant declines or asks for a human, follow OPT-OUT HANDLING below and end the conversation politely.

VOICE INTERVIEW GUIDELINES:
- Speak clearly and at a normal or slightly fast pace.
- Keep responses concise but complete
- Use warm, professional tone
- Pause after questions to allow responses
- Use verbal acknowledgments like "I understand" or "Thank you"
- If you don't catch something, politely ask them to repeat
- If the applicant gives a generic on unspecific answer, ask them to provide more details first with non-leading questions then with leading questions, after 3 attempts, move on.

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
  4. If available, call the request_human tool with reason "Applicant requested human interview" so the UI can hand off gracefully.

  5. If available, call the escalate_to_supervisor tool with reason "Applicant requested supervisor escalation" so the UI can hand off gracefully.
REQUIRED COVERAGE POLICY:
- You must ensure all required sections are fully covered: Household, Income, Expenses, Assets & Resources.
- After each applicant response, if uncertain, call the assess_coverage tool with the known transcript so far.
- If any required section is not covered, ask targeted, specific follow-up questions for ONLY the missing sections, prioritizing Assets & Resources when incomplete.
  - When you believe the interview is finished, call check_interview_complete with the current transcript. If it indicates complete and you have given a friendly closing (e.g., "Thank you for your time!"), then provide a brief verbal summary and end the conversation. Do NOT say any special keywords or markers.
  
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
    console.log('[Tool] escalate_to_supervisor: called with args →', { reason, complexityFactors });
    const result = `Case has been flagged for supervisor review due to: ${reason}. The interview will continue, and a supervisor will review the complete transcript.`;
    console.log('[Tool] escalate_to_supervisor: result →', result);
    return result;
  },
});

// Tool for requesting handoff to a human representative (signals the UI)
const requestHuman = tool({
  name: 'request_human',
  description: 'Signal the UI to hand off to a human interviewer (polite closing + stop recording + navigate).',
  parameters: z.object({
    reason: z.string().describe('Reason for handoff'),
  }),
  needsApproval: false,
  execute: async ({ reason }: { reason: string }) => {
    console.log('[Tool] request_human: called with args →', { reason });
    try {
      if (typeof window !== 'undefined') {
        const evt = new CustomEvent('interview:request_human');
        window.dispatchEvent(evt);
        console.log('[Tool] request_human: dispatched interview:request_human');
      } else {
        console.log('[Tool] request_human: window not available; UI will not receive event');
      }
    } catch (err) {
      console.error('[Tool] request_human: error dispatching event', err);
    }
    const result = `Human handoff requested (${reason})`;
    console.log('[Tool] request_human: result →', result);
    return result;
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
    console.log('[Tool] calculate_estimated_benefit: called with args →', {
      householdSize,
      monthlyIncome,
      monthlyRent,
      hasElderly,
      hasDisabled,
    });
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
      const outOfRange = 'Based on the information provided, the household may not qualify for SNAP benefits due to income limits. However, a full review is needed.';
      console.log('[Tool] calculate_estimated_benefit: result →', outOfRange);
      return outOfRange;
    }

    // Very rough estimate
    const netIncome = monthlyIncome * 0.8 - (monthlyRent * 0.5);
    const thirtyPercentNet = netIncome * 0.3;
    const estimatedBenefit = Math.max(20, Math.min(maxBenefit - thirtyPercentNet, maxBenefit));

    const result = `Based on preliminary information, the household might qualify for approximately $${Math.round(estimatedBenefit)} per month in SNAP benefits. This is just an estimate - the actual amount will be determined after full verification.`;
    console.log('[Tool] calculate_estimated_benefit: result →', result);
    return result;
  },
});

// Add tools to the agent
snapInterviewAgent.tools = [escalateToSupervisor, calculateEstimatedBenefit, requestHuman];

// Tool: assess coverage of transcript for required sections
const assessCoverage = tool({
  name: 'assess_coverage',
  description: 'Given the transcript so far, return which sections are covered (household, income, expenses, assets, special).',
  parameters: z.object({
    transcript: z.string().describe('The full transcript so far'),
  }),
  execute: async ({ transcript }) => {
    console.log('[Tool] assess_coverage: called with args →', { transcriptPreview: transcript.slice(0, 200) + (transcript.length > 200 ? '…' : '') });
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
    console.log('[Tool] check_interview_complete: called with args →', { transcriptPreview: transcript.slice(0, 200) + (transcript.length > 200 ? '…' : '') });
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

snapInterviewAgent.tools = [
  escalateToSupervisor,
  calculateEstimatedBenefit,
  requestHuman,
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