import React, { useState } from 'react';
import {
  buildBugReport,
  sendBugReportEmail,
  downloadBugReport,
} from '../../utils/bugReportUtils';

const BugReportModal = ({ isOpen, onClose, stats, skills }) => {
  const [description, setDescription] = useState('');
  const [includeDebug, setIncludeDebug] = useState(true);
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  // -----------------------------
  // Handlers
  // -----------------------------

  const buildReport = () =>
    buildBugReport({ description, stats, skills });

  const handleEmail = () => {
    const report = buildReport();
    sendBugReportEmail(report);
    setStatus('email');
  };

  const handleDownload = () => {
    const report = buildReport();
    downloadBugReport(report);
    setStatus('download');
  };

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2b2b2b] p-6 rounded-lg w-[500px] border-2 border-stone-600 shadow-xl">
        
        {/* Title */}
        <h2 className="text-2xl text-white mb-2">Report a Bug</h2>

        {/* Hint */}
        <p className="text-sm text-gray-400 mb-4">
          Send a report via email or download it for manual sharing.
        </p>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? What did you expect? Steps to reproduce..."
          className="w-full p-3 rounded bg-black/40 text-white mb-4 resize-none"
          rows={5}
        />

        {/* Debug toggle */}
        <label className="flex items-center gap-2 text-white mb-3">
          <input
            type="checkbox"
            checked={includeDebug}
            onChange={() => setIncludeDebug(prev => !prev)}
          />
          Include debug data (recommended)
        </label>

        {/* Info */}
        <p className="text-xs text-gray-400 mb-4">
          Debug data includes game state and environment info.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleEmail}
            disabled={!description.trim()}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send via Email
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded transition"
          >
            Download Report
          </button>
        </div>

        {/* Feedback */}
        {status === 'email' && (
          <p className="text-green-400 mt-3 text-sm">
            Email client opened with pre-filled report.
          </p>
        )}

        {status === 'download' && (
          <p className="text-blue-400 mt-3 text-sm">
            Bug report downloaded successfully.
          </p>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default React.memo(BugReportModal);