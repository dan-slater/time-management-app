# API Testing with Hurl

This directory contains comprehensive API tests for the Time Management App using [Hurl](https://hurl.dev/).

## 🚀 Quick Start

```bash
# Run all tests against local server
./tests/run-api-tests.sh

# Run tests against specific URL
./tests/run-api-tests.sh http://localhost:3002

# Run specific test suite
./tests/run-api-tests.sh tasks

# Run specific test against production
./tests/run-api-tests.sh https://leachie.com health
```

## 📁 Test Files

### `api/tasks.hurl`
Tests all task-related endpoints:
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Task completion/uncompletion
- ✅ **NEW**: Task text editing functionality
- ✅ Error handling and validation
- ✅ Edge cases

### `api/shopping.hurl` 
Tests shopping list endpoints:
- ✅ Shopping item CRUD operations
- ✅ Quantity management
- ✅ Purchase/unpurchase functionality
- ✅ Name and quantity editing
- ✅ Error handling

### `api/history.hurl`
Tests historical data and analytics:
- ✅ Event logging verification
- ✅ Analytics data retrieval
- ✅ Snapshot creation and retrieval
- ✅ Data export (JSON/CSV)
- ✅ Date range filtering

### `api/health.hurl`
Tests system health and edge cases:
- ✅ Health check endpoint
- ✅ CORS headers
- ✅ Special characters and Unicode
- ✅ Large data handling
- ✅ Concurrent requests
- ✅ Error scenarios

## 🛠 Test Runner Features

The `run-api-tests.sh` script provides:

- **Automatic server health checks** before running tests
- **Colored output** for easy reading
- **HTML reports** generated for each test suite
- **Flexible URL configuration** (local/staging/production)
- **Individual test execution** for debugging
- **Comprehensive error reporting**

## 📊 Reports

Test reports are automatically generated in `tests/reports/`:
- `health-report.html` - System health test results
- `tasks-report.html` - Task API test results  
- `shopping-report.html` - Shopping API test results
- `history-report.html` - Historical data test results

## 🔧 Configuration

Edit `api/hurl.config` to modify:
- Default base URL
- Timeout settings
- SSL/TLS options
- Redirect behavior

## 📋 Test Coverage

The test suite covers:

### Core Functionality
- [x] Task management (CRUD)
- [x] Shopping list management
- [x] Historical data logging
- [x] Analytics and reporting
- [x] Data export

### New Features
- [x] **Task editing** (inline text updates)
- [x] **Shopping item editing** (name + quantity)
- [x] Event logging for all updates

### Quality Assurance  
- [x] Input validation
- [x] Error handling
- [x] Edge cases
- [x] Performance (concurrent requests)
- [x] Data integrity
- [x] Unicode/special character support

### API Standards
- [x] HTTP status codes
- [x] JSON response format
- [x] CORS headers
- [x] Content-Type handling

## 🚦 Running Tests

### Prerequisites
1. **Hurl installed**: `brew install hurl` (macOS)
2. **Server running**: `npm start` in project root
3. **Executable permissions**: `chmod +x tests/run-api-tests.sh`

### Usage Examples

```bash
# Basic test run
./tests/run-api-tests.sh

# Test against different port
./tests/run-api-tests.sh http://localhost:3002

# Test production (with auth)
./tests/run-api-tests.sh https://leachie.com

# Run only task tests
./tests/run-api-tests.sh tasks

# Get help
./tests/run-api-tests.sh --help
```

### Expected Output
```
[INFO] Checking if server is running at http://localhost:3000...
[SUCCESS] Server is running and healthy
[INFO] Running health tests...
[SUCCESS] health tests passed
[INFO] Running tasks tests...
[SUCCESS] tasks tests passed
...
[SUCCESS] All tests passed! ✅
```

## 🐛 Debugging Failed Tests

1. **Check HTML reports** in `tests/reports/`
2. **Run individual test** for isolated debugging
3. **Verify server is healthy** at `/health` endpoint
4. **Check server logs** for backend errors

## 🔄 CI/CD Integration

These tests are designed to integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    npm start &
    sleep 5
    ./tests/run-api-tests.sh
    kill %1
```

## 📈 Future Enhancements

- [ ] Performance benchmarking tests
- [ ] Load testing scenarios  
- [ ] Authentication testing
- [ ] Rate limiting tests
- [ ] Database integration tests