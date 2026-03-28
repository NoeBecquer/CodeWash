# Testing Documentation

---

## 1. Introduction

This document describes the testing strategy implemented in the CodeWash project.

The goal of testing is to ensure:

* Stability of the application
* Preservation of existing behavior during refactoring
* Prevention of regressions
* Confidence in future modifications

Following the project requirements, testing was introduced before and during refactoring to validate all changes.

---

## 2. Testing Strategy

The project uses a multi-layer testing approach:

* Unit tests for pure logic
* Component tests for UI behavior
* End-to-end tests for user flows

This layered approach ensures both low-level correctness and high-level functionality.

---

## 3. Testing Tools

### 3.1 Unit and Integration Testing

* **Vitest**

Used for:

* Testing utility functions
* Testing custom hooks
* Testing component logic

---

### 3.2 Component Testing

* **React Testing Library**

Used for:

* Rendering components
* Simulating user interactions
* Verifying UI behavior

---

### 3.3 End-to-End Testing

* **Cypress**

Used for:

* Testing real user flows
* Validating UI navigation
* Ensuring integration between systems

---

## 4. Test Structure

Tests are organized as follows:

```id="2g2jxt"
test/
├── components/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── setup.js
```

Cypress tests are located in:

```id="hxkz2q"
cypress/e2e/
```

---

## 5. Unit Testing

### Scope

Unit tests focus on pure and isolated logic.

Examples:

* `gameUtils.js`

  * Damage calculation
  * XP scaling
  * Difficulty handling

* `achievementUtils.js`

  * Unlock conditions

---

### Example Cases

* Correct damage calculation based on difficulty
* XP increases correctly after a successful hit
* Level progression triggers at correct thresholds

---

## 6. Hook Testing

Custom hooks are critical to the architecture and are thoroughly tested.

### Key Hook: `useBattleLogic`

Tested behaviors:

* Successful hit updates:

  * Damage
  * XP
  * Skill state

* Wrong answer:

  * No XP gain
  * Failure effects triggered

* Level up:

  * Occurs when XP threshold is exceeded

* Battle transitions:

  * Idle → In Progress → Victory

* Async safety:

  * Outdated responses are ignored

---

## 7. Component Testing

Component tests validate UI behavior and interactions.

### Examples

* `SkillCard`

  * Renders correct skill data
  * Starts battle on button click

* `BugReportModal`

  * Opens and closes correctly

* `SafeImage`

  * Handles fallback image correctly

---

### Testing Approach

* Render component
* Simulate user interaction
* Assert expected DOM changes

---

## 8. End-to-End Testing

End-to-end tests simulate real user behavior.

### Tested Flows

* Application loading
* Navigation between menus
* Starting a battle
* UI interactions (buttons, drawers, modals)

### Example Files

* `navigation.cy.js`
* `battle_action.cy.js`
* `menu.cy.js`

---

## 9. Coverage

Coverage is measured using Vitest.

### Goals

* Approximately 80% coverage on modified code
* High coverage for critical systems

### Run Coverage

```sh id="9h4p52"
npx vitest run --coverage
```

Coverage reports help identify:

* Untested logic
* Dead code
* Risk areas

---

## 10. Testing Principles Applied

### 10.1 No Refactor Without Tests

Before modifying logic:

* Existing behavior is captured with tests

---

### 10.2 Small and Incremental Changes

* Each change is validated independently
* Tests ensure no regression

---

### 10.3 Focus on Critical Logic

Priority given to:

* Battle system
* State management
* Core utilities

---

## 11. Known Limitations

* Some UI edge cases are not fully covered
* Voice recognition is difficult to test automatically
* Some legacy code remains partially untested

---

## 12. Future Improvements

* Increase overall coverage
* Add more edge case testing
* Improve mocking of browser APIs (voice recognition)
* Automate tests in CI pipeline

---

## 13. How to Run Tests

### Unit and Component Tests

```sh id="3wz9o0"
npx vitest run
```

---

### Watch Mode

```sh id="d8g5nh"
npx vitest
```

---

### End-to-End Tests

```sh id="6w2fjb"
npx cypress open
```

---

## 14. Conclusion

The testing strategy ensures that the application remains stable during refactoring and future development.

By combining unit, component, and end-to-end testing, the project achieves:

* Reliable core logic
* Verified user interactions
* Reduced risk of regression

This provides a strong safety net for continued improvements.
