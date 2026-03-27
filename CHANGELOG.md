# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [0.1.0] - 2026-03-27

### Sprint 1 — Fundação, Domain e Infraestrutura

#### Adicionado
- Inicialização do projeto Next.js 16 com TypeScript (App Router, strict mode)
- Dependências: `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `uuid`, `xss`
- **Domain layer completo:**
  - Entidades: `Meeting` (com open/close/updateDetails), `Question` (com `transitionTo()` centralizando transições de status), `Admin` (com changePassword/toggleActive)
  - Enums: `QuestionStatus` (Submitted, Selected, Discarded, Answered) com validação de transições, `Avatar` (10 avatares da fauna brasileira como value object estruturado com id/displayName/icon)
  - Errors: `DomainError`
  - Ports: `IMeetingRepository`, `IQuestionRepository` (com orderBy), `IAdminRepository`, `IPasswordHasher`, `IIdGenerator`, `IRateLimiter`, `ISanitizer`
- **Application layer:**
  - `InputValidator` com validação de texto (min 5, max 500 chars), título, data, username, password
  - `ApplicationError` com código estruturado
- **Infrastructure layer:**
  - Database: connection (com mkdir recursive para path configurável), migrations (CREATE TABLE IF NOT EXISTS), seed (idempotente)
  - Repositories SQLite: `SqliteMeetingRepository`, `SqliteQuestionRepository` (com ordenação configurável), `SqliteAdminRepository`
  - Security: `BcryptPasswordHasher`, `InMemoryRateLimiter` (sliding window), `XssSanitizer`
  - ID: `UuidGenerator`
  - Composition root: `container.ts` (singleton lazy, DI manual)
- **Testes:**
  - Unitários domain: Question (transições válidas/inválidas/idempotentes — 16 cenários), Avatar (getAll/findById/isValid/random), Meeting (open/close/updateDetails)
  - Integração repositories: SqliteMeetingRepository, SqliteQuestionRepository, SqliteAdminRepository (SQLite :memory:)
  - Helpers: `createTestContainer`, factories
- Configuração Jest com suporte a path aliases
- `.env.example` com todas as variáveis documentadas
- `.env.local` para desenvolvimento
- Script `npm run seed` (ts-node + tsconfig-paths)
- README.md completo com arquitetura, estrutura, setup, decisões
- CHANGELOG.md
