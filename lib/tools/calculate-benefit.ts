import { tool } from '@openai/agents/realtime';
import { z } from 'zod';

/**
 * Tool for calculating estimated SNAP benefits (simplified)
 * Real calculations would use FNS tables and proper deduction rules
 */
export const calculateEstimatedBenefit = tool({
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