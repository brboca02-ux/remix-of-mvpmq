# API Documentation: [Function Name]

**File**: `src/server/[filename].ts`  
**Owner**: Kiro  
**Last Updated**: YYYY-MM-DD  
**Status**: [Stable | Beta | Deprecated]

---

## Overview

### Purpose
[Brief description of what this server function does and why it exists]

### Use Cases
- [Use case 1]
- [Use case 2]
- [Use case 3]

### Related Functions
- `[relatedFunction1]`: [Relationship]
- `[relatedFunction2]`: [Relationship]

---

## Function Signature

```typescript
export const [functionName] = createServerFn({ method: "[GET|POST|PUT|DELETE]" })
  .inputValidator((data) => [ValidationSchema].parse(data))
  .handler(async ({ data }) => {
    // Implementation
  });
```

---

## Input Schema

### Validation Schema (Zod)
```typescript
z.object({
  field1: z.string().min(1, "Error message"),
  field2: z.number().positive(),
  field3: z.enum(['option1', 'option2']).optional(),
  field4: z.array(z.string()).optional(),
})
```

### Input Parameters

#### `field1` (required)
- **Type**: `string`
- **Validation**: Minimum 1 character
- **Description**: [What this field represents]
- **Example**: `"example value"`

#### `field2` (required)
- **Type**: `number`
- **Validation**: Must be positive
- **Description**: [What this field represents]
- **Example**: `42`

#### `field3` (optional)
- **Type**: `'option1' | 'option2'`
- **Default**: `undefined`
- **Description**: [What this field represents]
- **Example**: `"option1"`

#### `field4` (optional)
- **Type**: `string[]`
- **Default**: `undefined`
- **Description**: [What this field represents]
- **Example**: `["item1", "item2"]`

### Input Example
```typescript
{
  field1: "example value",
  field2: 42,
  field3: "option1",
  field4: ["item1", "item2"]
}
```

---

## Output Schema

### Success Response
```typescript
{
  data: ResultType;
  metadata?: {
    timestamp: string;
    processingTime: number;
  };
}
```

### Output Fields

#### `data`
- **Type**: `ResultType`
- **Description**: [What the result contains]

#### `metadata` (optional)
- **Type**: `object`
- **Description**: Additional information about the operation

### Output Example
```typescript
{
  data: {
    id: "123",
    name: "Result Name",
    status: "success"
  },
  metadata: {
    timestamp: "2025-01-15T10:30:00Z",
    processingTime: 245
  }
}
```

---

## Error Handling

### Error Codes

#### `VALIDATION_ERROR`
- **HTTP Status**: 400
- **Cause**: Invalid input data
- **User Message**: "Os dados fornecidos são inválidos. Verifique os campos e tente novamente."
- **Technical Details**: Zod validation failed
- **Recovery**: Fix input data and retry

#### `RATE_LIMIT_EXCEEDED`
- **HTTP Status**: 429
- **Cause**: Too many requests in a short time
- **User Message**: "Muitas requisições. Aguarde alguns segundos e tente novamente."
- **Technical Details**: Rate limit from external API
- **Recovery**: Wait and retry with exponential backoff

#### `PAYMENT_REQUIRED`
- **HTTP Status**: 402
- **Cause**: API credits exhausted
- **User Message**: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage."
- **Technical Details**: External API billing issue
- **Recovery**: Add credits to account

#### `EXTERNAL_API_ERROR`
- **HTTP Status**: 502
- **Cause**: External service failure
- **User Message**: "Falha na chamada da API externa. Tente novamente."
- **Technical Details**: External API returned error
- **Recovery**: Retry with exponential backoff

#### `DATABASE_ERROR`
- **HTTP Status**: 500
- **Cause**: Database operation failed
- **User Message**: "Erro ao acessar o banco de dados. Tente novamente."
- **Technical Details**: Supabase query failed
- **Recovery**: Retry or contact support

#### `UNAUTHORIZED`
- **HTTP Status**: 401
- **Cause**: User not authenticated
- **User Message**: "Você precisa estar autenticado para realizar esta ação."
- **Technical Details**: Missing or invalid auth token
- **Recovery**: Redirect to login

#### `FORBIDDEN`
- **HTTP Status**: 403
- **Cause**: User lacks permission
- **User Message**: "Você não tem permissão para realizar esta ação."
- **Technical Details**: Authorization check failed
- **Recovery**: Request permission or contact admin

### Error Response Format
```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
}
```

### Error Handling Example
```typescript
try {
  const result = await [functionName]({ field1: "value" });
  // Handle success
} catch (error) {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        // Show rate limit message
        break;
      case ErrorCodes.PAYMENT_REQUIRED:
        // Show payment required message
        break;
      default:
        // Show generic error message
    }
  }
}
```

---

## Implementation Details

### Dependencies

#### External Services
- **[Service Name]**: [Purpose and API endpoint]
- **Environment Variables**: `[ENV_VAR_NAME]`

#### Internal Dependencies
- `logger`: Structured logging utility
- `handleServerError`: Error handling utility
- `requireEnvVar`: Environment variable validation
- `withRetry`: Retry logic wrapper

### Retry Logic
```typescript
withRetry(
  async () => {
    // Operation to retry
  },
  {
    maxAttempts: 3,
    delayMs: 1000,
    onRetry: (attempt, error) => {
      logger.warn('Retrying operation', { attempt, error: error.message });
    },
    shouldRetry: (error) => {
      // Custom retry logic
      return error.code !== ErrorCodes.RATE_LIMIT_EXCEEDED;
    }
  }
)
```

### Timeout Configuration
- **Default Timeout**: 30 seconds
- **Configurable**: Yes, via `AbortSignal.timeout(ms)`
- **Timeout Behavior**: Throws `TimeoutError`

### Caching Strategy
- **Cache Key**: [How cache key is generated]
- **Cache Duration**: [TTL in seconds]
- **Cache Invalidation**: [When cache is cleared]

---

## Usage Examples

### Basic Usage
```typescript
import { [functionName] } from '@/server/[filename]';

const result = await [functionName]({
  field1: "example value",
  field2: 42
});

console.log(result.data);
```

### With Error Handling
```typescript
import { [functionName] } from '@/server/[filename]';
import { logger } from '@/lib/logger';

try {
  const result = await [functionName]({
    field1: "example value",
    field2: 42
  });
  
  logger.info('Operation successful', { resultId: result.data.id });
  return result.data;
  
} catch (error) {
  if (error instanceof AppError) {
    logger.error('Operation failed', error, {
      code: error.code,
      input: { field1: "example value" }
    });
    
    // Show user-friendly error
    toast.error(error.message);
  }
  
  throw error;
}
```

### In React Component
```typescript
import { useMutation } from '@tanstack/react-query';
import { [functionName] } from '@/server/[filename]';

function MyComponent() {
  const mutation = useMutation({
    mutationFn: [functionName],
    onSuccess: (data) => {
      toast.success('Operação concluída com sucesso!');
    },
    onError: (error) => {
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error('Erro inesperado. Tente novamente.');
      }
    }
  });

  const handleSubmit = () => {
    mutation.mutate({
      field1: "example value",
      field2: 42
    });
  };

  return (
    <button 
      onClick={handleSubmit}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Processando...' : 'Enviar'}
    </button>
  );
}
```

---

## Performance

### Expected Response Time
- **Average**: [X ms]
- **95th Percentile**: [Y ms]
- **99th Percentile**: [Z ms]

### Rate Limits
- **Per User**: [X requests per minute]
- **Per IP**: [Y requests per minute]
- **Global**: [Z requests per second]

### Optimization Strategies
- [Strategy 1: e.g., database query optimization]
- [Strategy 2: e.g., response caching]
- [Strategy 3: e.g., parallel processing]

### Resource Usage
- **Memory**: [Typical memory usage]
- **CPU**: [Typical CPU usage]
- **Network**: [Typical bandwidth usage]

---

## Security

### Authentication
- **Required**: [Yes/No]
- **Method**: [JWT, Session, API Key]
- **Validation**: [How auth is validated]

### Authorization
- **Required Permissions**: [List of required permissions]
- **Role-Based Access**: [Which roles can access]

### Input Sanitization
- [Field 1]: [Sanitization method]
- [Field 2]: [Sanitization method]

### Data Privacy
- **PII Handling**: [How personally identifiable information is handled]
- **Logging**: [What data is logged, what is redacted]
- **Encryption**: [What data is encrypted in transit/at rest]

---

## Testing

### Unit Tests
**Location**: `src/__tests__/server/[filename].test.ts`

**Test Cases**:
- [ ] Valid input returns expected output
- [ ] Invalid input throws validation error
- [ ] External API failure is handled gracefully
- [ ] Retry logic works correctly
- [ ] Timeout is enforced
- [ ] Error codes are correct
- [ ] Logging is performed

### Integration Tests
- [ ] End-to-end flow with real database
- [ ] External API integration
- [ ] Authentication and authorization

### Property-Based Tests
- [ ] All valid inputs produce valid outputs
- [ ] Invalid inputs always throw errors
- [ ] Idempotency (if applicable)

### Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';
import { [functionName] } from './[filename]';

describe('[functionName]', () => {
  it('should return expected result for valid input', async () => {
    const result = await [functionName]({
      field1: "test value",
      field2: 42
    });
    
    expect(result.data).toBeDefined();
    expect(result.data.status).toBe('success');
  });

  it('should throw validation error for invalid input', async () => {
    await expect([functionName]({
      field1: "",  // Invalid: empty string
      field2: -1   // Invalid: negative number
    })).rejects.toThrow();
  });

  it('should retry on transient errors', async () => {
    // Mock external API to fail once then succeed
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Transient error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: 'success' }) });
    
    global.fetch = mockFetch;
    
    const result = await [functionName]({
      field1: "test",
      field2: 42
    });
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.data).toBe('success');
  });
});
```

---

## Monitoring

### Logging
```typescript
// Success logging
logger.info('[Operation] completed successfully', {
  field1: data.field1,
  resultId: result.id,
  processingTime: Date.now() - startTime
});

// Error logging
logger.error('[Operation] failed', error, {
  field1: data.field1,
  errorCode: error.code
});

// Warning logging
logger.warn('[Operation] retry attempt', {
  attempt: attemptNumber,
  maxAttempts: 3
});
```

### Metrics to Track
- Request count
- Success rate
- Error rate by error code
- Response time (p50, p95, p99)
- Retry count
- External API latency

### Alerts
- Error rate > 5%
- Response time > 5 seconds
- External API failure rate > 10%

---

## Migration Guide

### Breaking Changes

#### Version X.X.X
**Change**: [Description of breaking change]  
**Migration**:
```typescript
// Before
await [functionName]({ oldField: "value" });

// After
await [functionName]({ newField: "value" });
```

### Deprecations
- **[Deprecated Field]**: Use `[New Field]` instead. Will be removed in version X.X.X.

---

## Troubleshooting

### Common Issues

#### Issue: Function times out
**Symptoms**: Request takes > 30 seconds  
**Cause**: External API is slow or unresponsive  
**Solution**: 
1. Check external API status
2. Increase timeout if needed
3. Implement caching to reduce API calls

#### Issue: Rate limit errors
**Symptoms**: Frequent `RATE_LIMIT_EXCEEDED` errors  
**Cause**: Too many requests in short time  
**Solution**:
1. Implement request throttling on client
2. Add caching to reduce API calls
3. Increase rate limit if possible

#### Issue: Validation errors
**Symptoms**: `VALIDATION_ERROR` on valid-looking input  
**Cause**: Input doesn't match schema exactly  
**Solution**:
1. Check input types match schema
2. Verify required fields are present
3. Check for extra fields not in schema

---

## Related Documentation

### Internal
- [Module Documentation](./module-documentation.md)
- [Error Handling Guide](../error-handling.md)
- [Testing Guide](../testing.md)

### External
- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/server-functions)
- [Zod Validation](https://zod.dev/)
- [External API Documentation](https://example.com/docs)

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
- Implement server function logic
- Define input/output schemas
- Implement error handling
- Write unit and integration tests
- Update this documentation

### Lovable Responsibilities
- Use server function in UI components
- Handle loading and error states
- Display user-friendly error messages
- Request new features or modifications

### Handoff Requirements
When Kiro modifies this function:
1. Update this documentation
2. Update input/output schemas in types.ts
3. Create handoff document if breaking changes
4. Notify Lovable of changes

When Lovable needs modifications:
1. Request changes via handoff document
2. Specify new requirements clearly
3. Provide use cases and examples
