# Caixa de Perguntas Anônimas

Sistema web para coleta anônima de perguntas em reuniões mensais da prática de Modern Workplace. Participantes enviam perguntas de forma anônima, cada uma associada a um avatar de animal da fauna brasileira. Administradores gerenciam reuniões, selecionam e respondem perguntas.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Banco de dados:** SQLite (via better-sqlite3)
- **Autenticação:** JWT em cookie httpOnly
- **Sanitização:** xss
- **Hash de senhas:** bcryptjs
- **Deploy:** Azure App Service Linux

## Arquitetura

Arquitetura hexagonal simples com separação clara em 4 camadas:

```
src/
├── domain/           # Entidades, Enums, Errors, Ports (interfaces)
├── application/      # Use Cases, Validação de Input, DTOs, Errors
├── infrastructure/   # Adapters: SQLite repos, auth, rate limiting, sanitization
└── interface/        # Next.js: pages, API routes, React components
```

**Fluxo:** Interface → Application (Use Cases) → Domain ← Infrastructure (Adapters)

- **Domain** não depende de nada externo. Contém regras de negócio puras.
- **Application** depende apenas de Domain. Orquestra use cases e validação.
- **Infrastructure** implementa os ports do Domain. Nunca chamada pela Interface diretamente.
- **Interface** chama Application via Use Cases injetados pelo container.

### Decisões Arquiteturais

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | App Router (Next.js) | Padrão moderno do Next.js |
| 2 | better-sqlite3 | Síncrono, simples, sem ORM, adequado para single-instance |
| 3 | JWT em httpOnly cookie | Seguro, sem localStorage |
| 4 | DI manual (container.ts) | Simplicidade, sem framework DI |
| 5 | CSS Modules | Sem dependência extra |
| 6 | Rate limiting in-memory | Adequado para single-instance Azure |
| 7 | IRateLimiter como port | Abstração permite trocar implementação |
| 8 | IP hash SHA-256 | Não armazena IP raw |
| 9 | bcryptjs | Pure JS, sem problemas de native build |
| 10 | UUID v4 | IDs de entidades |
| 11 | ISanitizer port | Sanitização abstraída |
| 12 | Question.transitionTo() | Transições de status centralizadas no domínio |
| 13 | openedAt/closedAt em Meeting | Auditoria operacional |
| 14 | Seed idempotente | Verifica existência antes de criar |
| 15 | SQLite path persistente | /home/data/ no Azure |
| 16 | InputValidator separado | Validação ≠ sanitização ≠ renderização |
| 17 | Ações idempotentes | Select/Discard/Answer não falham se estado já é o alvo |
| 18 | Avatar estruturado | `{ id, displayName, icon }`, armazena apenas id no banco |
| 19 | Ordenação no repository | Submitted por createdAt DESC, Selected por selectedAt ASC |
| 20 | Nenhum SQL fora de repositories | Reforço arquitetural |
| 21 | Nenhuma regra de negócio na UI/rotas | Toda lógica em use cases e domínio |

## Estrutura de Pastas

```
src/
├── domain/
│   ├── entities/          # Meeting, Question, Admin
│   ├── enums/             # QuestionStatus, Avatar
│   ├── errors/            # DomainError
│   └── ports/             # IMeetingRepository, IQuestionRepository, IAdminRepository,
│                          # IPasswordHasher, IIdGenerator, IRateLimiter, ISanitizer
├── application/
│   ├── use-cases/         # Organized by: public/, questions/, meetings/, admin/
│   ├── validation/        # InputValidator
│   ├── dtos/              # Request/Response DTOs
│   └── errors/            # ApplicationError
├── infrastructure/
│   ├── database/          # connection, migrations, seed
│   ├── repositories/      # SqliteMeetingRepository, SqliteQuestionRepository, SqliteAdminRepository
│   ├── security/          # BcryptPasswordHasher, InMemoryRateLimiter, XssSanitizer
│   ├── auth/              # JwtAuthService
│   ├── id/                # UuidGenerator
│   └── container.ts       # Composition root (DI wiring)
└── interface/
    ├── app/               # Next.js App Router (pages + API routes)
    ├── components/        # React components (public/, admin/, shared/)
    ├── middleware/         # Auth guards
    └── hooks/             # Custom React hooks

tests/
├── unit/domain/           # Entidades e enums
├── unit/use-cases/        # Use cases com mocks
├── integration/repositories/  # Repos com SQLite :memory:
├── integration/api/       # Rotas API críticas
└── helpers/               # Test container, factories

scripts/
├── seed.ts                # Seed script
└── azure/                 # provision.sh, deploy.sh
```

## Requisitos

- Node.js 18+
- npm 9+

## Como clonar

```bash
git clone <repo-url>
cd CaixaDePerguntasAnonimas
```

## Como instalar

```bash
npm install
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição | Default |
|----------|-----------|---------|
| `DATABASE_PATH` | Caminho do arquivo SQLite | `./data/caixa.db` |
| `JWT_SECRET` | Segredo para geração de JWT | (obrigatório em prod) |
| `JWT_EXPIRATION_HOURS` | Tempo de expiração do token | `8` |
| `SEED_ADMIN_USERNAME` | Username do admin inicial | `admin` |
| `SEED_ADMIN_PASSWORD` | Senha do admin inicial | (obrigatório para seed) |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests por janela/IP | `5` |
| `QUESTION_MIN_LENGTH` | Tamanho mínimo da pergunta | `5` |
| `QUESTION_MAX_LENGTH` | Tamanho máximo da pergunta | `500` |

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis
cp .env.example .env.local
# Editar .env.local com valores desejados

# 3. Executar seed (cria banco + admin inicial)
npm run seed

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:3000`.

## Como rodar seed

```bash
npm run seed
```

O seed é **idempotente**: pode ser executado múltiplas vezes sem duplicar dados. Se o admin já existir, o seed é ignorado com log informativo.

## Como executar testes

```bash
# Rodar todos os testes
npm test

# Rodar com coverage
npm run test:coverage
```

Os testes de integração usam SQLite `:memory:` para isolamento e velocidade.

## Rate Limiting

O sistema implementa rate limiting in-memory para submissão de perguntas:

- Sliding window por IP hash (SHA-256)
- Configurável via `RATE_LIMIT_WINDOW_MS` e `RATE_LIMIT_MAX_REQUESTS`
- Abstrato via interface `IRateLimiter`

**Limitações:**
- Dados resetam quando a aplicação reinicia
- Não compartilhado entre instâncias (adequado para single-instance)
- Mitigação leve contra abuso, não proteção robusta contra DDoS
- Aceitável para o cenário de reuniões com dezenas de participantes

## SQLite e Azure

- **Local:** banco em `./data/caixa.db` (criado automaticamente)
- **Azure:** usar `DATABASE_PATH=/home/data/caixa.db` (path persistente no Azure App Service Linux)
- O diretório é criado automaticamente se não existir
- SQLite é adequado para single-instance; não recomendado para multi-instance

## Como publicar no Azure

Scripts em `scripts/azure/`:

```bash
# 1. Provisionar recursos
bash scripts/azure/provision.sh

# 2. Deploy
bash scripts/azure/deploy.sh
```

> **Nota:** Ajuste subscription ID e outros parâmetros nos scripts antes de executar.

## Status do Projeto

- [x] Sprint 1 — Fundação, Domain e Infraestrutura
- [ ] Sprint 2 — Use Cases + API Pública
- [ ] Sprint 3 — Autenticação Admin
- [ ] Sprint 4 — Interface Pública
- [ ] Sprint 5 — Gestão de Reuniões (Admin)
- [ ] Sprint 6 — Gestão de Perguntas (Admin)
- [ ] Sprint 7 — Gestão de Administradores
- [ ] Sprint 8 — Polish, Azure e Entrega
