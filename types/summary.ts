// Type definitions for SNAP interview summary data

export interface HouseholdMember {
  name: string;
  age: number;
  relationship: string;
  disabled?: boolean;
  student?: boolean;
}

export interface IncomeSource {
  source: string;
  amount: number;
  frequency: string;
  recipient: string;
}

export interface Expense {
  type: string;
  amount: number;
  frequency: string;
}

export interface InterviewSummary {
  sessionId: string;
  timestamp: string;
  eligibility: {
    isEligible: boolean;
    estimatedBenefit: number;
    reasons: string[];
  };
  household: {
    size: number;
    members: HouseholdMember[];
  };
  income: {
    total: number;
    sources: IncomeSource[];
  };
  expenses: {
    total: number;
    items: Expense[];
  };
  flags: {
    hasDiscrepancies: boolean;
    needsVerification: string[];
    specialCircumstances: string[];
  };
  caseworkerNotes?: string;
  rawTranscript?: string;
}