import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    AURA_ADJECTIVES,
    getRandomAura,
    generateMobWithAura,
} from '@/utils/mobDisplayUtils.js';

// Known aura types (mirrors the private AURA_TYPES constant)
const VALID_AURA_TYPES = ['rainbow', 'frost', 'shadow', 'lava', 'gradient', 'sparkle', 'plasma', 'nature'];

afterEach(() => {
    vi.restoreAllMocks();
});

// ──────────────────────────────────────────────
// AURA_ADJECTIVES
// ──────────────────────────────────────────────

describe('AURA_ADJECTIVES', () => {
    it('contains an adjective for every known aura type', () => {
        const auraTypesWithAdjective = ['frost', 'lava', 'shadow', 'rainbow', 'gradient', 'sparkle', 'plasma', 'nature'];
        for (const aura of auraTypesWithAdjective) {
            expect(AURA_ADJECTIVES[aura]).toBeDefined();
            expect(typeof AURA_ADJECTIVES[aura]).toBe('string');
        }
    });

    it('maps each aura type to the correct adjective', () => {
        expect(AURA_ADJECTIVES['frost']).toBe('Frozen');
        expect(AURA_ADJECTIVES['lava']).toBe('Flaming');
        expect(AURA_ADJECTIVES['shadow']).toBe('Shadowy');
        expect(AURA_ADJECTIVES['rainbow']).toBe('Prismatic');
        expect(AURA_ADJECTIVES['gradient']).toBe('Shifting');
        expect(AURA_ADJECTIVES['sparkle']).toBe('Glittering');
        expect(AURA_ADJECTIVES['plasma']).toBe('Volatile');
        expect(AURA_ADJECTIVES['nature']).toBe('Overgrown');
    });

    it('does not contain entries for unknown aura types', () => {
        expect(AURA_ADJECTIVES['unknown']).toBeUndefined();
        expect(AURA_ADJECTIVES['fire']).toBeUndefined();
    });
});

// ──────────────────────────────────────────────
// getRandomAura
// ──────────────────────────────────────────────

describe('getRandomAura', () => {
    it('returns a valid aura type from the known list', () => {
        // Run many times to catch any out-of-range value
        for (let i = 0; i < 50; i++) {
            expect(VALID_AURA_TYPES).toContain(getRandomAura());
        }
    });

    it('returns a string', () => {
        expect(typeof getRandomAura()).toBe('string');
    });

    it('can return every possible aura type (full range coverage)', () => {
        // Pin Math.random to each index position and verify the returned value
        VALID_AURA_TYPES.forEach((expectedAura, index) => {
            // Math.floor(x * 8) === index  →  x = index / 8
            vi.spyOn(Math, 'random').mockReturnValueOnce(index / VALID_AURA_TYPES.length);
            expect(getRandomAura()).toBe(expectedAura);
        });
    });
});

// ──────────────────────────────────────────────
// generateMobWithAura
// ──────────────────────────────────────────────

describe('generateMobWithAura', () => {
    it('returns an object with the correct shape', () => {
        const result = generateMobWithAura('Zombie', 'assets/zombie.png');
        expect(result).toMatchObject({
            mobName:     expect.any(String),
            mobSrc:      expect.any(String),
            aura:        expect.any(String),
            displayName: expect.any(String),
        });
    });

    it('preserves the mobName and mobSrc passed in', () => {
        const result = generateMobWithAura('Creeper', 'assets/creeper.png');
        expect(result.mobName).toBe('Creeper');
        expect(result.mobSrc).toBe('assets/creeper.png');
    });

    it('aura is a valid aura type', () => {
        const result = generateMobWithAura('Skeleton', 'assets/skeleton.png');
        expect(VALID_AURA_TYPES).toContain(result.aura);
    });

    it('displayName is "<Adjective> <mobName>" when the aura has an adjective', () => {
        // Force a known aura so we can assert the exact display name
        vi.spyOn(Math, 'random').mockReturnValue(0); // index 0 → 'rainbow' → 'Prismatic'
        const result = generateMobWithAura('Zombie', 'assets/zombie.png');
        expect(result.aura).toBe('rainbow');
        expect(result.displayName).toBe('Prismatic Zombie');
    });

    it('displayName falls back to plain mobName when the aura has no adjective', () => {
        // Inject an aura type that is NOT in AURA_ADJECTIVES
        // We force Math.random to pick index 0, then override the aura check by
        // mocking getRandomAura itself via the module-level approach.
        // Since AURA_TYPES only contains adjective-mapped values, we test the
        // fallback by monkeypatching Math.floor to return an out-of-bounds index.
        vi.spyOn(Math, 'floor').mockReturnValueOnce(99); // AURA_TYPES[99] === undefined
        const result = generateMobWithAura('Ghost', 'assets/ghost.png');
        expect(result.aura).toBeUndefined(); // AURA_TYPES[99] is undefined
        expect(result.displayName).toBe('Ghost'); // Fallback: just the mob name
    });

    it('works with empty string arguments', () => {
        const result = generateMobWithAura('', '');
        expect(result.mobName).toBe('');
        expect(result.mobSrc).toBe('');
        expect(typeof result.displayName).toBe('string');
    });

    it('covers every aura type and builds the correct displayName for each', () => {
        VALID_AURA_TYPES.forEach((aura, index) => {
            vi.spyOn(Math, 'random').mockReturnValueOnce(index / VALID_AURA_TYPES.length);
            const result = generateMobWithAura('Mob', 'src.png');
            expect(result.aura).toBe(aura);
            const expectedDisplay = AURA_ADJECTIVES[aura]
                ? `${AURA_ADJECTIVES[aura]} Mob`
                : 'Mob';
            expect(result.displayName).toBe(expectedDisplay);
        });
    });
});
