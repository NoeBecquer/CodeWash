# Architecture Documentation

---

## 1. Introduction

This document describes the architecture of the CodeWash project, a React-based educational game initially generated using AI and later refactored to improve maintainability, performance, and clarity.

The goal of this document is to provide a clear understanding of:

* System structure
* Module responsibilities
* Data flow
* Key design decisions

This documentation is intended to help future developers quickly understand and extend the project.

---

## 2. High-Level Architecture

The application follows a modular frontend architecture based on separation of concerns.

It is organized into four main layers:

* Components (UI layer)
* Hooks (business logic layer)
* Utils (pure logic layer)
* Constants (configuration layer)

```
User Interaction
       ↓
Components (UI)
       ↓
Hooks (State + Logic)
       ↓
Utils (Pure Functions)
       ↓
Constants (Static Data)
```

---

## 3. Core Modules

### 3.1 App Entry Point

File: `App.jsx`

Responsibilities:

* Initializes global state via `useAppState`
* Connects UI components with business logic
* Orchestrates the main game flow
* Handles global UI elements (menus, modals, HUD)

Observation:
This file was originally too large and has been partially decomposed. Some coupling still exists and may be improved further.

---

### 3.2 State Management

File: `useAppState.js`

Responsibilities:

* Stores global application state:

  * Profiles
  * Skills
  * Settings
  * UI state (menus, modals)
* Provides setters and state transition functions

Design Choice:
A custom React hook is used instead of external state libraries to keep the architecture simple and controlled.

---

### 3.3 Battle System

File: `useBattleLogic.js`

Responsibilities:

* Manages battle lifecycle:

  * Start / progression / end
* Handles:

  * Damage calculation
  * XP gain
  * Level progression
  * Mob health updates
* Prevents inconsistent async updates
* Triggers achievements and effects

Key Concept:
Encapsulation of all combat-related logic into a single hook improves testability and reduces coupling with UI components.

---

### 3.4 Game Rendering

File: `GameCarousel.jsx`

Responsibilities:

* Displays available skills/games
* Handles selection and navigation
* Connects UI interactions to battle logic

Interaction:
Acts as a bridge between user actions and the battle system.

---

### 3.5 Skill System

File: `SkillCard.jsx`

Responsibilities:

* Represents a single skill (game)
* Displays:

  * Level
  * XP
  * Mob
  * Challenge
* Handles user interactions (input, microphone, etc.)

Subcomponents:

* Game-specific rendering (memory, reading, simon)
* UI sections (HP bar, XP bar, top section)

Observation:
This component is complex but modularized internally to reduce cognitive load.

---

### 3.6 Voice Recognition

File: `useVoiceRecognition.js`

Responsibilities:

* Manages speech input using browser APIs
* Normalizes spoken input
* Triggers validation for reading challenges

Constraint:
Relies on `webkitSpeechRecognition`, which is browser-dependent.

---

## 4. Utility Layer

Location: `src/utils`

Purpose:
Provide reusable, pure functions independent of React.

Examples:

* `gameUtils.js`

  * Damage calculation
  * XP scaling
  * Difficulty handling

* `achievementUtils.js`

  * Achievement unlocking logic

* `soundManager.js`

  * Audio playback and control

Design Principle:
All functions are stateless and deterministic to ensure easy testing.

---

## 5. Constants Layer

Location: `src/constants`

Purpose:
Centralize static configuration data.

Examples:

* Skill definitions
* Mob definitions
* Theme configuration
* Game parameters

Benefit:
Avoids hardcoding values across the application and simplifies future extensions.

---

## 6. Data Flow

### Battle Flow

1. User starts a battle from UI
2. `GameCarousel` triggers `useBattleLogic`
3. A challenge is generated
4. User interacts (input or voice)
5. Result is validated
6. State is updated:

   * Damage applied
   * XP updated
   * Level progression checked
7. UI re-renders with new state

---

### State Flow

* Global state is stored in `useAppState`
* Components consume state via props
* Hooks update state through setters
* Updates trigger React re-render cycle

---

## 7. Design Decisions

### 7.1 Custom Hooks Instead of External State Libraries

Reason:

* Simpler architecture
* Better control over logic
* Reduced dependencies

---

### 7.2 Separation of Logic and UI

* Business logic moved to hooks
* UI components focus on rendering

Benefit:

* Improved readability
* Easier testing

---

### 7.3 Modular Game System

Each skill/game:

* Has its own logic and rendering
* Can be extended independently

This enables future additions (e.g., new games).

---

## 8. Known Limitations

* `App.jsx` still contains multiple responsibilities
* Some components remain tightly coupled
* Voice recognition is browser-dependent
* Theme system is not fully consistent

---

## 9. Future Improvements

* Further decompose `App.jsx`
* Introduce clearer domain boundaries
* Improve theme system consistency
* Optimize performance of rendering and animations
* Simplify integration of new games

---

## 10. Conclusion

The architecture has been significantly improved from its original state.

The project evolved from a monolithic and hard-to-maintain codebase into a modular system with:

* Clear separation of concerns
* Encapsulated business logic
* Testable components and utilities

This structure provides a solid foundation for future development and maintenance.
