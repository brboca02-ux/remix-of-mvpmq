# Handoff: [Feature Name]

**From**: [Kiro/Lovable]
**To**: [Lovable/Kiro]
**Date**: YYYY-MM-DD HH:MM

## Summary
[Brief description of what was accomplished and the overall goal of this work]

## Files Modified
- `path/to/file1.ts` - [What changed and why]
- `path/to/file2.tsx` - [What changed and why]
- `path/to/file3.ts` - [What changed and why]

## New Types/Interfaces (Kiro → Lovable)
```typescript
// Copy relevant type definitions here that Lovable will need to use
// Example:
// interface LeadData {
//   id: string;
//   name: string;
//   email: string;
// }
```

## New Components (Lovable → Kiro)
- `ComponentName` - Purpose and description of props
  - Props: `{ prop1: string, prop2: number }`
  - Location: `src/components/path/ComponentName.tsx`
- `AnotherComponent` - Purpose and description of props
  - Props: `{ propA: boolean, propB: string[] }`
  - Location: `src/components/path/AnotherComponent.tsx`

## Integration Points
[Describe how the work connects to the other tool's domain]

**For Kiro → Lovable handoffs:**
- API endpoints available for UI to consume
- Data structures and types that UI components should use
- State management patterns to follow
- Error handling expectations

**For Lovable → Kiro handoffs:**
- UI components that need backend integration
- User interactions that trigger server functions
- Data requirements for components
- Expected API contracts

## Dependencies Added
- `package-name@version` - Why it was added and what it's used for
- `another-package@version` - Why it was added and what it's used for

## Next Steps for Receiving Tool
1. [Specific action needed - be clear and actionable]
2. [Another action - include file paths and function names where relevant]
3. [Additional steps as needed]

## Testing Notes
**What was tested:**
- [List what functionality was tested and verified]
- [Include test files created or updated]

**What still needs testing:**
- [List what the receiving tool should test]
- [Include integration points that need validation]

## Questions/Clarifications Needed
- [Any unclear points or decisions that need to be made]
- [Technical questions about implementation approach]
- [Clarifications about requirements or expected behavior]

---

## Acknowledgment (To be filled by receiving tool)

**Acknowledged by**: [Kiro/Lovable]
**Date**: YYYY-MM-DD HH:MM

**Understanding confirmed:**
- [ ] Reviewed all modified files
- [ ] Understood new types/components
- [ ] Understood integration points
- [ ] Reviewed dependencies added
- [ ] Clear on next steps
- [ ] All questions answered or documented

**Additional notes:**
[Any comments, concerns, or observations from the receiving tool]
