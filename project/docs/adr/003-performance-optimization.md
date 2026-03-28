# ADR 003: Improve Performance via Memoization and Component Decomposition

---

## Status

Accepted

---

## Context

The original application exhibited several performance issues:

* Noticeable lag in the main menu
* Slow rendering of complex components
* Frequent unnecessary re-renders
* Large components handling multiple responsibilities

In particular:

* `App.jsx` was overly complex and triggered wide re-render cascades
* `SkillCard.jsx` combined UI rendering, state logic, and game behavior
* Functions and computed values were recreated on every render

These issues negatively impacted user experience and made the application feel unresponsive.

---

## Decision

We decided to improve performance by applying two main strategies:

1. **Component decomposition**
2. **Memoization techniques**

### Key Changes

* Split large components into smaller, focused subcomponents
* Applied `React.memo` to prevent unnecessary re-renders
* Used `useMemo` for expensive computations
* Used `useCallback` to stabilize function references
* Reduced scope of state updates to limit render propagation

---

## Rationale

This decision was made to:

* Reduce rendering cost
* Improve UI responsiveness
* Minimize unnecessary computations
* Align with React performance best practices

Memoization ensures that components and values are only recomputed when necessary, while decomposition reduces the complexity of each render cycle.

---

## Consequences

### Positive

* Improved responsiveness of the main menu
* Smoother gameplay interactions
* Reduced number of component re-renders
* Better separation of responsibilities
* Increased maintainability

---

### Negative

* Increased code complexity due to memoization patterns
* Risk of overusing memoization in non-critical areas
* Slightly higher cognitive load for developers

---

## Alternatives Considered

### 1. No Optimization

Rejected because:

* Poor user experience
* Does not meet project requirements

---

### 2. Full Rewrite

Rejected because:

* Violates incremental refactoring principle
* High risk and time cost

---

### 3. External Optimization Libraries

Rejected because:

* Adds unnecessary dependencies
* Native React tools are sufficient

---

## Implementation Notes

* Optimizations were applied incrementally

* Performance improvements were validated using browser developer tools

* Focus was placed on critical components:

  * `SkillCard`
  * `GameCarousel`
  * Battle-related rendering

* Memoization was only applied where measurable benefits were observed

---

## Related Documents

* `docs/PERFORMANCE.md`
* `docs/ARCHITECTURE.md`

---

## Conclusion

Applying memoization and component decomposition significantly improved the performance of the application.

These optimizations reduced rendering overhead and enhanced user experience while maintaining a clean and scalable architecture.
