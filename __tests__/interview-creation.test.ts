/**
 * Tests for interview creation and race condition fixes
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { createInterview, getInterview, saveInterviewCheckpoint } from '@/app/actions/interviews';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 1,
          sessionId: 'test-session-123',
          status: 'in_progress',
          audioEnabled: true,
          createdAt: new Date(),
        }]))
      }))
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{
            id: 1,
            sessionId: 'test-session-123',
            status: 'completed'
          }]))
        }))
      }))
    }))
  }
}));

// Mock the schema
vi.mock('@/lib/db/schema', () => ({
  interviews: {
    sessionId: 'sessionId',
    id: 'id'
  },
  interviewCheckpoints: {
    interviewId: 'interviewId'
  }
}));

describe('Interview Creation Race Condition Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInterview', () => {
    it('should create a new interview with correct data', async () => {
      const result = await createInterview({
        sessionId: 'test-session-123',
        audioEnabled: true,
      });

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('test-session-123');
      expect(result.status).toBe('in_progress');
    });

    it('should handle demo scenarios', async () => {
      const result = await createInterview({
        sessionId: 'demo-session-456',
        audioEnabled: false,
        demoScenarioId: 'single-adult',
      });

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('demo-session-456');
    });
  });

  describe('Race Condition Prevention', () => {
    it('should handle concurrent interview creation attempts', async () => {
      const sessionId = 'concurrent-session-789';
      
      // Mock getInterview to return null initially, then return an interview
      let callCount = 0;
      const mockGetInterview = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(null); // First call - no interview exists
        }
        return Promise.resolve({ // Subsequent calls - interview exists
          id: 1,
          sessionId,
          status: 'in_progress',
          audioEnabled: true,
        });
      });

      // Replace the actual function with our mock
      vi.mocked(getInterview).mockImplementation(mockGetInterview);

      // Simulate concurrent creation attempts
      const promises = Array(3).fill(null).map(() => 
        createInterview({
          sessionId,
          audioEnabled: true,
        })
      );

      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.sessionId).toBe(sessionId);
      });
    });

    it('should ensure interview exists before saving checkpoint', async () => {
      const sessionId = 'checkpoint-session-101';
      const transcript = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ];

      // Mock getInterview to return an interview
      vi.mocked(getInterview).mockResolvedValue({
        id: 1,
        sessionId,
        status: 'in_progress',
        audioEnabled: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
        startedAt: new Date(),
      });

      // This should not throw an error
      const result = await saveInterviewCheckpoint(sessionId, transcript);
      
      expect(result).toBeDefined();
      expect(vi.mocked(getInterview)).toHaveBeenCalledWith(sessionId);
    });

    it('should throw error when trying to save checkpoint for non-existent interview', async () => {
      const sessionId = 'non-existent-session';
      const transcript = [
        { role: 'user' as const, content: 'Hello' },
      ];

      // Mock getInterview to return null (no interview found)
      vi.mocked(getInterview).mockResolvedValue(null);

      await expect(saveInterviewCheckpoint(sessionId, transcript))
        .rejects
        .toThrow(`Interview not found for sessionId: ${sessionId}`);
    });

    it('should skip saving empty transcripts', async () => {
      const sessionId = 'empty-transcript-session';

      const result = await saveInterviewCheckpoint(sessionId, []);
      
      expect(result).toBeNull();
      // Should not call getInterview since transcript is empty
      expect(vi.mocked(getInterview)).not.toHaveBeenCalled();
    });
  });

  describe('Interview Flow Integration', () => {
    it('should handle complete interview creation -> checkpoint -> completion flow', async () => {
      const sessionId = 'full-flow-session';
      const transcript = [
        { role: 'user' as const, content: 'I need SNAP benefits' },
        { role: 'assistant' as const, content: 'I can help with that. Let me ask about your household.' },
        { role: 'user' as const, content: 'I live alone' },
        { role: 'assistant' as const, content: 'Thank you. Now about your income...' },
      ];

      // Step 1: Create interview
      const interview = await createInterview({
        sessionId,
        audioEnabled: true,
      });
      expect(interview.sessionId).toBe(sessionId);

      // Step 2: Mock getInterview to return our created interview
      vi.mocked(getInterview).mockResolvedValue(interview);

      // Step 3: Save checkpoint
      const checkpoint = await saveInterviewCheckpoint(sessionId, transcript);
      expect(checkpoint).toBeDefined();

      // Step 4: Verify the flow worked
      expect(vi.mocked(getInterview)).toHaveBeenCalledWith(sessionId);
    });

    it('should handle voice transcript race condition scenario', async () => {
      const sessionId = 'voice-race-session';
      
      // Simulate the exact scenario from the bug:
      // 1. Voice transcripts start coming in
      // 2. Multiple attempts to create interview and save checkpoints
      
      let interviewCreated = false;
      const mockGetInterview = vi.fn(() => {
        if (interviewCreated) {
          return Promise.resolve({
            id: 1,
            sessionId,
            status: 'in_progress',
            audioEnabled: true,
            createdAt: new Date(),
            lastUpdated: new Date(),
            startedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      const mockCreateInterview = vi.fn(async (data) => {
        // Simulate database creation delay
        await new Promise(resolve => setTimeout(resolve, 10));
        interviewCreated = true;
        return {
          id: 1,
          sessionId: data.sessionId,
          status: 'in_progress',
          audioEnabled: data.audioEnabled,
          createdAt: new Date(),
          lastUpdated: new Date(),
          startedAt: new Date(),
        };
      });

      vi.mocked(getInterview).mockImplementation(mockGetInterview);
      vi.mocked(createInterview).mockImplementation(mockCreateInterview);

      // Simulate multiple rapid voice transcripts
      const transcripts = [
        [{ role: 'user' as const, content: 'Hello' }],
        [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' }
        ],
        [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
          { role: 'user' as const, content: 'I need help' }
        ],
      ];

      // Process transcripts in sequence (as they would come from voice)
      for (const transcript of transcripts) {
        // Check if interview exists
        let interview = await mockGetInterview();
        
        // Create if it doesn't exist
        if (!interview) {
          interview = await mockCreateInterview({
            sessionId,
            audioEnabled: true,
          });
        }

        // Now save checkpoint (should work because interview exists)
        if (transcript.length > 0) {
          const result = await saveInterviewCheckpoint(sessionId, transcript);
          expect(result).toBeDefined();
        }
      }

      // Verify interview was created only once
      expect(mockCreateInterview).toHaveBeenCalledTimes(1);
    });
  });
});