import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Mock window.alert and window.confirm
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

// Mock CustomEvent for browser environment
global.CustomEvent = vi.fn().mockImplementation((event, params) => ({
  type: event,
  detail: params?.detail,
}));

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: vi.fn(),
});