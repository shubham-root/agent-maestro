# Roo Extension Test Suite

This directory contains comprehensive tests for all Roo API endpoints following VSCode extension testing best practices.

## Test Structure

### Test Files

1. **`extension.test.ts`** - Basic extension functionality tests
2. **`rooRoutes.test.ts`** - Main API endpoint tests with mocked dependencies
3. **`rooRoutesIntegration.test.ts`** - Integration tests that test the actual HTTP endpoints
4. **`schemaValidation.test.ts`** - Comprehensive schema validation tests
5. **`testUtils.ts`** - Shared utilities and helpers for testing

### Test Categories

#### Task Management Endpoints

- `POST /roo/task` - Create new RooCode task
- `POST /roo/task/{taskId}/message` - Send message to existing task
- `POST /roo/task/{taskId}/action` - Perform task actions (pressPrimaryButton, pressSecondaryButton, cancel, resume)
- `GET /roo/tasks` - Get task history
- `GET /roo/task/{taskId}` - Get specific task details

#### Profile Management Endpoints

- `GET /roo/profiles` - List all profiles or get active profile
- `GET /roo/profiles/{name}` - Get specific profile
- `POST /roo/profiles` - Create new profile
- `PUT /roo/profiles/{name}` - Update existing profile
- `DELETE /roo/profiles/{name}` - Delete profile
- `PUT /roo/profiles/active/{name}` - Set active profile

#### MCP Configuration Endpoint

- `POST /roo/install-mcp-config` - Install MCP configuration

#### Error Handling & Edge Cases

- Invalid image data URI formats
- Extension not available scenarios
- Task not found errors
- Profile management constraints
- Invalid action types
- Empty request validation

#### Server-Sent Events (SSE)

- Event stream format validation
- Message deduplication logic
- Filtered message types

## Running Tests

### Using VSCode Test CLI

The project is configured to use `@vscode/test-cli` for running tests:

```bash
# Run all tests
npm test

# Run specific test categories
npm run test -- --label unit
npm run test -- --label integration
npm run test -- --label schema
```

### Test Configuration

Tests are configured in `.vscode-test.mjs`:

- **unit**: All test files with 20s timeout
- **integration**: Integration tests with 30s timeout
- **schema**: Schema validation tests with 10s timeout

### Manual Test Execution

```bash
# Build tests
npm run build-tests

# Run with custom runner
node out/test/runTest.js
```

## Test Utilities

### MockRooAdapter

The `createMockRooAdapter()` function creates a comprehensive mock of the RooCode adapter with:

- Task management methods
- Profile management methods
- Event generation for SSE testing
- Configurable behavior through overrides

### Test Data Generators

The `TestData` object provides generators for:

- Valid/invalid image data URIs
- Task requests and responses
- Profile data
- MCP configuration requests
- SSE events

### Validators

The `Validators` object provides validation helpers for:

- Image data URI format
- Task actions
- API providers
- SSE event structure

## Test Coverage

### Endpoint Coverage

✅ **Task Management**

- Create task with valid/invalid data
- Send messages to existing/non-existent tasks
- Perform all supported actions
- Retrieve task history and specific tasks
- Handle task not found scenarios

✅ **Profile Management**

- List all profiles and get active profile
- CRUD operations on profiles
- Profile activation/deactivation
- Constraint validation (e.g., can't delete active profile)

✅ **MCP Configuration**

- Install configuration with specific extension
- Default extension selection
- Handle no available extensions

✅ **Error Handling**

- All HTTP error codes (400, 404, 500)
- Input validation failures
- Extension availability checks
- Resource not found scenarios

✅ **Schema Validation**

- All request/response schemas
- Optional vs required fields
- Data type validation
- Custom validation rules (e.g., image data URIs)

### Testing Patterns

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints with mocked dependencies
3. **Schema Tests**: Validate all Zod schemas with valid/invalid data
4. **Error Tests**: Ensure proper error handling and responses
5. **SSE Tests**: Validate Server-Sent Events streaming

## Best Practices Implemented

### VSCode Extension Testing

- Uses `@vscode/test-electron` for running tests in VSCode environment
- Proper extension context mocking
- Isolated test environment with disabled extensions

### Test Organization

- Logical grouping by functionality
- Clear test descriptions and assertions
- Comprehensive setup/teardown procedures

### Mock Strategy

- Realistic mock implementations
- Configurable behavior for different test scenarios
- Type-safe mocks with proper interfaces

### Validation Testing

- Positive and negative test cases
- Edge case coverage
- Schema validation with detailed error checking

## Adding New Tests

### For New Endpoints

1. Add endpoint tests to `rooRoutes.test.ts`
2. Add integration tests to `rooRoutesIntegration.test.ts`
3. Add schema validation to `schemaValidation.test.ts`
4. Update mock adapter in `testUtils.ts` if needed

### For New Schemas

1. Import schema in `schemaValidation.test.ts`
2. Add positive validation tests
3. Add negative validation tests with various invalid inputs
4. Test optional vs required fields

### Test Structure Template

```typescript
suite("New Feature Tests", () => {
  suiteSetup(() => {
    // Setup code
  });

  suiteTeardown(() => {
    // Cleanup code
  });

  test("Should handle valid input", () => {
    // Arrange
    const validInput = TestData.newFeatureRequest();

    // Act
    const result = validateInput(validInput);

    // Assert
    assert.ok(result.success, "Should accept valid input");
  });

  test("Should reject invalid input", () => {
    // Arrange
    const invalidInput = {
      /* invalid data */
    };

    // Act
    const result = validateInput(invalidInput);

    // Assert
    assert.ok(!result.success, "Should reject invalid input");
  });
});
```

## Debugging Tests

### VSCode Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "name": "Extension Tests",
  "type": "extensionHost",
  "request": "launch",
  "runtimeExecutable": "${execPath}",
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}",
    "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
  ],
  "outFiles": ["${workspaceFolder}/out/test/**/*.js"]
}
```

### Common Issues

1. **TypeScript Errors**: Ensure all imports are correct and types are properly defined
2. **Mock Issues**: Verify mock implementations match expected interfaces
3. **Async Issues**: Use proper async/await patterns for async generators
4. **VSCode Context**: Ensure proper extension context mocking

## Continuous Integration

Tests are designed to run in CI environments:

- No external dependencies required
- Deterministic test data
- Proper cleanup procedures
- Clear success/failure indicators

The test suite provides comprehensive coverage of all Roo API endpoints and ensures reliability and maintainability of the extension.
