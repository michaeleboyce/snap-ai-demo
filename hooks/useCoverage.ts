'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { evaluateCoverageAction } from '@/app/actions/evaluate-coverage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SectionCoverage {
  household: boolean;
  income: boolean;
  expenses: boolean;
  assets: boolean;
  special: boolean;
  complete: boolean;
}

interface UseCoverageProps {
  messages: Message[];
  debounceMs?: number;
}

/**
 * Custom hook for managing coverage assessment
 * Debounces AI calls to avoid excessive requests and provides efficient state management
 */
export function useCoverage({ messages, debounceMs = 2000 }: UseCoverageProps) {
  const [coverage, setCoverage] = useState<SectionCoverage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create transcript text from messages
  const transcriptText = useMemo(() => {
    return messages.map(m => `${m.role}: ${m.content}`).join('\\n');
  }, [messages]);

  // Debounced evaluation function
  const evaluateCoverage = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      setCoverage(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const sections = await evaluateCoverageAction(transcript);
      
      // Convert to our expected format
      const coverage: SectionCoverage = {
        household: !!sections.household,
        income: !!sections.income,
        expenses: !!sections.expenses,
        assets: !!sections.assets,
        special: !!sections.special,
        complete: !!(sections.household && sections.income && sections.expenses && sections.assets),
      };
      
      setCoverage(coverage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate coverage');
      console.error('Coverage evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced effect for transcript changes
  useEffect(() => {
    if (!transcriptText) {
      setCoverage(null);
      return;
    }

    const timer = setTimeout(() => {
      evaluateCoverage(transcriptText);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [transcriptText, debounceMs, evaluateCoverage]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!coverage) return 0;
    
    const sections = [
      coverage.household,
      coverage.income,
      coverage.expenses,
      coverage.assets,
      coverage.special
    ];
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  }, [coverage]);

  // Get sections that still need completion
  const missingSections = useMemo(() => {
    if (!coverage) return [];
    
    const missing = [];
    if (!coverage.household) missing.push('household information');
    if (!coverage.income) missing.push('income details');
    if (!coverage.expenses) missing.push('expenses');
    if (!coverage.assets) missing.push('assets');
    if (!coverage.special) missing.push('special circumstances');
    
    return missing;
  }, [coverage]);

  // Force re-evaluation (useful for manual refresh)
  const refresh = useCallback(() => {
    if (transcriptText) {
      evaluateCoverage(transcriptText);
    }
  }, [transcriptText, evaluateCoverage]);

  return {
    coverage,
    isLoading,
    error,
    completionPercentage,
    missingSections,
    refresh,
  };
}