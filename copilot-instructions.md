## 1. Project Mission

This repository contains the system **Caixa de Perguntas**, a web application used during internal townhall meetings to collect anonymous questions and allow administrators to manage them.

This is a **small but production-minded system**.  
Even though the system is simple, the implementation must follow **professional engineering standards**.

The solution must be:

- maintainable
- secure
- easy to operate during a live meeting
- architecturally consistent
- well documented
- testable
- deployable to Azure App Service Linux in single-instance mode

---

## 2. Mandatory Stack

You MUST use and preserve the following stack unless explicitly instructed otherwise:

- Next.js
- React
- TypeScript
- App Router
- Node.js
- SQLite
- Azure App Service Linux compatibility

Preferred supporting libraries may include:
- `better-sqlite3`
- `bcryptjs`
- `jsonwebtoken`
- `uuid`
- `xss`
- Jest or Vitest for testing

Do not introduce unnecessary frameworks, ORMs, or dependency injection frameworks unless explicitly requested.

---

## 3. Non-Negotiable Architecture

This project MUST follow a **simple hexagonal architecture**.

### Required layers
- `domain`
- `application`
- `infrastructure`
- `interface`

### Dependency rules
The dependency direction must always be preserved:

- `interface -> application -> domain`
- `infrastructure -> domain/application`

### Forbidden dependency directions
- `domain` must never depend on `application`
- `domain` must never depend on `interface`
- `domain` must never depend on framework code
- `application` must never depend on `interface`
- `repositories` must not contain business rules
- `React components` must not contain business rules
- `route handlers` must not contain business rules

### Layer responsibilities

#### Domain
Contains only:
- entities
- enums
- value objects
- domain errors
- repository ports/interfaces
- service ports/interfaces
- pure business rules

#### Application
Contains only:
- use cases
- DTOs
- validators
- orchestration logic
- application errors

#### Infrastructure
Contains only:
- SQLite repositories
- DB connection and migrations
- password hashing
- JWT generation/validation
- sanitization adapters
- rate limiting adapters
- config loading
- composition root / dependency wiring

#### Interface
Contains only:
- Next.js pages
- route handlers
- React components
- hooks
- view/presenter mapping
- UI behavior

---

## 4. Business Logic Rules

### Absolute rule
Business logic must live only in:
- domain entities
- value objects
- application use cases

### Prohibited
Do NOT:
- validate business state transitions inside React components
- decide domain transitions inside API handlers
- place business state rules in repository classes
- duplicate business validations in multiple layers without justification

### Correct behavior
UI may validate for UX.  
Server-side application/domain must validate for truth.

---

## 5. Mandatory Domain Model Rules

### Question status
Supported statuses:

- `Submitted`
- `Selected`
- `Discarded`
- `Answered`

Allowed transitions only:

- `Submitted -> Selected`
- `Submitted -> Discarded`
- `Selected -> Answered`
- `Selected -> Discarded`

Rules:
- `Discarded` is final
- `Answered` is final
- Any other transition must fail with a domain error

These rules MUST be centralized in domain logic.

### Question entity
A `Question` must explicitly model:
- `id`
- `meetingId`
- `avatarId`
- `text`
- `status`
- `createdAt`
- `updatedAt`
- `selectedAt`
- `answeredAt`

### Meeting entity
A `Meeting` must explicitly model:
- `id`
- `title`
- `scheduledAt`
- `isOpenForSubmissions`
- `openedAt`
- `closedAt`
- `createdAt`
- `updatedAt`

Rules:
- only one meeting may be open at a time
- opening one meeting must close any previously open meeting
- questions must always belong to a meeting
- only open meetings may receive submitted questions

### Admin entity
An `AdminUser` must explicitly model:
- `id`
- `login`
- `passwordHash`
- `isActive`
- `mustChangePassword`
- `createdAt`
- `updatedAt`

Rules:
- only active admins may authenticate
- login must be unique
- password changes must validate current password
- seed must be idempotent

---

## 6. Avatar Rules

Supported avatars are fixed and must remain stable.

Required avatar list:
- Arara-azul
- Onça-pintada
- Mico-leão-dourado
- Tamanduá-bandeira
- Capivara
- Quero-quero
- Veado-campeiro
- Bugio-ruivo
- João-de-barro
- Ema

Avatars should be represented internally with stable identifiers.

Preferred structure:
- `id`
- `displayName`
- `icon`

Storage may persist only `id`.

Do not hardcode avatar display logic repeatedly across multiple files. Centralize avatar metadata in a single source of truth.

---

## 7. Naming Conventions

### General rules
Use clear, explicit, professional names.

Prefer:
- `QuestionRepository`
- `CreateMeetingUseCase`
- `AuthenticateAdminUseCase`
- `ChangeOwnPasswordUseCase`

Avoid vague names like:
- `Helper`
- `Manager`
- `Utils`
- `Service` (unless it is truly a domain/application service and the name is specific)

### File naming
Prefer one of these conventions consistently:
- kebab-case for files
- PascalCase only when the project convention strongly requires it

Be consistent.

### Class naming
- Entities: `Question`, `Meeting`, `AdminUser`
- Use cases: `SubmitQuestionUseCase`
- Repositories: `SqliteQuestionRepository`
- Ports: `QuestionRepository`, `PasswordHasher`, `RateLimiter`
- Errors: `InvalidQuestionTransitionError`

### Function naming
Use verb-first names for behaviors:
- `submitQuestion`
- `selectQuestion`
- `discardQuestion`
- `markAsAnswered`
- `openMeetingForSubmissions`

### Boolean naming
Always use names that read clearly:
- `isActive`
- `isOpenForSubmissions`
- `mustChangePassword`
- `isAllowed`

Avoid ambiguous boolean names.

---

## 8. DTO Rules

All use cases that cross boundaries should use explicit DTOs.

### Required separation
Use:
- input DTOs
- output DTOs

Avoid:
- exposing raw DB rows to the interface
- using domain entities directly as API responses when avoidable

### DTO naming
Use explicit names:
- `SubmitQuestionInput`
- `SubmitQuestionOutput`
- `CreateMeetingInput`
- `ListSelectedQuestionsOutput`

### DTO responsibilities
DTOs should:
- define boundary contracts
- be simple and serializable
- avoid framework coupling

Do not place business behavior inside DTOs.

---

## 9. Error Handling Rules

### Error categories
Use distinct error categories where appropriate:
- domain errors
- application errors
- infrastructure errors

### Requirements
- domain errors must express business rule violations
- application errors may express orchestration/use case failures
- infrastructure errors must not leak to end users directly

### User-facing responses
- never expose stack traces
- never expose SQL errors
- never expose JWT internal details
- never expose whether login exists or not

### Error naming
Use explicit names:
- `QuestionTextTooShortError`
- `QuestionTextTooLongError`
- `MeetingClosedForSubmissionsError`
- `InvalidCredentialsError`
- `PasswordChangeRequiredError`

Avoid generic error names like:
- `ValidationError`
- `BadRequestError`
unless the context is narrow and well scoped.

---

## 10. Validation, Sanitization, and Rendering Rules

These concerns MUST be kept separate.

### Validation
Validation checks:
- empty input
- min length
- max length
- required fields
- allowed state preconditions

Validation should happen in application/use case boundary.

### Sanitization
Sanitization should happen before persistence and/or before dangerous rendering boundaries.
Use a sanitizer adapter through a port when appropriate.

### Rendering safety
UI must use safe rendering.
Do not use `dangerouslySetInnerHTML`.

### Important
Do not confuse:
- invalid input
- unsafe input
- escaped output

These are different concerns.

---

## 11. Persistence Rules

### Absolute rules
- SQLite access must only exist in infrastructure
- SQL must only exist inside repository implementations or DB infrastructure files
- Route handlers must never execute SQL directly
- React code must never execute SQL directly

### Repository requirements
Repositories must:
- implement ports
- map DB rows to domain/application structures cleanly
- not contain business policy decisions

### DB schema discipline
Schema, migrations, and seed behavior must be explicit and reproducible.

### Azure persistence rule
The SQLite file path must be configurable by environment variable.

Azure default path should support persistence, such as:
`/home/data/caixa.db`

The app must create the parent directory if needed.

---

## 12. API Route Rules

API routes are adapters. They are not business logic containers.

### API routes must
- parse request
- validate auth/session if needed
- call the correct use case
- map result to HTTP response
- map known errors to safe status codes/messages

### API routes must NOT
- contain transition rules
- contain SQL
- contain password hashing logic
- contain JWT construction logic directly if this is already encapsulated
- duplicate domain logic

### Response shape
Prefer consistent JSON responses.

For example:
- success: `{ data: ... }`
- error: `{ error: { code, message } }`

Be consistent.

---

## 13. Authentication and Authorization Rules

### Authentication
Admin authentication must:
- use JWT in `httpOnly` cookie
- use secure cookie options
- never use localStorage for tokens
- use expiration
- support logout correctly

### Authorization
Admin routes must be protected.
Inactive admins must not authenticate.
If `mustChangePassword = true`, the admin must be blocked from all protected admin operations except:
- view self/basic auth state if needed
- change own password
- logout

### Middleware/guards
Use middleware/guards/adapters consistently.
Do not spread auth logic chaotically across files.

---

## 14. Rate Limiting Rules

Anonymous public submissions must be protected with rate limiting.

### Requirements
- simple implementation is acceptable
- compatible with single-instance deployment
- in-memory implementation is acceptable
- use a port/interface where appropriate
- hash IP if stored or used as key

### Documentation
README must clearly document:
- rate limit strategy
- limitations
- why it is acceptable for this scenario

---

## 15. Testing Rules

Testing is mandatory for core behavior.

### Minimum required categories
- unit tests for domain entities
- unit tests for use cases
- integration tests for SQLite repositories
- tests for critical API routes

### What must be tested
At minimum:
- valid and invalid status transitions
- meeting open/close rules
- question submission rules
- avatar random assignment fallback
- admin authentication
- password change
- route protection
- repository behavior
- seed idempotency if practical

### Test quality rules
Tests must:
- assert behavior clearly
- cover failure cases
- avoid meaningless snapshots
- avoid brittle test structure when possible

### Forbidden
Do not claim a feature is complete without evaluating test impact.

---

## 16. README Rules

`README.md` must always be current.

It must contain:
- project purpose
- architecture explanation
- stack
- folder structure
- environment variables
- local setup
- install instructions
- database setup
- migrations/seed instructions
- how to run tests
- how to run locally
- Azure deployment instructions
- SQLite persistence explanation
- operational instructions for meeting day
- known limitations
- possible future improvements

Do not leave the README shallow or outdated.

---

## 17. CHANGELOG Rules

`CHANGELOG.md` must always be updated when relevant changes happen.

Update it for:
- features
- fixes
- refactors
- tests
- documentation changes
- configuration changes
- scripts
- infrastructure changes

Do not skip changelog updates.

Prefer meaningful entries over vague notes.

---

## 18. Sprint Execution Discipline

When implementing any sprint or feature, always follow this sequence:

1. understand the request
2. identify impacted layers
3. list files to create or modify
4. explain the implementation plan briefly
5. implement
6. create or update tests
7. update README
8. update CHANGELOG
9. review for architecture violations

Do not skip this sequence.

---

## 19. Refactoring Rules

When touching existing code:
- improve it if necessary
- do not preserve bad architecture just because it already exists
- do not introduce new inconsistency
- avoid large unrelated refactors unless needed
- keep changes cohesive

If a request requires violating architecture, first propose the correct architectural approach instead of taking shortcuts.

---

## 20. UI/UX Rules

### Public page
Must include:
- current open meeting info
- avatar selection
- anonymous explanation
- question text area
- character counter
- submit CTA
- clear success/error feedback

Must feel:
- clean
- safe
- anonymous
- friendly
- simple

### Admin area
Must include:
- submitted questions
- selected questions
- meetings management
- admin management
- auth-related pages

Must feel:
- operational
- fast
- readable
- low-friction during live use

### General UI
- prefer reusable components
- prioritize readability
- avoid visual clutter
- avoid heavy animation
- do not sacrifice usability for style

---

## 21. Composition Root Rules

All dependency wiring must be centralized.

Use:
- `container.ts`
- factories
- composition root helpers

Do not instantiate repositories, auth services, sanitizers, hashers, and use cases ad hoc inside route handlers or random UI code.

---

## 22. Configuration Rules

Environment variables must be centralized and documented.

Typical variables may include:
- `DATABASE_PATH`
- `JWT_SECRET`
- `JWT_EXPIRATION_HOURS`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`
- `QUESTION_MIN_LENGTH`
- `QUESTION_MAX_LENGTH`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

Do not scatter config literals throughout the codebase.

---

## 23. Azure Rules

This application is intended for Azure App Service Linux, single instance.

### Mandatory assumptions
- single-instance deployment
- SQLite persistence on a persistent path
- no horizontal scaling assumptions
- Azure CLI scripts must target resource group:
  `rgCaixaDePerguntas`

### Scripts
Deployment/provisioning scripts must be clear, parameterized, and documented.

---

## 24. Definition of Done

A feature is NOT done unless:
- architecture is respected
- code is implemented
- tests were evaluated and updated
- README was updated if needed
- CHANGELOG was updated
- security implications were considered
- edge cases were considered

Do not mark work as complete otherwise.

---

## 25. Copilot Behavior Contract

When generating code for this repository, you MUST:

- follow this instruction file strictly
- prefer clarity over speed
- prefer correctness over shortcuts
- preserve architecture
- preserve security
- preserve maintainability
- update tests
- update README
- update CHANGELOG

When in doubt:
- do the architecturally correct thing
- do the safer thing
- do the more maintainable thing
- do not invent shortcuts

---

## 26. Preferred High-Level Structure

```text
src/
  domain/
    entities/
    enums/
    errors/
    ports/
    value-objects/
  application/
    use-cases/
    dto/
    validators/
    errors/
  infrastructure/
    db/
    repositories/
    auth/
    security/
    sanitization/
    rate-limit/
    config/
    container/
  interface/
    app/
    api/
    components/
    hooks/
    presenters/
tests/
  unit/
  integration/
scripts/
  azure/

This structure may be refined, but the architecture must remain clear and preserved.

27. Final Non-Negotiable Rule

Never trade architectural integrity, security, test discipline, or documentation quality for short-term coding speed.