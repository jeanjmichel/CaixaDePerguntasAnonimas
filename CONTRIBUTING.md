# Contributing — Caixa de Perguntas

## 📌 Purpose

This document defines how to contribute to the **Caixa de Perguntas** project.

This is a small system with **production-level engineering discipline**.  
All contributions must follow strict architectural, testing, and documentation rules.

---

## 🧠 Core Principles

Every contribution must respect:

- clarity over cleverness
- simplicity over overengineering
- maintainability over speed
- correctness over shortcuts
- architecture over improvisation

---

## 🏗️ Architecture Rules (Non-Negotiable)

This project follows a **hexagonal architecture**:

interface -> application -> domain  
infrastructure -> domain/application  

### You MUST NOT:

- put business logic in React components
- put business logic in API routes
- put business logic in repositories
- access SQLite directly outside infrastructure
- bypass use cases
- duplicate domain rules across layers

### You MUST:

- use use cases for business actions
- keep domain rules centralized
- respect dependency direction
- use ports/interfaces for external concerns

---

## 📁 Project Structure

src/
  domain/
  application/
  infrastructure/
  interface/
tests/
scripts/

Do not break this structure.

---

## ✍️ Coding Guidelines

### TypeScript
- strict typing required
- avoid `any`
- prefer explicit types

### Naming
- use clear, descriptive names
- avoid generic names like `Helper`, `Utils`, `Manager`

### Functions
- small and focused
- one responsibility per function

### Files
- cohesive and well-organized
- avoid large, mixed-responsibility files

---

## 🔁 Development Workflow

When implementing any change:

1. understand the requirement
2. identify impacted layers
3. list files to create/modify
4. implement respecting architecture
5. update tests
6. update README.md
7. update CHANGELOG.md
8. validate security and edge cases

---

## 🧪 Testing Requirements

All relevant changes must include tests.

### Required coverage:
- domain rules
- use cases
- repository behavior (integration)
- critical API routes

### Expectations:
- test both success and failure cases
- avoid superficial tests
- tests must pass locally before PR

---

## 🔐 Security Requirements

You MUST:

- validate all inputs server-side
- sanitize user input when needed
- never expose internal errors
- never expose sensitive data
- protect admin routes
- use httpOnly cookies for authentication
- hash passwords securely

---

## 🧾 Documentation Requirements

### README.md
Must be updated when:
- features change
- setup changes
- environment variables change
- deployment changes

### CHANGELOG.md
Must be updated for:
- features
- fixes
- refactors
- test changes
- configuration changes

No PR should be merged without updating the changelog when applicable.

---

## ⚙️ Configuration Rules

- never hardcode secrets
- use environment variables
- document all variables in README

Common variables include:
- DATABASE_PATH
- JWT_SECRET
- SEED_ADMIN_USERNAME
- SEED_ADMIN_PASSWORD

---

## 🗄️ Database Rules

- SQLite is used
- must run in single-instance mode
- must use configurable path (Azure: /home/data/...)
- migrations must be idempotent
- seed must be idempotent

---

## 🚀 Azure Considerations

- designed for Azure App Service Linux
- single instance only
- no horizontal scaling assumptions
- scripts must target resource group:

rgCaixaDePerguntas

---

## 🎨 UI/UX Guidelines

- keep UI clean and simple
- prioritize usability over aesthetics
- avoid unnecessary complexity
- ensure good readability
- provide clear feedback (loading, success, error)

---

## 📦 Pull Request Process

Before opening a PR:

- ensure all tests pass
- ensure architecture is respected
- ensure no business logic leaked into wrong layers
- ensure README updated (if needed)
- ensure CHANGELOG updated

Then:

1. open PR
2. fill PR template completely
3. request review

---

## 🚫 Anti-Patterns (Do NOT do this)

- ❌ Business logic in UI
- ❌ Business logic in API routes
- ❌ Direct SQL outside repositories
- ❌ Skipping tests
- ❌ Skipping changelog
- ❌ Hardcoded config values
- ❌ Duplicate logic across layers
- ❌ Overengineering

---

## 🧠 When in Doubt

If unsure:

- choose the simplest correct solution
- preserve architecture
- ask for clarification instead of guessing
- do not introduce shortcuts

---

## 🏁 Definition of Done

A change is only complete if:

- code is implemented
- architecture is respected
- tests are updated and passing
- README is updated (if needed)
- CHANGELOG is updated
- security is considered
- edge cases are handled

---

## 🙌 Final Note

This project values **engineering discipline** even in a small scope.

Every contribution should improve:
- clarity
- consistency
- maintainability

Not just functionality.