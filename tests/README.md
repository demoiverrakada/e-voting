# E-Voting System - Test Suite

This directory contains all unit tests for the E-Voting System, organized by component type.

## 📁 Directory Structure

```
tests/
├── backend/           # Backend service tests (Node.js/Express)
├── react-native/      # React Native mobile app tests
├── react-web/         # React web application tests
├── shared/            # Shared utility tests
├── jest.config.js     # Centralized Jest configuration
├── jest.setup.js      # Global test setup
└── README.md          # This file
```

## 🚀 Running Tests

### From Root Directory

```bash
# Run all tests
npm test

# Run all tests with coverage
npm run test:coverage

# Run specific project tests
npm run test:backend
npm run test:react-native
npm run test:react-web

# Run specific project tests with coverage
npm run test:backend:coverage
npm run test:react-native:coverage
npm run test:react-web:coverage
```

### Using the Test Runner Script

```bash
# Run all tests
./run-tests.sh

# Run all tests with coverage
./run-tests.sh --coverage

# Run specific project tests
./run-tests.sh --project backend
./run-tests.sh --project react-native
./run-tests.sh --project react-web

# Run specific project tests with coverage
./run-tests.sh --project backend --coverage
```

### From Individual Components

```bash
# Backend services
cd src/evoting_localstorage/project_evoting
npm test

# React Native apps
cd src/evoting_localstorage/evoting_fron
npm test

# React web apps
cd src/evoting_localstorage/verification-webpage
npm test
```

## 📊 Coverage Reports

After running tests with coverage, you can view detailed reports:

- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Data**: `coverage/coverage-final.json`
- **Terminal Summary**: Displayed after test completion

## 🧪 Test Types

### Backend Tests (`tests/backend/`)
- API endpoint tests
- Database operation tests
- Authentication middleware tests
- Business logic tests
- Error handling tests

### React Native Tests (`tests/react-native/`)
- Component rendering tests
- User interaction tests
- Navigation tests
- Utility function tests
- State management tests

### React Web Tests (`tests/react-web/`)
- Component rendering tests
- User interaction tests
- Routing tests
- Form validation tests
- API integration tests

## 📝 Writing New Tests

### Test File Naming
- Use `.test.js` or `.test.tsx` extension
- Place in appropriate subdirectory
- Follow naming convention: `ComponentName.test.js`

### Example Test Structure
```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    // Edge case testing
  });
});
```

## ⚙️ Configuration

### Jest Configuration
The main Jest configuration is in `tests/jest.config.js` and includes:
- Project-specific configurations
- Coverage thresholds
- Test environment settings
- Transform configurations

### Global Setup
Global test setup is in `tests/jest.setup.js` and includes:
- Mock configurations
- Global variables
- Browser API mocks
- Test utilities

## 🎯 Coverage Targets

- **Backend Services**: 70% coverage
- **React Native Apps**: 60% coverage  
- **React Web Apps**: 60% coverage
- **Shared Utilities**: 80% coverage

## 🔧 Troubleshooting

### Common Issues

1. **Tests not found**: Ensure test files are in the correct directory and have proper naming
2. **Import errors**: Check that import paths are correct relative to the test file location
3. **Mock issues**: Verify mocks are properly configured in `jest.setup.js`
4. **Coverage not working**: Ensure source files are included in `collectCoverageFrom` patterns

### Debug Commands

```bash
# Run tests in verbose mode
npm test -- --verbose

# Run specific test file
npm test -- tests/backend/specific.test.js

# Run tests in watch mode
npm test -- --watch

# Clear Jest cache
npm test -- --clearCache
```

## 📚 Best Practices

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Test Names**: Use descriptive test names that explain what is being tested
3. **Assertions**: Use specific assertions (`toBe`, `toEqual`, `toContain`, etc.)
4. **Mocks**: Mock external dependencies and APIs
5. **Cleanup**: Clean up after each test to avoid side effects
6. **Coverage**: Aim for meaningful coverage, not just high percentages
7. **Maintenance**: Keep tests up to date with code changes

## 🤝 Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Place tests in the appropriate subdirectory
3. Update this README if adding new test categories
4. Ensure tests pass before submitting
5. Consider adding tests for new features or bug fixes