// --------------------------------------------------
// Constants
// --------------------------------------------------

const SUPPORT_EMAIL = 'CodeWash.Support@protonmail.com';

// --------------------------------------------------
// Core builder
// --------------------------------------------------

export const buildBugReport = ({ description, stats, skills }) => ({
  description: description?.trim() || '',
  timestamp: new Date().toISOString(),
  environment: {
    userAgent: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}`,
  },
  data: {
    stats,
    skills,
  },
});

// --------------------------------------------------
// Email formatter
// --------------------------------------------------

export const formatEmailBody = (report) => {
  return `
Bug description:
${report.description || 'No description provided'}

---

Environment:
- User Agent: ${report.environment.userAgent}
- Screen: ${report.environment.screen}

---

Timestamp:
${report.timestamp}

---

Note:
For full debug data, please attach the downloaded report file.
`.trim();
};

// --------------------------------------------------
// Email sender (mailto)
// --------------------------------------------------

export const sendBugReportEmail = (report) => {
  const subject = encodeURIComponent('Bug Report');

  const body = encodeURIComponent(formatEmailBody(report));

  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  window.location.href = mailtoUrl;
};

// --------------------------------------------------
// File download
// --------------------------------------------------

export const downloadBugReport = (report) => {
  const filename = `bug-report-${Date.now()}.json`;

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};