export interface ExtractedInterviewData {
  household: {
    size: number;
    members: Array<{
      name?: string;
      age?: number;
      relationship?: string;
      isDisabled?: boolean;
      isStudent?: boolean;
      isEmployed?: boolean;
    }>;
    hasElderly: boolean;
    hasDisabled: boolean;
    hasChildren: boolean;
    hasPregnantMember: boolean;
  };
  income: {
    totalMonthly: number;
    sources: Array<{
      type: string;
      amount: number;
      frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
      recipient?: string;
    }>;
    hasEmploymentIncome: boolean;
    hasUnemploymentBenefits: boolean;
    hasSocialSecurity: boolean;
    hasDisabilityBenefits: boolean;
    hasChildSupport: boolean;
    hasOtherBenefits: boolean;
  };
  expenses: {
    rent?: number;
    utilities?: number;
    medical?: number;
    childcare?: number;
    transportation?: number;
    other?: number;
    totalMonthly: number;
  };
  assets: {
    hasSavingsAccount: boolean;
    hasCheckingAccount: boolean;
    hasVehicle: boolean;
    hasProperty: boolean;
    totalValue?: number;
  };
  eligibility: {
    grossIncomeTest: {
      passed: boolean;
      limit: number;
      currentIncome: number;
    };
    netIncomeTest: {
      passed: boolean;
      limit: number;
      currentIncome: number;
    };
    assetTest: {
      passed: boolean;
      limit: number;
      currentAssets: number;
    };
    categoricalEligibility: boolean;
    estimatedBenefit?: number;
    qualifyingFactors: string[];
    disqualifyingFactors: string[];
  };
  flags: {
    needsDocumentVerification: string[];
    inconsistentInformation: string[];
    requiresFollowUp: string[];
    expeditedProcessing: boolean;
    urgentNeeds: string[];
  };
  interviewMetadata: {
    completionPercentage: number;
    duration?: number;
    language: string;
    assistanceNeeded: boolean;
    questionsAnswered: number;
    questionsSkipped: number;
  };
}

export function extractInterviewData(transcript: string): Partial<ExtractedInterviewData> {
  const data: Partial<ExtractedInterviewData> = {
    household: {
      size: 0,
      members: [],
      hasElderly: false,
      hasDisabled: false,
      hasChildren: false,
      hasPregnantMember: false,
    },
    income: {
      totalMonthly: 0,
      sources: [],
      hasEmploymentIncome: false,
      hasUnemploymentBenefits: false,
      hasSocialSecurity: false,
      hasDisabilityBenefits: false,
      hasChildSupport: false,
      hasOtherBenefits: false,
    },
    expenses: {
      totalMonthly: 0,
    },
    assets: {
      hasSavingsAccount: false,
      hasCheckingAccount: false,
      hasVehicle: false,
      hasProperty: false,
    },
    flags: {
      needsDocumentVerification: [],
      inconsistentInformation: [],
      requiresFollowUp: [],
      expeditedProcessing: false,
      urgentNeeds: [],
    },
  };

  // Extract household size
  const householdMatch = transcript.match(/(\d+)\s*(?:people|persons?|members?|individuals?)\s*(?:in|live)/i);
  if (householdMatch) {
    data.household!.size = parseInt(householdMatch[1]);
  }

  // Check for elderly members
  if (/\b(?:elderly|senior|65|sixty.?five|retirement|retired)\b/i.test(transcript)) {
    data.household!.hasElderly = true;
  }

  // Check for disabled members
  if (/\b(?:disab|wheelchair|special needs|SSI|SSDI)\b/i.test(transcript)) {
    data.household!.hasDisabled = true;
  }

  // Check for children
  if (/\b(?:child|kids?|son|daughter|minor|school|daycare)\b/i.test(transcript)) {
    data.household!.hasChildren = true;
  }

  // Check for pregnancy
  if (/\b(?:pregnant|pregnancy|expecting|baby on the way)\b/i.test(transcript)) {
    data.household!.hasPregnantMember = true;
  }

  // Extract income amounts
  const incomeMatches = transcript.matchAll(/\$?([\d,]+)\s*(?:per|a|\/)\s*(week|month|year|hour)/gi);
  for (const match of incomeMatches) {
    const amount = parseInt(match[1].replace(/,/g, ''));
    const frequency = match[2].toLowerCase();
    
    let monthlyAmount = amount;
    if (frequency.includes('week')) monthlyAmount = amount * 4.33;
    else if (frequency.includes('year')) monthlyAmount = amount / 12;
    else if (frequency.includes('hour')) monthlyAmount = amount * 173; // Assuming full-time
    
    data.income!.totalMonthly += monthlyAmount;
  }

  // Check for employment
  if (/\b(?:work|job|employ|wage|salary|paycheck)\b/i.test(transcript)) {
    data.income!.hasEmploymentIncome = true;
  }

  // Check for unemployment
  if (/\b(?:unemploy|laid off|job loss|looking for work)\b/i.test(transcript)) {
    data.income!.hasUnemploymentBenefits = true;
  }

  // Check for Social Security
  if (/\b(?:social security|SS|retirement benefits)\b/i.test(transcript)) {
    data.income!.hasSocialSecurity = true;
  }

  // Extract rent amount
  const rentMatch = transcript.match(/rent.*?\$?([\d,]+)/i);
  if (rentMatch) {
    data.expenses!.rent = parseInt(rentMatch[1].replace(/,/g, ''));
  }

  // Extract utilities
  const utilityMatch = transcript.match(/utilit.*?\$?([\d,]+)/i);
  if (utilityMatch) {
    data.expenses!.utilities = parseInt(utilityMatch[1].replace(/,/g, ''));
  }

  // Check for medical expenses
  const medicalMatch = transcript.match(/(?:medical|doctor|prescription|medicine).*?\$?([\d,]+)/i);
  if (medicalMatch) {
    data.expenses!.medical = parseInt(medicalMatch[1].replace(/,/g, ''));
  }

  // Check for urgent needs
  if (/\b(?:emergency|urgent|immediate|no food|hungry|eviction)\b/i.test(transcript)) {
    data.flags!.expeditedProcessing = true;
    if (/no food|hungry/i.test(transcript)) {
      data.flags!.urgentNeeds.push('No food in household');
    }
    if (/eviction/i.test(transcript)) {
      data.flags!.urgentNeeds.push('Facing eviction');
    }
  }

  // Calculate total expenses
  data.expenses!.totalMonthly = (data.expenses!.rent || 0) + 
                                (data.expenses!.utilities || 0) + 
                                (data.expenses!.medical || 0) +
                                (data.expenses!.childcare || 0) +
                                (data.expenses!.transportation || 0);

  return data;
}

export function calculateSNAPEligibility(data: Partial<ExtractedInterviewData>): {
  isEligible: boolean;
  reasons: string[];
  estimatedBenefit: number;
} {
  const household = data.household || { size: 1, hasElderly: false, hasDisabled: false };
  const income = data.income || { totalMonthly: 0 };
  
  // 2024 SNAP income limits (example for Connecticut)
  const grossIncomeLimits: Record<number, number> = {
    1: 1580,
    2: 2137,
    3: 2694,
    4: 3250,
    5: 3807,
    6: 4364,
    7: 4921,
    8: 5478,
  };

  const maxBenefits: Record<number, number> = {
    1: 292,
    2: 536,
    3: 768,
    4: 975,
    5: 1158,
    6: 1390,
    7: 1536,
    8: 1756,
  };

  const householdSize = household.size || 1;
  const grossLimit = grossIncomeLimits[Math.min(householdSize, 8)] || 5478;
  const maxBenefit = maxBenefits[Math.min(householdSize, 8)] || 1756;

  // Add extra for households larger than 8
  let adjustedGrossLimit = grossLimit;
  let adjustedMaxBenefit = maxBenefit;
  if (householdSize > 8) {
    const extra = (householdSize - 8) * 557;
    adjustedGrossLimit = grossLimit + extra;
    adjustedMaxBenefit = maxBenefit + (householdSize - 8) * 220;
  }

  const reasons: string[] = [];
  let isEligible = true;

  // Gross income test (130% of poverty level)
  if (income.totalMonthly > adjustedGrossLimit) {
    isEligible = false;
    reasons.push(`Gross income ($${income.totalMonthly}) exceeds limit ($${adjustedGrossLimit})`);
  } else {
    reasons.push(`Gross income ($${income.totalMonthly}) is within limit ($${adjustedGrossLimit})`);
  }

  // Categorical eligibility
  if (household.hasElderly || household.hasDisabled) {
    reasons.push('Household has elderly or disabled member - may qualify for higher income limits');
  }

  // Calculate estimated benefit (simplified)
  let estimatedBenefit = 0;
  if (isEligible) {
    const netIncome = income.totalMonthly * 0.8; // Rough estimate after deductions
    const thirtyPercentNet = netIncome * 0.3;
    estimatedBenefit = Math.max(0, adjustedMaxBenefit - thirtyPercentNet);
    estimatedBenefit = Math.min(estimatedBenefit, adjustedMaxBenefit);
  }

  return {
    isEligible,
    reasons,
    estimatedBenefit: Math.round(estimatedBenefit),
  };
}