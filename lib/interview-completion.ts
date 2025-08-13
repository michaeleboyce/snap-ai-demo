/**
 * Interview Completion Detection System
 * Provides multiple fallback mechanisms to ensure interviews complete reliably
 */

export interface CompletionCriteria {
  hasAllSections: boolean;
  messageCount: number;
  idleTime: number;
  agentSignal: boolean;
  manualEnd: boolean;
}

export interface SectionCoverage {
  household: boolean;
  income: boolean;
  expenses: boolean;
  assets: boolean;
  special: boolean;
  complete: boolean;
}

/**
 * Check if interview should be completed based on manual/timeout conditions
 * Primary completion logic is now handled by the AI agent via check_interview_complete tool
 */
export function shouldCompleteInterview(
  coverage: SectionCoverage | null,
  messageCount: number,
  lastMessageTime: Date,
  agentSignal: boolean = false,
  manualEnd: boolean = false
): { shouldComplete: boolean; reason: string } {
  // Priority 1: Manual end by user
  if (manualEnd) {
    return { shouldComplete: true, reason: 'User manually ended interview' };
  }

  // Priority 2: Agent explicitly signals completion
  if (agentSignal) {
    return { shouldComplete: true, reason: 'Agent signaled completion' };
  }

  // Priority 3: Idle timeout (5 minutes of inactivity)
  const idleMinutes = (Date.now() - lastMessageTime.getTime()) / 1000 / 60;
  if (idleMinutes > 5 && messageCount > 10) {
    return { shouldComplete: true, reason: 'Interview idle for 5+ minutes' };
  }

  // Priority 4: Safety valve - prevent infinite interviews
  if (messageCount >= 50) {
    return { shouldComplete: true, reason: 'Maximum message count reached' };
  }

  return { shouldComplete: false, reason: 'Interview in progress' };
}

/**
 * Check if all required sections are covered
 */
export function isAllSectionsCovered(coverage: SectionCoverage): boolean {
  return (
    coverage.household &&
    coverage.income &&
    coverage.expenses &&
    coverage.assets &&
    coverage.special
  );
}

/**
 * Get completion percentage (0-100)
 */
export function getCompletionPercentage(coverage: SectionCoverage): number {
  const sections = [
    coverage.household,
    coverage.income,
    coverage.expenses,
    coverage.assets,
    coverage.special
  ];
  const completed = sections.filter(Boolean).length;
  return Math.round((completed / sections.length) * 100);
}

/**
 * Get user-friendly completion status message
 */
export function getCompletionStatus(coverage: SectionCoverage | null): string {
  if (!coverage) {
    return 'Starting interview...';
  }

  const percentage = getCompletionPercentage(coverage);
  const sectionsLeft = [];
  
  if (!coverage.household) sectionsLeft.push('household information');
  if (!coverage.income) sectionsLeft.push('income details');
  if (!coverage.expenses) sectionsLeft.push('expenses');
  if (!coverage.assets) sectionsLeft.push('assets');
  if (!coverage.special) sectionsLeft.push('special circumstances');

  if (percentage === 100) {
    return '✅ All sections complete! You can submit your interview.';
  } else if (percentage >= 80) {
    return `Nearly complete (${percentage}%). Just need: ${sectionsLeft.join(', ')}.`;
  } else if (percentage >= 60) {
    return `Good progress (${percentage}%). Still need: ${sectionsLeft.join(', ')}.`;
  } else if (percentage >= 40) {
    return `Making progress (${percentage}%). Please continue with: ${sectionsLeft.join(', ')}.`;
  } else if (percentage >= 20) {
    return `Getting started (${percentage}%). Next: ${sectionsLeft.join(', ')}.`;
  } else {
    return 'Just beginning. Let\'s start with your household information.';
  }
}

/**
 * Analyze message content to detect completion signals
 * Simplified - main completion detection now handled by AI agent
 */
export function detectCompletionInMessage(message: string): boolean {
  const completionPhrases = [
    'interview is complete',
    'that completes our interview',
    'we\'re all done',
    'interview has been completed'
  ];

  const lowerMessage = message.toLowerCase();
  return completionPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Create an idle warning message
 */
export function createIdleWarning(idleMinutes: number): string {
  if (idleMinutes >= 4) {
    return '⚠️ Your interview will auto-complete in 1 minute due to inactivity. Please respond to continue.';
  } else if (idleMinutes >= 3) {
    return 'Are you still there? The interview will timeout soon if there\'s no response.';
  }
  return '';
}