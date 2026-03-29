# Known Limitations and Technical Debt

This document provides a comprehensive overview of the current limitations of the project, identified during development and refactoring. These limitations are acknowledged and documented to support future improvements and maintain transparency.

---

## 1. Bug Reporting System Constraints

### Description
The bug reporting system is implemented using the `mailto` protocol and a downloadable JSON report.

### Limitations
- Requires a configured email client on the user’s device
- Email sending is not automated (user must manually send the report)
- Attachments (e.g. screenshots, JSON files) cannot be automatically included
- No confirmation of successful report delivery
- No centralized tracking of submitted issues

### Impact
- Reporting process depends on user interaction and environment
- Reduced reliability compared to backend-driven systems
- Debug data must be manually shared

### Root Cause
- No backend infrastructure available
- Security constraints prevent direct email sending from frontend

### Possible Improvements
- Implement backend API for report submission
- Integrate email service (SMTP, SendGrid, etc.)
- Add automatic attachment support
- Connect to issue tracking system (GitHub API, Jira, etc.)

---

## 2. Absence of Backend and Persistence Layer

### Description
The application is fully client-side.

### Limitations
- No persistence of user data or bug reports
- No server-side validation or processing
- No centralized logging or monitoring
- Game state is transient (lost on refresh unless stored locally)

### Impact
- Limits scalability and robustness
- Prevents advanced features (analytics, user accounts, syncing)

### Root Cause
- Project scope limited to frontend refactoring and feature additions

### Possible Improvements
- Introduce backend service (Node.js, Firebase, etc.)
- Add persistent storage (database)
- Implement logging and monitoring tools

---

## 3. Performance Not Quantitatively Measured

### Description
Performance optimizations were implemented (memoization, component splitting, hook extraction), but not formally benchmarked.

### Limitations
- No objective metrics (render time, FPS, memory usage)
- Improvements validated only through observation

### Impact
- Difficult to quantify gains
- No baseline comparison for future improvements

### Root Cause
- Focus on structural refactoring rather than performance profiling

### Possible Improvements
- Use React Profiler
- Run Lighthouse audits
- Measure render counts and performance before/after changes

---

## 4. Partial Test Coverage (UI and Edge Cases)

### Description
Core logic and major components are covered by unit tests.

### Limitations
- Not all UI branches and edge cases are tested
- Limited integration testing between components
- No end-to-end (E2E) testing

### Impact
- Potential edge-case bugs may remain undetected
- UI regressions may occur in less common flows

### Root Cause
- Time constraints and prioritization of core logic testing

### Possible Improvements
- Increase branch coverage
- Add integration tests (React Testing Library)
- Introduce E2E testing (Cypress, Playwright)

---

## 5. Complexity of Core Game Logic (useBattleLogic)

### Description
The `useBattleLogic` hook centralizes battle mechanics and game progression.

### Limitations
- High complexity and multiple responsibilities
- Difficult to fully test all asynchronous and state transitions
- Hard to reason about edge cases

### Impact
- Increased maintenance difficulty
- Higher risk of regression in complex scenarios

### Root Cause
- Progressive feature additions concentrated in a single hook

### Possible Improvements
- Further split logic into smaller hooks/modules
- Isolate state transitions
- Improve test coverage for edge cases

---

## 6. Browser Dependency

### Description
The application relies on browser APIs.

### Dependencies
- `window.location` (email reporting)
- `localStorage`
- audio playback
- DOM APIs

### Limitations
- Behavior depends on browser configuration
- Email feature depends on external client
- Audio may not work consistently across environments

### Impact
- Reduced portability
- Inconsistent behavior in restricted environments

### Possible Improvements
- Add fallbacks for unsupported features
- Improve cross-browser testing
- Handle failures more gracefully

---

## 7. UI and UX Inconsistencies

### Description
The UI has been partially refactored and improved.

### Limitations
- Some components still have inconsistent styling or behavior
- Feedback mechanisms (success/error states) are not fully standardized
- Some interactions are not fully intuitive

### Impact
- Slightly degraded user experience
- Inconsistent feel across features

### Possible Improvements
- Standardize UI patterns
- Introduce design system or component library
- Improve feedback consistency

---

## 8. Internationalization Coverage

### Description
A translation system is implemented using `react-i18next`.

### Limitations
- Some strings may still fall back to default values
- Dynamic content may not be fully localized
- No automated verification of translation completeness

### Impact
- Incomplete localization in certain scenarios

### Possible Improvements
- Audit translation keys
- Add validation for missing translations
- Expand language coverage

---

## 9. No Automated Error Tracking

### Description
Errors are handled locally without external monitoring.

### Limitations
- No centralized error reporting
- No crash analytics
- Difficult to track production issues

### Impact
- Reduced observability
- Slower debugging in real-world usage

### Possible Improvements
- Integrate tools such as Sentry or LogRocket
- Add structured logging

---

## Conclusion

The identified limitations are primarily due to:
- absence of backend infrastructure
- project scope constraints
- prioritization of core refactoring and feature delivery

Despite these limitations, the project provides:
- a modular and maintainable architecture
- a fully functional bug reporting system
- a tested and stable codebase

Future work would focus on:
- backend integration
- improved automation
- stronger testing and observability