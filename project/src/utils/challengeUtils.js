import { generateMathProblem, getReadingWord, getWordForDifficulty } from './gameUtils';

export const generateChallenge = async (type, diff) => {
    if (type === 'math')
        return generateMathProblem(diff);

    if (type === 'patterns') 
        return { type: 'patterns', question: 'Simon Says!', answer: 'WIN' };

    if (type === 'reading') { 
        const w = await getReadingWord(diff);
        return { 
            id: Date.now() + Math.random(), // ✅ ADD THIS
            type, 
            question: w, 
            answer: w 
        }; 
    }
    
    if (type === 'writing') {
        const wd = await getWordForDifficulty(diff);
        return { 
            type, 
            question: 'Spell it!', 
            answer: wd.displayName.toUpperCase(), 
            images: [wd.image], 
            displayName: wd.displayName 
        };
    }

    if (type === 'memory') 
        return { 
            id: Date.now(),
            type: 'memory', 
            question: 'Find Pairs!', 
            answer: 'WIN' 
        };

    if (type === 'cleaning')
        return {
            id: Date.now() + Math.random(),
            type: 'cleaning',
            question: 'Organize',
            answer: 'WIN'
        };

    return { type: 'manual', question: 'Task Complete?', answer: 'yes' };
};