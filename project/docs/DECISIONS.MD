# Technical Decisions

## Introduction

This document explains the key technical decisions made during the refactoring of the CodeWash project.

Each decision is justified based on maintainability, performance, scalability, and alignment with clean code principles.

---

## 1. Extraction of Business Logic into Custom Hooks

### Decision
Use custom React hooks (`useAppState`, `useBattleLogic`) to encapsulate business logic.

### Context
The initial implementation concentrated logic inside `App.jsx`, creating a monolithic and tightly coupled structure.

### Rationale
- Separate concerns (UI vs logic)
- Improve code readability
- Enable reuse of logic
- Facilitate unit testing

### Trade-offs
- Slight increase in abstraction
- Requires understanding of hook patterns

---

## 2. Component-Based UI Decomposition

### Decision
Split large UI blocks into smaller, reusable components (layout, UI elements, modals, etc.).

### Context
UI and logic were initially mixed, making components difficult to maintain.

### Rationale
- Improve modularity
- Reduce component complexity
- Enable targeted testing
- Enhance readability

### Trade-offs
- Increased number of files
- Requires consistent project structure

---

## 3. Adoption of Vitest for Unit Testing

### Decision
Use Vitest as the primary unit testing framework.

### Context
The project uses Vite, making Vitest a natural fit.

### Rationale
- Fast execution time
- Native integration with Vite
- Modern API similar to Jest
- Easy setup and configuration

### Trade-offs
- Smaller ecosystem compared to Jest
- Requires adaptation for developers familiar with Jest

---

## 4. Use of Cypress for End-to-End Testing

### Decision
Introduce Cypress for E2E testing.

### Context
Unit tests alone were not sufficient to validate full user flows.

### Rationale
- Simulates real user interactions
- Ensures application stability
- Detects integration issues

### Trade-offs
- Slower execution compared to unit tests
- More complex setup

---

## 5. Implementation of Internationalization with i18next

### Decision
Use i18next for managing translations.

### Context
The application required support for multiple languages.

### Rationale
- Scalable translation system
- Well-supported ecosystem
- Easy integration with React
- Supports dynamic loading

### Trade-offs
- Additional configuration overhead
- Requires structured translation files

---

## 6. Lazy Loading of Translations and Game Content

### Decision
Load translations and game content dynamically instead of bundling everything upfront.

### Context
Initial bundle size was unnecessarily large.

### Rationale
- Reduce initial load time
- Improve performance
- Optimize resource usage

### Trade-offs
- Slight delay when loading new content
- Requires async handling

---

## 7. Reduction of Cognitive Complexity

### Decision
Refactor complex functions into smaller, simpler units.

### Context
Some functions exceeded acceptable cognitive complexity thresholds.

### Rationale
- Improve readability
- Simplify debugging
- Facilitate testing
- Align with SonarQube standards

### Trade-offs
- Increased number of helper functions
- Slight fragmentation of logic

---

## 8. Strict Code Cleanup and Standardization

### Decision
Remove unused code, debug logs, and deprecated patterns.

### Context
The initial codebase contained technical debt.

### Rationale
- Improve code clarity
- Reduce risk of hidden bugs
- Ensure consistency

### Trade-offs
- Requires continuous enforcement
- May remove potentially useful debug traces

---

## 9. Separation of Concerns in Project Structure

### Decision
Organize the project into clear directories:
- components
- hooks
- utils
- constants

### Context
Initial structure lacked clear separation.

### Rationale
- Improve navigation
- Enhance scalability
- Standardize development practices

### Trade-offs
- Requires discipline in file organization
- Slight learning curve for new contributors

---

## 10. Bug Reporting System (Email-Based)

### Context
The subject required the implementation of a bug reporting feature allowing users to submit detailed reports including context such as logs, screenshots, or game state.

An initial approach using GitHub Issues was considered, but it introduced a major limitation: users needed a GitHub account to submit reports. This created unnecessary friction and reduced accessibility.

### Decision
We implemented an email-based bug reporting system using the `mailto:` protocol.

The system:
- generates a structured bug report (description, environment, timestamp)
- opens the user’s default email client with a pre-filled message
- allows downloading a full JSON report containing detailed debug data (game state, stats, etc.)

The logic was extracted into a dedicated utility module (`bugReportUtils.js`) to separate business logic from UI.

### Consequences
- no authentication required → improved accessibility
- no backend needed → reduced complexity
- leverages user’s existing email client → reliable and simple

However:
- requires the user to have an email client configured
- debug data cannot be automatically attached (handled via downloadable file instead)

This trade-off was considered acceptable given the project scope and constraints.

---

## Conclusion

The technical decisions made during this project aim to transform the codebase into a maintainable, scalable, and testable application.

These choices prioritize:
- Separation of concerns
- Performance optimization
- Code quality
- Long-term maintainability

The result is a cleaner architecture aligned with modern React development practices.