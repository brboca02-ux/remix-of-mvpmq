# Implementation Plan: Kiro-Lovable Coordination System

## Overview

This implementation plan breaks down the Kiro-Lovable Coordination System into actionable tasks following the 7-phase rollout strategy defined in the design document. The system establishes clear ownership boundaries, coordination workflows, automated quality gates, and conflict resolution mechanisms for collaborative development between Kiro and Lovable on the MarketScope AI project.

**Implementation Timeline**: 5 weeks
**Primary Tool**: Kiro (infrastructure, tooling, refactoring)
**Secondary Tool**: Lovable (UI updates as needed)

## Tasks

### Phase 1: Setup Infrastructure (Week 1)

- [x] 1. Create coordination directory structure and ownership registry
  - Create `.kiro/coordination/` directory
  - Create `.kiro/coordination/ownership.json` with complete file ownership mappings
  - Define Kiro-owned patterns: `src/server/**/*`, `src/lib/**/*`, `src/modules/*/types.ts`, `src/integrations/supabase/**/*`, `src/**/__tests__/**/*`
  - Define Lovable-owned patterns: `src/components/ui/**/*`, `src/components/templates/**/*`, `src/components/**/*.tsx`, `src/styles.css`, `tailwind.config.*`
  - Define shared patterns: `src/routes/**/*.tsx`, `src/hooks/**/*`, `package.json`, `tsconfig.json`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

- [x] 2. Create work log system
  - Create `.kiro/coordination/work-log.md` with template structure
  - Implement work log parser in `scripts/check-work-log.ts`
  - Add work log validation to detect active work conflicts
  - _Requirements: 8.2, 8.3_

- [x] 3. Create handoff document template
  - Create `.kiro/coordination/templates/handoff-template.md`
  - Include sections for: summary, files modified, new types, new components, integration points, dependencies, next steps, testing notes, questions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Create CLI tools for ownership checking
  - Implement `scripts/check-ownership.ts` to validate file ownership against registry
  - Add `check-ownership` command to package.json scripts
  - Add `check-ownership:staged` command for pre-commit hook
  - Support glob pattern matching for file paths
  - _Requirements: 1.1-1.12_

- [x] 5. Create conflict detection scripts
  - Implement `scripts/check-recent-changes.ts` to detect files recently modified by other tool
  - Implement `scripts/check-work-log.ts` to detect active work conflicts
  - Add `check-conflicts` command to package.json scripts
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 6. Install and configure git hooks infrastructure
  - Install husky: `bun add -D husky`
  - Initialize husky: `bunx husky init`
  - Create `.husky/pre-commit` hook with ownership, TypeScript, ESLint, and test checks
  - _Requirements: 4.1-4.7, 7.1-7.7, 19.1, 19.5_

- [x] 7. Checkpoint - Verify infrastructure setup
  - Test ownership checking with sample files
  - Test work log parsing and conflict detection
  - Test pre-commit hook with intentional violations
  - Ensure all tests pass, ask the user if questions arise

### Phase 2: Documentation Standards (Week 1-2)

- [-] 8. Create comprehensive documentation templates
  - Create `.kiro/coordination/templates/module-documentation.md` for module structure
  - Create `.kiro/coordination/templates/api-documentation.md` for server functions
  - Create `.kiro/coordination/templates/component-documentation.md` for UI components
  - _Requirements: 17.1, 17.2, 17.3, 17.5_

- [~] 9. Document existing module structure
  - Document `src/modules/` directory organization
  - Create index documentation for each existing module
  - Document public APIs and exports
  - _Requirements: 16.1, 16.5, 16.6_

- [~] 10. Update project README
  - Add "Coordination System" section explaining Kiro-Lovable workflow
  - Document file ownership rules
  - Document handoff procedures
  - Add links to coordination templates
  - _Requirements: 17.4, 11.1, 11.2_

### Phase 3: Code Quality Cleanup (Week 2-3)

- [x] 11. Create structured logging utility
  - Implement `src/lib/logger.ts` with debug, info, warn, error methods
  - Support structured logging with context objects
  - Implement development vs production logging modes
  - Add TypeScript types for log levels and context
  - _Requirements: 7.2, 5.5_

- [x] 12. Replace console.log statements with structured logging
  - [x] 12.1 Audit codebase for console.log usage
    - Run grep search to find all console.log statements
    - Categorize by file ownership (Kiro vs Lovable)
    - Create list of files requiring updates
    - _Requirements: 7.1_
  
  - [x] 12.2 Replace console.log in Kiro-owned files
    - Replace console.log in `src/server/**/*`
    - Replace console.log in `src/lib/**/*`
    - Replace console.log in `src/integrations/supabase/**/*`
    - Use appropriate log levels (debug, info, warn, error)
    - _Requirements: 7.1, 7.2_
  
  - [x] 12.3 Replace console.log in shared files
    - Replace console.log in `src/hooks/**/*`
    - Replace console.log in `src/routes/**/*`
    - Coordinate with Lovable for UI-specific logging
    - _Requirements: 7.1, 7.2_

- [~] 13. Enhance ESLint configuration with coordination rules
  - Update `eslint.config.js` with no-console rule (error level)
  - Add @typescript-eslint/no-explicit-any rule (error level)
  - Add @typescript-eslint/explicit-function-return-type rule
  - Add @typescript-eslint/explicit-module-boundary-types rule
  - Add react-hooks/exhaustive-deps rule (error level)
  - Add max-lines-per-function rule (warn at 50 lines)
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.4, 7.7_

- [x] 14. Fix TypeScript 'any' types
  - [x] 14.1 Audit codebase for 'any' usage
    - Run TypeScript compiler with strict mode
    - Generate list of all 'any' types in codebase
    - Prioritize by file ownership and criticality
    - _Requirements: 4.1_
  
  - [x] 14.2 Create missing type definitions
    - Create type definitions in `src/modules/*/types.ts`
    - Define interfaces for API responses
    - Define types for Zustand store state
    - Define types for component props
    - _Requirements: 4.5, 4.6_
  
  - [x] 14.3 Replace 'any' with proper types in Kiro-owned files
    - Fix 'any' in server functions
    - Fix 'any' in utility libraries
    - Fix 'any' in Supabase integration
    - Add explicit return types to all functions
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 14.4 Write unit tests for new type definitions
    - Test type inference and type guards
    - Test type compatibility across modules
    - _Requirements: 6.1, 6.6_

- [ ] 15. Add comprehensive error handling
  - [x] 15.1 Implement error handling in server functions
    - Add try-catch blocks to all async server functions
    - Create structured error response types
    - Implement error logging with context
    - _Requirements: 5.1, 5.3, 5.5_
  
  - [~] 15.2 Create error boundary components
    - Create `src/components/ErrorBoundary.tsx` (Lovable)
    - Wrap critical sections with error boundaries
    - Implement fallback UI for errors
    - _Requirements: 5.6_
  
  - [~] 15.3 Implement user-friendly error messages
    - Create error message mapping utility
    - Replace technical errors with user-friendly messages
    - Add actionable error recovery suggestions
    - _Requirements: 5.2, 5.4_
  
  - [ ]* 15.4 Write integration tests for error handling
    - Test error propagation from server to UI
    - Test error boundary behavior
    - Test error recovery flows
    - _Requirements: 6.1, 6.7_

- [ ] 16. Fix memory leaks in useEffect hooks
  - [~] 16.1 Audit useEffect hooks for cleanup functions
    - Search for useEffect without cleanup returns
    - Identify subscriptions, timers, and event listeners
    - Prioritize by impact and frequency
    - _Requirements: 7.4_
  
  - [~] 16.2 Add cleanup functions to useEffect hooks
    - Add cleanup for event listeners
    - Add cleanup for subscriptions (Supabase realtime)
    - Add cleanup for timers and intervals
    - Add cleanup for AbortController in fetch calls
    - _Requirements: 7.4_
  
  - [ ]* 16.3 Write tests for cleanup behavior
    - Test that cleanup functions are called on unmount
    - Test that subscriptions are properly cancelled
    - _Requirements: 6.3_

- [~] 17. Checkpoint - Verify code quality improvements
  - Run ESLint and verify no errors
  - Run TypeScript compiler in strict mode
  - Verify all console.log replaced with logger
  - Verify no 'any' types remain
  - Ensure all tests pass, ask the user if questions arise

### Phase 4: Store Refactoring (Week 3-4)

- [~] 18. Analyze current store structure
  - Identify all state slices in existing store
  - Map state to feature modules
  - Identify dependencies between state slices
  - Create refactoring plan for module-based stores
  - _Requirements: 15.5_

- [ ] 19. Create module-specific store structure
  - [~] 19.1 Create prospecting module store
    - Create `src/modules/prospecting/types.ts` with state and action types
    - Create `src/modules/prospecting/prospecting-store.ts` (under 300 lines)
    - Migrate lead-related state from main store
    - Migrate lead-related actions from main store
    - Export store hook and selectors
    - _Requirements: 15.1, 15.2, 15.5, 16.1, 16.2_
  
  - [~] 19.2 Create CRM module store
    - Create `src/modules/crm/types.ts` with state and action types
    - Create `src/modules/crm/crm-store.ts` (under 300 lines)
    - Migrate CRM-related state from main store
    - Migrate CRM-related actions from main store
    - Export store hook and selectors
    - _Requirements: 15.1, 15.2, 15.5, 16.1, 16.2_
  
  - [~] 19.3 Create market research module store
    - Create `src/modules/market-research/types.ts` with state and action types
    - Create `src/modules/market-research/market-research-store.ts` (under 300 lines)
    - Migrate market research state from main store
    - Migrate market research actions from main store
    - Export store hook and selectors
    - _Requirements: 15.1, 15.2, 15.5, 16.1, 16.2_
  
  - [~] 19.4 Create jobs module store
    - Create `src/modules/jobs/types.ts` with state and action types
    - Create `src/modules/jobs/jobs-store.ts` (under 300 lines)
    - Migrate background job state from main store
    - Migrate job-related actions from main store
    - Export store hook and selectors
    - _Requirements: 15.1, 15.2, 15.5, 16.1, 16.2_
  
  - [ ]* 19.5 Write unit tests for module stores
    - Test state initialization
    - Test action execution and state updates
    - Test selector functions
    - Test store isolation (no cross-module dependencies)
    - _Requirements: 6.1, 6.6_

- [ ] 20. Update components to use new stores
  - [~] 20.1 Update prospecting components
    - Update components in `src/components/buscador/` to use prospecting store
    - Remove references to old store
    - Verify no direct state mutation
    - _Requirements: 15.3, 15.6_
  
  - [~] 20.2 Update CRM components
    - Update components in `src/components/crm/` to use CRM store
    - Remove references to old store
    - Verify no direct state mutation
    - _Requirements: 15.3, 15.6_
  
  - [~] 20.3 Update market research components
    - Update components in `src/components/market-research/` to use market research store
    - Remove references to old store
    - Verify no direct state mutation
    - _Requirements: 15.3, 15.6_
  
  - [~] 20.4 Update job components
    - Update components in `src/components/jobs/` to use jobs store
    - Remove references to old store
    - Verify no direct state mutation
    - _Requirements: 15.3, 15.6_

- [~] 21. Remove or minimize old monolithic store
  - Archive old store file for reference
  - Remove unused state slices
  - Keep only global app state (if any)
  - Update imports across codebase
  - _Requirements: 15.5, 7.5_

- [~] 22. Checkpoint - Verify store refactoring
  - Verify all components use new module stores
  - Verify no direct state mutation
  - Run all tests to ensure functionality preserved
  - Check bundle size impact
  - Ensure all tests pass, ask the user if questions arise

### Phase 5: Testing Infrastructure (Week 4-5)

- [~] 23. Set up comprehensive testing infrastructure
  - Verify Vitest configuration in `vite.config.ts`
  - Configure test coverage reporting
  - Set up test utilities in `src/__tests__/utils/`
  - Create test data factories for common entities
  - _Requirements: 6.4, 6.5_

- [ ] 24. Create unit tests for server functions
  - [~] 24.1 Write tests for authentication functions
    - Test `src/server/auth.ts` functions
    - Test success and error cases
    - Test input validation
    - _Requirements: 6.1, 14.1, 14.2_
  
  - [~] 24.2 Write tests for lead management functions
    - Test lead creation, update, deletion
    - Test data validation
    - Test error handling
    - _Requirements: 6.1_
  
  - [~] 24.3 Write tests for Supabase integration
    - Test database queries
    - Test realtime subscriptions
    - Test error handling and retries
    - _Requirements: 6.1_
  
  - [ ]* 24.4 Write property-based tests for data validation
    - Test that all valid inputs are accepted
    - Test that all invalid inputs are rejected
    - Run 100+ iterations per property
    - _Requirements: 6.2_

- [ ] 25. Create component tests for UI components
  - [ ]* 25.1 Write tests for CRM components
    - Test `CRMSummaryBar` rendering and interactions
    - Test `LeadCard` component behavior
    - Test error states and loading states
    - _Requirements: 6.3_
  
  - [ ]* 25.2 Write tests for prospecting components
    - Test search functionality
    - Test results table rendering
    - Test bulk operations
    - _Requirements: 6.3_
  
  - [ ]* 25.3 Write tests for market research components
    - Test input validation
    - Test results display
    - Test source citations
    - _Requirements: 6.3_

- [ ] 26. Create integration tests
  - [ ]* 26.1 Write end-to-end flow tests
    - Test lead creation to CRM flow
    - Test search to export flow
    - Test authentication flow
    - _Requirements: 6.7_
  
  - [ ]* 26.2 Write API integration tests
    - Test server function integration with Supabase
    - Test error propagation from backend to frontend
    - Test state synchronization
    - _Requirements: 6.7_

- [~] 27. Create smoke tests for critical paths
  - Write smoke test for app initialization
  - Write smoke test for authentication
  - Write smoke test for lead search
  - Write smoke test for CRM operations
  - _Requirements: 6.7_

- [~] 28. Checkpoint - Verify testing infrastructure
  - Run full test suite and verify all pass
  - Check test coverage meets minimum thresholds
  - Verify tests run in CI/CD pipeline
  - Ensure all tests pass, ask the user if questions arise

### Phase 6: Workflow Training and Documentation (Week 5)

- [~] 29. Create workflow documentation
  - Document step-by-step coordination workflow
  - Create examples of successful handoffs
  - Document conflict resolution procedures
  - Create troubleshooting guide
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [~] 30. Practice coordination workflows
  - Simulate Kiro → Lovable handoff with sample feature
  - Simulate Lovable → Kiro handoff with sample feature
  - Practice conflict detection and resolution
  - Verify all coordination tools work as expected
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [~] 31. Document rollback procedures
  - Create rollback checklist
  - Document git revert procedures
  - Document backup branch strategy
  - Create examples of rollback scenarios
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [~] 32. Create review checkpoint templates
  - Create backend review checklist
  - Create UI review checklist
  - Document review criteria
  - Create review workflow documentation
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [~] 33. Update project documentation
  - Update README with coordination system overview
  - Document all CLI commands
  - Create quick reference guide
  - Add troubleshooting section
  - _Requirements: 17.4_

### Phase 7: Continuous Improvement (Ongoing)

- [~] 34. Monitor coordination effectiveness
  - Track merge conflicts over time
  - Track handoff success rate
  - Identify pain points in workflow
  - Gather feedback on coordination tools
  - _Requirements: 8.1, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [~] 35. Refine ownership rules based on experience
  - Review file ownership assignments
  - Adjust shared file list based on actual conflicts
  - Update ownership registry as needed
  - Document ownership changes
  - _Requirements: 1.1-1.12_

- [~] 36. Enhance automation tools
  - Add more sophisticated conflict detection
  - Improve pre-commit hook performance
  - Add automated handoff generation
  - Enhance work log automation
  - _Requirements: 8.1, 8.2, 8.3_

- [~] 37. Optimize build and deployment coordination
  - Verify build optimization for both tools' changes
  - Implement automated deployment checks
  - Add performance regression detection
  - Monitor bundle size changes
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [~] 38. Final checkpoint - System validation
  - Verify all coordination tools functional
  - Verify all code quality standards enforced
  - Verify all documentation complete
  - Verify testing infrastructure comprehensive
  - Ensure all tests pass, ask the user if questions arise

## Notes

### Task Ownership
- **Kiro**: Tasks 1-38 (infrastructure, tooling, refactoring, testing)
- **Lovable**: Will be involved in tasks 15.2 (error boundaries), 20.x (component updates), and 25.x (component tests) through coordination

### Optional Tasks
- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- All core implementation tasks (infrastructure, refactoring, documentation) are required

### Dependencies
- Phase 1 must complete before Phase 2
- Phase 3 depends on Phase 1 (ESLint rules need pre-commit hook)
- Phase 4 depends on Phase 3 (clean code before refactoring)
- Phase 5 can run in parallel with Phase 4 (testing existing code)
- Phase 6 depends on Phases 1-5 (document what's built)
- Phase 7 is ongoing after Phase 6

### Checkpoints
- 7 checkpoint tasks ensure incremental validation
- Each checkpoint requires user confirmation before proceeding
- Checkpoints verify: infrastructure setup, code quality, store refactoring, testing, and final system validation

### Requirements Coverage
- All 20 requirements are covered by implementation tasks
- Each task explicitly references the requirements it addresses
- Requirements are validated through automated quality gates and manual checkpoints

### Testing Strategy
- Unit tests for all server functions and stores
- Component tests for UI components (optional)
- Integration tests for end-to-end flows (optional)
- Property-based tests for critical validation logic (optional)
- Smoke tests for critical paths (required)

### Coordination Points
- Task 15.2: Lovable creates error boundary components
- Tasks 20.1-20.4: Lovable updates components to use new stores
- Tasks 25.1-25.3: Lovable writes component tests (optional)
- Task 30: Practice handoff workflows between Kiro and Lovable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1"] },
    { "id": 1, "tasks": ["6.1", "8.1", "9.1", "10.1"] },
    { "id": 2, "tasks": ["11.1", "13.1"] },
    { "id": 3, "tasks": ["12.1", "14.1"] },
    { "id": 4, "tasks": ["12.2", "12.3", "14.2"] },
    { "id": 5, "tasks": ["14.3", "14.4", "15.1"] },
    { "id": 6, "tasks": ["15.2", "15.3", "16.1"] },
    { "id": 7, "tasks": ["15.4", "16.2", "16.3", "18.1"] },
    { "id": 8, "tasks": ["19.1", "19.2", "19.3", "19.4"] },
    { "id": 9, "tasks": ["19.5"] },
    { "id": 10, "tasks": ["20.1", "20.2", "20.3", "20.4"] },
    { "id": 11, "tasks": ["21.1", "23.1"] },
    { "id": 12, "tasks": ["24.1", "24.2", "24.3"] },
    { "id": 13, "tasks": ["24.4", "25.1", "25.2", "25.3", "27.1"] },
    { "id": 14, "tasks": ["26.1", "26.2"] },
    { "id": 15, "tasks": ["29.1", "30.1", "31.1", "32.1", "33.1"] },
    { "id": 16, "tasks": ["34.1", "35.1", "36.1", "37.1"] }
  ]
}
```
