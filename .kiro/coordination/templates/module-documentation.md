# Module Documentation: [Module Name]

**Module Path**: `src/modules/[module-name]/`  
**Owner**: Kiro  
**Last Updated**: YYYY-MM-DD  
**Status**: [Active | In Development | Deprecated]

---

## Overview

### Purpose
[Brief description of what this module does and why it exists]

### Responsibilities
- [Primary responsibility 1]
- [Primary responsibility 2]
- [Primary responsibility 3]

### Dependencies
- **Internal Modules**: [List other modules this depends on]
- **External Libraries**: [List npm packages used]
- **Supabase Tables**: [List database tables accessed]

---

## Module Structure

```
src/modules/[module-name]/
├── types.ts                    # TypeScript type definitions (Kiro-owned)
├── [module-name]-store.ts      # Zustand store (Kiro-owned)
├── index.ts                    # Public API exports (Kiro-owned)
├── server/                     # Server functions (Kiro-owned)
│   ├── [function-1].ts
│   └── [function-2].ts
├── hooks/                      # React hooks (Shared)
│   └── use[HookName].ts
└── components/                 # UI components (Lovable-owned)
    ├── [Component1].tsx
    └── [Component2].tsx
```

---

## Public API

### Exported Types

#### `[TypeName]`
```typescript
export interface [TypeName] {
  // Type definition
}
```

**Purpose**: [What this type represents]

**Usage Example**:
```typescript
const example: [TypeName] = {
  // Example usage
};
```

---

### Store

#### State Shape
```typescript
interface [ModuleName]State {
  // State properties
}
```

#### Actions

##### `[actionName]`
```typescript
[actionName]: (param1: Type1, param2: Type2) => ReturnType
```

**Purpose**: [What this action does]

**Parameters**:
- `param1` (Type1): [Description]
- `param2` (Type2): [Description]

**Returns**: [Description of return value]

**Side Effects**: [Any side effects like API calls, state updates]

**Usage Example**:
```typescript
const store = use[ModuleName]Store();
store.[actionName](value1, value2);
```

#### Selectors

##### `[selectorName]`
```typescript
const [selectorName] = (state: [ModuleName]State) => DerivedType
```

**Purpose**: [What this selector computes]

**Usage Example**:
```typescript
const value = use[ModuleName]Store([selectorName]);
```

---

### Server Functions

#### `[serverFunctionName]`

**File**: `src/modules/[module-name]/server/[function-name].ts`

**Purpose**: [What this server function does]

**Input Schema**:
```typescript
{
  field1: Type1;
  field2: Type2;
}
```

**Output Schema**:
```typescript
{
  result: ResultType;
}
```

**Error Codes**:
- `ERROR_CODE_1`: [Description]
- `ERROR_CODE_2`: [Description]

**Usage Example**:
```typescript
import { [serverFunctionName] } from '@/modules/[module-name]';

const result = await [serverFunctionName]({
  field1: value1,
  field2: value2,
});
```

---

### Hooks

#### `use[HookName]`

**File**: `src/modules/[module-name]/hooks/use[HookName].ts`

**Purpose**: [What this hook provides]

**Parameters**:
```typescript
(param1: Type1, param2?: Type2) => ReturnType
```

**Returns**:
```typescript
{
  data: DataType;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Usage Example**:
```typescript
const { data, loading, error } = use[HookName](param1);
```

---

## Components

### `[ComponentName]`

**File**: `src/modules/[module-name]/components/[ComponentName].tsx`  
**Owner**: Lovable

**Purpose**: [What this component displays/does]

**Props**:
```typescript
interface [ComponentName]Props {
  prop1: Type1;
  prop2?: Type2;
  onAction?: (data: DataType) => void;
}
```

**Usage Example**:
```tsx
<[ComponentName]
  prop1={value1}
  prop2={value2}
  onAction={handleAction}
/>
```

**Dependencies**:
- Store: `use[ModuleName]Store`
- Hooks: `use[HookName]`
- Components: `[OtherComponent]`

---

## Data Flow

### Typical User Flow
1. [Step 1: User action]
2. [Step 2: Component interaction]
3. [Step 3: Store update]
4. [Step 4: Server function call]
5. [Step 5: UI update]

### State Management Flow
```
User Action → Component Event → Store Action → Server Function → State Update → UI Re-render
```

---

## Integration Points

### With Other Modules
- **[Module1]**: [How they interact]
- **[Module2]**: [How they interact]

### With External Services
- **Supabase**: [Tables and operations]
- **External APIs**: [Which APIs and why]

---

## Testing

### Unit Tests
**Location**: `src/__tests__/modules/[module-name]/`

**Coverage**:
- [ ] Store actions
- [ ] Server functions
- [ ] Type guards
- [ ] Utility functions

### Integration Tests
- [ ] End-to-end user flows
- [ ] API integration
- [ ] State synchronization

### Property-Based Tests
- [ ] Data validation
- [ ] State transitions
- [ ] Business logic invariants

---

## Performance Considerations

### Optimization Strategies
- [Strategy 1: e.g., memoization, caching]
- [Strategy 2: e.g., lazy loading]
- [Strategy 3: e.g., debouncing]

### Known Bottlenecks
- [Bottleneck 1 and mitigation]
- [Bottleneck 2 and mitigation]

---

## Error Handling

### Common Errors
1. **[Error Type 1]**
   - **Cause**: [What causes this error]
   - **User Message**: "[User-friendly message]"
   - **Recovery**: [How to recover]

2. **[Error Type 2]**
   - **Cause**: [What causes this error]
   - **User Message**: "[User-friendly message]"
   - **Recovery**: [How to recover]

### Error Boundaries
- [Which components have error boundaries]
- [Fallback UI behavior]

---

## Security Considerations

### Authentication
- [Authentication requirements]
- [Authorization checks]

### Data Validation
- [Input validation rules]
- [Sanitization procedures]

### Sensitive Data
- [What data is sensitive]
- [How it's protected]

---

## Migration Guide

### Breaking Changes
- **Version X.X.X**: [Description of breaking change and migration steps]

### Deprecations
- **[Deprecated API]**: Use `[New API]` instead. Will be removed in version X.X.X.

---

## Troubleshooting

### Common Issues

#### Issue: [Problem description]
**Symptoms**: [What the user sees]  
**Cause**: [Root cause]  
**Solution**: [How to fix]

#### Issue: [Problem description]
**Symptoms**: [What the user sees]  
**Cause**: [Root cause]  
**Solution**: [How to fix]

---

## Future Enhancements

### Planned Features
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

### Technical Debt
- [ ] [Debt item 1]
- [ ] [Debt item 2]

---

## References

### Related Documentation
- [Link to design document]
- [Link to requirements]
- [Link to API documentation]

### External Resources
- [Relevant library documentation]
- [Architecture decision records]

---

## Changelog

### [Version] - YYYY-MM-DD
- [Change 1]
- [Change 2]

### [Version] - YYYY-MM-DD
- [Change 1]
- [Change 2]

---

## Coordination Notes

### Kiro Responsibilities
- Type definitions in `types.ts`
- Store implementation in `[module-name]-store.ts`
- Server functions in `server/`
- Public API in `index.ts`
- Unit and integration tests

### Lovable Responsibilities
- UI components in `components/`
- Component styling and layout
- User interaction handling
- Component tests (optional)

### Shared Responsibilities
- React hooks in `hooks/`
- Route integration
- State-to-UI binding

### Handoff Requirements
When Kiro adds new types or store actions:
1. Update this documentation
2. Create handoff document with type definitions
3. Notify Lovable of new APIs available

When Lovable adds new components:
1. Document component props and usage
2. Request any missing types from Kiro
3. Update this documentation with component list
