/**
 * Tests for useCompletion hook race condition fixes
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useCompletion } from '@/hooks/useCompletion';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock the interview actions
vi.mock('@/app/actions/interviews', () => ({
  saveInterviewCheckpoint: vi.fn(),
  completeInterview: vi.fn(),
  getInterview: vi.fn(),
  createInterview: vi.fn(),
}));

// Mock the completion library
vi.mock('@/lib/interview-completion', () => ({
  shouldCompleteInterview: vi.fn(() => ({ shouldComplete: false, reason: 'Interview in progress' })),
  createIdleWarning: vi.fn(() => ''),
  detectCompletionInMessage: vi.fn(() => false),
}));

describe('useCompletion Hook Tests', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  const defaultProps = {
    sessionId: 'test-session-123',
    messages: [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Hi there!', timestamp: new Date() },
    ],
    coverage: {
      household: true,
      income: false,
      expenses: false,
      assets: false,
      special: false,
      complete: false,
    },
    hasConsented: true,
  };

  describe('Interview Completion Flow', () => {
    it('should complete interview successfully when interview exists', async () => {
      const { saveInterviewCheckpoint, completeInterview: completeInterviewAction, getInterview } = await import('@/app/actions/interviews');
      
      // Mock existing interview
      vi.mocked(getInterview).mockResolvedValue({
        id: 1,
        sessionId: 'test-session-123',
        status: 'in_progress',
        audioEnabled: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
        startedAt: new Date(),
      });

      vi.mocked(saveInterviewCheckpoint).mockResolvedValue({
        interview: { id: 1, sessionId: 'test-session-123' },
        checkpoint: { id: 1, interviewId: 1 }
      } as any);

      vi.mocked(completeInterviewAction).mockResolvedValue({
        id: 1,
        sessionId: 'test-session-123',
        status: 'completed'
      } as any);

      const { result } = renderHook(() => useCompletion(defaultProps));

      await act(async () => {
        await result.current.completeInterview();
      });

      await waitFor(() => {
        expect(vi.mocked(getInterview)).toHaveBeenCalledWith('test-session-123');
        expect(vi.mocked(saveInterviewCheckpoint)).toHaveBeenCalledWith(
          'test-session-123',
          expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'Hello' }),
            expect.objectContaining({ role: 'assistant', content: 'Hi there!' }),
          ])
        );
        expect(vi.mocked(completeInterviewAction)).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/summary/test-session-123');
      });
    });

    it('should create interview before completion if it doesn\'t exist', async () => {
      const { saveInterviewCheckpoint, completeInterview: completeInterviewAction, getInterview, createInterview } = await import('@/app/actions/interviews');
      
      // Mock no existing interview initially
      vi.mocked(getInterview).mockResolvedValue(null);
      
      // Mock successful interview creation
      vi.mocked(createInterview).mockResolvedValue({
        id: 1,
        sessionId: 'test-session-123',
        status: 'in_progress',
        audioEnabled: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
        startedAt: new Date(),
      });

      vi.mocked(saveInterviewCheckpoint).mockResolvedValue({
        interview: { id: 1, sessionId: 'test-session-123' },
        checkpoint: { id: 1, interviewId: 1 }
      } as any);

      vi.mocked(completeInterviewAction).mockResolvedValue({
        id: 1,
        sessionId: 'test-session-123',
        status: 'completed'
      } as any);

      const { result } = renderHook(() => useCompletion(defaultProps));

      await act(async () => {
        await result.current.completeInterview();
      });

      await waitFor(() => {
        expect(vi.mocked(getInterview)).toHaveBeenCalledWith('test-session-123');
        expect(vi.mocked(createInterview)).toHaveBeenCalledWith({
          sessionId: 'test-session-123',
          audioEnabled: true,
        });
        expect(vi.mocked(saveInterviewCheckpoint)).toHaveBeenCalled();
        expect(vi.mocked(completeInterviewAction)).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/summary/test-session-123');
      });
    });

    it('should handle completion errors gracefully', async () => {
      const { getInterview } = await import('@/app/actions/interviews');
      
      // Mock interview fetch failure
      vi.mocked(getInterview).mockRejectedValue(new Error('Database connection failed'));

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { result } = renderHook(() => useCompletion(defaultProps));

      await act(async () => {
        await result.current.completeInterview();
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to complete interview. Please try again.');
        expect(result.current.isCompleting).toBe(false);
      });

      alertSpy.mockRestore();
    });

    it('should not allow multiple concurrent completion attempts', async () => {
      const { getInterview } = await import('@/app/actions/interviews');
      
      // Mock slow interview fetch
      vi.mocked(getInterview).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          id: 1,
          sessionId: 'test-session-123',
          status: 'in_progress',
          audioEnabled: true,
          createdAt: new Date(),
          lastUpdated: new Date(),
          startedAt: new Date(),
        }), 100))
      );

      const { result } = renderHook(() => useCompletion(defaultProps));

      // Start first completion
      act(() => {
        result.current.completeInterview();
      });

      // Should be completing now
      expect(result.current.isCompleting).toBe(true);

      // Try to start second completion
      act(() => {
        result.current.completeInterview();
      });

      // Should still only be one completion in progress
      expect(vi.mocked(getInterview)).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Completion', () => {
    it('should show confirmation dialog for manual completion', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { saveInterviewCheckpoint, completeInterview: completeInterviewAction, getInterview } = await import('@/app/actions/interviews');
      
      vi.mocked(getInterview).mockResolvedValue({
        id: 1,
        sessionId: 'test-session-123',
        status: 'in_progress',
        audioEnabled: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
        startedAt: new Date(),
      });

      vi.mocked(saveInterviewCheckpoint).mockResolvedValue({} as any);
      vi.mocked(completeInterviewAction).mockResolvedValue({} as any);

      const { result } = renderHook(() => useCompletion(defaultProps));

      await act(async () => {
        await result.current.handleManualComplete();
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        'End interview now? If required sections are incomplete, you can still save and review.'
      );

      confirmSpy.mockRestore();
    });

    it('should not complete if user cancels confirmation', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { getInterview } = await import('@/app/actions/interviews');

      const { result } = renderHook(() => useCompletion(defaultProps));

      await act(async () => {
        await result.current.handleManualComplete();
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(vi.mocked(getInterview)).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Completion Status Updates', () => {
    it('should update completion status based on coverage', () => {
      const propsWithGoodCoverage = {
        ...defaultProps,
        coverage: {
          household: true,
          income: true,
          expenses: true,
          assets: false,
          special: false,
          complete: false,
        },
      };

      const { result } = renderHook(() => useCompletion(propsWithGoodCoverage));

      expect(result.current.completionStatus).toContain('Good progress (60%)');
      expect(result.current.completionStatus).toContain('assets');
    });

    it('should show ready status when all sections complete', () => {
      const propsWithFullCoverage = {
        ...defaultProps,
        coverage: {
          household: true,
          income: true,
          expenses: true,
          assets: true,
          special: true,
          complete: true,
        },
      };

      const { result } = renderHook(() => useCompletion(propsWithFullCoverage));

      expect(result.current.completionStatus).toBe('✅ All sections complete! You can submit your interview.');
      expect(result.current.isReadyForCompletion).toBe(true);
    });
  });
});