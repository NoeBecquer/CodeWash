import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CORRECT_ANSWER = 'FLOPPY DISK';
const NORMALIZED_ANSWER = CORRECT_ANSWER.replace(/\s/g, '');

const ParentalVerificationModal = ({ isOpen, onClose, onVerified }) => {
    const { t } = useTranslation();

    const [answer, setAnswer] = useState('');
    const [error, setError] = useState(false);
    const inputRef = useRef(null);

    if (!isOpen) return null;

    // -------------------------------------
    // Safe translation
    // -------------------------------------
    const safeT = (key, fallback) => {
        const v = t(key);
        return v === key ? fallback : v;
    };

    // -------------------------------------
    // Handlers
    // -------------------------------------
    const resetState = () => {
        setAnswer('');
        setError(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (answer === NORMALIZED_ANSWER) {
            onVerified();
            resetState();
        } else {
            setError(true);
        }
    };

    const handleInputChange = (e) => {
        let value = e.target.value;

        // normalize input
        value = value.replace(/\s/g, '').toUpperCase();

        if (value.length > NORMALIZED_ANSWER.length) return;

        setAnswer(value);
        setError(false);
    };

    const handleSlotClick = () => {
        inputRef.current?.focus();
    };

    // -------------------------------------
    // Slot helpers
    // -------------------------------------
    const getInputIndexForDisplay = (displayIndex) => {
        let inputIndex = 0;

        for (let i = 0; i < displayIndex; i++) {
            if (CORRECT_ANSWER[i] !== ' ') inputIndex++;
        }

        return inputIndex;
    };

    const isSlotFilled = (displayIndex) => {
        const inputIndex = getInputIndexForDisplay(displayIndex);
        return inputIndex < answer.length;
    };

    const getDisplayChar = (displayIndex) => {
        return isSlotFilled(displayIndex) ? '*' : '';
    };

    // -------------------------------------
    // UI
    // -------------------------------------
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative bg-stone-900 border-4 border-blue-600 rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center">

                    {/* Icon */}
                    <div className="bg-blue-600/20 p-6 rounded-full mb-4 border-2 border-blue-600">
                        <Save size={64} className="text-blue-400" />
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-bold text-blue-400 uppercase tracking-wider mb-4">
                        {safeT('modals.parental_title', 'What is this?')}
                    </h2>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="w-full">

                        {/* Slots */}
                        <div
                            className="relative w-full flex justify-center mb-4"
                            onClick={handleSlotClick}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={answer}
                                onChange={handleInputChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                autoFocus
                                maxLength={NORMALIZED_ANSWER.length}
                            />

                            <div className={`flex gap-1 flex-wrap justify-center cursor-pointer ${error ? 'animate-shake' : ''}`}>
                                {CORRECT_ANSWER.split('').map((char, i) => (
                                    char === ' ' ? (
                                        <div key={i} className="w-4" />
                                    ) : (
                                        <div
                                            key={i}
                                            className={`w-7 h-9 border-b-4 flex items-center justify-center text-lg font-mono font-bold text-white bg-black/20 rounded-t ${
                                                error
                                                    ? 'border-red-500 bg-red-900/30'
                                                    : isSlotFilled(i)
                                                        ? 'border-green-500'
                                                        : 'border-gray-600'
                                            }`}
                                        >
                                            {getDisplayChar(i)}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-400 text-sm mb-4">
                                {safeT('modals.parental_error', 'Incorrect answer. Try again!')}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-lg font-bold uppercase tracking-wider transition-all border-2 border-blue-400"
                        >
                            {safeT('modals.parental_submit', 'Submit')}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ParentalVerificationModal;