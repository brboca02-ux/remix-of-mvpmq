# Rollback Procedures

**Task 31 - Phase 6: Rollback Documentation**

## 🎯 Overview

This document outlines procedures for rolling back changes when issues arise during development or after deployment.

---

## 🚨 When to Rollback

Consider rollback when:

- ✅ **Production bug**: Critical issue affecting users
- ✅ **Breaking change**: Change breaks existing functionality
- ✅ **Test failures**: Tests fail after deployment
- ✅ **Performance regression**: Significant performance degradation
- ✅ **Security issue**: Security vulnerability introduced
- ✅ **Bad merge**: Incorrect merge causing issues

**Don't rollback when**:
- ❌ Minor UI issues (fix forward)
- ❌ Non-critical bugs (fix in next release)
- ❌ Expected behavior changes
- ❌ Intentional breaking changes with migration

---

## 📋 Pre-Rollback Checklist

Before initiating rollback:

- [ ] Identify the issue clearly
- [ ] Determine scope of impact
- [ ] Check if fix-forward is faster
- [ ] Notify team/users if applicable
- [ ] Document the reason
- [ ] Backup current state
- [ ] Have rollback plan ready

---

## 🔄 Rollback Types

### 1. Git-Based Rollback

#### A. Revert Single Commit

```bash
# Safe rollback (creates new commit)
git revert <commit-hash>

# Push the revert
git push origin <branch>
```

**When to use**:
- ✅ Changes already pushed
- ✅ Need to preserve history
- ✅ Working with team

#### B. Reset to Previous Commit

```bash
# Soft reset (keeps changes staged)
git reset --soft HEAD~1

# Mixed reset (default, unstages changes)
git reset HEAD~1

# Hard reset (DISCARDS ALL CHANGES)
git reset --hard HEAD~1
```

**When to use**:
- ✅ Changes not pushed yet
- ✅ Working alone on branch
- ✅ Want to redo changes

**⚠️ Warning**: `--hard` discards uncommitted changes!

#### C. Revert Multiple Commits

```bash
# Revert range of commits
git revert <oldest-commit>^..<newest-commit>

# Revert last 3 commits
git revert HEAD~3..HEAD
```

---

### 2. Backup Branch Strategy

#### Create Backup Before Major Changes

```bash
# Create backup branch
git checkout -b backup/before-refactor-$(date +%Y%m%d-%H%M%S)

# Push backup to remote
git push origin backup/before-refactor-$(date +%Y%m%d-%H%M%S)

# Return to main branch
git checkout main
```

#### Restore from Backup

```bash
# List backup branches
git branch -a | grep backup/

# Checkout backup branch
git checkout backup/before-refactor-20260512

# Create new branch from backup
git checkout -b restore-from-backup

# Merge back to main
git checkout main
git merge restore-from-backup
```

---

### 3. File-Level Rollback

#### Restore Single File

```bash
# Restore file from previous commit
git checkout HEAD~1 -- path/to/file.ts

# Restore file from specific commit
git checkout <commit-hash> -- path/to/file.ts

# Restore file from another branch
git checkout main -- path/to/file.ts
```

#### Restore Multiple Files

```bash
# Restore entire directory
git checkout HEAD~1 -- src/modules/crm/

# Restore matching pattern
git checkout HEAD~1 -- 'src/**/*.ts'
```

---

## 📝 Rollback Scenarios

### Scenario 1: Broken Feature in Production

**Situation**: New feature deployed to production has critical bug

**Steps**:
1. **Immediate**: Revert the deployment
   ```bash
   # On production server
   git revert <feature-commit>
   git push origin main
   ```

2. **Deploy revert**:
   ```bash
   npm run build
   npm run deploy
   ```

3. **Verify**: Check production is working

4. **Document**: Create incident report

5. **Fix**: Work on fix in separate branch

6. **Test**: Thoroughly test before re-deploying

---

### Scenario 2: Bad Merge

**Situation**: Merge introduced conflicts/bugs

**Steps**:
1. **Check merge commit**:
   ```bash
   git log --merges --oneline
   ```

2. **Revert merge**:
   ```bash
   git revert -m 1 <merge-commit-hash>
   ```

3. **Push revert**:
   ```bash
   git push origin main
   ```

4. **Redo merge** properly in new branch

---

### Scenario 3: Database Migration Failure

**Situation**: Database migration failed, data corrupted

**Steps**:
1. **Stop**: Don't run more migrations

2. **Backup current state**:
   ```sql
   -- Create backup
   pg_dump database_name > backup_$(date +%Y%m%d).sql
   ```

3. **Restore from backup**:
   ```sql
   -- Restore previous state
   psql database_name < backup_previous.sql
   ```

4. **Rollback migration**:
   ```bash
   # If using migration tool
   npm run migration:rollback
   ```

5. **Fix migration** in code

6. **Test migration** in staging first

---

### Scenario 4: Package Update Broke Things

**Situation**: Updated package causes errors

**Steps**:
1. **Identify problematic package**:
   ```bash
   git log -p package.json
   ```

2. **Revert package.json**:
   ```bash
   git checkout HEAD~1 -- package.json package-lock.json
   ```

3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Verify**: Run tests
   ```bash
   npm run test
   ```

---

### Scenario 5: Configuration Change Broke Build

**Situation**: Changed config file breaks build

**Steps**:
1. **Restore config**:
   ```bash
   git checkout HEAD~1 -- vite.config.ts tsconfig.json
   ```

2. **Rebuild**:
   ```bash
   npm run build
   ```

3. **Commit restore**:
   ```bash
   git add .
   git commit -m "revert: restore config to working state"
   git push
   ```

---

## 🛡️ Prevention Strategies

### 1. Always Use Branches

```bash
# NEVER work directly on main
git checkout -b feature/my-feature

# Create PR for review
```

### 2. Use Backup Branches for Major Changes

```bash
# Before refactoring
git checkout -b backup/pre-refactor-$(date +%Y%m%d)
git push origin backup/pre-refactor-$(date +%Y%m%d)
```

### 3. Test Thoroughly Before Merging

```bash
# Run all tests
npm run test

# Run type check
npm run typecheck

# Run linter
npm run lint

# Check ownership
npm run check-ownership
```

### 4. Use Pre-commit Hooks

Already configured in `.husky/pre-commit`:
- Type checking
- Linting
- Tests
- Ownership validation

### 5. Deploy to Staging First

```bash
# Deploy to staging
git push origin staging

# Test in staging environment

# Only then deploy to production
git push origin main
```

---

## 📊 Rollback Decision Matrix

| Issue Severity | User Impact | Time to Fix | Action |
|---------------|-------------|-------------|--------|
| Critical | All users | < 30 min | Fix forward |
| Critical | All users | > 30 min | **Rollback** |
| High | Some users | < 1 hour | Fix forward |
| High | Some users | > 1 hour | **Rollback** |
| Medium | Few users | Any | Fix forward |
| Low | No visible impact | Any | Fix in next release |

---

## 📞 Escalation Path

1. **Developer**: Attempts rollback
2. **Tech Lead**: If rollback affects multiple systems
3. **CTO**: If production data at risk
4. **CEO**: If customer SLA affected

---

## 📝 Post-Rollback Checklist

After successful rollback:

- [ ] Verify system is working
- [ ] Run smoke tests
- [ ] Check user-facing features
- [ ] Monitor error logs
- [ ] Document incident
- [ ] Create follow-up tasks
- [ ] Update runbook if needed
- [ ] Conduct post-mortem
- [ ] Plan proper fix
- [ ] Notify stakeholders

---

## 🔍 Incident Report Template

```markdown
# Incident Report: [Title]

**Date**: YYYY-MM-DD HH:MM
**Duration**: X minutes
**Severity**: Critical/High/Medium/Low

## Summary
Brief description of what happened

## Impact
- Who was affected
- What functionality was broken
- Business impact

## Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Rollback initiated
- HH:MM - System restored
- HH:MM - Incident closed

## Root Cause
Detailed technical explanation

## Resolution
What was done to resolve

## Prevention
How to prevent in future

## Action Items
- [ ] Action 1
- [ ] Action 2
```

---

## 🎯 Common Git Commands Reference

```bash
# View recent commits
git log --oneline -10

# View file history
git log --follow path/to/file

# View changes in commit
git show <commit-hash>

# Create branch from commit
git checkout -b new-branch <commit-hash>

# Cherry-pick commit
git cherry-pick <commit-hash>

# Stash changes temporarily
git stash
git stash pop

# View stash list
git stash list

# Reflog (shows all HEAD movements)
git reflog

# Recover "lost" commits
git checkout <reflog-hash>
```

---

**Remember**: Rollback is a safety net, not a strategy. Always prefer fix-forward when possible!

**Last Updated**: 2026-05-12
