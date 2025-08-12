import { generateSessionId } from './utils';

describe('generateSessionId', () => {
  it('should generate unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    const id3 = generateSessionId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should follow the expected format', () => {
    const sessionId = generateSessionId();
    
    // Should start with 'session_'
    expect(sessionId).toMatch(/^session_/);
    
    // Should contain timestamp and random string
    expect(sessionId).toMatch(/^session_\d+_[a-z0-9]{7}$/);
  });

  it('should generate IDs with different timestamps when called sequentially', async () => {
    const id1 = generateSessionId();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const id2 = generateSessionId();
    
    const timestamp1 = id1.split('_')[1];
    const timestamp2 = id2.split('_')[1];
    
    expect(parseInt(timestamp2)).toBeGreaterThanOrEqual(parseInt(timestamp1));
  });

  it('should generate IDs that are strings', () => {
    const sessionId = generateSessionId();
    expect(typeof sessionId).toBe('string');
  });

  it('should generate IDs with consistent length structure', () => {
    const ids = Array.from({ length: 10 }, () => generateSessionId());
    
    ids.forEach(id => {
      const parts = id.split('_');
      expect(parts).toHaveLength(3); // session, timestamp, random
      expect(parts[0]).toBe('session');
      expect(parts[1]).toMatch(/^\d+$/); // timestamp should be numeric
      expect(parts[2]).toHaveLength(7); // random part should be 7 chars
    });
  });
});