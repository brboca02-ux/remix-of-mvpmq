# Requirements Document

## Introduction

The Kiro-Lovable Coordination System establishes a structured collaboration framework for the MarketScope AI project, which is being developed simultaneously by two AI development tools: Kiro (advanced AI development environment) and Lovable (UI-focused AI development tool). This system defines clear ownership boundaries, coordination workflows, code quality standards, and conflict resolution procedures to prevent merge conflicts, duplicated work, and inconsistent code patterns.

## Glossary

- **Kiro**: Advanced AI development environment responsible for complex logic, backend integrations, type systems, server functions, and testing infrastructure
- **Lovable**: UI-focused AI development tool responsible for visual components, design system implementation, user experience, and styling
- **Coordination_System**: The complete set of rules, workflows, and standards governing collaboration between Kiro and Lovable
- **File_Ownership**: Assignment of primary responsibility for specific files or directories to either Kiro or Lovable
- **Shared_File**: A file that requires coordination between both tools before modification
- **Handoff_Procedure**: The process of transferring work context from one tool to another
- **Conflict_Detection**: Automated or manual identification of overlapping changes before they cause merge conflicts
- **Code_Quality_Gate**: A checkpoint that enforces TypeScript strict mode, error handling patterns, and testing requirements
- **User**: The human developer coordinating both Kiro and Lovable
- **Project**: The MarketScope AI application built with React, TanStack Router, Zustand, Supabase, and shadcn/ui

## Requirements

### Requirement 1: File Ownership Rules

**User Story:** As a User, I want clear file ownership rules, so that Kiro and Lovable do not modify the same files simultaneously and cause conflicts.

#### Acceptance Criteria

1. THE Coordination_System SHALL designate all files in `src/server/` as Kiro-owned
2. THE Coordination_System SHALL designate all files in `src/lib/` as Kiro-owned
3. THE Coordination_System SHALL designate all files in `src/modules/*/types.ts` as Kiro-owned
4. THE Coordination_System SHALL designate all files in `src/integrations/supabase/` as Kiro-owned
5. THE Coordination_System SHALL designate all files in `src/__tests__/` and `src/tests/` as Kiro-owned
6. THE Coordination_System SHALL designate all files in `src/components/ui/` as Lovable-owned
7. THE Coordination_System SHALL designate all files in `src/components/templates/` as Lovable-owned
8. THE Coordination_System SHALL designate all files matching `src/components/**/*.tsx` (excluding ui and templates) as Lovable-owned
9. THE Coordination_System SHALL designate `src/styles.css` and `tailwind.config.*` as Lovable-owned
10. THE Coordination_System SHALL designate `src/routes/*.tsx` as Shared_File requiring coordination
11. THE Coordination_System SHALL designate `src/hooks/*.ts` and `src/hooks/*.tsx` as Shared_File requiring coordination
12. THE Coordination_System SHALL designate `package.json` and `tsconfig.json` as Shared_File requiring coordination

### Requirement 2: Coordination Workflow for Shared Files

**User Story:** As a User, I want a coordination workflow for shared files, so that both tools can collaborate on the same file without conflicts.

#### Acceptance Criteria

1. WHEN a tool needs to modify a Shared_File, THE Coordination_System SHALL require the tool to announce the intended changes to the User
2. WHEN the User approves changes to a Shared_File, THE Coordination_System SHALL require the tool to document what was changed and why
3. WHEN one tool modifies a Shared_File, THE Coordination_System SHALL require the User to inform the other tool of the changes before that tool makes further modifications
4. THE Coordination_System SHALL require both tools to read the current state of a Shared_File before proposing modifications
5. IF both tools need to modify the same Shared_File simultaneously, THEN THE Coordination_System SHALL require the User to sequence the changes with explicit handoff

### Requirement 3: Handoff Procedures

**User Story:** As a User, I want clear handoff procedures, so that I can efficiently transfer work context between Kiro and Lovable.

#### Acceptance Criteria

1. WHEN transferring work from Kiro to Lovable, THE Coordination_System SHALL require Kiro to provide a summary of completed backend changes, new types added, and API contracts established
2. WHEN transferring work from Lovable to Kiro, THE Coordination_System SHALL require Lovable to provide a summary of new UI components created, user interactions added, and integration points needed
3. THE Coordination_System SHALL require handoff summaries to include file paths of all modified files
4. THE Coordination_System SHALL require handoff summaries to include any new dependencies added to package.json
5. WHEN a handoff occurs, THE Coordination_System SHALL require the receiving tool to acknowledge understanding of the context before proceeding

### Requirement 4: TypeScript Strict Mode Enforcement

**User Story:** As a User, I want TypeScript strict mode enforced, so that the codebase maintains type safety and eliminates the 100+ `any` types currently present.

#### Acceptance Criteria

1. THE Coordination_System SHALL require all new code to use explicit types instead of `any`
2. THE Coordination_System SHALL require all function parameters to have type annotations
3. THE Coordination_System SHALL require all function return types to be explicitly declared
4. THE Coordination_System SHALL require all React component props to use TypeScript interfaces or types
5. WHEN Kiro creates or modifies type definitions, THE Coordination_System SHALL require those types to be exported from `src/modules/*/types.ts` or `src/types/*.ts`
6. WHEN Lovable needs new types, THE Coordination_System SHALL require Lovable to request type definitions from Kiro rather than using `any`
7. THE Coordination_System SHALL prohibit the use of `@ts-ignore` or `@ts-expect-error` without documented justification

### Requirement 5: Error Handling Standards

**User Story:** As a User, I want consistent error handling patterns, so that the application handles failures gracefully and provides useful error messages.

#### Acceptance Criteria

1. THE Coordination_System SHALL require all async functions to use try-catch blocks
2. THE Coordination_System SHALL require all error messages to be user-friendly and actionable
3. THE Coordination_System SHALL require all server functions to return structured error responses with error codes
4. WHEN Lovable creates UI components that call async operations, THE Coordination_System SHALL require error states to be displayed to users
5. WHEN Kiro creates server functions, THE Coordination_System SHALL require error logging with sufficient context for debugging
6. THE Coordination_System SHALL require all React components to implement error boundaries for critical sections
7. THE Coordination_System SHALL prohibit silent error swallowing (empty catch blocks without logging)

### Requirement 6: Testing Requirements

**User Story:** As a User, I want comprehensive testing requirements, so that both tools contribute to a well-tested codebase.

#### Acceptance Criteria

1. WHEN Kiro creates server functions, THE Coordination_System SHALL require unit tests to be created in `src/__tests__/`
2. WHEN Kiro creates complex business logic, THE Coordination_System SHALL require property-based tests for critical paths
3. WHEN Lovable creates reusable UI components, THE Coordination_System SHALL require component tests to be created
4. THE Coordination_System SHALL require all tests to use the project's testing framework (Vitest)
5. THE Coordination_System SHALL require test files to follow the naming convention `*.test.ts` or `*.test.tsx`
6. WHEN Kiro modifies type definitions, THE Coordination_System SHALL require existing tests to be updated to reflect type changes
7. THE Coordination_System SHALL require all new features to include at least one smoke test

### Requirement 7: Code Quality Standards

**User Story:** As a User, I want code quality standards enforced, so that the codebase remains maintainable and eliminates the 100+ console.log statements currently present.

#### Acceptance Criteria

1. THE Coordination_System SHALL prohibit `console.log` statements in production code
2. WHERE debugging output is needed, THE Coordination_System SHALL require the use of a structured logging utility
3. THE Coordination_System SHALL require all React components to be functional components using hooks
4. THE Coordination_System SHALL prohibit memory leaks in useEffect hooks by requiring cleanup functions
5. THE Coordination_System SHALL require all large files (over 500 lines) to be refactored into smaller, focused modules
6. THE Coordination_System SHALL require all magic numbers and strings to be extracted into named constants
7. THE Coordination_System SHALL require all functions to have a single, clear responsibility

### Requirement 8: Conflict Detection

**User Story:** As a User, I want early conflict detection, so that I can prevent merge conflicts before they occur.

#### Acceptance Criteria

1. WHEN a tool begins work, THE Coordination_System SHALL require the tool to check which files were recently modified by the other tool
2. THE Coordination_System SHALL require the User to maintain a work log indicating which tool is currently working on which files
3. WHEN a tool detects that a file it needs to modify was recently changed by the other tool, THE Coordination_System SHALL require the tool to alert the User
4. THE Coordination_System SHALL require both tools to pull the latest changes before starting new work
5. WHEN the User switches between tools, THE Coordination_System SHALL require the User to commit or stash changes from the previous tool

### Requirement 9: Conflict Resolution Procedures

**User Story:** As a User, I want clear conflict resolution procedures, so that I can quickly resolve conflicts when they occur.

#### Acceptance Criteria

1. WHEN a merge conflict occurs, THE Coordination_System SHALL require the User to identify which tool's changes should take precedence based on file ownership
2. IF a conflict occurs in a Kiro-owned file, THEN THE Coordination_System SHALL require Kiro to resolve the conflict
3. IF a conflict occurs in a Lovable-owned file, THEN THE Coordination_System SHALL require Lovable to resolve the conflict
4. IF a conflict occurs in a Shared_File, THEN THE Coordination_System SHALL require the User to manually review and merge both sets of changes
5. WHEN a conflict is resolved, THE Coordination_System SHALL require the resolving tool to verify that the resolution does not break existing functionality
6. THE Coordination_System SHALL require all conflict resolutions to be tested before committing

### Requirement 10: Rollback Strategies

**User Story:** As a User, I want rollback strategies, so that I can recover from problematic changes quickly.

#### Acceptance Criteria

1. THE Coordination_System SHALL require all significant changes to be committed with descriptive commit messages indicating which tool made the change
2. THE Coordination_System SHALL require commit messages to follow the format: `[Kiro]` or `[Lovable]` prefix followed by a description
3. WHEN a change causes issues, THE Coordination_System SHALL support reverting to the last known good state using git revert
4. THE Coordination_System SHALL require the User to create a backup branch before major refactoring by either tool
5. WHEN rolling back changes, THE Coordination_System SHALL require the User to inform both tools of the rollback and the reason

### Requirement 11: Communication Protocol

**User Story:** As a User, I want a clear communication protocol, so that I can effectively coordinate between Kiro and Lovable.

#### Acceptance Criteria

1. THE Coordination_System SHALL require the User to explicitly state which tool is being addressed in each request
2. WHEN the User switches tools, THE Coordination_System SHALL require the User to provide context about what the previous tool accomplished
3. THE Coordination_System SHALL require each tool to provide status updates in a consistent format including: files modified, features added, and next steps needed
4. WHEN a tool completes work, THE Coordination_System SHALL require the tool to indicate whether handoff to the other tool is needed
5. THE Coordination_System SHALL require both tools to acknowledge when they receive handoff context

### Requirement 12: Dependency Management

**User Story:** As a User, I want coordinated dependency management, so that both tools do not add conflicting or duplicate dependencies.

#### Acceptance Criteria

1. WHEN Kiro needs to add a backend dependency, THE Coordination_System SHALL require Kiro to add it to package.json and inform the User
2. WHEN Lovable needs to add a UI dependency, THE Coordination_System SHALL require Lovable to check if a similar dependency already exists
3. THE Coordination_System SHALL prohibit both tools from adding dependencies without User approval
4. WHEN a dependency is added, THE Coordination_System SHALL require the tool to document why the dependency is needed
5. THE Coordination_System SHALL require both tools to use the project's package manager (bun) consistently

### Requirement 13: Environment Variable Security

**User Story:** As a User, I want secure environment variable handling, so that secrets are not exposed in the codebase.

#### Acceptance Criteria

1. THE Coordination_System SHALL prohibit both tools from committing `.env` files to version control
2. THE Coordination_System SHALL require all environment variables to be documented in a `.env.example` file
3. WHEN Kiro creates server functions that use environment variables, THE Coordination_System SHALL require those variables to be validated at runtime
4. THE Coordination_System SHALL prohibit hardcoded API keys, tokens, or passwords in any file
5. WHEN Lovable needs to reference environment variables, THE Coordination_System SHALL require Lovable to use the project's environment variable access pattern

### Requirement 14: Authentication and Authorization Coordination

**User Story:** As a User, I want coordinated authentication handling, so that mock authentication is removed and real authentication is properly implemented.

#### Acceptance Criteria

1. THE Coordination_System SHALL require Kiro to implement authentication logic in `src/server/` and `src/integrations/supabase/`
2. THE Coordination_System SHALL require Lovable to implement authentication UI components in `src/components/`
3. THE Coordination_System SHALL prohibit mock authentication code in production builds
4. WHEN Kiro implements authentication endpoints, THE Coordination_System SHALL require Kiro to provide type definitions for auth state
5. WHEN Lovable implements login UI, THE Coordination_System SHALL require Lovable to use the auth types provided by Kiro
6. THE Coordination_System SHALL require both tools to coordinate on the authentication flow before implementation

### Requirement 15: State Management Coordination

**User Story:** As a User, I want coordinated state management, so that the 1000+ line store file is properly refactored and both tools use consistent state patterns.

#### Acceptance Criteria

1. THE Coordination_System SHALL require Kiro to define Zustand store structures and types in `src/modules/*/types.ts`
2. THE Coordination_System SHALL require Kiro to create store files in `src/modules/*/*-store.ts`
3. THE Coordination_System SHALL require Lovable to use existing stores rather than creating new state management solutions
4. WHEN Lovable needs new state, THE Coordination_System SHALL require Lovable to request store additions from Kiro
5. THE Coordination_System SHALL require all stores to be split into focused modules (under 300 lines each)
6. THE Coordination_System SHALL prohibit direct state mutation outside of store actions

### Requirement 16: Module Boundary Enforcement

**User Story:** As a User, I want clear module boundaries, so that the codebase remains organized and both tools respect architectural decisions.

#### Acceptance Criteria

1. THE Coordination_System SHALL require all business logic for a feature to be contained in `src/modules/{feature-name}/`
2. THE Coordination_System SHALL require Kiro to create module structure including types, stores, and server functions
3. THE Coordination_System SHALL require Lovable to create UI components that consume module exports
4. THE Coordination_System SHALL prohibit cross-module imports except through public module exports
5. THE Coordination_System SHALL require each module to have an index.ts file that exports its public API
6. WHEN Kiro creates a new module, THE Coordination_System SHALL require Kiro to document the module's purpose and public API

### Requirement 17: Documentation Standards

**User Story:** As a User, I want consistent documentation, so that both tools can understand each other's work and maintain the codebase effectively.

#### Acceptance Criteria

1. THE Coordination_System SHALL require Kiro to document all server functions with JSDoc comments including parameters, return types, and error conditions
2. THE Coordination_System SHALL require Kiro to document all type definitions with descriptions of their purpose
3. THE Coordination_System SHALL require Lovable to document complex UI components with usage examples
4. THE Coordination_System SHALL require both tools to update README.md when adding new features or changing architecture
5. WHEN Kiro creates API endpoints, THE Coordination_System SHALL require API documentation to be created or updated
6. THE Coordination_System SHALL require all exported functions and types to have documentation comments

### Requirement 18: Performance Optimization Coordination

**User Story:** As a User, I want coordinated performance optimization, so that both tools contribute to a fast, efficient application.

#### Acceptance Criteria

1. WHEN Kiro creates server functions, THE Coordination_System SHALL require Kiro to consider response time and implement caching where appropriate
2. WHEN Lovable creates UI components, THE Coordination_System SHALL require Lovable to use React.memo for expensive components
3. THE Coordination_System SHALL require both tools to avoid unnecessary re-renders by properly managing dependencies
4. THE Coordination_System SHALL require Kiro to implement database query optimization for frequently accessed data
5. THE Coordination_System SHALL require Lovable to implement lazy loading for routes and heavy components
6. WHEN performance issues are identified, THE Coordination_System SHALL require the responsible tool (based on file ownership) to address them

### Requirement 19: Build and Deployment Coordination

**User Story:** As a User, I want coordinated build and deployment processes, so that changes from both tools integrate smoothly into production.

#### Acceptance Criteria

1. THE Coordination_System SHALL require both tools to verify that the project builds successfully after their changes
2. THE Coordination_System SHALL require both tools to run the test suite before declaring work complete
3. WHEN Kiro modifies server functions, THE Coordination_System SHALL require Kiro to verify that edge functions deploy correctly
4. WHEN Lovable modifies UI components, THE Coordination_System SHALL require Lovable to verify that the build output is optimized
5. THE Coordination_System SHALL require both tools to check for TypeScript errors before committing
6. THE Coordination_System SHALL require both tools to verify that no new console warnings are introduced

### Requirement 20: Review Checkpoints

**User Story:** As a User, I want structured review checkpoints, so that I can verify work quality before moving forward.

#### Acceptance Criteria

1. WHEN Kiro completes a backend feature, THE Coordination_System SHALL require a review checkpoint where the User verifies type safety, error handling, and tests
2. WHEN Lovable completes a UI feature, THE Coordination_System SHALL require a review checkpoint where the User verifies component structure, accessibility, and integration
3. THE Coordination_System SHALL require both tools to provide a summary of changes at each review checkpoint
4. WHEN a review checkpoint identifies issues, THE Coordination_System SHALL require the responsible tool to address issues before proceeding
5. THE Coordination_System SHALL require review checkpoints before merging to main branch
6. THE Coordination_System SHALL require both tools to confirm that their changes do not break existing functionality at each checkpoint
