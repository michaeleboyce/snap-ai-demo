/**
 * @jest-environment node
 */

import { 
  createInterview, 
  updateInterview, 
  getInterview, 
  completeInterview,
  saveInterviewCheckpoint 
} from './interviews';

// Mock the database module
jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock the schema module
jest.mock('@/lib/db/schema', () => ({
  interviews: {
    sessionId: 'sessionId',
    id: 'id',
    status: 'status',
    completedAt: 'completedAt',
    summary: 'summary',
    lastUpdated: 'lastUpdated',
    audioEnabled: 'audioEnabled',
    demoScenarioId: 'demoScenarioId',
    completedSections: 'completedSections',
    flags: 'flags',
    transcript: 'transcript',
    currentSection: 'currentSection',
    applicantName: 'applicantName',
    householdSize: 'householdSize',
    monthlyIncome: 'monthlyIncome',
    exchangeCount: 'exchangeCount',
    saveState: 'saveState',
  },
  interviewCheckpoints: {
    interviewId: 'interviewId',
    transcriptSnapshot: 'transcriptSnapshot',
    currentSection: 'currentSection',
    completedSections: 'completedSections',
    metadata: 'metadata',
  }
}));

import { db } from '@/lib/db';

describe('Interview Actions', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInterview', () => {
    it('should create a new interview with required fields', async () => {
      const mockInterview = {
        id: 1,
        sessionId: 'test-session-123',
        status: 'in_progress',
        audioEnabled: false,
        completedSections: [],
        flags: [],
        lastUpdated: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockInterview])
        })
      });

      const result = await createInterview({
        sessionId: 'test-session-123',
        audioEnabled: false
      });

      expect(result).toEqual(mockInterview);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should create interview with demo scenario', async () => {
      const mockInterview = {
        id: 2,
        sessionId: 'demo-session-456',
        status: 'in_progress',
        audioEnabled: true,
        demoScenarioId: 'scenario-1',
        completedSections: [],
        flags: [],
        lastUpdated: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockInterview])
        })
      });

      const result = await createInterview({
        sessionId: 'demo-session-456',
        audioEnabled: true,
        demoScenarioId: 'scenario-1'
      });

      expect(result).toEqual(mockInterview);
      expect(result.demoScenarioId).toBe('scenario-1');
      expect(result.audioEnabled).toBe(true);
    });
  });

  describe('updateInterview', () => {
    it('should update interview data and lastUpdated timestamp', async () => {
      const mockUpdatedInterview = {
        id: 1,
        sessionId: 'test-session-123',
        status: 'completed',
        lastUpdated: new Date(),
        applicantName: 'John Doe',
        householdSize: 3,
      };

      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedInterview])
          })
        })
      });

      const result = await updateInterview('test-session-123', {
        applicantName: 'John Doe',
        householdSize: 3,
        status: 'completed'
      });

      expect(result).toEqual(mockUpdatedInterview);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('getInterview', () => {
    it('should retrieve interview by session ID', async () => {
      const mockInterview = {
        id: 1,
        sessionId: 'test-session-123',
        status: 'in_progress',
        lastUpdated: new Date(),
      };

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockInterview])
          })
        })
      });

      const result = await getInterview('test-session-123');

      expect(result).toEqual(mockInterview);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when interview not found', async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      const result = await getInterview('non-existent-session');

      expect(result).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getInterview('error-session');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('[getInterview] Error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('completeInterview', () => {
    it('should mark interview as completed with summary', async () => {
      const mockSummary = {
        eligibility: { isEligible: true, estimatedBenefit: 250 },
        household: { size: 2, hasChildren: true }
      };

      const mockCompletedInterview = {
        id: 1,
        sessionId: 'test-session-123',
        status: 'completed',
        completedAt: new Date(),
        summary: mockSummary,
        lastUpdated: new Date(),
      };

      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCompletedInterview])
          })
        })
      });

      const result = await completeInterview('test-session-123', mockSummary);

      expect(result).toEqual(mockCompletedInterview);
      expect(result.status).toBe('completed');
      expect(result.summary).toEqual(mockSummary);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('saveInterviewCheckpoint', () => {
    it('should not save checkpoint for empty transcript', async () => {
      const result = await saveInterviewCheckpoint('test-session', []);
      expect(result).toBeNull();
    });

    it('should save checkpoint with valid transcript', async () => {
      const mockInterview = {
        id: 1,
        sessionId: 'test-session-123'
      };

      const mockCheckpoint = {
        id: 1,
        interviewId: 1,
        transcriptSnapshot: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' }
        ],
        currentSection: 'household',
        completedSections: ['household'],
        createdAt: new Date(),
      };

      // Mock the select query for finding interview
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockInterview])
          })
        })
      });

      // Mock the update and insert operations
      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      });

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCheckpoint])
        })
      });

      const transcript = [
        { role: 'user' as const, content: 'Hello, I need help with SNAP benefits' },
        { role: 'assistant' as const, content: 'I can help you with that. How many people are in your household?' },
        { role: 'user' as const, content: 'There are 3 people in my household' }
      ];

      const result = await saveInterviewCheckpoint('test-session-123', transcript);

      expect(result).toBeDefined();
      expect(result?.checkpoint).toEqual(mockCheckpoint);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error when interview not found', async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      const transcript = [
        { role: 'user' as const, content: 'Hello' }
      ];

      await expect(saveInterviewCheckpoint('non-existent', transcript))
        .rejects.toThrow('Interview not found');
    });
  });
});