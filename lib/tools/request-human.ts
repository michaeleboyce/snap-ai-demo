import { tool } from '@openai/agents/realtime';
import { z } from 'zod';

/**
 * Tool for requesting handoff to a human representative
 * Signals the UI to gracefully hand off to a human interviewer
 */
export const requestHuman = tool({
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