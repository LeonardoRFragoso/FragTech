# FragTech - FASE 4: Infraestrutura Financeira Real

## Visão Geral

A Fase 4 implementa a infraestrutura necessária para a FragTech operar como uma fintech B2C real no Brasil, incluindo:

- **PIX**: Chaves, transferências, recebimentos, webhooks
- **Open Finance**: Consentimentos, conexões, sincronização de dados
- **Motor Antifraude**: Scoring, regras, alertas
- **Compliance & LGPD**: Consentimentos, auditoria, retenção de dados
- **Segurança Avançada**: MFA, rate limiting, criptografia
- **Observabilidade**: Logs estruturados, métricas, alertas

---

## Arquitetura de Módulos

```
backend/src/
├── pix/                          # Módulo PIX
│   ├── pix.module.ts
│   ├── pix.controller.ts
│   ├── pix.service.ts
│   ├── dto/
│   │   ├── create-pix-key.dto.ts
│   │   └── send-pix.dto.ts
│   ├── services/
│   │   ├── pix-key.service.ts
│   │   ├── pix-transaction.service.ts
│   │   ├── pix-validation.service.ts
│   │   ├── pix-webhook.service.ts
│   │   └── pix-limit.service.ts
│   └── providers/
│       └── psp-mock.service.ts   # Mock PSP para sandbox
│
├── open-finance/                 # Módulo Open Finance
│   ├── open-finance.module.ts
│   ├── open-finance.controller.ts
│   ├── open-finance.service.ts
│   ├── services/
│   │   ├── consent.service.ts
│   │   ├── connection.service.ts
│   │   └── sync.service.ts
│   └── providers/
│       └── institution-mock.service.ts
│
├── fraud/                        # Motor Antifraude
│   ├── fraud.module.ts
│   ├── fraud.controller.ts
│   ├── fraud.service.ts
│   └── services/
│       ├── fraud-engine.service.ts
│       ├── risk-profile.service.ts
│       ├── device.service.ts
│       └── alert.service.ts
│
├── compliance/                   # Compliance & LGPD
│   ├── compliance.module.ts
│   ├── compliance.controller.ts
│   ├── compliance.service.ts
│   └── services/
│       ├── lgpd.service.ts
│       ├── audit.service.ts
│       ├── data-retention.service.ts
│       └── immutable-log.service.ts
│
├── security/                     # Segurança Avançada
│   ├── security.module.ts
│   ├── security.controller.ts
│   ├── security.service.ts
│   └── services/
│       ├── mfa.service.ts
│       ├── rate-limit.service.ts
│       └── encryption.service.ts
│
└── observability/                # Observabilidade
    ├── observability.module.ts
    ├── observability.controller.ts
    └── services/
        ├── logging.service.ts
        ├── metrics.service.ts
        ├── alerting.service.ts
        └── health.service.ts
```

---

## 1. Módulo PIX

### Funcionalidades

| Endpoint | Descrição |
|----------|-----------|
| `POST /pix/keys` | Cadastrar chave PIX |
| `GET /pix/keys` | Listar chaves do usuário |
| `DELETE /pix/keys/:id` | Excluir chave PIX |
| `POST /pix/transfer` | Enviar PIX |
| `GET /pix/transactions` | Histórico de transações |
| `POST /pix/qrcode/generate` | Gerar QR Code |
| `GET /pix/limits` | Consultar limites |
| `GET /pix/dashboard` | Dashboard PIX |

### Tipos de Chave

- **CPF**: Validação com dígitos verificadores
- **CNPJ**: Validação completa
- **Email**: Validação de formato
- **Telefone**: Formato +55 + DDD + número
- **Aleatória**: UUID v4 formatado

### Limites

| Tipo | Valor Padrão |
|------|--------------|
| Por transação | R$ 2.000 |
| Diário | R$ 5.000 |
| Noturno (20h-6h) | R$ 1.000 |
| Mensal | R$ 50.000 |

### Mock PSP

O `PspMockService` simula integração com PSP real:
- Execução de transferências com latência simulada
- Taxa de falha de 5% para testes
- Lookup de chaves no DICT (mockado)
- Geração de QR Codes EMV

---

## 2. Módulo Open Finance

### Fluxo de Consentimento

```
1. Usuario solicita conexão → initiateConsent()
2. Redirect para instituição (mockado)
3. Callback com código → authorizeConsent()
4. Criação de conexão ativa
5. Sincronização de dados → syncConnection()
```

### Instituições Mockadas

- Itaú Unibanco
- Bradesco
- Nubank
- Banco Inter
- Banco do Brasil

### Dados Sincronizados

- Saldos de contas
- Transações (últimos 90 dias)
- Categorização automática

---

## 3. Motor Antifraude

### Regras Implementadas

| Regra | Score | Descrição |
|-------|-------|-----------|
| `AMOUNT_THRESHOLD` | 15-30 | Valor acima do padrão |
| `VELOCITY` | 25 | Alta frequência de transações |
| `TIME_BASED` | 10 | Horário incomum (madrugada) |
| `NEW_DEVICE` | 20 | Dispositivo desconhecido |
| `AMOUNT_DEVIATION` | 20 | Valor 5x acima da média |
| `NEW_RECIPIENT` | 15 | Novo destinatário + alto valor |
| `CUMULATIVE_DAILY` | 25 | Limite diário excedido |

### Thresholds de Ação

| Score | Severidade | Ação |
|-------|------------|------|
| 0-20 | LOW | Permitir |
| 20-40 | MEDIUM | Permitir + Log |
| 40-60 | MEDIUM | Permitir + Alerta |
| 60-80 | HIGH | Requer MFA |
| 80-90 | CRITICAL | Alerta + Review |
| 90+ | CRITICAL | Bloquear |

### Perfil de Risco

Cada usuário possui um `UserRiskProfile` com:
- Score de risco acumulado
- Média de transações
- Horários típicos
- Dispositivos conhecidos
- Histórico de flags

---

## 4. Compliance & LGPD

### Tipos de Consentimento

| Tipo | Obrigatório | Descrição |
|------|-------------|-----------|
| `DATA_PROCESSING` | Sim | Processamento de dados |
| `MARKETING` | Não | Comunicações de marketing |
| `THIRD_PARTY_SHARING` | Não | Compartilhamento |
| `ANALYTICS` | Não | Análise de uso |
| `AI_PERSONALIZATION` | Não | Personalização por IA |

### Direitos LGPD

- **Acesso**: `POST /compliance/data/export`
- **Correção**: Via perfil de usuário
- **Exclusão**: `POST /compliance/data/deletion-request`
- **Portabilidade**: Incluído no export

### Políticas de Retenção

| Entidade | Período | Justificativa |
|----------|---------|---------------|
| Audit Logs | 7 anos | Requisito regulatório |
| Transações | 5 anos | Requisito fiscal |
| Mensagens AI | 1 ano | Operacional |
| Eventos de Segurança | 2 anos | Compliance |

### Log Imutável

Todas as transações financeiras geram registros em `ImmutableFinancialLog`:
- Hash SHA-256 do evento
- Encadeamento com hash anterior
- Assinatura digital
- Impossível de modificar retroativamente

---

## 5. Segurança Avançada

### MFA (Preparação)

```typescript
// Setup
POST /security/mfa/setup
→ { secret, otpAuthUrl, backupCodes }

// Ativar
POST /security/mfa/verify
→ { code: "123456" }

// Usar
POST /auth/login
→ { email, password, mfaCode? }
```

### Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `auth:login` | 5 | 15 min |
| `auth:signup` | 3 | 1 hora |
| `pix:transfer` | 20 | 1 hora |
| `pix:key:create` | 5 | 24 horas |
| `api:general` | 100 | 1 min |

### Criptografia

- **Em trânsito**: HTTPS/TLS 1.3
- **Em repouso**: AES-256-GCM
- **Senhas**: bcrypt (salt rounds: 12)
- **Tokens**: JWT RS256

---

## 6. Observabilidade

### Endpoints de Saúde

| Endpoint | Uso |
|----------|-----|
| `GET /health` | Status completo |
| `GET /health/live` | Liveness probe (K8s) |
| `GET /health/ready` | Readiness probe (K8s) |
| `GET /metrics` | Prometheus format |

### Logs Estruturados

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "PIX transfer completed",
  "context": {
    "userId": "uuid",
    "transactionId": "uuid",
    "action": "PIX_SENT",
    "duration": 1250
  },
  "service": "FragTech",
  "version": "1.0.0"
}
```

### Métricas

- Transações por status
- Volume PIX
- Usuários ativos
- Alertas de fraude
- Latência de API

---

## 7. Schema de Banco de Dados (Prisma)

### Novos Models

```prisma
// PIX
- PixKey
- PixTransaction
- PixWebhookEvent
- PixLimit

// Open Finance
- OpenFinanceInstitution
- OpenFinanceConsent
- OpenFinanceConnection
- OpenFinanceAccount
- OpenFinanceTransaction
- OpenFinanceSyncLog

// Fraud
- FraudRule
- FraudAlert
- UserRiskProfile
- UserDevice

// Compliance
- LgpdConsent
- DataRetentionPolicy
- DataDeletionRequest
- ImmutableFinancialLog

// Security
- MfaConfig
- SecurityEvent
- RateLimitRecord
```

---

## 8. Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=...

# PIX/PSP (Produção)
PSP_API_URL=https://api.psp.com
PSP_API_KEY=...
PSP_WEBHOOK_SECRET=...

# Open Finance (Produção)
OPENFINANCE_CLIENT_ID=...
OPENFINANCE_CLIENT_SECRET=...
OPENFINANCE_REDIRECT_URI=...

# Observability (Produção)
SENTRY_DSN=...
PROMETHEUS_ENABLED=true
```

---

## 9. Roadmap para Produção

### Fase 4.1: Sandbox Completo ✅
- [x] Schema de banco de dados
- [x] Módulos backend implementados
- [x] Mock services para PIX e Open Finance
- [x] Motor antifraude básico
- [x] Compliance LGPD
- [x] Segurança (MFA, rate limiting)
- [x] Observabilidade

### Fase 4.2: Integração Real
- [ ] Parceria com PSP para PIX
- [ ] Certificação Open Finance Brasil
- [ ] Integração com provedor de identidade
- [ ] Auditoria de segurança externa

### Fase 4.3: Compliance & Certificação
- [ ] Auditoria SOC 2
- [ ] Certificação PCI-DSS (se aplicável)
- [ ] Registro no Banco Central
- [ ] Homologação Open Finance

### Fase 4.4: Go-Live
- [ ] Migração sandbox → produção
- [ ] Monitoramento 24/7
- [ ] Suporte ao cliente
- [ ] Plano de contingência

---

## 10. Decisões Arquiteturais

### ADR-001: Separação de Concerns
Cada módulo tem responsabilidade única e bem definida, facilitando testes, manutenção e evolução independente.

### ADR-002: Mock Services
Services de mock (`PspMockService`, `InstitutionMockService`) implementam as mesmas interfaces que serão usadas em produção, permitindo troca transparente.

### ADR-003: Log Imutável
Todas as transações financeiras são registradas em log imutável com hash encadeado, garantindo integridade e auditabilidade.

### ADR-004: Score de Fraude Incremental
O score de risco é calculado incrementalmente por regras configuráveis, permitindo ajuste fino sem deploy.

### ADR-005: Consent-First Design
Nenhum dado é processado sem consentimento explícito do usuário, com trilha de auditoria completa.

---

## Contato

Para dúvidas sobre a arquitetura da Fase 4:
- **Arquiteto**: Equipe FragTech
- **Documentação**: `/docs/PHASE4_ARCHITECTURE.md`
