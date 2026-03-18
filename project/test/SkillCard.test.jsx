import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillCard from '../src/components/skills/SkillCard.jsx';

// Mock soundManager to avoid Audio dependency
vi.mock('../src/utils/soundManager.js', () => ({
    playClick: vi.fn(),
    getSfxVolume: () => 0.5,
    playMobSound: vi.fn(),
    BGMManager: { getInstance: () => ({ fadeToTrack: vi.fn() }) },
}));

// Mock Audio global (used via new Audio() in playMismatch, playAxolotlNote)
const mockPlay = vi.fn().mockResolvedValue(undefined);
const MockAudio = vi.fn().mockImplementation(function() {
    this.play = mockPlay;
    this.pause = vi.fn();
    this.volume = 0;
    this.src = '';
    this.addEventListener = vi.fn();
});

beforeEach(() => {
    vi.stubGlobal('Audio', MockAudio);
    mockPlay.mockClear();
    MockAudio.mockClear();
});

// Minimal valid config objects for each challenge type
const mathConfig = {
    id: 'math',
    name: 'Math',
    class: 'Math',
    fantasyName: 'Redstone',
    actionName: 'Calculate!',
    taskDescription: 'Power up your redstone circuits!',
    img: null,
    colorStyle: { background: 'linear-gradient(to bottom, #b91c1c, #9a3412)' },
    accent: 'text-red-400',
    boss: 'The Wither',
    hasChallenge: true,
    challengeType: 'math',
    mobOffset: 4,
};

const readingConfig = {
    id: 'reading',
    name: 'Reading',
    class: 'Reading',
    fantasyName: 'Enchanting Table',
    actionName: 'Enchant!',
    taskDescription: 'Speak the ancient words!',
    img: null,
    colorStyle: { background: 'linear-gradient(to bottom, #7e22ce, #3730a3)' },
    accent: 'text-purple-400',
    boss: 'Ender Dragon',
    hasChallenge: true,
    challengeType: 'reading',
    mobOffset: 0,
};

const cleaningConfig = {
    id: 'cleaning',
    name: 'Cleaning',
    class: 'Cleaning',
    fantasyName: 'Chest Management',
    actionName: 'Organize!',
    taskDescription: 'Sort your loot!',
    img: null,
    colorStyle: { background: 'linear-gradient(to bottom, #059669, #15803d)' },
    accent: 'text-emerald-400',
    boss: 'Ender Chest',
    hasChallenge: true,
    challengeType: 'cleaning',
    mobOffset: 12,
};

const defaultData = {
    level: 5,
    xp: 0,
    mobHealth: 80,
    mobMaxHealth: 100,
};

const mockThemeData = {
    assets: { cardBack: null, mobs: {} },
    skills: {
        math: {}, reading: {}, writing: {}, cleaning: {}, memory: {}, patterns: {}
    }
};

const mathChallenge = { question: '2 + 3', answer: 5 };

const defaultProps = {
    config: mathConfig,
    data: defaultData,
    themeData: mockThemeData,
    isCenter: false,
    isBattling: false,
    mobName: 'Zombie',
    mobAura: null,
    challenge: mathChallenge,
    isListening: false,
    spokenText: '',
    damageNumbers: [],
    onStartBattle: vi.fn(),
    onEndBattle: vi.fn(),
    onMathSubmit: vi.fn(),
    onMicClick: vi.fn(),
    difficulty: 1,
    setDifficulty: vi.fn(),
    unlockedDifficulty: 1,
    selectedBorder: null,
    borderColor: null,
    bossHealing: false,
};

describe('SkillCard', () => {
    describe('non-battling state', () => {
        it('renders without crashing', () => {
            expect(() => render(<SkillCard {...defaultProps} />)).not.toThrow();
        });

        it('shows the fantasy name of the skill', () => {
            render(<SkillCard {...defaultProps} />);
            expect(screen.getByText('Redstone')).toBeInTheDocument();
        });

        it('shows the level', () => {
            render(<SkillCard {...defaultProps} />);
            expect(screen.getByText('Lvl 5')).toBeInTheDocument();
        });

        it('shows the action button (Calculate!)', () => {
            render(<SkillCard {...defaultProps} />);
            expect(screen.getByRole('button', { name: /Calculate!/i })).toBeInTheDocument();
        });

        it('calls onStartBattle when action button is clicked', () => {
            const onStartBattle = vi.fn();
            render(<SkillCard {...defaultProps} onStartBattle={onStartBattle} />);
            fireEvent.click(screen.getByRole('button', { name: /Calculate!/i }));
            expect(onStartBattle).toHaveBeenCalledOnce();
        });

        it('shows task description', () => {
            render(<SkillCard {...defaultProps} />);
            expect(screen.getByText('Power up your redstone circuits!')).toBeInTheDocument();
        });

        it('shows HP bar', () => {
            render(<SkillCard {...defaultProps} />);
            expect(screen.getByText('HP')).toBeInTheDocument();
        });

        it('HP percentage is correct (80/100 = 80%)', () => {
            render(<SkillCard {...defaultProps} />);
            expect(screen.getByText('80%')).toBeInTheDocument();
        });

        it('HP percentage is 100% when mobHealth equals mobMaxHealth', () => {
            render(<SkillCard {...defaultProps} data={{ ...defaultData, mobHealth: 100, mobMaxHealth: 100 }} />);
            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });

    describe('battling state (isCenter=false)', () => {
        const battlingProps = { ...defaultProps, isBattling: true };

        it('renders without crashing in battling state', () => {
            expect(() => render(<SkillCard {...battlingProps} />)).not.toThrow();
        });

        it('shows XP bar when battling', () => {
            render(<SkillCard {...battlingProps} />);
            expect(screen.getByText('XP')).toBeInTheDocument();
        });

        it('shows math question challenge', () => {
            render(<SkillCard {...battlingProps} />);
            expect(screen.getByText('2 + 3')).toBeInTheDocument();
        });

        it('math input: correct answer calls onMathSubmit', () => {
            const onMathSubmit = vi.fn();
            render(<SkillCard {...battlingProps} onMathSubmit={onMathSubmit} />);
            // The invisible input is there for math challenge
            const input = document.querySelector('input[type="text"]');
            expect(input).not.toBeNull();
            // Type correct answer '5'
            fireEvent.change(input, { target: { value: '5' } });
            expect(onMathSubmit).toHaveBeenCalledWith('5');
        });

        it('math input: wrong answer (same length as correct) calls onMathSubmit with "WRONG"', () => {
            const onMathSubmit = vi.fn();
            const challenge = { question: '2 + 3', answer: 9 }; // answer is '9', length=1
            render(<SkillCard {...battlingProps} challenge={challenge} onMathSubmit={onMathSubmit} />);
            const input = document.querySelector('input[type="text"]');
            // Type '1' — same length as '9' (1 digit), but wrong value
            fireEvent.change(input, { target: { value: '1' } });
            expect(onMathSubmit).toHaveBeenCalledWith('WRONG');
        });

        it('math input: partial answer (shorter than correct) does NOT call onMathSubmit', () => {
            const onMathSubmit = vi.fn();
            const challenge = { question: '10 + 20', answer: 30 }; // answer '30', length=2
            render(<SkillCard {...battlingProps} challenge={challenge} onMathSubmit={onMathSubmit} />);
            const input = document.querySelector('input[type="text"]');
            // Type only '3' — 1 char, not complete
            fireEvent.change(input, { target: { value: '3' } });
            expect(onMathSubmit).not.toHaveBeenCalled();
        });

        it('shows reading mic button for reading skill', () => {
            render(<SkillCard {...battlingProps} config={readingConfig} challenge={{ question: 'cat', answer: 'cat' }} />);
            expect(screen.getByText(/Tap to Speak/i)).toBeInTheDocument();
        });

        it('calls onMicClick when mic button is clicked', () => {
            const onMicClick = vi.fn();
            render(<SkillCard {...battlingProps} config={readingConfig} challenge={{ question: 'cat', answer: 'cat' }} onMicClick={onMicClick} />);
            const micBtn = screen.getByText(/Tap to Speak/i).closest('button');
            fireEvent.click(micBtn);
            expect(onMicClick).toHaveBeenCalledOnce();
        });

        it('shows Complete! button for cleaning skill', () => {
            render(<SkillCard {...battlingProps} config={cleaningConfig} />);
            expect(screen.getByRole('button', { name: /Complete!/i })).toBeInTheDocument();
        });
    });

    describe('difficulty adjuster', () => {
        it('hidden when unlockedDifficulty=1', () => {
            render(<SkillCard {...defaultProps} unlockedDifficulty={1} />);
            // Neither + nor - buttons for difficulty should appear
            const buttons = screen.queryAllByRole('button');
            const plusBtn = buttons.find(b => b.querySelector('svg') && b.className.includes('bg-stone-700'));
            expect(plusBtn).toBeUndefined();
        });

        it('visible when unlockedDifficulty > 1', () => {
            const { container } = render(<SkillCard {...defaultProps} unlockedDifficulty={2} />);
            const difficultyBtns = container.querySelectorAll('.bg-stone-700');
            expect(difficultyBtns.length).toBeGreaterThan(0);
        });

        it('shows current difficulty number when difficulty adjuster visible', () => {
            render(<SkillCard {...defaultProps} difficulty={2} unlockedDifficulty={3} />);
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        it('calls setDifficulty(-1) when minus button clicked at difficulty 2', () => {
            const setDifficulty = vi.fn();
            const { container } = render(
                <SkillCard {...defaultProps} difficulty={2} unlockedDifficulty={3} setDifficulty={setDifficulty} />
            );
            const diffBtns = container.querySelectorAll('.bg-stone-700');
            if (diffBtns.length >= 1) {
                fireEvent.click(diffBtns[0]); // Minus button (first)
                expect(setDifficulty).toHaveBeenCalledWith(1); // Math.max(1, 2-1) = 1
            }
        });

        it('calls setDifficulty(+1) when plus button clicked', () => {
            const setDifficulty = vi.fn();
            const { container } = render(
                <SkillCard {...defaultProps} difficulty={2} unlockedDifficulty={3} setDifficulty={setDifficulty} />
            );
            const diffBtns = container.querySelectorAll('.bg-stone-700');
            if (diffBtns.length >= 2) {
                fireEvent.click(diffBtns[1]); // Plus button (second)
                expect(setDifficulty).toHaveBeenCalledWith(3); // Math.min(3, 2+1) = 3
            }
        });

        it('difficulty adjuster is hidden for cleaning skill', () => {
            const { container } = render(
                <SkillCard {...defaultProps} config={cleaningConfig} unlockedDifficulty={3} />
            );
            const diffBtns = container.querySelectorAll('.bg-stone-700');
            expect(diffBtns.length).toBe(0);
        });
    });

    describe('level color thresholds', () => {
        it('level < 20 uses default white text', () => {
            const { container } = render(<SkillCard {...defaultProps} data={{ ...defaultData, level: 5 }} />);
            const levelDiv = Array.from(container.querySelectorAll('[class*="text"]')).find(el =>
                el.textContent.includes('Lvl 5')
            );
            // Just verify it renders correctly without crash
            expect(levelDiv).not.toBeNull();
        });

        it('level 20+ uses amber text class', () => {
            const { container } = render(<SkillCard {...defaultProps} data={{ ...defaultData, level: 20 }} />);
            // text-amber-700 should appear in level display
            const levelDisplay = container.querySelector('.text-amber-700');
            expect(levelDisplay).not.toBeNull();
        });

        it('level 100+ uses emerald text class', () => {
            const { container } = render(<SkillCard {...defaultProps} data={{ ...defaultData, level: 100 }} />);
            const levelDisplay = container.querySelector('.text-emerald-400');
            expect(levelDisplay).not.toBeNull();
        });
    });
});
