import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { z } from 'zod';

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