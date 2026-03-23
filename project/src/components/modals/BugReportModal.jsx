import React from 'react';
import { useTranslation } from 'react-i18next';

const BugReportModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-stone-900 border-4 border-stone-600 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold text-slate-300 uppercase tracking-wider mb-4">{t('modals.bug_title')}</h2>
                    <p className="text-stone-400 text-xl">{t('modals.bug_subtitle')}</p>
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;
