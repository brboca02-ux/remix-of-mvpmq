# Production Readiness Guide

Complete guide for deploying MarketScope AI to production with all recommended features implemented.

## ✅ Status: Production Ready

Todas as implementações de prioridade ALTA e MÉDIA foram completadas.

---

## 🔴 Prioridade ALTA - ✅ Implementado

### 1. Error Tracking (Sentry-compatible)

**Arquivo**: `src/lib/monitoring.ts`

**Features**:
- ✅ API compatível com Sentry SDK
- ✅ Captura automática de erros não tratados
- ✅ Captura de unhandled promise rejections
- ✅ Sistema de breadcrumbs
- ✅ User context tracking
- ✅ Performance transactions
- ✅ Tags e extras para context

**Como ativar Sentry real**:
```bash
npm install @sentry/react
```

Editar `src/lib/monitoring.ts` e descomentar as chamadas do Sentry SDK.

**Uso**:
```typescript
import { monitoring } from '@/lib/monitoring';

// Capturar exception
try {
  // ... código
} catch (error) {
  monitoring.captureException(error, {
    tags: { module: 'crm' },
    extra: { userId: user.id },
  });
}

// Adicionar breadcrumb
monitoring.addBreadcrumb({
  category: 'navigation',
  message: 'User opened dashboard',
});

// Performance tracking
const transaction = monitoring.startTransaction('lead-search', 'api');
// ... operation
const duration = transaction.finish();
```

---

### 2. CI/CD Pipeline

**Arquivos**: 
- `.github/workflows/ci.yml` - Pipeline de integração
- `.github/workflows/deploy.yml` - Pipeline de deployment

**Jobs Implementados**:

#### CI Pipeline (`ci.yml`):
- ✅ **Code Quality**: Lint, type check, formatting, ownership
- ✅ **Tests**: Multi-version (Node 18 & 20) com coverage
- ✅ **Build**: Bundle size check e upload de artifacts
- ✅ **Security**: npm audit + secret scanning (TruffleHog)
- ✅ **Coordination**: Validação dos arquivos de coordenação

#### Deploy Pipeline (`deploy.yml`):
- ✅ **Staging**: Deploy automático no push para main
- ✅ **Production**: Deploy com aprovação manual
- ✅ **Smoke Tests**: Validação pós-deploy
- ✅ **Release Tags**: Tags automáticas em produção

**Setup necessário**:

Configurar GitHub Secrets:
```
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SENTRY_DSN
STAGING_URL

PROD_SUPABASE_URL
PROD_SUPABASE_ANON_KEY
PROD_SENTRY_DSN
PRODUCTION_URL
```

---

### 3. Performance Monitoring

**Arquivo**: `src/lib/performance.ts`

**Features**:
- ✅ Web Vitals tracking (LCP, FCP, CLS, FID, TTFB, INP)
- ✅ Thresholds de Google recommendations
- ✅ Navigation timing automático
- ✅ Resource timing summary
- ✅ Long task detection
- ✅ Slow render detection
- ✅ Custom metrics com tags

**Uso**:
```typescript
import { performanceTracker } from '@/lib/performance';

// Measure async operations
const result = await performanceTracker.measure(
  'fetch-leads',
  async () => {
    return await fetchLeads();
  },
  { module: 'prospecting' }
);

// Measure sync operations
const parsed = performanceTracker.measureSync(
  'parse-csv',
  () => parseCSV(data)
);

// Manual marks
performanceTracker.startMark('my-operation');
// ... do work
performanceTracker.endMark('my-operation');
```

---

### 4. Rate Limiting

**Arquivo**: `src/lib/rate-limiter.ts`

**Features**:
- ✅ Sliding Window algorithm
- ✅ Token Bucket algorithm
- ✅ Queue management
- ✅ Predefined limits para APIs comuns
- ✅ Status monitoring
- ✅ Auto-reset após janela expirar

**Limites Configurados**:
| API | Limit | Window |
|-----|-------|--------|
| Google Places | 100 req | 1 min |
| Brasil API | 30 req | 1 min |
| ReceitaWS | 3 req | 1 min |
| Lovable AI | 50 req | 1 min |
| Internal API | 200 req | 1 min |
| WhatsApp Export | 10 req | 1 min |
| Lead Import | 5 req | 1 hora |

**Uso**:
```typescript
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

// Usar limite predefinido
const places = await withRateLimit(
  RATE_LIMITS.GOOGLE_PLACES,
  async () => {
    return await fetchFromGooglePlaces(query);
  }
);

// Limite customizado
const result = await withRateLimit(
  { key: 'my-api', maxRequests: 10, windowMs: 60000 },
  async () => apiCall()
);

// Check status sem consumir
import { isRateLimited, getResetTime } from '@/lib/rate-limiter';

if (isRateLimited('google-places')) {
  const resetIn = getResetTime('google-places');
  console.log(`Limited. Reset in ${resetIn}ms`);
}
```

---

## 🟡 Prioridade MÉDIA - ✅ Implementado

### 5. Tipos TypeScript (Redução de `any`)

**Progresso**:
- ✅ Places API tipado corretamente
- ✅ Responses de Google Places APIs tipadas
- ✅ Interfaces `GooglePlacesTextResponse` e `GooglePlacesDetailsResponse`

**Ainda pendente** (não crítico):
- ~290 tipos `any` em APIs externas menores
- Recomendação: corrigir gradualmente

### 6. Testes Adicionais

**Novos Arquivos**:
- `src/lib/__tests__/rate-limiter.test.ts`
- `src/lib/__tests__/monitoring.test.ts`
- `src/lib/__tests__/performance.test.ts`

### 7. Environment Variables

**Arquivo**: `.env.example`

**Categorias Documentadas**:
- Supabase
- Google Places API
- Lovable AI
- Make.com Integration
- Sentry
- Feature Flags
- Rate Limiting
- Analytics
- Debug

---

## 🚀 Checklist de Deploy para Produção

### Pré-Deploy
- [ ] Criar `.env` com todas as variáveis necessárias
- [ ] Configurar GitHub Secrets
- [ ] Executar suite completa de testes: `npm run test`
- [ ] Verificar types: `npm run typecheck`
- [ ] Rodar lint: `npm run lint`
- [ ] Fazer build local: `npm run build`

### Infraestrutura
- [ ] Criar projeto no Supabase (prod)
- [ ] Configurar Sentry DSN
- [ ] Setup de domínio/DNS
- [ ] Configurar SSL/HTTPS
- [ ] Setup de CDN (opcional)

### Monitoring
- [ ] Verificar Sentry recebendo eventos
- [ ] Verificar Web Vitals no console
- [ ] Configurar alertas no Sentry
- [ ] Setup de dashboard de monitoring

### Segurança
- [ ] Row Level Security (RLS) habilitado no Supabase
- [ ] Secrets rotacionados
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] CSP headers configurados

### Performance
- [ ] Bundle size < 500KB (gzipped)
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FID < 100ms

### Backup & Recovery
- [ ] Backup do Supabase configurado
- [ ] Rollback procedures documentados
- [ ] Disaster recovery plan testado

---

## 📊 Monitoramento em Produção

### Ferramentas Integradas

1. **Error Tracking**: Sentry (via `lib/monitoring.ts`)
2. **Performance**: Web Vitals + Custom metrics
3. **Logs**: Logger estruturado (JSON em produção)
4. **Rate Limiting**: Client-side com queue
5. **CI/CD**: GitHub Actions

### Métricas Importantes

| Métrica | Alvo | Crítico |
|---------|------|---------|
| Error Rate | < 0.1% | > 1% |
| Response Time (p95) | < 1s | > 3s |
| LCP | < 2.5s | > 4s |
| CLS | < 0.1 | > 0.25 |
| FID | < 100ms | > 300ms |
| Uptime | 99.9% | < 99% |

---

## 🛠️ Troubleshooting

### Sentry não está recebendo eventos

1. Verificar DSN no `.env`:
   ```
   VITE_SENTRY_DSN=https://...
   ```

2. Verificar inicialização em `src/lib/monitoring.ts`

3. Testar captura manual:
   ```typescript
   monitoring.captureException(new Error('Test'));
   ```

### Rate limiting muito restritivo

Ajustar em `src/lib/rate-limiter.ts`:
```typescript
export const RATE_LIMITS = {
  GOOGLE_PLACES: {
    maxRequests: 200, // aumentar
    windowMs: 60 * 1000,
  },
};
```

### Testes falhando no CI

1. Verificar Node.js version matches local
2. Verificar se todos os secrets estão configurados
3. Rodar localmente com `CI=true npm test`

---

## 📚 Documentação Adicional

- [CI/CD Configuration](.github/workflows/)
- [Monitoring Guide](../src/lib/monitoring.ts)
- [Rate Limiting Guide](../src/lib/rate-limiter.ts)
- [Performance Guide](../src/lib/performance.ts)
- [Environment Variables](../.env.example)

---

## 🎯 Próximos Passos (Opcionais)

### Melhorias Contínuas

1. **Real-time Sentry Integration**
   - Instalar `@sentry/react`
   - Ativar source maps upload
   - Configurar release tracking

2. **Advanced Analytics**
   - Integrar Google Analytics 4
   - Setup de eventos customizados
   - Dashboard de uso

3. **A/B Testing**
   - Framework de feature flags
   - Testes de conversão
   - Metrics de experimentos

4. **E2E Testing**
   - Expandir Playwright tests
   - Visual regression testing
   - Cross-browser testing

---

**Última atualização**: 2026-05-12  
**Status**: ✅ Production Ready
