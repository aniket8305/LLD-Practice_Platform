````markdown
# LLD Practice Platform

An interactive platform for practicing Low-Level Design through structured problem solving, submission, evaluation, and iterative feedback.

The core learning loop is:

**Choose a problem → Design → Submit → Evaluate → Review feedback → Try again**

## Overview

LLD problems often have multiple valid solutions, making it difficult for learners to know whether their design is actually good and how it can be improved.

This platform addresses that problem by allowing learners to:

- Practice curated LLD problems
- Understand requirements and constraints
- Create structured design submissions
- Receive rubric-based, evidence-backed feedback
- Review previous attempts
- Retry problems and track improvement

The focus is on the **quality of the design and reasoning**, not just whether code works.

---

## Core User Flow

```text
Browse Problems
      ↓
Select Problem
      ↓
Read Requirements
      ↓
Start Attempt
      ↓
Write Structured Solution
      ↓
Submit
      ↓
Evaluate
      ↓
View Feedback
      ↓
Review History
      ↓
Try Again
````

---

## Features

### Problem Catalog

The MVP provides curated Low-Level Design problems such as:

* Parking Lot
* Vending Machine
* Elevator System

Problems provide requirements, context, constraints, hints, and evaluation criteria.

### Structured Submissions

Learners submit their design through guided sections:

* Classes & Responsibilities
* Relationships
* Key Design Decisions
* Trade-offs & Extensibility

Structured submissions make it easier for learners to explain their reasoning and allow the evaluator to assess specific aspects of the design.

### Attempt Lifecycle

Each attempt follows an explicit lifecycle:

```text
DRAFT
  ↓
SUBMITTED
  ↓
EVALUATING
  ↓
EVALUATED
```

Evaluation failures are represented separately:

```text
EVALUATING
     ↓
EVALUATION_FAILED
     ↓
   RETRY
     ↓
EVALUATING
```

The `Attempt` domain object owns these state transitions and prevents invalid transitions.

### AI-Assisted Evaluation

The platform uses a fixed rubric rather than asking an AI model to simply provide a score.

Feedback is structured around:

* Requirement Understanding
* Class Responsibilities
* Relationships & Coupling
* Encapsulation & Interfaces
* Extensibility
* Edge Cases & Error Handling
* Design Rationale Quality

Each criterion can provide:

```text
Score
Evidence
Concern
Suggestion
Confidence
```

This makes feedback more actionable and helps avoid unexplained or arbitrary scores.

### Attempt History

Previous attempts are preserved so learners can:

* Review previous submissions
* See evaluation scores
* Read feedback
* Track improvement
* Start another attempt for the same problem

### Failure Handling

The system accounts for evaluator failures such as:

* AI API errors
* Timeouts
* Malformed AI responses
* Database failures
* Duplicate submission requests

The submission is persisted before evaluation begins, so evaluator failure does not destroy the learner's work.

Failed evaluations can be retried without requiring the learner to submit again.

---

## Architecture

The application follows a simple layered architecture.

```text
┌────────────────────────────┐
│      React Frontend        │
│                            │
│ Problems / Attempts        │
│ Feedback / History         │
└─────────────┬──────────────┘
              │
              │ REST API
              ↓
┌────────────────────────────┐
│         API Layer          │
│ Controllers / Routes       │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│     Application Layer      │
│ Services / Use Cases       │
└─────────────┬──────────────┘
              ↓
┌────────────────────────────┐
│        Domain Layer        │
│                            │
│ Problem                    │
│ Attempt                    │
│ Submission                 │
│ Evaluation                 │
│ Rubric                     │
└─────────────┬──────────────┘
              │
       ┌──────┴───────┐
       ↓              ↓
┌──────────────┐ ┌────────────────┐
│ Repositories │ │   Evaluator    │
│ / Database   │ │  Abstraction   │
└──────────────┘ └───────┬────────┘
                         ↓
                   AI Evaluator
                         ↓
                    AI Provider
```

The project intentionally uses a **simple monolithic architecture**. The assignment emphasizes domain design and engineering judgment rather than distributed-system infrastructure.

---

## Domain Model

### Problem

Represents an LLD exercise.

Contains the problem description, requirements, hints, and evaluation rubric.

### Attempt

Represents one practice session for a problem.

Responsible for:

* Attempt lifecycle
* State transitions
* Submission
* Evaluation status
* Retry rules

### Submission

Represents what the learner submitted.

It is kept separate from `Attempt` so that submission formats can evolve independently.

### SubmissionContent

An abstraction representing the content of a submission.

The MVP uses structured text.

Future implementations could support:

```text
TextSubmissionContent
DiagramSubmissionContent
CodeSubmissionContent
```

without changing the core attempt lifecycle.

### Evaluation

Represents the evaluation result for a submission.

Contains:

* Overall score
* Overall summary
* Criterion results
* Evaluator type
* Evaluation metadata

### CriterionResult

Represents feedback for an individual rubric criterion.

```text
CriterionResult
├── Criterion
├── Score
├── Max Score
├── Evidence
├── Concern
├── Suggestion
└── Confidence
```

### RubricTemplate

Defines the criteria used to evaluate a particular problem.

Different problems can use different rubric configurations.

---

## Evaluator Abstraction

Evaluation is hidden behind an `Evaluator` abstraction.

Conceptually:

```typescript
interface Evaluator {
  evaluate(
    submission,
    rubricTemplate,
    problemContext
  ): Promise<Evaluation>;

  getType(): string;
  canEvaluate(format): boolean;
}
```

The current MVP uses an AI evaluator.

The abstraction allows future evaluators such as:

```text
AI Evaluator
Rule-Based Evaluator
Human Evaluator
Composite Evaluator
```

to be introduced without changing the core practice flow.

---

## Deterministic vs AI Evaluation

The system separates objective validation from judgment-heavy evaluation.

### Deterministic checks

Used for:

* Required submission sections
* Content validation
* Minimum content requirements
* Attempt state transitions

### AI evaluation

Used for:

* Quality of class responsibilities
* Coupling and cohesion
* SOLID principles
* Design trade-offs
* Extensibility
* Edge cases
* Improvement suggestions

This separation makes objective validation predictable while using AI where human-like judgment is more useful.

---

## Submission Extensibility

The MVP uses structured text because it provides a low-cost way to capture design thinking while mapping naturally to the evaluation rubric.

The submission abstraction allows future formats to be added.

For example:

```text
SubmissionContent
       │
       ├── TextSubmissionContent
       │
       ├── DiagramSubmissionContent
       │
       └── CodeSubmissionContent
```

Adding a new submission type should not require rewriting `Attempt`, `Evaluation`, or the main practice flow.

---

## Reliability & Idempotency

The platform is designed to handle evaluation failures safely.

### Submission Flow

```text
1. Verify the attempt is in DRAFT
2. Validate the submission
3. Persist the submission
4. Move the attempt to SUBMITTED
5. Start evaluation
6. On success → EVALUATED
7. On failure → EVALUATION_FAILED
```

The submission is persisted **before evaluation begins**.

### Retry Flow

```text
EVALUATION_FAILED
        ↓
     Retry
        ↓
   EVALUATING
        ↓
   EVALUATED
```

Retrying reuses the stored submission rather than forcing the learner to submit again.

Duplicate submissions and duplicate evaluations are guarded using attempt state checks and idempotency/uniqueness controls.

---

## API

The core REST API follows the practice flow.

### Problems

```http
GET /api/problems
GET /api/problems/:slug
```

### Attempts

```http
POST  /api/attempts
GET   /api/attempts/:id
PATCH /api/attempts/:id
```

### Submission & Evaluation

```http
POST /api/attempts/:id/submit
POST /api/attempts/:id/retry-evaluation
```

### History

```http
GET /api/attempts/history
```

---

## Frontend Pages

| Page           | Purpose                                       |
| -------------- | --------------------------------------------- |
| Problem List   | Browse available LLD problems                 |
| Problem Detail | View requirements, hints and start an attempt |
| Attempt Editor | Create and save a structured solution         |
| Feedback View  | Review rubric scores and feedback             |
| History        | Review previous attempts and progress         |

---

## Testing

The testing strategy focuses on important behavior and failure scenarios.

### Domain Tests

* Attempt state transitions
* Invalid transition prevention
* Submission validation
* Retry rules

### Evaluation Tests

* Evaluator selection
* Prompt construction
* Structured response parsing
* Malformed AI responses
* Timeout/error handling
* Retry behavior
* Idempotency

### API Tests

* Request validation
* Error responses
* Submission flow
* Evaluation retrieval
* History retrieval

### Edge Cases

* Empty submissions
* Duplicate submissions
* Evaluator timeout
* AI API errors
* Malformed evaluator responses
* Failed evaluation retries

---

## Design Patterns

Patterns are used only where they solve an actual design problem.

### Strategy

The `Evaluator` abstraction allows different evaluation strategies to be swapped without changing the practice workflow.

### Repository

Repositories separate persistence concerns from the application and domain layers and make testing easier.

### State Machine

`Attempt.status` represents the explicit lifecycle of an attempt and prevents invalid state transitions.

### Value Objects

Evaluation and rubric structures are modeled as focused data structures where they do not require independent identity.

---

## Key Design Decisions

### Why separate Attempt and Submission?

An `Attempt` represents the learner's practice lifecycle, while a `Submission` represents the actual submitted design.

This separation means a new submission format can be introduced without changing the attempt lifecycle.

### Why structured feedback?

A single score does not explain how a learner can improve.

Criterion-level evidence, concerns and suggestions make feedback more useful.

### Why a simple monolith?

The MVP does not require distributed infrastructure.

Keeping the application simple makes the domain model easier to understand, test and evolve.

### Why one AI evaluator?

The goal is to ship one useful evaluation flow within the limited MVP scope.

The evaluator abstraction still allows additional evaluation strategies later.

---

## Future Extensions

The architecture provides clear extension points for:

* Diagram-based submissions
* Code-based submissions
* Rule-based evaluation
* Human evaluation
* Composite evaluation
* Multiple AI providers
* More detailed progress analytics
* Additional LLD problems
* Difficulty progression
* Peer review

---

## Intentionally Out of Scope

The MVP deliberately does not include:

* User authentication and registration
* Real-time collaboration
* Diagram editor
* Code execution sandbox
* Leaderboards
* Payments
* Multi-tenant infrastructure
* Admin panel
* Multiple AI providers
* Microservices
* Complex deployment infrastructure

These features are outside the core learning loop and were intentionally excluded to keep the prototype focused.

---

## Project Documentation

Additional documentation is available in the repository:

* `RESEARCH_NOTE.md` — Learner problem and product direction
* `DESIGN_NOTE.md` — Architecture and Low-Level Design decisions
* `AI_USAGE.md` — AI-assisted development decisions and trade-offs

---

## Getting Started

### Prerequisites

* Node.js
* npm
* Configured database
* Required AI API credentials

### Clone the repository

```bash
git clone https://github.com/aniket8305/LLD-Practice_Platform.git
cd LLD-Practice_Platform
```

### Install dependencies

```bash
npm install
```

### Environment Variables

Create the required environment variables using the project's environment configuration/documentation.

Do not commit API keys or other secrets to the repository.

### Run the application

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Build

```bash
npm run build
```

---

## MVP Philosophy

The project is centered around one core question:

> **How can LLD practice become more useful when multiple valid designs are possible?**

The approach is:

**Structured submissions + explicit domain modeling + rubric-based evaluation + evidence-backed feedback + attempt history.**

This creates a focused learning loop while keeping the system extensible for future submission formats and evaluation strategies.

---

## Author

**Aniket**

GitHub: [aniket8305](https://github.com/aniket8305)

---

## Assignment

Built as part of the **CipherSchools LLD Practice Platform Engineering Assignment — September 2026**.
