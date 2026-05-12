# useEffect Cleanup Audit

**Task 16.1 - Phase 3: Code Quality**

## Summary

- **Total useEffect hooks found**: 40+
- **Hooks with cleanup**: ~15 (38%)
- **Hooks needing cleanup**: ~25 (62%)

## Priority Issues

### 🔴 High Priority (Memory Leaks)

1. **Intervals without cleanup** (5 instances)
   - `src/routes/market-research.tsx` - Line 36
   - `src/routes/dev.jobs.tsx` - Line 33
   - `src/modules/crm/FollowupRulesPanel.tsx` - Line 83
   - `src/modules/crm/CRMCalendar.tsx` - Line 74
   - `src/modules/prospecting/FocusMode.tsx` - Line 61

2. **Supabase subscriptions without cleanup** (2 instances)
   - `src/hooks/useImportedLeads.ts` - Line 124
   - `src/components/jobs/BackgroundJobBanner.tsx` - Line 19

3. **Event listeners without cleanup** (3 instances)
   - `src/components/ui/sidebar.tsx` - Line 97
   - `src/hooks/useAnalysisHistory.ts` - Line 27

### 🟡 Medium Priority

4. **Timers without cleanup** (10+ instances)
   - Various setTimeout calls in components

### ✅ Already Has Cleanup

- `src/modules/prospecting/LeadCard.tsx` - Line 343 ✅
- `src/hooks/useCompanySearch.ts` - Line 9 ✅
- `src/lib/icons.tsx` - Line 76 ✅

## Recommendations

### Pattern 1: Intervals
```typescript
// ❌ Bad
useEffect(() => {
  const interval = setInterval(() => {
    // do something
  }, 5000);
}, []);

// ✅ Good
useEffect(() => {
  const interval = setInterval(() => {
    // do something
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

### Pattern 2: Supabase Subscriptions
```typescript
// ❌ Bad
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('postgres_changes', handler)
    .subscribe();
}, []);

// ✅ Good
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('postgres_changes', handler)
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}, []);
```

### Pattern 3: Event Listeners
```typescript
// ❌ Bad
useEffect(() => {
  window.addEventListener('keydown', handler);
}, []);

// ✅ Good
useEffect(() => {
  window.addEventListener('keydown', handler);
  return () => {
    window.removeEventListener('keydown', handler);
  };
}, []);
```

## Action Items

- [ ] Fix 5 interval leaks
- [ ] Fix 2 Supabase subscription leaks
- [ ] Fix 3 event listener leaks
- [ ] Review and fix timer leaks
- [ ] Add ESLint rule to catch missing cleanups

## Notes

Most hooks are safe (read-only, one-time effects), but the identified issues should be fixed to prevent memory leaks in long-running sessions.
