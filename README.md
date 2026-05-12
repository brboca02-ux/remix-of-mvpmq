# MarketScope AI 🚀

> Plataforma inteligente de prospecção e gestão de leads para agências e freelancers que vendem websites premium.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E)](https://supabase.com/)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Sistema de Coordenação](#-sistema-de-coordenação-kiro-lovable)
- [Estrutura de Módulos](#-estrutura-de-módulos)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **MarketScope AI** é uma plataforma completa para prospecção, qualificação e gestão de leads, desenvolvida especificamente para agências e freelancers que vendem websites premium. A plataforma utiliza inteligência artificial para automatizar processos, gerar insights e aumentar a taxa de conversão.

### Principais Diferenciais

- 🤖 **IA Generativa**: Geração automática de pitches personalizados
- 🎯 **Qualificação Inteligente**: Score de oportunidade baseado em múltiplos fatores
- 📊 **Análise de Mercado**: Pesquisa de tendências e inteligência competitiva
- 🔄 **Automação de Follow-up**: Sequências multi-canal automatizadas
- 💰 **Insight de Receita**: Análise de precificação e probabilidade de fechamento
- 🧠 **Análise Psicológica**: Perfil comportamental e estratégia de abordagem

---

## ✨ Funcionalidades

### 🔍 Prospecting (Prospecção)
- Busca de empresas via Google Places API
- Importação em massa via CSV
- Descoberta automática de redes sociais
- Qualificação automática de leads
- Geração de pitches personalizados por IA
- Análise psicológica e emocional
- Plano diário gerado por IA

### 📈 CRM (Gestão de Relacionamento)
- Pipeline de vendas visual
- Calendário de atividades
- Regras de follow-up automatizadas
- Exportação para WhatsApp, CSV, Make.com
- Dashboard de métricas
- Gestão de tarefas

### 📊 Market Research (Pesquisa de Mercado)
- Análise de tendências (Google Trends)
- Inteligência competitiva
- Perfil de público-alvo
- Síntese por IA de múltiplas fontes
- Relatórios estruturados

### 🔄 Jobs System (Processamento em Background)
- Importação de leads em background
- Enriquecimento de dados
- Descoberta social automatizada
- Geração de pitches em lote
- Monitoramento de progresso

### 🔌 Integrações
- **Supabase**: Banco de dados e autenticação
- **Google Places API**: Busca de empresas
- **BrasilAPI**: Validação de CNPJ
- **Make.com**: Automação via webhooks
- **WhatsApp**: Exportação de contatos

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend**:
- React 18 + TypeScript
- Vite (build tool)
- TanStack Router (roteamento)
- Zustand (gerenciamento de estado)
- Tailwind CSS + shadcn/ui (UI)
- Recharts (gráficos)

**Backend**:
- Supabase (PostgreSQL + Auth + Realtime)
- Server Functions (API)
- Background Jobs System

**Ferramentas**:
- ESLint + Prettier (linting/formatting)
- Vitest (testes)
- Husky (git hooks)
- TypeScript (type safety)

### Estrutura de Diretórios

```
remix-of-mvpmq/
├── .kiro/                      # Sistema de coordenação Kiro-Lovable
│   ├── coordination/           # Ownership, work log, templates
│   ├── specs/                  # Especificações de features
│   └── steering/               # Regras e padrões
├── docs/                       # Documentação
│   ├── modules/                # Documentação de módulos
│   └── api/                    # Documentação de APIs
├── src/
│   ├── components/             # Componentes React (UI)
│   ├── modules/                # Módulos funcionais
│   │   ├── prospecting/        # Prospecção de leads
│   │   ├── crm/                # CRM e pipeline
│   │   ├── market-research/    # Pesquisa de mercado
│   │   ├── followup/           # Sistema de follow-up
│   │   └── services/           # Catálogo de serviços
│   ├── server/                 # Server functions (backend)
│   ├── lib/                    # Utilitários e helpers
│   ├── hooks/                  # React hooks customizados
│   ├── types/                  # Definições de tipos TypeScript
│   └── integrations/           # Integrações externas
├── scripts/                    # Scripts de automação
└── e2e/                        # Testes end-to-end
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ ou Bun 1.0+
- Conta no Supabase
- Chaves de API (Google Places, etc.)

### Passo a Passo

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/remix-of-mvpmq.git
cd remix-of-mvpmq
```

2. **Instale as dependências**

```bash
# Com npm
npm install

# Com bun (recomendado)
bun install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Google Places API
VITE_GOOGLE_PLACES_API_KEY=sua-chave-google-places

# Outras configurações
VITE_APP_ENV=development
```

4. **Configure o banco de dados**

Execute as migrations do Supabase (se disponíveis):

```bash
# Instruções específicas do Supabase
```

5. **Inicie o servidor de desenvolvimento**

```bash
# Com npm
npm run dev

# Com bun
bun run dev
```

6. **Acesse a aplicação**

Abra [http://localhost:5173](http://localhost:5173) no navegador.

---

## 💻 Uso

### Prospecção de Leads

1. Acesse o módulo **Buscador**
2. Digite o nicho e localização (ex: "Restaurante em São Paulo")
3. Clique em **Buscar**
4. Revise os leads encontrados
5. Importe os leads desejados para o CRM

### Geração de Pitches

1. Selecione um lead no CRM
2. Clique em **Gerar Pitch**
3. A IA criará mensagens personalizadas para cada canal
4. Revise e edite conforme necessário
5. Copie e envie via WhatsApp, Instagram ou Email

### Automação de Follow-up

1. Configure regras de follow-up em **Configurações**
2. Defina condições (ex: "3 dias sem resposta")
3. Defina ações (ex: "Criar tarefa de follow-up")
4. Ative a regra
5. O sistema executará automaticamente

### Pesquisa de Mercado

1. Acesse o módulo **Market Research**
2. Digite sua pergunta (ex: "Mercado de energia solar no Brasil")
3. Aguarde a análise
4. Revise insights, concorrentes e tendências
5. Exporte o relatório se necessário

---

## 🤝 Sistema de Coordenação Kiro-Lovable

Este projeto utiliza um sistema de coordenação entre **Kiro** (IA de desenvolvimento) e **Lovable** (IA de UI) para desenvolvimento colaborativo.

### Ownership de Arquivos

Os arquivos são divididos em três categorias:

| Categoria | Owner | Exemplos |
|-----------|-------|----------|
| **Backend/Logic** | Kiro | `src/server/**/*`, `src/lib/**/*`, `src/types/**/*` |
| **UI Components** | Lovable | `src/components/**/*.tsx`, `src/styles.css` |
| **Shared** | Ambos | `src/hooks/**/*`, `src/routes/**/*`, `package.json` |

### Workflow de Coordenação

1. **Kiro** trabalha em infraestrutura, tipos, lógica de negócio
2. **Lovable** trabalha em componentes UI, estilos, UX
3. Handoffs são documentados em `.kiro/coordination/`
4. Git hooks validam ownership antes de commits
5. Work log previne conflitos de edição simultânea

### Ferramentas de Coordenação

```bash
# Verificar ownership de arquivos
npm run check-ownership

# Verificar conflitos ativos
npm run check-conflicts

# Verificar mudanças recentes
npm run check-recent-changes
```

**Documentação completa**: [.kiro/coordination/README.md](.kiro/coordination/README.md)

---

## 📦 Estrutura de Módulos

O projeto está organizado em módulos funcionais independentes:

### 1. Prospecting (`src/modules/prospecting/`)
- Prospecção e qualificação de leads
- Geração de pitches por IA
- Análise psicológica e emocional
- **Documentação**: [docs/modules/prospecting.md](docs/modules/prospecting.md)

### 2. CRM (`src/modules/crm/`)
- Pipeline de vendas
- Calendário de atividades
- Regras de follow-up
- **Documentação**: [docs/modules/crm.md](docs/modules/crm.md)

### 3. Market Research (`src/modules/market-research/`)
- Pesquisa de mercado
- Análise de tendências
- Inteligência competitiva
- **Documentação**: [docs/modules/market-research.md](docs/modules/market-research.md)

### 4. Follow-up (`src/modules/followup/`)
- Sistema de follow-up automatizado
- Fila de execução

### 5. Services (`src/modules/services/`)
- Catálogo de serviços
- Pacotes e combos
- Documentação de entrega

**Documentação completa**: [docs/modules/README.md](docs/modules/README.md)

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # Executa ESLint
npm run format           # Formata código com Prettier
npm run type-check       # Verifica tipos TypeScript

# Testes
npm run test             # Executa testes
npm run test:watch       # Executa testes em modo watch
npm run test:coverage    # Gera relatório de cobertura

# Coordenação
npm run check-ownership  # Verifica ownership de arquivos
npm run check-conflicts  # Verifica conflitos ativos
```

### Padrões de Código

- **TypeScript**: Strict mode habilitado
- **ESLint**: Configuração personalizada
- **Prettier**: Formatação automática
- **Commits**: Conventional Commits
- **Branches**: GitFlow

### Git Hooks

O projeto utiliza Husky para git hooks:

- **pre-commit**: Valida ownership, TypeScript, ESLint e testes
- **commit-msg**: Valida formato de mensagem de commit

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm run test

# Testes específicos
npm run test src/modules/prospecting

# Com cobertura
npm run test:coverage
```

### Estrutura de Testes

```
src/
├── modules/
│   └── prospecting/
│       ├── __tests__/
│       │   ├── lead-parser.test.ts
│       │   └── opportunity-score.test.ts
│       └── ...
└── server/
    └── __tests__/
        └── leads.functions.test.ts
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas diretrizes:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Diretrizes

- Siga os padrões de código do projeto
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Respeite o sistema de ownership de arquivos

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

- **Projeto**: [GitHub](https://github.com/seu-usuario/remix-of-mvpmq)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/remix-of-mvpmq/issues)
- **Documentação**: [docs/](docs/)

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Vite](https://vitejs.dev/) - Build tool
- [TanStack](https://tanstack.com/) - Router e Query

---

**Desenvolvido com ❤️ por Kiro e Lovable**

---

## 📊 Status do Projeto

### Progresso Geral

- ✅ **Fase 1**: Infraestrutura de Coordenação (100%)
- 🟡 **Fase 2**: Documentação (60%)
- 🟡 **Fase 3**: Qualidade de Código (70%)
- ⏳ **Fase 4**: Refatoração de Store (0%)
- ⏳ **Fase 5**: Testes (0%)
- ⏳ **Fase 6**: Treinamento (0%)
- ⏳ **Fase 7**: Melhoria Contínua (0%)

### Métricas de Qualidade

| Métrica | Valor | Meta |
|---------|-------|------|
| Cobertura de Testes | 0% | 80% |
| Tipos 'any' | 294 | 0 |
| console.log | 15 | 0 |
| Linhas por Função | ~50 | <50 |
| Duplicação de Código | ? | <5% |

---

## 🗺️ Roadmap

### Q2 2026
- [x] Sistema de coordenação Kiro-Lovable
- [x] Logging estruturado
- [x] Tipos TypeScript robustos
- [ ] Refatoração de stores
- [ ] Infraestrutura de testes

### Q3 2026
- [ ] Integração WhatsApp Business API
- [ ] Análise de sentimento em tempo real
- [ ] Dashboard avançado com ML
- [ ] Testes E2E completos

### Q4 2026
- [ ] Mobile app (React Native)
- [ ] Integrações adicionais (Zapier, HubSpot)
- [ ] Marketplace de templates
- [ ] Multi-tenancy

---

**Última atualização**: 2026-05-12
