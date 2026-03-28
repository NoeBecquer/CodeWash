# ADR 001: Refactor Business Logic into Custom Hooks

---

## Status

Accepted

---

## Context

The original codebase was entirely AI-generated and exhibited several architectural issues:

* Large monolithic components (notably `App.jsx`)
* Business logic tightly coupled with UI components
* Poor separation of concerns
* Difficult testing due to intertwined logic and rendering
* High risk of regression when modifying features

This structure made the codebase hard to understand, maintain, and extend.

---

## Decision

We decided to refactor the application by extracting business logic into dedicated custom React hooks.

Key hooks introduced:

* `useBattleLogic`
  Handles combat lifecycle, damage calculation, XP progression, and battle state transitions

* `useAppState`
  Centralizes global application state (profiles, skills, UI state, settings)

* `useVoiceRecognition`
  Encapsulates speech recognition logic and input validation

---

## Rationale

This decision was made to:

* Improve separation of concerns
* Isolate business logic from UI rendering
* Increase testability of core systems
* Reduce component complexity
* Enable safer and more incremental refactoring

Custom hooks provide a lightweight and native way to structure logic in React without introducing additional dependencies.

---

## Consequences

### Positive

* Clearer architecture with defined responsibilities
* Easier unit testing of logic (hooks tested independently)
* Reduced complexity in UI components
* Improved maintainability and readability
* Better scalability for future features

---

### Negative

* Initial refactoring effort required
* Increased number of files and abstraction layers
* Learning curve for understanding hook-based structure

---

## Alternatives Considered

### 1. Keep Existing Structure

Rejected because:

* Would maintain high coupling
* Difficult to test and evolve

---

### 2. Introduce External State Management (Redux, Zustand)

Rejected because:

* Adds unnecessary complexity for this project
* Increases dependency overhead
* Not required for current scale

---

### 3. Service Layer (Non-React Logic Modules)

Partially considered, but custom hooks were preferred because:

* They integrate directly with React lifecycle
* They allow easier state synchronization

---

## Implementation Notes

* Logic progressively extracted from components into hooks
* Each refactor step validated with tests
* No breaking changes introduced during refactoring
* Existing behavior preserved

---

## Related Documents

* `docs/ARCHITECTURE.md`
* `docs/TESTING.md`
* `docs/PERFORMANCE.md`

---

## Conclusion

Refactoring business logic into custom hooks significantly improved the structure and maintainability of the application.

This decision transformed the codebase from a monolithic and tightly coupled system into a modular and testable architecture aligned with modern React practices.
