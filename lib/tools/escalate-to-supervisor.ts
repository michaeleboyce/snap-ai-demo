import { tool } from '@openai/agents/realtime';
import { z } from 'zod';

/**
 * Tool for flagging complex cases that need supervisor review
 */
export const escalateToSupervisor = tool({
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