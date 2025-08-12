'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shouldCompleteInterview, createIdleWarning, detectCompletionInMessage } from '@/lib/interview-completion';
import { saveInterviewCheckpoint, completeInterview as completeInterviewAction } from '@/app/actions/interviews';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SectionCoverage {
  household: boolean;
  income: boolean;
  expenses: boolean;
  assets: boolean;
  special: boolean;
  complete: boolean;
}

interface UseCompletionProps {
  sessionId: string;
  messages: Message[];
  coverage: SectionCoverage | null;
  hasConsented: boolean;
}

export function useCompletion({ sessionId, messages, coverage, hasConsented }: UseCompletionProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(new Date());
  const [idleWarning, setIdleWarning] = useState('');
  const [completionStatus, setCompletionStatus] = useState('');
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const agentSignalRef = useRef(false);

  // Update last message time when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageTime(new Date());
      
      // Check if the latest assistant message indicates completion
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const isCompletionSignal = detectCompletionInMessage(lastMessage.content);
        if (isCompletionSignal) {
          agentSignalRef.current = true;
        }
      }
    }
  }, [messages]);

  // Update completion status based on coverage
  useEffect(() => {
    if (!coverage) {
      setCompletionStatus('Starting interview...');
      return;
    }

    const sectionsLeft = [];
    if (!coverage.household) sectionsLeft.push('household information');
    if (!coverage.income) sectionsLeft.push('income details');
    if (!coverage.expenses) sectionsLeft.push('expenses');
    if (!coverage.assets) sectionsLeft.push('assets');
    if (!coverage.special) sectionsLeft.push('special circumstances');

    const completedCount = [coverage.household, coverage.income, coverage.expenses, coverage.assets, coverage.special]
      .filter(Boolean).length;
    const percentage = Math.round((completedCount / 5) * 100);

    if (percentage === 100) {
      setCompletionStatus('✅ All sections complete! You can submit your interview.');
    } else if (percentage >= 80) {
      setCompletionStatus(`Nearly complete (${percentage}%). Just need: ${sectionsLeft.join(', ')}.`);
    } else if (percentage >= 60) {
      setCompletionStatus(`Good progress (${percentage}%). Still need: ${sectionsLeft.join(', ')}.`);
    } else if (percentage >= 40) {
      setCompletionStatus(`Making progress (${percentage}%). Please continue with: ${sectionsLeft.join(', ')}.`);
    } else if (percentage >= 20) {
      setCompletionStatus(`Getting started (${percentage}%). Next: ${sectionsLeft.join(', ')}.`);
    } else {
      setCompletionStatus(`Just beginning. Let's start with your household information.`);
    }
  }, [coverage]);

  // Complete interview function
  const completeInterview = useCallback(async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      // Ensure interview exists before saving
      const { getInterview, createInterview } = await import('@/app/actions/interviews');
      let interview = await getInterview(sessionId);
      
      if (!interview) {
        console.log('[useCompletion] Creating interview before completion:', sessionId);
        interview = await createInterview({
          sessionId,
          audioEnabled: true, // Assume voice if completing without existing interview
        });
      }
      
      // Save final transcript
      const transcriptData = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      if (transcriptData.length > 0) {
        await saveInterviewCheckpoint(sessionId, transcriptData);
      }
      
      // Generate summary data
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      const summary = {
        totalMessages: messages.length,
        exchangeCount: userMessageCount,
        completedSections: Object.entries(coverage || {})
          .filter(([k, v]) => v && k !== 'complete')
          .map(([k]) => k),
        timestamp: new Date().toISOString(),
      };
      
      // Mark interview as complete
      await completeInterviewAction(sessionId, summary);
      
      // Navigate to summary page
      router.push(`/summary/${sessionId}`);
    } catch (error) {
      console.error('Error completing interview:', error);
      alert('Failed to complete interview. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  }, [messages, coverage, router, sessionId, isCompleting]);

  // Monitor for auto-completion conditions
  useEffect(() => {
    if (!hasConsented || messages.length === 0) return;

    // Check completion conditions
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    const completion = shouldCompleteInterview(
      coverage,
      userMessageCount,
      lastMessageTime,
      agentSignalRef.current,
      false
    );

    // Handle idle timeout
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      const idleMinutes = (Date.now() - lastMessageTime.getTime()) / 1000 / 60;
      const warning = createIdleWarning(idleMinutes);
      setIdleWarning(warning);

      // Auto-complete if idle too long
      if (idleMinutes > 5 && userMessageCount > 10) {
        console.log('[useCompletion] Auto-completing due to idle timeout');
        completeInterview();
      }
    }, 60000); // Check every minute

    // Auto-complete if criteria met
    if (completion.shouldComplete && !isCompleting) {
      console.log('[useCompletion] Auto-completing:', completion.reason);
      setTimeout(() => completeInterview(), 3000); // Give user time to see status
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [messages, coverage, lastMessageTime, hasConsented, isCompleting, completeInterview]);

  // Manual completion function
  const handleManualComplete = useCallback(async () => {
    const wantsToEnd = confirm('End interview now? If required sections are incomplete, you can still save and review.');
    if (!wantsToEnd) return;
    await completeInterview();
  }, [completeInterview]);

  // Check if interview is ready for completion
  const isReadyForCompletion = coverage?.complete || messages.length > 10;

  return {
    isCompleting,
    completionStatus,
    idleWarning,
    isReadyForCompletion,
    completeInterview,
    handleManualComplete,
  };
}