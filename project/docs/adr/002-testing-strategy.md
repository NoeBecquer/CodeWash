# ADR 002: Introduce Testing Strategy Before Refactoring

---

## Status

Accepted

---

## Context

The initial codebase was unstable, poorly structured, and lacked any form of automated testing.

Key issues:

* No safety net for refactoring
* Unknown behavior in several parts of the system
* High risk of regressions when modifying logic
* Difficult to validate correctness of features

According to the project requirements, refactoring should not alter existing behavior unless explicitly intended.

---

## Decision

We decided to introduce a testing strategy before and during refactoring, following a "test-first stabilization" approach.

The testing stack includes:

* **Vitest** for unit and integration tests
* **React Testing Library** for component testing
* **Cypress** for end-to-end testing

Additionally, characterization tests were written to capture existing behavior before modifying the code.

---

## Rationale

This decision was made to:

* Preserve existing behavior during refactoring
* Detect regressions early
* Provide confidence when modifying critical systems
* Align with best practices for legacy system improvement

Testing acts as a safety net, allowing incremental and reversible changes.

---

## Consequences

### Positive

* Reduced risk of breaking functionality
* Improved confidence in refactoring steps
* Better documentation of expected behavior
* Easier debugging and validation

---

### Negative

* Additional development time required to write tests
* Some legacy code is difficult to test due to tight coupling
* Partial coverage in complex UI interactions

---

## Alternatives Considered

### 1. Refactor Without Tests

Rejected because:

* Extremely high risk of regression
* No way to validate correctness

---

### 2. Manual Testing Only

Rejected because:

* Not reliable
* Not scalable
* Does not provide long-term safety

---

### 3. End-to-End Testing Only

Rejected because:

* Does not isolate logic errors
* Slower feedback loop

---

## Implementation Notes

* Tests were added progressively before modifying logic
* Critical modules were prioritized:

  * Battle system
  * Utility functions
* Coverage goals were defined (~80% for modified code)
* Failing tests guided refactoring decisions

---

## Related Documents

* `docs/TESTING.md`
* `docs/ARCHITECTURE.md`

---

## Conclusion

Introducing a testing strategy before refactoring enabled safe and controlled improvements of the codebase.

This approach transformed an unreliable system into a more stable and maintainable application, while preserving existing functionality.
