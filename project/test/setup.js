import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ✅ mock Audio
global.Audio = class {
  play() {
    return {
      catch: () => {},
    };
  }
};

// ✅ CRITICAL: mock i18n globally
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // returns key instead of real translation
  }),
}));
