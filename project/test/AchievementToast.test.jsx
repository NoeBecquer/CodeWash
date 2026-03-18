import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementToast from '../src/components/ui/AchievementToast.jsx';
import { TIER_NAMES } from '../src/constants/achievements.js';

describe('AchievementToast', () => {
    describe('invalid achievementId', () => {
        it('returns null for unknown achievementId', () => {
            const { container } = render(<AchievementToast achievementId="does_not_exist" />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when achievementId is undefined', () => {
            const { container } = render(<AchievementToast />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('non-tiered achievement (first_steps)', () => {
        it('renders achievement name', () => {
            render(<AchievementToast achievementId="first_steps" />);
            expect(screen.getByText('First Steps')).toBeInTheDocument();
        });

        it('shows ACHIEVEMENT UNLOCKED! heading', () => {
            render(<AchievementToast achievementId="first_steps" />);
            expect(screen.getByText('ACHIEVEMENT UNLOCKED!')).toBeInTheDocument();
        });

        it('uses gold border (#FFD700) for non-tiered achievement', () => {
            const { container } = render(<AchievementToast achievementId="first_steps" />);
            const innerDiv = container.querySelector('[style]');
            // getAttribute('style') preserves the original hex value (jsdom converts .style.border to rgb)
            expect(innerDiv.getAttribute('style')).toContain('#FFD700');
        });

        it('does not render tier name for non-tiered achievement', () => {
            render(<AchievementToast achievementId="first_steps" />);
            expect(screen.queryByText(/Tier$/)).toBeNull();
        });
    });

    describe('tiered achievement (phantom_hunter)', () => {
        it('renders tier name when tierIndex is provided', () => {
            // tierIndex=0 → PHANTOM_HUNTER_TIERS[0].tierName = 'Bronze Ghost Buster'
            render(<AchievementToast achievementId="phantom_hunter" tierIndex={0} />);
            expect(screen.getByText('Bronze Ghost Buster')).toBeInTheDocument();
        });

        it('renders tier label (e.g. "Bronze Tier") when tierIndex is provided', () => {
            render(<AchievementToast achievementId="phantom_hunter" tierIndex={0} />);
            expect(screen.getByText(`${TIER_NAMES[0]} Tier`)).toBeInTheDocument();
        });

        it('uses TIER_COLORS border for tiered achievement', () => {
            const { container } = render(<AchievementToast achievementId="phantom_hunter" tierIndex={0} />);
            // getAttribute('style') preserves hex (jsdom converts .style.border to rgb)
            const innerDivStyle = container.querySelector('[style]')?.getAttribute('style') ?? '';
            // TIER_COLORS[1] (Bronze) has border '#8B4513'
            expect(innerDivStyle).toContain('#8B4513');
        });

        it('renders base achievement name when tierIndex=null', () => {
            // isTiered=true but tierIndex=null → condition fails → shows achievement.name
            render(<AchievementToast achievementId="phantom_hunter" tierIndex={null} />);
            expect(screen.getByText('Ghost Buster')).toBeInTheDocument();
        });

        it('renders Silver tier at tierIndex=1', () => {
            render(<AchievementToast achievementId="phantom_hunter" tierIndex={1} />);
            expect(screen.getByText('Silver Ghost Buster')).toBeInTheDocument();
            expect(screen.getByText(`${TIER_NAMES[1]} Tier`)).toBeInTheDocument();
        });
    });

    describe('combined_levels tiered achievement', () => {
        it('renders tier name for combined_levels at tierIndex=2 (Gold)', () => {
            render(<AchievementToast achievementId="combined_levels" tierIndex={2} />);
            expect(screen.getByText('Gold Power')).toBeInTheDocument();
            expect(screen.getByText(`${TIER_NAMES[2]} Tier`)).toBeInTheDocument();
        });
    });
});
