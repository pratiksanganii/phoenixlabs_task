# PhoenixLabs — GLP-1 Screening Engine

## Overview

PhoenixLabs GLP-1 Screening Engine is a patient-facing clinical screening platform designed to evaluate patient eligibility for GLP-1 weight-loss medication through a dynamic multi-step questionnaire system.

The platform guides anonymous users through a 15-screen intake flow that:

- Applies real-time branching logic
- Computes physiological metrics dynamically
- Persists progress continuously
- Restores interrupted sessions seamlessly
- Generates immutable clinical audit records
- Produces deterministic clinical outcomes

The system is designed with accessibility, resiliency, and deterministic evaluation as core architectural priorities.

---

# Goals

- Enable anonymous users to securely complete a clinical eligibility questionnaire
- Provide a fully accessible frontend experience compliant with WCAG 2.1 AA
- Dynamically alter routing paths based on runtime clinical thresholds
- Compute physiological metrics such as BMI in real time
- Persist responses after every screen transition to prevent progress loss
- Generate immutable clinical records and diagnostic audit trails
- Execute a deterministic, side-effect-free evaluation engine that classifies patients as:
  - Eligible
  - Ineligible
  - Requires Clinical Review

---

# Core User Flow

```text
1. User lands on the application root page
2. App checks for an existing session token
3. If missing, backend initializes an anonymous intake session
4. User begins the questionnaire flow from Screen 1
5. Each "Next" action commits a snapshot to the database
6. Backend evaluates branching logic and determines the next route
7. User may refresh or leave the browser at any time
8. App restores the latest persisted state and active screen
9. User reaches the terminal assessment screen
10. Clinical evaluation engine computes final classification
11. Session becomes immutable and returns final outcome
```

---

# Architecture Highlights

## Anonymous Session Management

- Token-based anonymous identity tracking
- No authentication or login barriers
- Automatic token validation against persisted records
- Indexed lookup strategies optimized for concurrent access patterns

### Capabilities

- Frictionless intake experience
- Recoverable sessions after refresh or browser interruption
- Stateless frontend restoration using persisted backend state

---

## Resilient Persistence & Audit Logging

The platform uses a dual-layer persistence model.

### Snapshot Store

Maintains the latest consolidated questionnaire state.

### Append-Only Historical Ledger

Stores immutable field-level mutations across every screen transition.

### Benefits

- Full auditability of patient interactions
- Historical replay capability
- Elimination of synchronization conflicts
- Safe backward/forward editing behavior

---

# Dynamic Conditional Form Engine

The questionnaire is driven by a JSON-based configuration system that defines:

- Prompt content
- Input types
- Validation requirements
- Branching metadata
- Clinical thresholds
- Routing conditions

## Runtime Evaluation

The backend dynamically evaluates incoming responses to determine:

- Next screen routing
- Hard-stop contraindications
- Eligibility boundaries
- Risk escalation flows

## Physiological Calculations

BMI is calculated dynamically during intake:

```math
BMI = \frac{\text{weight}}{(\text{height}/100)^2}
```

### Features

- Inline mathematical evaluations
- Immediate contraindication termination
- Dynamic screen skipping and branching
- Stateless deterministic routing

---

# Pure Clinical Evaluation Engine

The final assessment engine is intentionally designed as:

- Pure
- Deterministic
- Side-effect-free
- Fully testable
- Dependency isolated

## Evaluation Responsibilities

- Aggregate multi-screen response states
- Apply risk classification logic
- Detect contraindications
- Escalate review-required conditions
- Produce final immutable classifications

## Classification Outcomes

| Outcome | Description |
|---|---|
| Eligible | User satisfies all qualification criteria |
| Ineligible | User violates hard clinical boundaries |
| Requires Clinical Review | User requires manual or advanced review |

---

# Accessibility & UX

The platform is designed with accessibility as a first-class concern.

## Accessibility Features

- WCAG 2.1 AA compliance
- Fully keyboard-navigable interfaces
- Semantic HTML structure
- Accessible validation alerts
- ARIA-compatible messaging
- Screen-reader friendly error handling

## UX Priorities

- Minimal friction onboarding
- Continuous progress preservation
- Predictable navigation behavior
- Clear validation feedback
- Stable recovery after interruption

---

# Scope

## In Scope

### Infrastructure

- PostgreSQL setup via localized containerized environments
- Transactional persistence architecture
- Snapshot + append-only ledger model

### Backend

- APIs for:
  - Session initialization
  - Screen submission
  - State restoration
  - Final evaluation
- Deterministic evaluation engine

### Frontend

- Next.js 15 dynamic questionnaire engine
- Accessible form validation
- Progress indicators
- Runtime branching UI

### Testing

- 100% branch coverage on evaluation logic using Vitest
- Playwright E2E coverage for:
  - Happy path flows
  - Page refresh recovery
  - Terminal conditions
- CI validation workflows on pull requests

---

## Out of Scope

- Authentication systems
- User profile management
- Administrative dashboards
- Billing or subscription systems
- Production deployment infrastructure
- Cloud routing and domain setup
- Visual animation systems
- Advanced database benchmarking
- Custom design system implementation

---

# Testing Strategy

## Unit Testing

Using **Vitest** to validate:

- Clinical rule execution
- Branch routing
- Deterministic evaluation behavior
- Edge-case coverage

### Requirements

- 100% branch coverage on evaluation logic

---

## End-to-End Testing

Using **Playwright** to validate:

- Full questionnaire completion
- Session persistence after refresh
- Dynamic routing correctness
- Terminal assessment execution
- Recovery and hydration flows

---

# Continuous Integration

CI workflows automatically execute:

- Unit test suites
- Integration tests
- E2E Playwright flows
- Type validation
- Build verification

All pull requests must pass automated validation before merge eligibility.

---

# Success Criteria

The project is considered complete when:

- Anonymous users can successfully initialize intake sessions
- Users receive and progress through Screen 1–15 correctly
- Every screen transition persists data safely
- Historical audit logs are generated correctly
- Refresh recovery restores exact progress state
- Clinical evaluation produces deterministic outcomes
- Evaluation logic achieves full branch coverage
- Playwright E2E flows pass consistently
- CI workflows validate all incoming pull requests successfully

---

# Technical Characteristics

| Area | Characteristics |
|---|---|
| Frontend | Next.js 15 |
| Database | PostgreSQL |
| Testing | Vitest + Playwright |
| Architecture | Stateless + Deterministic |
| Persistence | Snapshot + Append-only Ledger |
| Sessions | Anonymous Token-Based |
| Accessibility | WCAG 2.1 AA |
| Evaluation Engine | Pure Functional Rules Engine |
| Routing | Dynamic Conditional Branching |

---

# Design Principles

- Deterministic clinical evaluation
- Fault-tolerant persistence
- Accessibility-first interfaces
- Immutable auditability
- Stateless recoverability
- High testability
- Runtime configurability
- Minimal user friction