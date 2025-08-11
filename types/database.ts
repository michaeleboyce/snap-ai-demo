// Database schema types
export interface InterviewSummary {
  eligibility_assessment?: {
    likely_eligible?: boolean;
    expedited_qualifying?: boolean;
    confidence_score?: number;
    reasons?: string[];
  };
  household?: {
    size?: number;
    composition_notes?: string;
    members?: Array<{
      name?: string;
      age?: number;
      relationship?: string;
    }>;
  };
  income?: {
    total_monthly?: number;
    verification_needed?: boolean;
    sources?: Array<{
      type?: string;
      amount?: number;
      frequency?: string;
    }>;
  };
  expenses?: {
    rent_mortgage?: number;
    utilities?: number;
    medical?: number;
    total_deductions?: number;
  };
  flags?: {
    missing_information?: string[];
    inconsistencies?: string[];
    follow_up_required?: string[];
  };
  caseworker_notes?: string;
}