# Prompts para Lovable - Kiro-Lovable Coordination System

Este documento contém os prompts específicos que você deve passar para a Lovable em cada fase do projeto. Use estes prompts exatamente como estão escritos para garantir que a Lovable entenda o contexto e execute as tarefas corretas.

---

## 📋 **FASE 1: Setup da Infraestrutura**

**Status:** ✅ 100% Kiro - Nenhuma ação necessária da Lovable

**O que o Kiro está fazendo:**
- Criando ownership registry
- Criando work log system
- Instalando git hooks
- Criando CLI tools

**Ação para você:** Aguarde o Kiro completar a Fase 1

---

## 📋 **FASE 2: Padrões de Documentação**

**Status:** ✅ 100% Kiro - Nenhuma ação necessária da Lovable

**O que o Kiro está fazendo:**
- Criando templates de documentação
- Documentando módulos existentes
- Atualizando README

**Ação para você:** Aguarde o Kiro completar a Fase 2

---

## 📋 **FASE 3: Limpeza de Qualidade de Código**

### **Tarefa da Lovable: Criar Error Boundary Component**

**Quando passar este prompt:** Após o Kiro completar as tarefas 11-16 (logger, console.log, tipos any, error handling)

**Prompt para a Lovable:**

```
# Tarefa: Criar Error Boundary Component

## Contexto
O Kiro está implementando um sistema de coordenação entre nós. Ele já criou:
- Logger estruturado em `src/lib/logger.ts`
- Padrões de error handling para server functions
- Tipos TypeScript para erros

## Sua Tarefa
Crie um componente ErrorBoundary para capturar erros em componentes React.

## Requisitos

### 1. Criar `src/components/ErrorBoundary.tsx`

```typescript
import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Algo deu errado</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  Tentar novamente
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Recarregar página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Envolver seções críticas com ErrorBoundary

Atualize os seguintes arquivos para usar ErrorBoundary:

**`src/routes/prospecting.tsx`** - Envolver o conteúdo principal:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dentro do componente, envolver o conteúdo:
<ErrorBoundary>
  {/* Conteúdo existente */}
</ErrorBoundary>
```

**`src/routes/crm.tsx`** - Envolver o conteúdo principal:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  {/* Conteúdo existente */}
</ErrorBoundary>
```

**`src/routes/market-research.tsx`** - Envolver o conteúdo principal:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  {/* Conteúdo existente */}
</ErrorBoundary>
```

## Critérios de Aceitação
- ✅ ErrorBoundary captura erros de componentes filhos
- ✅ Exibe UI amigável quando erro ocorre
- ✅ Permite tentar novamente ou recarregar página
- ✅ Mostra detalhes do erro apenas em desenvolvimento
- ✅ Rotas críticas estão protegidas com ErrorBoundary

## Após Completar
Informe que você completou a tarefa e eu (Kiro) vou:
1. Validar a implementação
2. Integrar com o sistema de logging
3. Criar testes para o ErrorBoundary
```

---

## 📋 **FASE 4: Refatoração do Store**

### **Tarefa da Lovable: Atualizar Componentes para Usar Novos Stores**

**Quando passar este prompt:** Após o Kiro completar as tarefas 18-19 (criar stores modulares)

**Prompt para a Lovable:**

```
# Tarefa: Atualizar Componentes para Usar Novos Stores

## Contexto
O Kiro refatorou o store monolítico (1000+ linhas) em stores modulares:
- `src/modules/prospecting/prospecting-store.ts`
- `src/modules/crm/crm-store.ts`
- `src/modules/market-research/market-research-store.ts`
- `src/modules/jobs/jobs-store.ts`

Cada store agora tem menos de 300 linhas e responsabilidades claras.

## Sua Tarefa
Atualizar os componentes UI para usar os novos stores modulares.

## Requisitos

### 1. Atualizar Componentes de Prospecting

**Arquivos a atualizar:**
- `src/components/buscador/results-table.tsx`
- `src/components/buscador/search-sidebar.tsx`
- `src/components/buscador/company-detail-dialog.tsx`
- `src/components/buscador/import-leads-dialog.tsx`

**Mudanças:**
```typescript
// ANTES (store antigo):
import { useProspectingStore } from '@/store/app-store';

// DEPOIS (novo store modular):
import { useProspectingStore } from '@/modules/prospecting/prospecting-store';

// O uso permanece o mesmo:
const { leads, addLead, updateLead } = useProspectingStore();
```

### 2. Atualizar Componentes de CRM

**Arquivos a atualizar:**
- `src/components/crm/CRMSummaryBar.tsx`
- `src/components/crm/WhatsappExportDialog.tsx`
- Qualquer outro componente em `src/components/crm/`

**Mudanças:**
```typescript
// ANTES:
import { useCRMStore } from '@/store/app-store';

// DEPOIS:
import { useCRMStore } from '@/modules/crm/crm-store';
```

### 3. Atualizar Componentes de Market Research

**Arquivos a atualizar:**
- `src/components/market-research/MarketResearchInput.tsx`
- `src/components/market-research/MarketResearchResult.tsx`
- `src/components/market-research/MarketResearchCharts.tsx`
- `src/components/market-research/MarketResearchHistory.tsx`

**Mudanças:**
```typescript
// ANTES:
import { useMarketResearchStore } from '@/store/app-store';

// DEPOIS:
import { useMarketResearchStore } from '@/modules/market-research/market-research-store';
```

### 4. Atualizar Componentes de Jobs

**Arquivos a atualizar:**
- `src/components/jobs/BackgroundJobBanner.tsx`
- `src/components/jobs/JobProgressCard.tsx`
- `src/components/jobs/JobHistoryList.tsx`

**Mudanças:**
```typescript
// ANTES:
import { useJobsStore } from '@/store/app-store';

// DEPOIS:
import { useJobsStore } from '@/modules/jobs/jobs-store';
```

## Regras Importantes
- ⚠️ **NÃO modifique a lógica dos componentes** - apenas atualize os imports
- ⚠️ **NÃO crie novos stores** - use apenas os stores criados pelo Kiro
- ⚠️ **NÃO mude state diretamente** - use apenas as actions dos stores
- ✅ **Verifique que não há erros TypeScript** após as mudanças

## Critérios de Aceitação
- ✅ Todos os componentes usam os novos stores modulares
- ✅ Nenhum import do store antigo permanece
- ✅ Nenhum erro TypeScript
- ✅ Aplicação compila e roda sem erros
- ✅ Funcionalidade existente permanece intacta

## Após Completar
Informe que você completou a tarefa e eu (Kiro) vou:
1. Remover o store antigo
2. Validar que não há referências ao store antigo
3. Executar testes para garantir que tudo funciona
```

---

## 📋 **FASE 5: Infraestrutura de Testes**

### **Tarefa da Lovable (OPCIONAL): Criar Testes de Componentes**

**Quando passar este prompt:** Após o Kiro completar as tarefas 23-24 (setup de testes e testes de server)

**Prompt para a Lovable:**

```
# Tarefa OPCIONAL: Criar Testes de Componentes

## Contexto
O Kiro já criou:
- Infraestrutura de testes com Vitest
- Testes unitários para server functions
- Testes de integração

Esta tarefa é **OPCIONAL** - você pode pular se quiser um MVP mais rápido.

## Sua Tarefa
Criar testes para componentes UI críticos.

## Requisitos

### 1. Testes para CRMSummaryBar

**Criar:** `src/components/crm/__tests__/CRMSummaryBar.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CRMSummaryBar } from '../CRMSummaryBar';

describe('CRMSummaryBar', () => {
  it('should render summary statistics', () => {
    render(<CRMSummaryBar />);
    
    expect(screen.getByText(/leads/i)).toBeInTheDocument();
    expect(screen.getByText(/quentes/i)).toBeInTheDocument();
  });

  it('should display correct counts', () => {
    // Mock store data
    const mockStore = {
      leads: [
        { id: '1', opportunityLevel: 'quente' },
        { id: '2', opportunityLevel: 'média' },
      ],
    };
    
    // Test implementation
  });
});
```

### 2. Testes para LeadCard

**Criar:** `src/components/buscador/__tests__/LeadCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadCard } from '../LeadCard';

describe('LeadCard', () => {
  const mockLead = {
    id: '1',
    companyName: 'Test Company',
    niche: 'Solar',
    opportunityLevel: 'quente',
  };

  it('should render lead information', () => {
    render(<LeadCard lead={mockLead} />);
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Solar')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<LeadCard lead={mockLead} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Test Company'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### 3. Testes para MarketResearchInput

**Criar:** `src/components/market-research/__tests__/MarketResearchInput.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketResearchInput } from '../MarketResearchInput';

describe('MarketResearchInput', () => {
  it('should validate input before submission', () => {
    render(<MarketResearchInput />);
    
    const input = screen.getByPlaceholderText(/ideia/i);
    const button = screen.getByRole('button', { name: /analisar/i });
    
    fireEvent.click(button);
    
    // Should show validation error
    expect(screen.getByText(/campo obrigatório/i)).toBeInTheDocument();
  });

  it('should submit valid input', () => {
    const onSubmit = vi.fn();
    render(<MarketResearchInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ideia/i);
    fireEvent.change(input, { target: { value: 'curso de finanças' } });
    
    const button = screen.getByRole('button', { name: /analisar/i });
    fireEvent.click(button);
    
    expect(onSubmit).toHaveBeenCalledWith('curso de finanças');
  });
});
```

## Executar Testes
```bash
bun run test
```

## Critérios de Aceitação
- ✅ Testes cobrem renderização básica
- ✅ Testes cobrem interações do usuário
- ✅ Testes cobrem validação de inputs
- ✅ Todos os testes passam

## Após Completar
Informe que você completou a tarefa (ou que pulou por ser opcional).
```

---

## 📋 **FASE 6: Workflow Training**

**Status:** ✅ 100% Kiro - Nenhuma ação necessária da Lovable

**O que o Kiro está fazendo:**
- Documentando workflows de coordenação
- Praticando handoffs
- Criando guias de troubleshooting

**Ação para você:** Aguarde o Kiro completar a Fase 6

---

## 📋 **FASE 7: Melhoria Contínua**

**Status:** ✅ 100% Kiro - Nenhuma ação necessária da Lovable

**O que o Kiro está fazendo:**
- Monitorando efetividade do sistema
- Refinando regras de ownership
- Otimizando ferramentas

**Ação para você:** Aguarde o Kiro completar a Fase 7

---

## 📊 **RESUMO DE QUANDO CHAMAR A LOVABLE**

| Fase | Quando Chamar | Tarefa | Obrigatória? |
|------|---------------|--------|--------------|
| Fase 1 | ❌ Nunca | - | - |
| Fase 2 | ❌ Nunca | - | - |
| Fase 3 | ✅ Após Kiro completar tarefas 11-16 | Criar ErrorBoundary | ✅ Sim |
| Fase 4 | ✅ Após Kiro completar tarefas 18-19 | Atualizar componentes para novos stores | ✅ Sim |
| Fase 5 | ✅ Após Kiro completar tarefas 23-24 | Criar testes de componentes | ⚠️ Opcional |
| Fase 6 | ❌ Nunca | - | - |
| Fase 7 | ❌ Nunca | - | - |

---

## 🎯 **WORKFLOW COMPLETO**

### **Passo 1:** Kiro trabalha sozinho
- Fases 1, 2, 3 (parcial)

### **Passo 2:** Você chama Lovable (1ª vez)
- Copie o prompt da **Fase 3** acima
- Cole na Lovable
- Aguarde ela completar ErrorBoundary

### **Passo 3:** Kiro trabalha sozinho
- Fase 4 (parcial) - criar stores

### **Passo 4:** Você chama Lovable (2ª vez)
- Copie o prompt da **Fase 4** acima
- Cole na Lovable
- Aguarde ela atualizar componentes

### **Passo 5:** Kiro trabalha sozinho
- Fase 5 (parcial) - criar testes de server

### **Passo 6 (OPCIONAL):** Você chama Lovable (3ª vez)
- Copie o prompt da **Fase 5** acima
- Cole na Lovable
- Aguarde ela criar testes de componentes (ou pule)

### **Passo 7:** Kiro finaliza
- Fases 6 e 7

---

## ✅ **CHECKLIST DE COORDENAÇÃO**

- [ ] Fase 1 completa (Kiro) → Nenhuma ação
- [ ] Fase 2 completa (Kiro) → Nenhuma ação
- [ ] Fase 3 parcial completa (Kiro) → **CHAMAR LOVABLE** com prompt da Fase 3
- [ ] ErrorBoundary criado (Lovable) → Kiro valida
- [ ] Fase 4 parcial completa (Kiro) → **CHAMAR LOVABLE** com prompt da Fase 4
- [ ] Componentes atualizados (Lovable) → Kiro valida
- [ ] Fase 5 parcial completa (Kiro) → **CHAMAR LOVABLE** (opcional) com prompt da Fase 5
- [ ] Testes de componentes criados (Lovable - opcional) → Kiro valida
- [ ] Fase 6 completa (Kiro) → Nenhuma ação
- [ ] Fase 7 completa (Kiro) → Nenhuma ação

---

**Dica:** Salve este arquivo e consulte-o durante a implementação para saber exatamente quando e como chamar a Lovable!
