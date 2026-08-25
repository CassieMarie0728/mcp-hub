# Testing Guide

## Overview

This document describes the testing strategy, frameworks, and best practices for MCP Hub.

## Testing Frameworks

| Framework | Purpose | Location |
|-----------|---------|----------|
| **Vitest** | Unit & integration tests | `lib/__tests__/`, `tests/` |
| **React Testing Library** | Component testing | (Ready to add) |
| **Expo Testing Library** | Native component testing | (Ready to add) |

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test --watch
```

### Run Specific Test File
```bash
pnpm test onboarding.test.ts
```

### Run Tests with Coverage
```bash
pnpm test --coverage
```

## Current Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| **Onboarding** | 24 | ✅ Passing |
| **MCP Client** | 7 | ✅ Passing |
| **New Features** | 10 | ✅ Passing |
| **AI Security** | 2 | ✅ Passing |
| **Router Security** | 6 | ✅ Passing |
| **Auth** | 1 | ⏭️ Skipped |
| **Total** | 50 | ✅ 49 Passing |

## Test Structure

### Unit Tests (`lib/__tests__/`)
Test individual functions and utilities in isolation.

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Tests (`tests/`)
Test how multiple components work together.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('API Integration', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should connect to server and execute tool', async () => {
    // Test complete workflow
  });
});
```

## Testing Best Practices

### 1. **Test Naming**
Use descriptive names that explain what is being tested:

```typescript
// ✅ Good
it('should return error when server connection fails')

// ❌ Bad
it('should handle error')
```

### 2. **Arrange-Act-Assert Pattern**
Structure tests with clear setup, execution, and verification:

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [1, 2, 3];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(6);
});
```

### 3. **Mock External Dependencies**
Mock API calls, storage, and external services:

```typescript
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));
```

### 4. **Test Edge Cases**
Include tests for error conditions and edge cases:

```typescript
it('should handle empty array', () => {
  expect(calculateTotal([])).toBe(0);
});

it('should throw error for invalid input', () => {
  expect(() => calculateTotal(null)).toThrow();
});
```

### 5. **Keep Tests Focused**
Each test should verify one specific behavior:

```typescript
// ✅ Good - One assertion per test
it('should set loading state', () => {
  expect(state.loading).toBe(true);
});

// ❌ Bad - Multiple unrelated assertions
it('should update state', () => {
  expect(state.loading).toBe(true);
  expect(state.data).toBeDefined();
  expect(state.error).toBeNull();
});
```

## Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| **Statements** | 80% | 40% |
| **Branches** | 75% | 30% |
| **Functions** | 80% | 35% |
| **Lines** | 80% | 40% |

## Missing Test Coverage

### High Priority
- [ ] Settings screen functionality
- [ ] Theme provider behavior
- [ ] App context state management
- [ ] Navigation flows
- [ ] API error handling

### Medium Priority
- [ ] Authentication flows
- [ ] File upload/download
- [ ] Notification system
- [ ] Macro execution
- [ ] Tool discovery

### Low Priority
- [ ] Analytics integration
- [ ] Performance monitoring
- [ ] Crash reporting

## Writing New Tests

### 1. Create Test File
```bash
# For lib utilities
touch lib/__tests__/my-feature.test.ts

# For API/integration
touch tests/my-feature.test.ts
```

### 2. Write Test
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { myFunction } from '@/lib/my-feature';

describe('My Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should work correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### 3. Run Tests
```bash
pnpm test
```

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
```

## Debugging Tests

### Run Single Test
```bash
pnpm test --grep "test name"
```

### Debug Mode
```bash
node --inspect-brk ./node_modules/.bin/vitest
```

### Console Logging
```typescript
it('should debug', () => {
  console.log('Debug info:', data);
  expect(data).toBeDefined();
});
```

## Common Testing Patterns

### Testing Async Functions
```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Testing Error Handling
```typescript
it('should throw error', async () => {
  await expect(failingFunction()).rejects.toThrow('Error message');
});
```

### Testing State Updates
```typescript
it('should update state', () => {
  const { result } = renderHook(() => useState(0));
  act(() => {
    result.current[1](1);
  });
  expect(result.current[0]).toBe(1);
});
```

### Testing Context
```typescript
it('should provide context value', () => {
  const wrapper = ({ children }) => (
    <Provider>{children}</Provider>
  );
  const { result } = renderHook(() => useContext(MyContext), { wrapper });
  expect(result.current).toBeDefined();
});
```

## Performance Testing

### Measure Execution Time
```typescript
it('should execute quickly', () => {
  const start = performance.now();
  myFunction();
  const end = performance.now();
  expect(end - start).toBeLessThan(100);
});
```

## Troubleshooting

### Tests Not Running
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm test
```

### Import Errors
```bash
# Check tsconfig.json paths
# Ensure all imports use @ alias correctly
```

### Timeout Errors
```typescript
// Increase timeout for slow tests
it('should complete', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Matchers](https://vitest.dev/api/expect.html)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
