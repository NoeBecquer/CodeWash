import React from 'react';
import { useTranslation } from 'react-i18next';

const BugReportModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    // -------------------------------------
    // Safe translation helper
    // -------------------------------------
    const safeT = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    const title = safeT('modals.bug_title', 'Discovered a bug?');
    const subtitle = safeT('modals.bug_subtitle', 'Whoa... That sucks...');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-stone-900 border-4 border-stone-600 rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold text-slate-300 uppercase tracking-wider mb-4">
                        {title}
                    </h2>

                    <p className="text-stone-400 text-xl">
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;