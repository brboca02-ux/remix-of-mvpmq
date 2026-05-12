# Review Checklists

**Task 32 - Phase 6: Review Templates**

## 🎯 Overview

Checklists for code reviews to ensure quality and coordination between Kiro and Lovable.

---

## 📋 Backend Review Checklist (Kiro's Code)

### Code Quality
- [ ] No `any` types used
- [ ] All functions have explicit return types
- [ ] All exported functions have JSDoc comments
- [ ] No `console.log` statements (use logger)
- [ ] No commented-out code
- [ ] No TODO without issue number

### Type Safety
- [ ] All props/parameters typed
- [ ] Types exported from module
- [ ] Types documented
- [ ] Type guards where needed
- [ ] Generic types used appropriately

### Error Handling
- [ ] Try-catch in async functions
- [ ] Errors logged with logger
- [ ] User-friendly error messages
- [ ] Error codes from ErrorCodes enum
- [ ] Recovery suggestions provided

### Testing
- [ ] Unit tests for new functions
- [ ] Tests cover edge cases
- [ ] Tests cover error paths
- [ ] All tests passing
- [ ] Test coverage > 80%

### Performance
- [ ] No N+1 queries
- [ ] Pagination implemented
- [ ] Caching where appropriate
- [ ] No blocking operations
- [ ] Async/await used correctly

### Security
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] No hardcoded secrets
- [ ] Environment variables used

### Database
- [ ] Migrations written
- [ ] Migrations reversible
- [ ] Indexes added
- [ ] Foreign keys defined
- [ ] RLS policies applied

### API Design
- [ ] RESTful conventions
- [ ] Consistent response format
- [ ] Proper HTTP status codes
- [ ] Versioning considered
- [ ] Rate limiting

### Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Type definitions exported
- [ ] Breaking changes noted
- [ ] Migration guide if needed

---

## 🎨 UI Review Checklist (Lovable's Code)

### Code Quality
- [ ] Components < 200 lines
- [ ] Functions < 50 lines
- [ ] No inline styles
- [ ] Props destructured
- [ ] Props typed with TypeScript

### Component Design
- [ ] Single responsibility
- [ ] Reusable when possible
- [ ] Composable
- [ ] Follow existing patterns
- [ ] Use shadcn/ui components

### State Management
- [ ] Use store for shared state
- [ ] Don't mutate store directly
- [ ] Use store actions
- [ ] Local state for UI only
- [ ] Optimistic updates

### Performance
- [ ] useCallback where needed
- [ ] useMemo for expensive computations
- [ ] Lazy loading for routes
- [ ] Code splitting
- [ ] Image optimization

### Accessibility
- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast (WCAG AA)
- [ ] Screen reader support

### Responsive Design
- [ ] Mobile-first approach
- [ ] Breakpoints defined
- [ ] Touch targets ≥ 44px
- [ ] Text readable on all sizes
- [ ] Images responsive

### User Experience
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Success feedback
- [ ] Form validation
- [ ] Helpful error messages

### Animations
- [ ] Smooth transitions
- [ ] Performance optimized
- [ ] Respects prefers-reduced-motion
- [ ] Not distracting
- [ ] Purpose-driven

### Forms
- [ ] Proper labels
- [ ] Required fields marked
- [ ] Validation feedback
- [ ] Error messages clear
- [ ] Autocomplete attributes

### Testing
- [ ] Component tests (if critical)
- [ ] Integration with store tested
- [ ] Accessibility tested
- [ ] Visual regression tests
- [ ] Manual testing completed

---

## 🔍 Coordination Review

### File Ownership
- [ ] Respects ownership.json
- [ ] No boundary violations
- [ ] Shared files coordinated
- [ ] Work log updated

### Integration
- [ ] Uses types from Kiro's modules
- [ ] Follows API contracts
- [ ] No direct database access
- [ ] Uses server functions
- [ ] Handles async properly

### Documentation
- [ ] Handoff document exists
- [ ] Integration points documented
- [ ] Dependencies listed
- [ ] Testing notes included

---

## 🚨 Critical Issues (Reject Immediately)

Any of these require immediate rejection:

### Security Issues
- ❌ Hardcoded credentials
- ❌ SQL injection vulnerability
- ❌ XSS vulnerability
- ❌ Unprotected sensitive data
- ❌ Missing authentication

### Quality Issues
- ❌ Breaking tests
- ❌ TypeScript errors
- ❌ Lint errors
- ❌ Build failures
- ❌ Console errors in runtime

### Architectural Issues
- ❌ Circular dependencies
- ❌ Direct store mutations
- ❌ Ownership violations
- ❌ Missing error handling
- ❌ Performance regressions

---

## ✅ PR Description Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Performance verified

## Screenshots (if UI)
[Add screenshots here]

## Breaking Changes
[List any breaking changes]

## Migration Guide
[If breaking changes, add migration steps]

## Related Issues
Closes #XXX
```

---

## 🎯 Review Process

### Step 1: Automated Checks
- CI/CD pipeline runs
- Tests must pass
- Linting must pass
- Type checking must pass
- Pre-commit hooks validated

### Step 2: Self-Review
Author reviews their own code:
- [ ] Read through all changes
- [ ] Run application locally
- [ ] Test happy path
- [ ] Test error paths
- [ ] Check for TODOs

### Step 3: Peer Review
Another developer reviews:
- [ ] Code quality
- [ ] Architectural fit
- [ ] Test coverage
- [ ] Documentation
- [ ] User experience (if UI)

### Step 4: Approval
- [ ] All comments addressed
- [ ] All checks passing
- [ ] Approved by reviewer
- [ ] Branch up to date

### Step 5: Merge
- [ ] Squash commits if needed
- [ ] Use meaningful commit message
- [ ] Delete feature branch
- [ ] Monitor deployment

---

## 📝 Review Comments Guide

### Severity Levels

**🔴 Blocker**: Must fix before merge
- Security issues
- Breaking bugs
- Architectural problems

**🟡 Major**: Should fix before merge
- Performance issues
- Code quality issues
- Missing tests

**🟢 Minor**: Nice to have
- Code style
- Minor optimizations
- Documentation improvements

**💬 Question**: Seeking clarification
- Design decisions
- Implementation approach
- Future considerations

### Example Comments

**Good**:
```
🔴 Blocker: This SQL query is vulnerable to injection. 
Use parameterized queries instead:
`db.query('SELECT * FROM users WHERE id = $1', [userId])`
```

**Good**:
```
🟡 Major: This useEffect is missing cleanup for the 
event listener. Add:
`return () => window.removeEventListener('scroll', handler);`
```

**Good**:
```
🟢 Minor: Consider extracting this logic into a custom hook 
for reusability:
`const useLeadData = (leadId) => { ... }`
```

**Bad**:
```
This is wrong.
```

**Bad**:
```
Why did you do it this way?
```

---

## 🎓 Review Principles

1. **Be Respectful**: Critique code, not person
2. **Be Specific**: Give concrete examples
3. **Be Constructive**: Suggest improvements
4. **Be Thorough**: Don't rush reviews
5. **Be Timely**: Review within 24h
6. **Be Clear**: Distinguish blockers from suggestions
7. **Be Supportive**: Acknowledge good work

---

## 📊 Review Metrics

Track these metrics:

- **Time to First Review**: < 24 hours
- **Review Iterations**: < 3 per PR
- **Defects Caught**: Track critical issues found
- **False Positives**: Unnecessary comments
- **Review Coverage**: All PRs reviewed

---

**Last Updated**: 2026-05-12
