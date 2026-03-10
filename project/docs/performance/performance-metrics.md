# CodeWash – Performance Audit

## 1. Environment

- Build Mode: Production
- Device: Desktop
- Date: 2026-03-03
- Browser: Chrome XX

---

## 2. Lighthouse Results (Baseline)

| Metric | Value |
|--------|--------|
| Performance Score | 53 |
| FCP | 2.0 s |
| LCP | 4.3 s |
| Total Blocking Time | 290 ms |
| Speed Index | 2.4 s |

---

## 3. Metric Interpretation

- Performance Score (53) indicates poor startup experience.
- LCP of 4.3s exceeds recommended threshold (<2.5s).
- TBT of 290ms suggests moderate main-thread blocking.
- FCP is acceptable (2.0s) but main content renders too late.

---

## 4. Bundle Size Analysis

The main JavaScript bundle is 355KB, which is moderate.
Performance degradation is therefore primarily caused by runtime initialization
rather than excessive bundle size.

---

## 4. Observed Bottlenecks

- Entire game logic loaded at startup
- All drawers loaded immediately
- Large constants imported globally
- No code splitting
- Heavy initialization in App.jsx

---

## 5. Root Cause

App.jsx acts as a "God Component" and initializes:
- Skill state
- Mob generation
- Audio manager
- Achievement system

This increases initial JS execution time and TBT.

---

## 6. Optimization Plan

1. Split App into MainMenu + GameEngine
2. Lazy-load drawers and modals
3. Defer game data initialization
4. Introduce dynamic imports for heavy modules

---

## 7. Next Measurement Target

- Reduce LCP below 2.5s
- Reduce TBT below 200ms
- Improve Lighthouse score above 80
- Defer heavy initialization until game start

---

## 8. Baseline Reference

This document represents the performance baseline (v1.0-legacy).
All improvements will be measured against this version.