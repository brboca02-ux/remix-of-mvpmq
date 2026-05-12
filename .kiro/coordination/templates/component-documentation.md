# Component Documentation: [ComponentName]

**File**: `src/components/[path]/[ComponentName].tsx`  
**Owner**: Lovable  
**Last Updated**: YYYY-MM-DD  
**Status**: [Stable | Beta | Deprecated]

---

## Overview

### Purpose
[Brief description of what this component displays/does and why it exists]

### Use Cases
- [Use case 1: Where and when this component is used]
- [Use case 2: Specific user interaction or display scenario]
- [Use case 3: Integration with other features]

### Visual Preview
[Optional: Screenshot or description of component appearance]

---

## Component Signature

```typescript
export const [ComponentName]: React.FC<[ComponentName]Props> = ({
  prop1,
  prop2,
  onAction,
  className,
}) => {
  // Implementation
};
```

---

## Props Interface

### Type Definition
```typescript
interface [ComponentName]Props {
  prop1: Type1;
  prop2?: Type2;
  prop3?: Type3;
  onAction?: (data: DataType) => void;
  className?: string;
  children?: React.ReactNode;
}
```

### Props Documentation

#### `prop1` (required)
- **Type**: `Type1`
- **Description**: [What this prop controls or represents]
- **Example**: `"example value"` or `{ id: "123", name: "Example" }`
- **Validation**: [Any validation rules or constraints]

#### `prop2` (optional)
- **Type**: `Type2`
- **Default**: `undefined` or `defaultValue`
- **Description**: [What this prop controls or represents]
- **Example**: `42` or `true`

#### `prop3` (optional)
- **Type**: `Type3`
- **Default**: `undefined`
- **Description**: [What this prop controls or represents]
- **Example**: `"option1"`

#### `onAction` (optional)
- **Type**: `(data: DataType) => void`
- **Description**: Callback fired when [specific user action occurs]
- **Parameters**:
  - `data`: [Description of callback data]
- **Example**:
  ```typescript
  const handleAction = (data: DataType) => {
    console.log('Action triggered:', data);
  };
  ```

#### `className` (optional)
- **Type**: `string`
- **Default**: `undefined`
- **Description**: Additional CSS classes for styling customization
- **Example**: `"mt-4 border-2"`

#### `children` (optional)
- **Type**: `React.ReactNode`
- **Description**: [If component accepts children, describe what they represent]

---

## Usage Examples

### Basic Usage
```tsx
import { [ComponentName] } from '@/components/[path]/[ComponentName]';

function ParentComponent() {
  return (
    <[ComponentName]
      prop1="example value"
      prop2={42}
    />
  );
}
```

### With Event Handlers
```tsx
import { [ComponentName] } from '@/components/[path]/[ComponentName]';

function ParentComponent() {
  const handleAction = (data: DataType) => {
    console.log('Action triggered:', data);
    // Handle the action
  };

  return (
    <[ComponentName]
      prop1="example value"
      prop2={42}
      onAction={handleAction}
    />
  );
}
```

### With State Management
```tsx
import { [ComponentName] } from '@/components/[path]/[ComponentName]';
import { use[Module]Store } from '@/modules/[module]/[module]-store';

function ParentComponent() {
  const { data, actions } = use[Module]Store();

  return (
    <[ComponentName]
      prop1={data.field}
      onAction={actions.updateField}
    />
  );
}
```

### With Custom Styling
```tsx
import { [ComponentName] } from '@/components/[path]/[ComponentName]';

function ParentComponent() {
  return (
    <[ComponentName]
      prop1="example value"
      className="mt-6 shadow-lg border-primary"
    />
  );
}
```

### In Route Component
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { [ComponentName] } from '@/components/[path]/[ComponentName]';

export const Route = createFileRoute('/[route]')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto p-4">
      <h1>Page Title</h1>
      <[ComponentName]
        prop1="example value"
        prop2={42}
      />
    </div>
  );
}
```

---

## Dependencies

### Internal Dependencies
- **UI Components**: 
  - `@/components/ui/[component]` - [Purpose]
  - `@/components/ui/[component]` - [Purpose]
- **Hooks**: 
  - `use[HookName]` from `@/modules/[module]/hooks/use[HookName]` - [Purpose]
- **Stores**: 
  - `use[Module]Store` from `@/modules/[module]/[module]-store` - [Purpose]
- **Types**: 
  - `[TypeName]` from `@/modules/[module]/types` - [Purpose]
- **Utilities**: 
  - `[utilityName]` from `@/lib/[utility]` - [Purpose]

### External Dependencies
- **lucide-react**: Icons used - `[IconName]`, `[IconName]`
- **@tanstack/react-query**: For data fetching (if applicable)
- **Other libraries**: [List any other external dependencies]

### shadcn/ui Components Used
- `Card` - [How it's used]
- `Button` - [How it's used]
- `Badge` - [How it's used]
- `Dialog` - [How it's used]

---

## State Management

### Internal State
```typescript
const [localState, setLocalState] = useState<StateType>(initialValue);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

**State Variables**:
- `localState`: [Purpose and when it changes]
- `isLoading`: [When true/false]
- `error`: [Error handling state]

### Store Integration
```typescript
const { data, actions } = use[Module]Store();
```

**Store Data Used**:
- `data.field1`: [How it's used in the component]
- `data.field2`: [How it's used in the component]

**Store Actions Called**:
- `actions.actionName()`: [When and why it's called]

### Effects
```typescript
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

**Effects**:
1. **[Effect Purpose]**
   - **Dependencies**: `[dep1, dep2]`
   - **Cleanup**: [What cleanup is performed]
   - **Trigger**: [When this effect runs]

---

## Behavior

### User Interactions

#### [Interaction 1: e.g., Click on button]
- **Trigger**: User clicks [element]
- **Action**: [What happens]
- **Side Effects**: [State changes, API calls, navigation]
- **Feedback**: [Visual feedback to user]

#### [Interaction 2: e.g., Form submission]
- **Trigger**: User submits form
- **Validation**: [Input validation performed]
- **Action**: [What happens on valid submission]
- **Error Handling**: [What happens on validation failure]

#### [Interaction 3: e.g., Hover effect]
- **Trigger**: User hovers over [element]
- **Action**: [Visual change or tooltip display]

### Data Flow
```
Props → Component State → User Interaction → Event Handler → 
Store Action → Server Function → State Update → Re-render
```

### Conditional Rendering

#### Loading State
```tsx
{isLoading && <LoadingSpinner />}
```
**Condition**: When data is being fetched

#### Error State
```tsx
{error && <ErrorMessage error={error} />}
```
**Condition**: When an error occurs

#### Empty State
```tsx
{data.length === 0 && <EmptyState message="No items found" />}
```
**Condition**: When no data is available

#### Success State
```tsx
{data.length > 0 && <DataDisplay data={data} />}
```
**Condition**: When data is successfully loaded

---

## Styling

### Tailwind Classes
```typescript
className={cn(
  "base-class",
  "responsive-class md:different-class",
  condition && "conditional-class",
  className // User-provided classes
)}
```

### Style Variants
- **Default**: [Description of default appearance]
- **Variant 1**: [Description and when used]
- **Variant 2**: [Description and when used]

### Responsive Behavior
- **Mobile (< 768px)**: [How component adapts]
- **Tablet (768px - 1024px)**: [How component adapts]
- **Desktop (> 1024px)**: [How component adapts]

### Theme Integration
- **Light Mode**: [Appearance in light mode]
- **Dark Mode**: [Appearance in dark mode]
- **CSS Variables Used**: `--primary`, `--background`, etc.

---

## Accessibility

### ARIA Attributes
```tsx
<button
  aria-label="[Descriptive label]"
  aria-describedby="[Description ID]"
  aria-pressed={isActive}
>
  {children}
</button>
```

### Keyboard Navigation
- **Tab**: [What happens when user tabs]
- **Enter/Space**: [What happens on activation]
- **Escape**: [What happens on escape (for modals/dialogs)]
- **Arrow Keys**: [Navigation behavior if applicable]

### Screen Reader Support
- [How component is announced to screen readers]
- [Important information conveyed to screen readers]

### Focus Management
- [How focus is managed within the component]
- [Focus trap behavior for modals/dialogs]

### Color Contrast
- [Ensure text meets WCAG AA standards]
- [Verify interactive elements have sufficient contrast]

---

## Performance

### Optimization Strategies
- **React.memo**: [If component is memoized and why]
  ```typescript
  export const [ComponentName] = React.memo(({ prop1, prop2 }) => {
    // Component logic
  });
  ```
- **useMemo**: [What expensive computations are memoized]
  ```typescript
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);
  ```
- **useCallback**: [What callbacks are memoized]
  ```typescript
  const handleAction = useCallback((data: DataType) => {
    // Handler logic
  }, [dependency]);
  ```

### Lazy Loading
- [If component is lazy loaded]
  ```typescript
  const [ComponentName] = lazy(() => import('./[ComponentName]'));
  ```

### Render Optimization
- [Strategies to minimize re-renders]
- [Dependency array optimization]

---

## Error Handling

### Error Boundaries
- **Wrapped By**: `[ErrorBoundary component name]`
- **Fallback UI**: [What users see when error occurs]
- **Recovery**: [How users can recover from error]

### Error States

#### [Error Type 1: e.g., Network Error]
- **Cause**: [What causes this error]
- **Display**: [How error is shown to user]
- **Message**: "[User-friendly error message]"
- **Recovery Action**: [What user can do to recover]

#### [Error Type 2: e.g., Validation Error]
- **Cause**: [What causes this error]
- **Display**: [How error is shown to user]
- **Message**: "[User-friendly error message]"
- **Recovery Action**: [What user can do to recover]

### Error Logging
```typescript
logger.error('Component error', error, {
  component: '[ComponentName]',
  props: { prop1, prop2 },
  context: additionalContext
});
```

---

## Testing

### Component Tests
**Location**: `src/__tests__/components/[path]/[ComponentName].test.tsx`

**Test Cases**:
- [ ] Renders with required props
- [ ] Renders with all props
- [ ] Handles user interactions correctly
- [ ] Displays loading state
- [ ] Displays error state
- [ ] Displays empty state
- [ ] Calls event handlers with correct data
- [ ] Applies custom className
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility

### Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { [ComponentName] } from './[ComponentName]';

describe('[ComponentName]', () => {
  it('renders with required props', () => {
    render(<[ComponentName] prop1="test value" />);
    
    expect(screen.getByText('test value')).toBeInTheDocument();
  });

  it('calls onAction when user interacts', () => {
    const handleAction = vi.fn();
    render(
      <[ComponentName] 
        prop1="test value" 
        onAction={handleAction} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleAction).toHaveBeenCalledWith(
      expect.objectContaining({ /* expected data */ })
    );
  });

  it('displays loading state', () => {
    render(<[ComponentName] prop1="test" isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const error = new Error('Test error');
    render(<[ComponentName] prop1="test" error={error} />);
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Visual Regression Tests
- [If component has visual regression tests]
- [Tool used: Chromatic, Percy, etc.]

---

## Integration Points

### Parent Components
- **[ParentComponent1]**: [How it uses this component]
- **[ParentComponent2]**: [How it uses this component]

### Child Components
- **[ChildComponent1]**: [Purpose within this component]
- **[ChildComponent2]**: [Purpose within this component]

### Routes
- **`/[route-path]`**: [Where component is used in this route]

### Modules
- **[Module1]**: [How component integrates with this module]
- **[Module2]**: [How component integrates with this module]

---

## Variants and Composition

### Variants
If component supports multiple variants:

```typescript
type [ComponentName]Variant = 'default' | 'compact' | 'detailed';

interface [ComponentName]Props {
  variant?: [ComponentName]Variant;
  // other props
}
```

**Variant Descriptions**:
- **default**: [Standard appearance and behavior]
- **compact**: [Condensed version for space-constrained areas]
- **detailed**: [Expanded version with more information]

### Composition Patterns

#### Pattern 1: [Pattern Name]
```tsx
<[ComponentName]>
  <[ComponentName].Header>
    {/* Header content */}
  </[ComponentName].Header>
  <[ComponentName].Body>
    {/* Body content */}
  </[ComponentName].Body>
  <[ComponentName].Footer>
    {/* Footer content */}
  </[ComponentName].Footer>
</[ComponentName]>
```

---

## Known Issues and Limitations

### Current Limitations
1. **[Limitation 1]**: [Description and workaround if any]
2. **[Limitation 2]**: [Description and workaround if any]

### Browser Compatibility
- **Chrome**: ✅ Fully supported
- **Firefox**: ✅ Fully supported
- **Safari**: ⚠️ [Any known issues]
- **Edge**: ✅ Fully supported
- **Mobile Browsers**: [Any mobile-specific issues]

### Performance Considerations
- [Any performance limitations]
- [Recommended usage limits (e.g., max items to display)]

---

## Migration Guide

### Breaking Changes

#### Version X.X.X
**Change**: [Description of breaking change]  
**Migration**:
```tsx
// Before
<[ComponentName] oldProp="value" />

// After
<[ComponentName] newProp="value" />
```

### Deprecations
- **[Deprecated Prop]**: Use `[New Prop]` instead. Will be removed in version X.X.X.

---

## Future Enhancements

### Planned Features
- [ ] [Feature 1: Description]
- [ ] [Feature 2: Description]
- [ ] [Feature 3: Description]

### Requested Improvements
- [ ] [Improvement 1: From user feedback]
- [ ] [Improvement 2: From user feedback]

---

## Related Components

### Similar Components
- **[SimilarComponent1]**: [How it differs from this component]
- **[SimilarComponent2]**: [How it differs from this component]

### Complementary Components
- **[ComplementaryComponent1]**: [How they work together]
- **[ComplementaryComponent2]**: [How they work together]

---

## References

### Design System
- [Link to Figma design]
- [Link to design system documentation]

### Related Documentation
- [Module Documentation](./module-documentation.md)
- [API Documentation](./api-documentation.md)
- [Handoff Template](./handoff-template.md)

### External Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Documentation](https://react.dev/)

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

### Lovable Responsibilities
- Implement component UI and styling
- Handle user interactions and events
- Implement responsive design
- Ensure accessibility compliance
- Write component tests (optional)
- Update this documentation

### Kiro Responsibilities
- Provide type definitions for props
- Implement server functions for data fetching
- Create store actions for state management
- Define business logic and validation rules
- Review component integration with backend

### Shared Responsibilities
- Coordinate on component API (props interface)
- Agree on error handling patterns
- Define loading and empty states
- Ensure consistent user experience

### Handoff Requirements

#### When Lovable creates/updates this component:
1. Update this documentation with props and usage
2. Document any new types needed from Kiro
3. Create handoff document if new backend integration needed
4. Notify Kiro of new component availability

#### When Kiro provides new types or data:
1. Update component to use new types
2. Update props interface if needed
3. Update usage examples
4. Test component with new data structure

### Type Requests
If this component needs types that don't exist:
1. Document required types in handoff document
2. Specify type structure and purpose
3. Provide usage examples
4. Wait for Kiro to create types before using `any`

