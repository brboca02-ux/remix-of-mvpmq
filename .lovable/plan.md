# Atualizar pre-commit hook com work-log check

## Objetivo

Adicionar o step `work-log:check` no template do hook gerado por `scripts/setup-git-hooks.js`, na ordem correta.

## Mudança única

**Arquivo:** `scripts/setup-git-hooks.js` (apenas o template string `preCommitHook`)

Inserir um novo step **entre** ownership e typecheck:

```sh
# 2. Check work log conflicts
echo "📋 Checking work log for active conflicts..."
STAGED_FILES=$(git diff --cached --name-only)
if [ -n "$STAGED_FILES" ]; then
  npm run work-log:check $STAGED_FILES
  if [ $? -ne 0 ]; then
    echo "❌ Work log conflict detected. Another tool is actively working on these files."
    echo "   Update .kiro/coordination/work-log.md or wait for the other tool to complete."
    exit 1
  fi
fi
```

Renumerar os steps seguintes (TypeScript → 3, ESLint → 4, tests → 5) e atualizar a mensagem final que lista o que o hook faz.

**Ordem final do hook:**
1. `check-ownership:staged`
2. `work-log:check` *(novo)*
3. `typecheck`
4. `lint`
5. `test:quick`

## O que NÃO vou tocar

- `package.json` — scripts `work-log:status` e `work-log:check` já existem.
- Nenhum outro arquivo do projeto.
- Nada de UI / migração / backend.

## Pós-implementação (você roda localmente no Kiro)

```bash
git pull
bun run scripts/setup-git-hooks.js
```

Isso reinstala o `.git/hooks/pre-commit` com o novo step. A partir daí cada commit valida ownership + work-log + typecheck + lint + tests.
