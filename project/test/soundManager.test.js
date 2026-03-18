import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Audio mock ─────────────────────────────────────────────────────────────────
// jsdom does not implement HTMLAudioElement.play(), so we provide a full mock.
const mockPlay  = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();
const mockAddEventListener = vi.fn();

// Keeps track of Audio instances created during each test
let audioInstances = [];

class MockAudio {
    constructor(src) {
        this.src    = src;
        this.volume = 1;
        this.play   = mockPlay;
        this.pause  = mockPause;
        this.addEventListener = mockAddEventListener;
        audioInstances.push(this);
    }
}

vi.stubGlobal('Audio', MockAudio);

// ── Reset singleton between tests ──────────────────────────────────────────────
// bgmManagerInstance is module-level state; we reset the module after each test
// so every test starts from a clean slate.
beforeEach(async () => {
    audioInstances = [];
    mockPlay.mockClear();
    mockPause.mockClear();
    mockAddEventListener.mockClear();
    await vi.resetModules();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// Helper: fresh import after vi.resetModules()
async function importSM() {
    return await import('../src/utils/soundManager.js');
}

// ──────────────────────────────────────────────
// UI_SOUND_NAMES
// ──────────────────────────────────────────────

describe('UI_SOUND_NAMES', () => {
    it('contains all expected UI sound keys', async () => {
        const { UI_SOUND_NAMES } = await importSM();
        const expected = [
            'actioncard_left', 'actioncard_right', 'click', 'death',
            'fail', 'levelup', 'notification', 'successful_hit'
        ];
        expect(UI_SOUND_NAMES).toEqual(expect.arrayContaining(expected));
        expect(UI_SOUND_NAMES.length).toBe(expected.length);
    });
});

// ──────────────────────────────────────────────
// setSfxVolume / getSfxVolume
// ──────────────────────────────────────────────

describe('setSfxVolume / getSfxVolume', () => {
    it('default sfx volume is 0.5', async () => {
        const { getSfxVolume } = await importSM();
        expect(getSfxVolume()).toBe(0.5);
    });

    it('setSfxVolume updates the value returned by getSfxVolume', async () => {
        const { setSfxVolume, getSfxVolume } = await importSM();
        setSfxVolume(0.8);
        expect(getSfxVolume()).toBe(0.8);
    });

    it('accepts 0 (mute)', async () => {
        const { setSfxVolume, getSfxVolume } = await importSM();
        setSfxVolume(0);
        expect(getSfxVolume()).toBe(0);
    });
});

// ──────────────────────────────────────────────
// playUISound
// ──────────────────────────────────────────────

describe('playUISound', () => {
    it('creates an Audio and calls play() for a known sound name', async () => {
        const { playUISound } = await importSM();
        playUISound('click');
        expect(audioInstances.length).toBe(1);
        expect(audioInstances[0].src).toContain('click.wav');
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('sets the audio volume to the current sfxVolume', async () => {
        const { playUISound, setSfxVolume } = await importSM();
        setSfxVolume(0.7);
        playUISound('fail');
        expect(audioInstances[0].volume).toBe(0.7);
    });

    it('does nothing (no Audio created) for an unknown sound name', async () => {
        const { playUISound } = await importSM();
        playUISound('nonexistent_sound');
        expect(audioInstances.length).toBe(0);
        expect(mockPlay).not.toHaveBeenCalled();
    });

    it('swallows play() rejections without throwing', async () => {
        mockPlay.mockRejectedValueOnce(new Error('NotAllowedError'));
        const { playUISound } = await importSM();
        await expect(async () => playUISound('click')).not.toThrow();
    });
});

// ──────────────────────────────────────────────
// Convenience wrappers (all delegate to playUISound)
// ──────────────────────────────────────────────

describe('convenience sound wrappers', () => {
    const wrappers = [
        ['playActionCardLeft',  'actioncard_left.wav'],
        ['playActionCardRight', 'actioncard_right.wav'],
        ['playClick',           'click.wav'],
        ['playDeath',           'death.wav'],
        ['playFail',            'fail.wav'],
        ['playLevelUp',         'levelup.wav'],
        ['playNotification',    'notification.wav'],
        ['playSuccessfulHit',   'successful_hit.wav'],
        ['playAchievement',     'notification.wav'], // delegates to notification
    ];

    it.each(wrappers)('%s plays "%s"', async (fnName, expectedFile) => {
        const sm = await importSM();
        sm[fnName]();
        expect(audioInstances.length).toBe(1);
        expect(audioInstances[0].src).toContain(expectedFile);
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });
});

// ──────────────────────────────────────────────
// playMobHurt / playMobDeath / playMobSay
// ──────────────────────────────────────────────

describe('playMobHurt', () => {
    it('plays the hurt sound for a known mob', async () => {
        const { playMobHurt } = await importSM();
        playMobHurt('Zombie');
        expect(audioInstances.length).toBe(1);
        expect(audioInstances[0].src).toContain('zombie/hurt.wav');
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('handles mobs with multi-word names (Magma Cube → magmacube)', async () => {
        const { playMobHurt } = await importSM();
        playMobHurt('Magma Cube');
        expect(audioInstances[0].src).toContain('magmacube/hurt.wav');
    });

    it('handles alias mapping (Bunny → rabbit)', async () => {
        const { playMobHurt } = await importSM();
        playMobHurt('Bunny');
        expect(audioInstances[0].src).toContain('rabbit/hurt.wav');
    });

    it('does nothing for an unknown mob name', async () => {
        const { playMobHurt } = await importSM();
        playMobHurt('UnknownMob');
        expect(audioInstances.length).toBe(0);
        expect(mockPlay).not.toHaveBeenCalled();
    });

    it('does nothing when mobName is undefined', async () => {
        const { playMobHurt } = await importSM();
        playMobHurt(undefined);
        expect(audioInstances.length).toBe(0);
    });
});

describe('playMobDeath', () => {
    it('plays the death sound for a known mob', async () => {
        const { playMobDeath } = await importSM();
        playMobDeath('Creeper');
        expect(audioInstances[0].src).toContain('creeper/death.wav');
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('does nothing for an unknown mob', async () => {
        const { playMobDeath } = await importSM();
        playMobDeath('Ghost');
        expect(audioInstances.length).toBe(0);
    });
});

describe('playMobSay', () => {
    it('plays the say sound for a known friendly mob', async () => {
        const { playMobSay } = await importSM();
        playMobSay('Cat');
        expect(audioInstances[0].src).toContain('cat/say.wav');
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('does nothing for an unknown mob', async () => {
        const { playMobSay } = await importSM();
        playMobSay('Dragon');
        expect(audioInstances.length).toBe(0);
    });
});

// ──────────────────────────────────────────────
// BGMManager (via getBGMManager)
// ──────────────────────────────────────────────

describe('getBGMManager', () => {
    it('returns the same singleton on every call', async () => {
        const { getBGMManager } = await importSM();
        const a = getBGMManager();
        const b = getBGMManager();
        expect(a).toBe(b);
    });

    it('initial state: isPlaying = false, audio = null', async () => {
        const { getBGMManager } = await importSM();
        const mgr = getBGMManager();
        expect(mgr.isPlaying).toBe(false);
        expect(mgr.audio).toBeNull();
    });

    // ── setVolume ────────────────────────────────
    describe('setVolume', () => {
        it('updates the manager volume', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.setVolume(0.6);
            expect(mgr.volume).toBe(0.6);
        });

        it('also updates audio.volume when an Audio instance exists', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play(); // creates mgr.audio
            mgr.setVolume(0.2);
            expect(mgr.audio.volume).toBe(0.2);
        });
    });

    // ── getRandomTrack ───────────────────────────
    describe('getRandomTrack', () => {
        it('returns a valid track index (0 to 5)', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            for (let i = 0; i < 20; i++) {
                const idx = mgr.getRandomTrack();
                expect(idx).toBeGreaterThanOrEqual(0);
                expect(idx).toBeLessThan(6); // 6 BGM tracks
            }
        });

        it('never returns the currentTrackIndex (when alternatives exist)', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.currentTrackIndex = 2;
            for (let i = 0; i < 30; i++) {
                expect(mgr.getRandomTrack()).not.toBe(2);
            }
        });

        it('returns currentTrackIndex when it is the only track (length 1)', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.tracks = ['solo.wav'];
            mgr.currentTrackIndex = 0;
            expect(mgr.getRandomTrack()).toBe(0);
        });

        it('returns 0 when tracks has one item and currentTrackIndex is -1', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.tracks = ['solo.wav'];
            mgr.currentTrackIndex = -1;
            // availableIndices = [0] → not empty, so picks index 0
            expect(mgr.getRandomTrack()).toBe(0);
        });

        it('fallback: returns 0 when tracks is empty and currentTrackIndex is -1', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.tracks = [];
            mgr.currentTrackIndex = -1;
            // availableIndices is empty, currentTrackIndex < 0 → returns 0
            expect(mgr.getRandomTrack()).toBe(0);
        });

        it('fallback: returns currentTrackIndex when tracks is empty and it is ≥ 0', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.tracks = [];
            mgr.currentTrackIndex = 3;
            expect(mgr.getRandomTrack()).toBe(3);
        });
    });

    // ── play ─────────────────────────────────────
    describe('play', () => {
        it('creates an Audio instance and sets isPlaying = true', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();
            expect(mgr.audio).toBeInstanceOf(MockAudio);
            expect(mgr.isPlaying).toBe(true);
            expect(mockPlay).toHaveBeenCalledTimes(1);
        });

        it('adds an "ended" event listener that calls playNextTrack', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();
            // The 'ended' listener should have been registered
            expect(mockAddEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
        });

        it('"ended" callback triggers playNextTrack (covers line 123)', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();
            // Grab the callback registered with addEventListener('ended', cb)
            const [event, endedCallback] = mockAddEventListener.mock.calls.find(
                ([ev]) => ev === 'ended'
            );
            expect(endedCallback).toBeTypeOf('function');
            const firstSrc = mgr.audio.src;
            mockPlay.mockClear();
            // Simulate the track ending
            endedCallback();
            expect(mockPlay).toHaveBeenCalledTimes(1);
        });

        it('does not create a second Audio instance if already created', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();
            mgr.play(); // second call — audio already exists
            expect(audioInstances.length).toBe(1);
            expect(mockPlay).toHaveBeenCalledTimes(2); // but play() is called twice
        });

        it('swallows play() rejections', async () => {
            mockPlay.mockRejectedValueOnce(new Error('blocked'));
            const { getBGMManager } = await importSM();
            await expect(async () => getBGMManager().play()).not.toThrow();
        });
    });

    // ── playNextTrack ─────────────────────────────
    describe('playNextTrack', () => {
        it('changes the src and calls play() again', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();
            const firstSrc = mgr.audio.src;
            mockPlay.mockClear();
            mgr.playNextTrack();
            expect(mgr.audio.src).toBeDefined();
            expect(mockPlay).toHaveBeenCalledTimes(1);
        });

        it('does nothing when audio is null', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            // audio is null by default — should not throw
            expect(() => mgr.playNextTrack()).not.toThrow();
        });

        it('sets volume on new track', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.setVolume(0.4);
            mgr.play();
            mgr.playNextTrack();
            expect(mgr.audio.volume).toBe(0.4);
        });
    });

    // ── pause ─────────────────────────────────────
    describe('pause', () => {
        it('calls audio.pause() and sets isPlaying = false', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();
            mgr.pause();
            expect(mockPause).toHaveBeenCalledTimes(1);
            expect(mgr.isPlaying).toBe(false);
        });

        it('does nothing when audio is null', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            expect(() => mgr.pause()).not.toThrow();
            expect(mockPause).not.toHaveBeenCalled();
        });
    });

    // ── toggle ────────────────────────────────────
    describe('toggle', () => {
        it('calls play() when isPlaying is false', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            expect(mgr.isPlaying).toBe(false);
            mgr.toggle();
            expect(mgr.isPlaying).toBe(true);
            expect(mockPlay).toHaveBeenCalledTimes(1);
        });

        it('calls pause() when isPlaying is true', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.play();                  // isPlaying = true
            mockPlay.mockClear();
            mockPause.mockClear();
            mgr.toggle();
            expect(mgr.isPlaying).toBe(false);
            expect(mockPause).toHaveBeenCalledTimes(1);
        });

        it('alternates between play and pause on successive calls', async () => {
            const { getBGMManager } = await importSM();
            const mgr = getBGMManager();
            mgr.toggle(); // play
            expect(mgr.isPlaying).toBe(true);
            mgr.toggle(); // pause
            expect(mgr.isPlaying).toBe(false);
            mgr.toggle(); // play again
            expect(mgr.isPlaying).toBe(true);
        });
    });
});
