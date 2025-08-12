import { extractInterviewData, calculateSNAPEligibility } from './interview-extractor';

describe('extractInterviewData', () => {
  describe('household size extraction', () => {
    it('should extract household size from transcript', () => {
      const transcript = 'I live with 3 people in my household including myself.';
      const result = extractInterviewData(transcript);
      
      expect(result.household?.size).toBe(3);
    });

    it('should handle different phrasings for household size', () => {
      const transcripts = [
        '4 people live in our house',
        '2 members live in my household', 
        '5 individuals live here',
        '1 person lives in our home'
      ];
      
      const expectedSizes = [4, 2, 5, 1];
      
      transcripts.forEach((transcript, index) => {
        const result = extractInterviewData(transcript);
        expect(result.household?.size).toBe(expectedSizes[index]);
      });
    });
  });

  describe('household composition detection', () => {
    it('should detect elderly household members', () => {
      const transcript = 'My grandmother is 67 years old and lives with us. She is elderly and retired.';
      const result = extractInterviewData(transcript);
      
      expect(result.household?.hasElderly).toBe(true);
    });

    it('should detect disabled household members', () => {
      const transcript = 'My brother has a disability and receives SSDI benefits.';
      const result = extractInterviewData(transcript);
      
      expect(result.household?.hasDisabled).toBe(true);
    });

    it('should detect children in household', () => {
      const transcript = 'I have two kids, ages 8 and 12, who go to school.';
      const result = extractInterviewData(transcript);
      
      expect(result.household?.hasChildren).toBe(true);
    });

    it('should detect pregnant household members', () => {
      const transcript = 'My wife is pregnant and expecting our first baby in 3 months.';
      const result = extractInterviewData(transcript);
      
      expect(result.household?.hasPregnantMember).toBe(true);
    });
  });

  describe('income extraction', () => {
    it('should extract monthly income amounts', () => {
      const transcript = 'I earn $2000 per month from my job at the store.';
      const result = extractInterviewData(transcript);
      
      expect(result.income?.totalMonthly).toBe(2000);
    });

    it('should convert weekly income to monthly', () => {
      const transcript = 'I make $500 per week from my part-time job.';
      const result = extractInterviewData(transcript);
      
      // $500 * 4.33 weeks = $2165
      expect(result.income?.totalMonthly).toBeCloseTo(2165, 0);
    });

    it('should convert yearly income to monthly', () => {
      const transcript = 'My annual salary is $36000 per year.';
      const result = extractInterviewData(transcript);
      
      // $36000 / 12 = $3000
      expect(result.income?.totalMonthly).toBe(3000);
    });

    it('should detect employment income', () => {
      const transcript = 'I work full-time and get a paycheck every two weeks.';
      const result = extractInterviewData(transcript);
      
      expect(result.income?.hasEmploymentIncome).toBe(true);
    });

    it('should detect unemployment benefits', () => {
      const transcript = 'I was laid off last month and am looking for work.';
      const result = extractInterviewData(transcript);
      
      expect(result.income?.hasUnemploymentBenefits).toBe(true);
    });

    it('should detect Social Security income', () => {
      const transcript = 'I receive Social Security retirement benefits.';
      const result = extractInterviewData(transcript);
      
      expect(result.income?.hasSocialSecurity).toBe(true);
    });
  });

  describe('expense extraction', () => {
    it('should extract rent amount', () => {
      const transcript = 'My rent is $1200 per month for my apartment.';
      const result = extractInterviewData(transcript);
      
      expect(result.expenses?.rent).toBe(1200);
    });

    it('should extract utility costs', () => {
      const transcript = 'My utilities cost $150 each month.';
      const result = extractInterviewData(transcript);
      
      expect(result.expenses?.utilities).toBe(150);
    });

    it('should extract medical expenses', () => {
      const transcript = 'My prescription medications cost $80 per month.';
      const result = extractInterviewData(transcript);
      
      expect(result.expenses?.medical).toBe(80);
    });

    it('should calculate total monthly expenses', () => {
      const transcript = 'My rent is $1000, utilities are $100, and medical costs are $50.';
      const result = extractInterviewData(transcript);
      
      expect(result.expenses?.totalMonthly).toBe(1150);
    });
  });

  describe('urgent needs detection', () => {
    it('should detect urgent food needs', () => {
      const transcript = 'We have no food in the house and my children are hungry.';
      const result = extractInterviewData(transcript);
      
      expect(result.flags?.expeditedProcessing).toBe(true);
      expect(result.flags?.urgentNeeds).toContain('No food in household');
    });

    it('should detect eviction threats', () => {
      const transcript = 'I received an eviction notice and need help immediately.';
      const result = extractInterviewData(transcript);
      
      expect(result.flags?.expeditedProcessing).toBe(true);
      expect(result.flags?.urgentNeeds).toContain('Facing eviction');
    });
  });
});

describe('calculateSNAPEligibility', () => {
  it('should determine eligibility for low-income household', () => {
    const data = {
      household: { size: 2, hasElderly: false, hasDisabled: false },
      income: { totalMonthly: 1500 }
    };
    
    const result = calculateSNAPEligibility(data);
    
    expect(result.isEligible).toBe(true);
    expect(result.estimatedBenefit).toBeGreaterThan(0);
    expect(result.reasons).toContain('Gross income ($1500) is within limit ($2137)');
  });

  it('should determine ineligibility for high-income household', () => {
    const data = {
      household: { size: 1, hasElderly: false, hasDisabled: false },
      income: { totalMonthly: 2000 }
    };
    
    const result = calculateSNAPEligibility(data);
    
    expect(result.isEligible).toBe(false);
    expect(result.estimatedBenefit).toBe(0);
    expect(result.reasons).toContain('Gross income ($2000) exceeds limit ($1580)');
  });

  it('should handle elderly/disabled household benefits', () => {
    const data = {
      household: { size: 1, hasElderly: true, hasDisabled: false },
      income: { totalMonthly: 1200 }
    };
    
    const result = calculateSNAPEligibility(data);
    
    expect(result.reasons).toContain('Household has elderly or disabled member - may qualify for higher income limits');
  });

  it('should calculate benefits for larger households', () => {
    const data = {
      household: { size: 6, hasElderly: false, hasDisabled: false },
      income: { totalMonthly: 3000 }
    };
    
    const result = calculateSNAPEligibility(data);
    
    expect(result.isEligible).toBe(true);
    expect(result.estimatedBenefit).toBeGreaterThan(0);
  });

  it('should handle very large households (over 8 people)', () => {
    const data = {
      household: { size: 10, hasElderly: false, hasDisabled: false },
      income: { totalMonthly: 4000 }
    };
    
    const result = calculateSNAPEligibility(data);
    
    expect(result.isEligible).toBe(true);
  });

  it('should handle edge case with no income', () => {
    const data = {
      household: { size: 1, hasElderly: false, hasDisabled: false },
      income: { totalMonthly: 0 }
    };
    
    const result = calculateSNAPEligibility(data);
    
    expect(result.isEligible).toBe(true);
    expect(result.estimatedBenefit).toBeGreaterThan(0);
  });
});