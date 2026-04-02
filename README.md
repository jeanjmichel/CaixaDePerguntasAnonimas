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
│                          # IPasswordHasher, IIdGenerator, IRateLimiter, ISanitizer,
│                          # IMigrationRunner, IBootstrapConfigProvider
├── application/
│   ├── bootstrap/         # ApplicationBootstrapper
│   ├── use-cases/         # Organized by: public/, questions/, meetings/, admin/
│   ├── validation/        # InputValidator
│   ├── dtos/              # Request/Response DTOs
│   └── errors/            # ApplicationError
├── infrastructure/
│   ├── bootstrap/         # SqliteMigrationRunner, EnvironmentBootstrapConfigProvider
│   ├── database/          # connection, migrations, seed (dev-only)
│   ├── repositories/      # SqliteMeetingRepository, SqliteQuestionRepository, SqliteAdminRepository
│   ├── security/          # BcryptPasswordHasher, InMemoryRateLimiter, XssSanitizer
│   ├── auth/              # JwtAuthService
│   ├── id/                # UuidGenerator
│   └── container.ts       # Composition root (DI wiring + bootstrapApplication)
└── interface/
    ├── app/               # Next.js App Router (pages + API routes)
    ├── components/        # React components (public/, admin/, shared/)
    ├── middleware/         # Auth guards (withAdminAuth)
    └── hooks/             # Custom React hooks

tests/
├── unit/domain/           # Entidades e enums
├── unit/use-cases/        # Use cases com mocks
├── unit/bootstrap/        # ApplicationBootstrapper com mocks
├── integration/repositories/  # Repos com SQLite :memory:
├── integration/bootstrap/ # Bootstrap end-to-end com SQLite :memory:
├── integration/api/       # Rotas API críticas
└── helpers/               # Test container, factories

scripts/
├── seed.ts                # Seed script (local dev only)
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

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:3000`.

Ao iniciar, o **bootstrap automático** (`instrumentation.ts`) executa migrações e cria o admin inicial usando `SEED_ADMIN_USERNAME` e `SEED_ADMIN_PASSWORD` do `.env.local`. Não é necessário rodar `npm run seed` manualmente.

## Application Bootstrap

O sistema possui um mecanismo de bootstrap idempotente e **não-bloqueante** que executa automaticamente ao iniciar o servidor (via `src/instrumentation.ts` → Next.js `register()` hook).

### O que o bootstrap faz

1. Cria o diretório pai do banco de dados se não existir
2. Abre a conexão com o SQLite
3. Executa migrações (idempotentes — `CREATE TABLE IF NOT EXISTS`)
4. Verifica se o admin inicial existe:
   - Se `SEED_ADMIN_PASSWORD` não está definida → pula criação com log informativo
   - Se o admin já existe → não faz nada (nunca sobrescreve senha existente)
   - Se o admin não existe → cria com `isActive=true`, `mustChangePassword=true`

### Comportamento lazy (non-blocking)

O bootstrap é disparado em background durante o `register()` do Next.js, **sem bloquear** a inicialização do servidor. Isso garante que:

- **`/api/health`** responde `200 OK` imediatamente, mesmo antes do bootstrap completar
- O Azure App Service health check nunca mata o container por timeout de startup
- Rotas que dependem do banco (todas exceto `/api/health`) aguardam a conclusão do bootstrap na primeira requisição via `ensureBootstrap()`
- Após a primeira requisição, `ensureBootstrap()` resolve instantaneamente (promise já resolvida)

### Garantias

- **Idempotente**: seguro para executar em cada restart da aplicação
- **Execução única**: guard por promise garante uma única execução por processo
- **Non-blocking**: servidor inicia imediatamente, bootstrap roda em background
- **Sem mutação**: nunca altera dados existentes (admins, reuniões, perguntas)
- **Sem secrets em logs**: senhas nunca são logadas
- **Sem `process.exit()`**: falhas são logadas, não terminam o processo

### Logs de bootstrap

```
[Bootstrap] Started
[Bootstrap] Migrations completed
[Bootstrap] Seed admin created          # ou "already exists" ou "Skipped: missing seed password"
[Bootstrap] Completed
```

### Variáveis de ambiente

| Variável | Descrição | Default |
|----------|-----------|--------|
| `SEED_ADMIN_USERNAME` | Username do admin inicial | `admin` |
| `SEED_ADMIN_PASSWORD` | Senha do admin inicial | (bootstrap pula se ausente) |

## Como rodar seed (local dev only)

```bash
npm run seed
```

O script `scripts/seed.ts` é mantido apenas para **conveniência em desenvolvimento local** (ex.: reset do banco). Em produção, o bootstrap automático é o mecanismo primário. O seed é **idempotente**: pode ser executado múltiplas vezes sem duplicar dados.

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

## API Pública

### `GET /api/health`

Health check endpoint (liveness probe). Público, sem autenticação.

**Resposta (200):** `OK` (text/plain)

### `GET /api/meetings/open`

Retorna a reunião atualmente aberta para submissão de perguntas.

**Resposta (200):**
```json
{ "data": { "id": "...", "title": "Townhall Março", "scheduledAt": "2026-03-30T14:00:00.000Z", "isOpenForSubmissions": true } }
```

Se nenhuma reunião estiver aberta: `{ "data": null }`

### `GET /api/avatars`

Retorna a lista de avatares disponíveis.

**Resposta (200):**
```json
{ "data": [{ "id": "CAPIVARA", "displayName": "Capivara", "icon": "🦫" }, ...] }
```

### `POST /api/questions`

Submete uma pergunta anônima.

**Body:**
```json
{ "meetingId": "...", "text": "Qual o plano para Q2?", "avatarId": "CAPIVARA" }
```

- `avatarId` é opcional — se omitido, um avatar aleatório é atribuído.
- `text` deve ter entre 5 e 500 caracteres.

**Resposta (201):**
```json
{ "data": { "id": "...", "meetingId": "...", "avatarId": "CAPIVARA", "text": "...", "status": "Submitted", "createdAt": "..." } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-------------------------------------------|
| 400 | `INVALID_INPUT` | Texto vazio, curto, longo ou avatar inválido |
| 404 | `MEETING_NOT_FOUND` | Reunião não encontrada |
| 409 | `MEETING_CLOSED` | Reunião não está aberta para submissões |
| 429 | `RATE_LIMITED` | Limite de submissões excedido (header `Retry-After`) |

Formato de erro: `{ "error": { "code": "...", "message": "..." } }`

## API Admin (Autenticação)

A autenticação admin usa JWT armazenado em cookie httpOnly (`auth_token`). O cookie é `Secure` em produção, `SameSite=Strict`, com `Path=/`.

### Fluxo de autenticação

1. Admin faz `POST /api/admin/auth/login` com username e senha
2. Servidor valida credenciais e retorna JWT em cookie httpOnly
3. Todas as rotas `/api/admin/*` (exceto login) exigem o cookie
4. Se `mustChangePassword` é `true`, o admin é bloqueado de todas as rotas admin exceto: `/api/admin/auth/change-password`, `/api/admin/auth/me` e `/api/admin/auth/logout`
5. Após trocar a senha, `mustChangePassword` é definido como `false` automaticamente

### `POST /api/admin/auth/login`

Autentica um administrador e define cookie JWT.

**Body:**
```json
{ "username": "admin", "password": "senha123" }
```

**Resposta (200):**
```json
{
  "data": {
    "mustChangePassword": true,
    "admin": { "id": "...", "username": "admin", "mustChangePassword": true, "isActive": true, "createdAt": "..." }
  }
}
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 400 | `INVALID_INPUT` | Username ou password vazio/inválido |
| 401 | `INVALID_CREDENTIALS` | Credenciais inválidas (msg genérica, sem revelar se username existe) |

### `POST /api/admin/auth/logout`

Encerra a sessão limpando o cookie. Requer autenticação.

**Resposta (200):**
```json
{ "data": { "message": "Logged out successfully" } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 401 | `UNAUTHORIZED` | Não autenticado |

### `POST /api/admin/auth/change-password`

Altera a senha do admin autenticado. Requer autenticação, mas é isenta da verificação de `mustChangePassword`.

**Body:**
```json
{ "oldPassword": "senhaAtual", "newPassword": "novaSenha123" }
```

**Resposta (200):**
```json
{ "data": { "message": "Password changed successfully" } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 400 | `INVALID_INPUT` | Senha nova inválida (< 6 chars) |
| 400 | `INVALID_CURRENT_PASSWORD` | Senha atual incorreta |
| 401 | `UNAUTHORIZED` | Não autenticado |

### `GET /api/admin/auth/me`

Retorna dados do admin autenticado (sem passwordHash). Requer autenticação, isenta de `mustChangePassword`.

**Resposta (200):**
```json
{
  "data": { "id": "...", "username": "admin", "mustChangePassword": false, "isActive": true, "createdAt": "..." }
}
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 401 | `UNAUTHORIZED` | Não autenticado |
| 404 | `ADMIN_NOT_FOUND` | Admin não encontrado no banco |

### Proxy de página

O proxy Next.js (`src/proxy.ts`) protege rotas `/admin/*`:
- Sem cookie → redireciona para `/admin/login`
- Em `/admin/login` com cookie válido → redireciona para `/admin/meetings`

## API Admin (Reuniões)

Todas as rotas de reuniões requerem autenticação admin (cookie JWT) e passam pela verificação de `mustChangePassword`.

### `GET /api/admin/meetings`

Lista todas as reuniões, ordenadas por data (mais recente primeiro).

**Resposta (200):**
```json
{
  "data": [
    { "id": "...", "title": "Sprint Planning", "scheduledAt": "2026-04-01T14:00:00.000Z", "isOpenForSubmissions": false, "openedAt": null, "closedAt": null, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

### `POST /api/admin/meetings`

Cria uma nova reunião (fechada para submissões por padrão).

**Body:**
```json
{ "title": "Townhall Abril", "scheduledAt": "2026-04-15T14:00:00.000Z" }
```

**Resposta (201):**
```json
{ "data": { "id": "...", "title": "Townhall Abril", "scheduledAt": "...", "isOpenForSubmissions": false, ... } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 400 | `INVALID_INPUT` | Título vazio/longo ou data inválida |

### `GET /api/admin/meetings/[id]`

Retorna uma reunião específica por ID.

**Resposta (200):**
```json
{ "data": { "id": "...", "title": "...", ... } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 404 | `MEETING_NOT_FOUND` | Reunião não encontrada |

### `PUT /api/admin/meetings/[id]`

Atualiza título e data de uma reunião.

**Body:**
```json
{ "title": "Título Atualizado", "scheduledAt": "2026-04-20T14:00:00.000Z" }
```

**Resposta (200):**
```json
{ "data": { "id": "...", "title": "Título Atualizado", ... } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 400 | `INVALID_INPUT` | Título vazio/longo ou data inválida |
| 404 | `MEETING_NOT_FOUND` | Reunião não encontrada |

### `POST /api/admin/meetings/[id]/open`

Abre uma reunião para receber perguntas. **Fecha automaticamente qualquer outra reunião que esteja aberta** (regra: apenas uma reunião aberta por vez).

**Resposta (200):**
```json
{ "data": { "id": "...", "isOpenForSubmissions": true, "openedAt": "...", ... } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 404 | `MEETING_NOT_FOUND` | Reunião não encontrada |

### `POST /api/admin/meetings/[id]/close`

Fecha uma reunião para submissões. **Idempotente**: se já estiver fechada, retorna sucesso sem erro.

**Resposta (200):**
```json
{ "data": { "id": "...", "isOpenForSubmissions": false, "closedAt": "...", ... } }
```

**Erros:**

| Código HTTP | Código | Descrição |
|-------------|--------|-----------|
| 404 | `MEETING_NOT_FOUND` | Reunião não encontrada |

### Telas Admin

- **`/admin/login`** — Formulário de login (username/senha)
- **`/admin/change-password`** — Troca de senha obrigatória (no primeiro acesso)
- **`/admin/meetings`** — Lista de reuniões com ações: criar, editar, abrir/fechar coleta
- **`/admin/meetings/[id]/questions`** — Gestão de perguntas por reunião: tabs por status, selecionar, descartar, marcar respondida

## API Admin (Perguntas)

Todas as rotas de perguntas requerem autenticação admin (cookie JWT).

### `GET /api/admin/meetings/[id]/questions?status=Submitted`

Lista perguntas de uma reunião filtradas por status.

**Query params:**
- `status` — `Submitted` (default), `Selected`, `Answered`, `Discarded`

**Resposta (200):**
```json
{
  "data": [
    { "id": "...", "meetingId": "...", "avatarId": "CAPIVARA", "avatarDisplayName": "Capivara", "avatarIcon": "🦫", "text": "...", "status": "Submitted", "createdAt": "...", "updatedAt": "...", "selectedAt": null, "answeredAt": null }
  ]
}
```

### `POST /api/admin/questions/[id]/select`

Seleciona uma pergunta (Submitted → Selected).

**Resposta (200):**
```json
{ "data": { "id": "...", "status": "Selected", "selectedAt": "...", ... } }
```

### `POST /api/admin/questions/[id]/discard`

Descarta uma pergunta (Submitted → Discarded ou Selected → Discarded).

**Resposta (200):**
```json
{ "data": { "id": "...", "status": "Discarded", ... } }
```

### `POST /api/admin/questions/[id]/answer`

Marca uma pergunta como respondida (Selected → Answered).

**Resposta (200):**
```json
{ "data": { "id": "...", "status": "Answered", "answeredAt": "...", ... } }
```

### Erros de transição

| Código HTTP | Código | Descrição |
|-------------|--------|-------------------------------------------|
| 404 | `QUESTION_NOT_FOUND` | Pergunta não encontrada |
| 409 | `INVALID_TRANSITION` | Transição de status inválida (ex: Submitted → Answered, Discarded → Selected) |

## API Admin (Administradores)

Todas as rotas exigem autenticação via cookie `auth_token` (`withAdminAuth`).

### `GET /api/admin/admins`

Lista todos os administradores.

**Resposta (200):**
```json
{ "data": [{ "id": "...", "username": "admin", "mustChangePassword": false, "isActive": true, "createdAt": "..." }] }
```

### `POST /api/admin/admins`

Cria um novo administrador.

**Body:**
```json
{ "username": "novoadmin", "password": "senhasegura" }
```

**Resposta (201):**
```json
{ "data": { "id": "...", "username": "novoadmin", "mustChangePassword": true, "isActive": true, "createdAt": "..." } }
```

| Código HTTP | Código | Descrição |
|-------------|--------|-------------------------------------------|
| 400 | `INVALID_INPUT` | Username ou senha inválidos |
| 409 | `USERNAME_ALREADY_EXISTS` | Username já em uso |

### `POST /api/admin/admins/[id]/toggle-active`

Alterna o status ativo/inativo de um administrador. Não permite alterar o próprio status.

**Resposta (200):**
```json
{ "data": { "id": "...", "username": "...", "isActive": false, ... } }
```

| Código HTTP | Código | Descrição |
|-------------|--------|-------------------------------------------|
| 403 | `CANNOT_MODIFY_SELF` | Tentativa de modificar a si mesmo |
| 404 | `ADMIN_NOT_FOUND` | Administrador não encontrado |

### `POST /api/admin/admins/[id]/reset-password`

Redefine a senha de outro administrador. Define `mustChangePassword: true`.

**Body:**
```json
{ "newPassword": "novasenha123" }
```

**Resposta (200):**
```json
{ "data": { "message": "Password reset successfully" } }
```

| Código HTTP | Código | Descrição |
|-------------|--------|-------------------------------------------|
| 400 | `INVALID_INPUT` | Senha inválida (mín. 8 caracteres) |
| 403 | `CANNOT_MODIFY_SELF` | Tentativa de modificar a si mesmo |
| 404 | `ADMIN_NOT_FOUND` | Administrador não encontrado |

## SQLite e Azure

- **Local:** banco em `./data/caixa.db` (criado automaticamente)
- **Azure:** usar `DATABASE_PATH=/home/data/caixa.db` (path persistente no Azure App Service Linux)
- O diretório é criado automaticamente se não existir
- SQLite é adequado para single-instance; não recomendado para multi-instance

### Persistência no Azure

O Azure App Service Linux persiste o diretório `/home/` entre restarts e deploys. O banco é armazenado em `/home/data/caixa.db` para garantir que dados sobrevivam a reinicializações.

**Importante:** SQLite não suporta múltiplas instâncias simultâneas. O App Service deve estar configurado com **1 instância** (sem auto-scaling horizontal).

## Como publicar no Azure

### Pré-requisitos

- Azure CLI instalado e logado (`az login`)
- Subscription ativa

### 1. Provisionar recursos

Edite as variáveis no script e execute:

```bash
bash scripts/azure/provision.sh
```

O script cria:
- Resource Group: `rgCaixaDePerguntas`
- App Service Plan: Linux, B1
- Web App: Node.js 20
- Variáveis de ambiente configuradas (incluindo `SEED_ADMIN_USERNAME` e `SEED_ADMIN_PASSWORD` para bootstrap)
- Startup command: `mkdir -p /home/data && npm run start`

**Nota:** O admin inicial é criado automaticamente pelo bootstrap da aplicação ao iniciar. Não é necessário executar `npm run seed` em produção.

**Após provisionar, atualize os valores de produção:**

```bash
# Gerar JWT_SECRET seguro:
openssl rand -base64 64

# Atualizar variáveis sensíveis:
az webapp config appsettings set \
  --name app-caixa-de-perguntas \
  --resource-group rgCaixaDePerguntas \
  --settings \
    JWT_SECRET="<valor-gerado>" \
    SEED_ADMIN_PASSWORD="<senha-forte>"
```

### 2. Deploy

```bash
bash scripts/azure/deploy.sh
```

O script:
1. Instala dependências de produção
2. Faz build da aplicação
3. Empacota em zip
4. Faz deploy via `az webapp deploy`

### 3. Verificar

```bash
# Ver logs em tempo real:
az webapp log tail --name app-caixa-de-perguntas --resource-group rgCaixaDePerguntas
```

A aplicação estará disponível em `https://app-caixa-de-perguntas.azurewebsites.net`.

## Procedimento Operacional — Dia da Reunião

Passo a passo para usar o sistema durante uma reunião:

### Antes da reunião

1. Acessar `/admin/login` e fazer login
2. Ir em **Reuniões** e criar uma nova reunião com título e data
3. Clicar em **Abrir Coleta** na reunião criada
4. Compartilhar a URL pública (`/`) com os participantes

### Durante a reunião

1. Manter o painel admin aberto em `/admin/meetings/{id}/questions`
2. Usar a aba **Submetidas** para ver perguntas chegando
3. Clicar em **Selecionar** nas perguntas que serão respondidas
4. Usar a aba **Selecionadas** como fila de perguntas para responder
5. Clicar em **Marcar como Respondida** após responder cada pergunta
6. Perguntas irrelevantes podem ser **Descartadas**

### Após a reunião

1. Clicar em **Fechar Coleta** na reunião
2. Participantes verão que a coleta foi encerrada
3. As perguntas ficam registradas para consulta futura

### Dicas

- A aba **Selecionadas** funciona como uma fila ordenada por tempo de seleção
- Apenas uma reunião pode estar aberta por vez
- O rate limiting protege contra spam (5 perguntas/minuto por IP)

## Limitações Conhecidas

| Limitação | Motivo | Impacto |
|-----------|--------|--------|
| Single-instance SQLite | Sem suporte a escritas concorrentes | Não escalar horizontalmente |
| Rate limiting in-memory | Reseta quando a app reinicia | Proteção temporariamente perdida após restart |
| Sem atualizações em tempo real | Polling manual no admin | Admin precisa atualizar a página para ver novas perguntas |
| Sem edição de pergunta | Regra de negócio: pergunta é imutável após envio | Participante deve enviar nova pergunta |
| Sem anexos | Fora do escopo | Apenas texto |
| Sem multi-idioma | Apenas pt-BR | Interface fixa em português |
| Sem busca de perguntas | Não implementado | Usar as abas por status para filtrar |

## Possíveis Melhorias Futuras

- **WebSocket/SSE** — Atualizações em tempo real no painel admin (feed de perguntas)
- **PostgreSQL** — Substituir SQLite para suporte a múltiplas instâncias
- **Exportação CSV** — Exportar perguntas de uma reunião para análise
- **Estatísticas** — Dashboard com métricas (total de perguntas, taxa de resposta, etc.)
- **Busca e filtros** — Pesquisar perguntas por texto ou avatar
- **Avatares customizáveis** — Permitir upload de ícones/imagens
- **Notificações sonoras** — Alerta no admin quando nova pergunta chegar
- **Temas** — Suporte a temas visuais além de light/dark
- **Histórico de reuniões** — Visualização pública de perguntas de reuniões passadas

## Status do Projeto

- [x] Sprint 1 — Fundação, Domain e Infraestrutura
- [x] Sprint 2 — Use Cases Públicos + API Pública
- [x] Sprint 3 — Autenticação Admin
- [x] Sprint 4 — Interface Pública
- [x] Sprint 5 — Gestão de Reuniões (Admin)
- [x] Sprint 6 — Gestão de Perguntas (Admin)
- [x] Sprint 7 — Gestão de Administradores
- [x] Sprint 8 — Polish, Azure e Entrega
