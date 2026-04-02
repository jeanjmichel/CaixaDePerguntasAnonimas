# Changelog

Todas as alterações relevantes do projeto são documentadas neste arquivo.

## [0.10.0] - 2026-04-01

### Bootstrap Lazy (Non-Blocking)

#### Alterado
- **Bootstrap não-bloqueante** — `instrumentation.ts` dispara bootstrap em background sem `await`, permitindo que o servidor inicie imediatamente
- **`ensureBootstrap()`** — nova função exportada por `container.ts` que garante conclusão do bootstrap antes do acesso ao banco
- **Rotas DB-dependentes** aguardam bootstrap via `ensureBootstrap()` na primeira requisição
- **`/api/health`** permanece completamente isolado — zero imports, resposta instantânea
- **Guards `withAdminAuth` / `withAdminAuthNoPasswordCheck`** aguardam bootstrap automaticamente (cobre 11 rotas admin)
- **4 rotas auth admin** (`login`, `logout`, `me`, `change-password`) e **3 rotas públicas** (`avatars`, `meetings/open`, `questions`) aguardam bootstrap individualmente
- Falhas de bootstrap logam `[Bootstrap] Failed` sem `process.exit()`

## [0.9.1] - 2026-04-01

### Adicionado
- **Health check endpoint** — `GET /api/health` retorna `200 OK` (liveness probe para Azure App Service)

## [0.9.0] - 2026-04-01

### Bootstrap Idempotente da Aplicação

#### Adicionado
- **Application Bootstrap automático via `instrumentation.ts`**
  - Executa automaticamente ao iniciar o servidor (Next.js `register()` hook)
  - Cria diretório do banco, executa migrações, garante admin inicial
  - Idempotente e seguro para múltiplos restarts
  - Guard de execução única por processo (module-level promise)
- **Ports novos no domínio:**
  - `IMigrationRunner` — abstração para execução de migrações
  - `IBootstrapConfigProvider` + `SeedAdminConfig` — abstração para configuração de seed
- **Application Bootstrapper (`ApplicationBootstrapper`):**
  - Orquestrador de inicialização na camada de application
  - Usa exclusivamente ports (sem SQL direto)
  - Nunca loga senhas ou secrets
- **Infrastructure adapters:**
  - `SqliteMigrationRunner` — implementa `IMigrationRunner` delegando para `runMigrations()`
  - `EnvironmentBootstrapConfigProvider` — lê `SEED_ADMIN_USERNAME` (default: `'admin'`) e `SEED_ADMIN_PASSWORD` de `process.env`
- **Testes novos:**
  - Unit: 9 testes para `ApplicationBootstrapper` (mocked ports)
  - Integration: 7 testes para bootstrap end-to-end com SQLite `:memory:` + guard de execução única

#### Alterado
- **`container.ts`:** adicionada função `bootstrapApplication()` com guard de execução única; removido `runMigrations()` de `getContainer()` (bootstrap é o único ponto de inicialização)
- **README:** seção "Application Bootstrap" adicionada, "Como rodar localmente" atualizada (sem `npm run seed` obrigatório), seção de deploy atualizada
- **`seed.ts` e `scripts/seed.ts`:** marcados como dev-only (produção usa bootstrap)

## [0.8.0] - 2026-03-30

### Sprint 8 — Polish, Azure e Entrega

#### Corrigido
- **Bug crítico: JWT cookie não atualizado após troca de senha**
  - Após `changeOwnPassword`, a rota agora emite novo JWT com `mustChangePassword: false` e atualiza o cookie na resposta
  - Antes, o admin ficava preso com o token antigo e recebia 403 em todas as rotas protegidas
  - Referência: mesma lógica de cookie já usada na rota de login

#### Migrado
- **middleware.ts → proxy.ts** — Migração para a nova convenção do Next.js 16
  - Função renomeada de `middleware()` para `proxy()`
  - Eliminado warning de depreciação no build
  - Corrigido bug: redirecionamento de login ia para `/admin/dashboard` (inexistente) → agora redireciona para `/admin/meetings`

#### Adicionado
- **Scripts Azure (`scripts/azure/`):**
  - `provision.sh` — Provisiona Resource Group, App Service Plan (Linux B1), Web App (Node 20), variáveis de ambiente, startup command
  - `deploy.sh` — Build local, empacotamento zip, deploy via `az webapp deploy`, verificação
  - Resource Group: `rgCaixaDePerguntas` (conforme copilot-instructions.md §23)
- **README — Seções novas:**
  - Persistência SQLite no Azure (`/home/data/`)
  - Como publicar no Azure (provisionar + deploy + verificar + atualizar secrets)
  - Procedimento Operacional — Dia da Reunião (antes/durante/após + dicas)
  - Limitações Conhecidas (7 itens documentados)
  - Possíveis Melhorias Futuras (9 itens)
  - Atualização da seção Proxy (ex-Middleware)
- **1 teste novo:**
  - Integração: verifica que JWT emitido após troca de senha tem `mustChangePassword=false`

#### Atualizado
- README: seção Proxy atualizada, referências ao middleware removidas, Sprint 8 marcado como completo
- Total: 225 testes, 35 suítes

## [0.7.0] - 2026-03-30

### Sprint 7 — Gestão de Administradores

#### Adicionado
- **Use Cases (admin/):**
  - `ListAdminsUseCase` — lista todos os administradores como `AdminResponseDTO[]`
  - `CreateAdminUseCase` — cria novo admin com validação de username/password, verificação de unicidade, `mustChangePassword: true`
  - `ToggleAdminActiveUseCase` — alterna status ativo/inativo, proteção contra auto-modificação (`CANNOT_MODIFY_SELF`)
  - `ResetAdminPasswordUseCase` — redefine senha de outro admin, define `mustChangePassword: true`, proteção contra auto-modificação
- **API Routes admin (protegidas via `withAdminAuth`):**
  - `GET /api/admin/admins` — lista todos os administradores
  - `POST /api/admin/admins` — cria novo administrador (201, erros: INVALID_INPUT 400, USERNAME_ALREADY_EXISTS 409)
  - `POST /api/admin/admins/[id]/toggle-active` — alterna status ativo/inativo (erros: ADMIN_NOT_FOUND 404, CANNOT_MODIFY_SELF 403)
  - `POST /api/admin/admins/[id]/reset-password` — redefine senha (erros: INVALID_INPUT 400, ADMIN_NOT_FOUND 404, CANNOT_MODIFY_SELF 403)
- **Tela Admin:**
  - `src/app/admin/admins/page.tsx` — página de gestão de administradores com lista e criação
- **Componentes Admin:**
  - `AdminList` — lista de cards com badges de status (Ativo/Inativo), indicador `Deve trocar senha`, badge `Você` para admin logado, botões desabilitados para auto-modificação
  - `AdminForm` — formulário de criação com validação de username (3-50 chars) e password (mín. 8 chars)
- **Navegação:**
  - Link "Administradores" adicionado ao layout admin
- **36 testes novos:**
  - Unitários: ListAdmins (3), CreateAdmin (6), ToggleAdminActive (5), ResetAdminPassword (5)
  - Integração: AdminManagement (9) — fluxo completo: criar → listar → desativar → login falha → reativar → redefinir senha → login com nova senha
  - Componentes: AdminList (8) — renderização, badges, proteção self, callbacks
- **Total: 224 testes, 35 suítes**

#### Container
- 4 novos campos no `Container`: `listAdmins`, `createAdmin`, `toggleAdminActive`, `resetAdminPassword`
- Wiring espelhado em `createTestContainer`

## [0.6.0] - 2026-03-30

### Sprint 6 — Gestão de Perguntas (Admin)

#### Adicionado
- **DTO:**
  - `QuestionResponseDTO` — DTO admin com avatar resolvido (avatarDisplayName, avatarIcon), timestamps completos
- **Mapper:**
  - `questionMapper.ts` — `questionToDTO(question)` resolve avatar via `Avatar.findById()`, pattern idêntico ao `meetingMapper`
- **Use Cases (questions/):**
  - `ListQuestionsByStatusUseCase` — lista perguntas por meetingId + status, ordenação inteligente por status (Submitted: createdAt DESC, Selected: selectedAt ASC, Answered: answeredAt DESC, Discarded: updatedAt DESC)
  - `SelectQuestionUseCase` — Submitted → Selected via `question.transitionTo()`, traduz DomainError → ApplicationError(INVALID_TRANSITION)
  - `DiscardQuestionUseCase` — Submitted/Selected → Discarded, mesma tradução de erro
  - `AnswerQuestionUseCase` — Selected → Answered, mesma tradução de erro
- **API Routes admin (protegidas via `withAdminAuth`):**
  - `GET /api/admin/meetings/[id]/questions?status=Submitted` — lista perguntas por status
  - `POST /api/admin/questions/[id]/select` — seleciona pergunta
  - `POST /api/admin/questions/[id]/discard` — descarta pergunta
  - `POST /api/admin/questions/[id]/answer` — marca como respondida
- **Tela Admin:**
  - `src/app/admin/meetings/[id]/questions/page.tsx` — tabs por status (Submetidas/Selecionadas/Respondidas/Descartadas), botões de ação inline, link de volta para reuniões
- **Componentes Admin:**
  - `QuestionList` — lista de cards com mensagem de estado vazio por status
  - `QuestionCard` — card com avatar (icon + nome), texto, timestamp, botões de ação condicionais ao status
- **22 testes novos:**
  - Unitários: ListQuestionsByStatus (5), SelectQuestion (4), DiscardQuestion (4), AnswerQuestion (4)
  - Integração: QuestionUseCases full stack (5 cenários — fluxo completo Submit→Select→Answer, discard de Submitted e Selected, transições inválidas, múltiplas perguntas por reunião)

#### Modificado
- `MeetingList.tsx` — adicionado botão "Ver Perguntas" com link para `/admin/meetings/[id]/questions`
- `MeetingList.module.css` — estilo `.questionsLink` para o novo botão
- `container.ts` e `createTestContainer.ts` — 4 novos use cases: `listQuestionsByStatus`, `selectQuestion`, `discardQuestion`, `answerQuestion`

#### Totais
- **Testes:** 186 (164 existentes + 22 novos)
- **Suites:** 29 (26 server + 3 components)

## [0.5.0] - 2026-03-30

### Sprint 5 — Gestão de Reuniões (Admin)

#### Adicionado
- **DTOs:**
  - `CreateMeetingInput`, `UpdateMeetingInput` — inputs tipados para criação e edição de reuniões
  - `MeetingResponseDTO` expandido com campos opcionais admin: `openedAt`, `closedAt`, `createdAt`, `updatedAt`
- **Use Cases (meetings/):**
  - `CreateMeetingUseCase` — cria reunião fechada por padrão, valida título (≤200 chars) e data
  - `UpdateMeetingUseCase` — atualiza título e data, valida input, verifica existência
  - `ListMeetingsUseCase` — lista todas as reuniões (ordenadas por scheduledAt DESC)
  - `OpenMeetingForSubmissionsUseCase` — abre reunião para perguntas, **fecha automaticamente todas as outras** (regra: apenas uma aberta por vez)
  - `CloseMeetingForSubmissionsUseCase` — fecha reunião, **idempotente** (se já fechada, retorna sucesso)
  - `meetingMapper.ts` — helper compartilhado para mapear Meeting entity → MeetingResponseDTO
- **API Routes admin (protegidas via `withAdminAuth`):**
  - `GET /api/admin/meetings` — lista todas as reuniões
  - `POST /api/admin/meetings` — cria reunião (201)
  - `GET /api/admin/meetings/[id]` — retorna reunião por ID
  - `PUT /api/admin/meetings/[id]` — atualiza reunião
  - `POST /api/admin/meetings/[id]/open` — abre coleta de perguntas
  - `POST /api/admin/meetings/[id]/close` — fecha coleta de perguntas
- **Telas Admin:**
  - `src/app/admin/layout.tsx` — layout admin com barra de navegação
  - `src/app/admin/login/page.tsx` — formulário de login
  - `src/app/admin/change-password/page.tsx` — formulário de troca de senha obrigatória
  - `src/app/admin/meetings/page.tsx` — lista + CRUD de reuniões com abrir/fechar coleta
- **Componentes Admin:**
  - `LoginForm` — form username/senha com mensagem de erro contextual
  - `ChangePasswordForm` — form senha atual/nova/confirmar com validação client-side
  - `MeetingList` — cards de reuniões com badge "Aberta", botões editar e abrir/fechar
  - `MeetingForm` — formulário criar/editar reunião com datetime-local input
- **Hook `useAuth`** — verificação de autenticação via `/api/admin/auth/me`, redirect para login (401) ou change-password (mustChangePassword), logout
- **26 testes novos:**
  - Unitários: CreateMeeting (6), UpdateMeeting (4), ListMeetings (2), OpenMeetingForSubmissions (4), CloseMeetingForSubmissions (3)
  - Integração: MeetingUseCases full stack com SQLite :memory: (7 cenários — CRUD, abrir/fechar, idempotência, regra "uma aberta por vez")

#### Modificado
- `withAdminAuth` e `withAdminAuthNoPasswordCheck` — aceita e Forward `segmentData` como 3° parâmetro para suporte a rotas dinâmicas (`[id]`)
- `container.ts` e `createTestContainer.ts` — 5 novos use cases registrados: `createMeeting`, `updateMeeting`, `listMeetings`, `openMeetingForSubmissions`, `closeMeetingForSubmissions`

#### Totais
- **Testes:** 164 (138 existentes + 26 novos)
- **Suites:** 24 (21 server + 3 components)

## [0.4.0] - 2026-03-30

### Sprint 4 — Interface Pública

#### Adicionado
- **Layout global:** metadata atualizada (título, descrição, lang pt-BR), Geist Sans como fonte principal
- **CSS variables de tema:** cores primária, superfície, borda, sucesso, erro, dark mode via `prefers-color-scheme`
- **Componente `AvatarIcon`:** renderiza emoji do avatar em container circular com tamanhos sm/md/lg
- **Componente `AvatarSelector`:** grid 5×2 de avatares com seleção visual, `role="radiogroup"`, acessível
- **Componente `QuestionForm`:** textarea com contador de caracteres, debounce 1s no submit, mensagens de erro contextuais (rate limit com Retry-After, reunião fechada, input inválido)
- **Componente `SuccessMessage`:** feedback pós-envio com avatar escolhido, nota de anonimato, botão "enviar outra"
- **Hook `apiFetch`:** fetch wrapper tipado para formato `{ data }` / `{ error: { code, message } }` da API
- **Página pública (`page.tsx`):** client component com estados loading/no-meeting/form/success, fetch de reunião + avatares
- **Responsividade:** mobile-first (320px+), ajustes para desktop (640px+)
- **19 testes de componentes:** AvatarSelector (5), QuestionForm (9), SuccessMessage (5) com React Testing Library + jsdom

#### Configuração
- **Dependências dev:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom`
- **Jest:** migrado para `projects` com ambiente `node` (server) e `jsdom` (components), CSS Modules mockados

#### Totais
- **Testes:** 138 (119 existentes + 19 novos)
- **Suites:** 18 (15 server + 3 components)

## [0.3.0] - 2026-03-30

### Sprint 3 — Autenticação Admin

#### Adicionado
- **Port novo:**
  - `IJwtService` — interface no domain para operações JWT (sign, verify, cookie config), mantendo use cases desacoplados da lib jsonwebtoken
- **Infrastructure:**
  - `JwtAuthService` — implementa `IJwtService` usando `jsonwebtoken`. Cookie `auth_token` httpOnly, Secure (prod), SameSite=strict, expiração configurável via `JWT_EXPIRATION_HOURS`
- **DTOs:**
  - `LoginInput`, `LoginOutput`, `AdminResponseDTO`, `ChangePasswordInput`
- **Use Cases admin:**
  - `LoginUseCase` — autentica admin: valida input → busca por username → verifica isActive → compara senha → gera JWT. Mensagem genérica "Invalid credentials" em caso de falha (nunca revela se username existe)
  - `ChangeOwnPasswordUseCase` — troca senha: valida nova senha → verifica senha atual → hash nova → `admin.changePassword()` (seta mustChangePassword=false via domain entity) → persiste
  - `GetCurrentAdminUseCase` — retorna dados do admin logado sem `passwordHash`
- **Auth Guards (interface layer):**
  - `authGuard.ts` — extrai e verifica JWT do cookie, retorna `{ adminId, mustChangePassword }` ou null
  - `mustChangePasswordGuard.ts` — bloqueia rotas admin com 403 `PASSWORD_CHANGE_REQUIRED` se mustChangePassword=true, exceto change-password/me/logout
  - `withAdminAuth.ts` — wrapper HOF para route handlers admin com auth + mustChangePassword check integrados
- **API Routes admin:**
  - `POST /api/admin/auth/login` — autenticação, retorna admin DTO + seta cookie httpOnly
  - `POST /api/admin/auth/logout` — limpa cookie, requer autenticação
  - `POST /api/admin/auth/change-password` — troca de senha, exempt do mustChangePassword guard
  - `GET /api/admin/auth/me` — dados do admin logado, exempt do mustChangePassword guard
- **Root Middleware:**
  - `src/middleware.ts` — redireciona `/admin/*` para `/admin/login` se não autenticado; redireciona `/admin/login` para `/admin/dashboard` se já autenticado
- **Container:**
  - `jwtService`, `login`, `changeOwnPassword`, `getCurrentAdmin` registrados no composition root
- **Testes:**
  - Unitários: `LoginUseCase` (6 cenários — sucesso, username não encontrado, senha errada, admin inativo, username vazio, senha vazia), `ChangeOwnPasswordUseCase` (5 cenários — sucesso, senha antiga errada, admin não encontrado, senha nova curta, senha nova longa), `GetCurrentAdminUseCase` (2 cenários), `JwtAuthService` (6 cenários — sign, verify válido/inválido/expirado/secret diferente, cookie config)
  - Integração: Auth full stack com SQLite :memory: (6 cenários — login, login errado, change password, re-login nova senha, re-login senha antiga falha, admin sem passwordHash)
- Documentação de autenticação e API admin no README

---

## [0.2.0] - 2026-03-30

### Sprint 2 — Use Cases Públicos + API Pública

#### Adicionado
- **DTOs (contracts de fronteira):**
  - `SubmitQuestionInput`, `SubmitQuestionOutput`, `MeetingResponseDTO`, `AvatarResponseDTO`
- **Use Cases públicos:**
  - `GetOpenMeetingUseCase` — retorna reunião aberta ou null (DTO serializado)
  - `ListAvatarsUseCase` — retorna os 10 avatares como DTOs
  - `SubmitQuestionUseCase` — fluxo completo: validação → verificação de reunião aberta → rate limiting → sanitização → atribuição de avatar → persistência. Erros tipados: `INVALID_INPUT`, `MEETING_NOT_FOUND`, `MEETING_CLOSED`, `RATE_LIMITED`
- **API Routes públicas:**
  - `GET /api/meetings/open` — retorna reunião aberta para submissão
  - `GET /api/avatars` — retorna lista de avatares disponíveis
  - `POST /api/questions` — submissão anônima de pergunta com rate limiting e sanitização
- **Infrastructure:**
  - `hashIp()` — utility SHA-256 para hash de IP do cliente (nunca armazena IP raw)
- **Container:**
  - Use cases `getOpenMeeting`, `listAvatars`, `submitQuestion` registrados no composition root
- **Testes:**
  - Unitários use cases: `GetOpenMeeting` (2 cenários), `ListAvatars` (2 cenários), `SubmitQuestion` (11 cenários — sucesso, auto-assign avatar, texto vazio, texto curto, texto longo, avatar inválido, reunião inexistente, reunião fechada, rate limited, sanitização, ipHash)
  - Integração use cases: `SubmitQuestion` + `GetOpenMeeting` full stack com SQLite :memory: (8 cenários — persistência, sanitização, reunião fechada, reunião inexistente, rate limiting, IPs distintos)
- Documentação de API pública no README

---

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
