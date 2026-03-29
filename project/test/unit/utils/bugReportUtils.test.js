import { describe, it, expect, vi } from 'vitest';
import {
  buildBugReport,
  formatEmailBody,
  sendBugReportEmail,
  downloadBugReport,
} from '@/utils/bugReportUtils';

// -------------------------------------
// buildBugReport
// -------------------------------------

describe('buildBugReport', () => {
  it('creates a report with expected structure', () => {
    const report = buildBugReport({
      description: 'Test bug',
      stats: { score: 10 },
      skills: { reading: 5 },
    });

    expect(report.description).toBe('Test bug');
    expect(report.environment).toBeDefined();
    expect(report.data.stats).toEqual({ score: 10 });
    expect(report.data.skills).toEqual({ reading: 5 });
  });
});

// -------------------------------------
// formatEmailBody
// -------------------------------------

describe('formatEmailBody', () => {
  it('formats report into readable string', () => {
    const report = {
      description: 'Bug here',
      timestamp: '123',
      environment: {
        userAgent: 'UA',
        screen: '1920x1080',
      },
    };

    const body = formatEmailBody(report);

    expect(body).toContain('Bug here');
    expect(body).toContain('UA');
    expect(body).toContain('1920x1080');
  });
});

// -------------------------------------
// sendBugReportEmail
// -------------------------------------

describe('sendBugReportEmail', () => {
  it('redirects to mailto link', () => {
    const original = window.location;

    delete window.location;
    window.location = { href: '' };

    const report = {
      description: 'Test',
      timestamp: '123',
      environment: {
        userAgent: 'UA',
        screen: '1920x1080',
      },
    };

    sendBugReportEmail(report);

    expect(window.location.href).toContain('mailto:');

    window.location = original;
  });
});

// -------------------------------------
// downloadBugReport
// -------------------------------------

describe('downloadBugReport', () => {
  it('creates a downloadable file', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');

    const report = { test: 'data' };

    downloadBugReport(report);

    expect(createObjectURL).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});