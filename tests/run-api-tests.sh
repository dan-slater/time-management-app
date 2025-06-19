#!/bin/bash

# API Test Runner for Time Management App
# Uses Hurl to run comprehensive API tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_BASE_URL="http://localhost:3000"
BASE_URL="${1:-$DEFAULT_BASE_URL}"
TEST_DIR="$(dirname "$0")/api"
REPORTS_DIR="$(dirname "$0")/reports"

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if server is running
check_server() {
    print_status "Checking if server is running at $BASE_URL..."
    if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "Server is running and healthy"
        return 0
    else
        print_error "Server is not running at $BASE_URL"
        print_status "Please start the server with: npm start"
        return 1
    fi
}

# Function to run a single test file
run_test() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .hurl)
    local report_file="$REPORTS_DIR/${test_name}-report.html"
    
    print_status "Running $test_name tests..."
    
    if hurl --test \
        --variable base_url="$BASE_URL" \
        --variable today="$(date +%Y-%m-%d)" \
        --variable tomorrow="$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d '+1 day' +%Y-%m-%d)" \
        --html "$report_file" \
        "$test_file"; then
        print_success "$test_name tests passed"
        return 0
    else
        print_error "$test_name tests failed"
        print_status "Report saved to: $report_file"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    local failed_tests=0
    local total_tests=0
    
    print_status "Starting API test suite for Time Management App"
    print_status "Base URL: $BASE_URL"
    echo
    
    # Test files in order
    local test_files=(
        "$TEST_DIR/health.hurl"
        "$TEST_DIR/tasks.hurl"
        "$TEST_DIR/shopping.hurl"
        "$TEST_DIR/history.hurl"
    )
    
    for test_file in "${test_files[@]}"; do
        if [[ -f "$test_file" ]]; then
            total_tests=$((total_tests + 1))
            if ! run_test "$test_file"; then
                failed_tests=$((failed_tests + 1))
            fi
            echo
        else
            print_warning "Test file not found: $test_file"
        fi
    done
    
    # Summary
    echo "========================================="
    print_status "Test Summary"
    echo "Total tests: $total_tests"
    echo "Passed: $((total_tests - failed_tests))"
    echo "Failed: $failed_tests"
    
    if [[ $failed_tests -eq 0 ]]; then
        print_success "All tests passed! ✅"
        return 0
    else
        print_error "$failed_tests test(s) failed ❌"
        print_status "Check reports in: $REPORTS_DIR"
        return 1
    fi
}

# Function to run a specific test
run_specific_test() {
    local test_name="$1"
    local test_file="$TEST_DIR/${test_name}.hurl"
    
    if [[ -f "$test_file" ]]; then
        run_test "$test_file"
    else
        print_error "Test file not found: $test_file"
        print_status "Available tests:"
        ls "$TEST_DIR"/*.hurl 2>/dev/null | xargs -n1 basename | sed 's/.hurl$//' | sed 's/^/  - /'
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [BASE_URL] [TEST_NAME]"
    echo
    echo "Arguments:"
    echo "  BASE_URL    Base URL for the API (default: $DEFAULT_BASE_URL)"
    echo "  TEST_NAME   Name of specific test to run (optional)"
    echo
    echo "Examples:"
    echo "  $0                                    # Run all tests against localhost:3000"
    echo "  $0 http://localhost:3002              # Run all tests against localhost:3002"
    echo "  $0 https://leachie.com tasks          # Run only task tests against production"
    echo
    echo "Available tests:"
    if [[ -d "$TEST_DIR" ]]; then
        ls "$TEST_DIR"/*.hurl 2>/dev/null | xargs -n1 basename | sed 's/.hurl$//' | sed 's/^/  - /' || echo "  No test files found"
    else
        echo "  Test directory not found: $TEST_DIR"
    fi
    echo
    echo "Reports will be saved to: $REPORTS_DIR"
}

# Main script logic
main() {
    # Check for help flag
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Parse arguments
    if [[ $# -eq 0 ]]; then
        # No arguments - run all tests with default URL
        BASE_URL="$DEFAULT_BASE_URL"
    elif [[ $# -eq 1 ]]; then
        if [[ "$1" =~ ^https?:// ]]; then
            # Argument is a URL - run all tests with this URL
            BASE_URL="$1"
        else
            # Argument is a test name - run specific test with default URL
            BASE_URL="$DEFAULT_BASE_URL"
            TEST_NAME="$1"
        fi
    elif [[ $# -eq 2 ]]; then
        # Two arguments - URL and test name
        BASE_URL="$1"
        TEST_NAME="$2"
    else
        print_error "Too many arguments"
        show_help
        exit 1
    fi
    
    # Check if hurl is installed
    if ! command -v hurl &> /dev/null; then
        print_error "Hurl is not installed. Please install it first:"
        print_status "  macOS: brew install hurl"
        print_status "  Linux: https://hurl.dev/docs/installation.html"
        exit 1
    fi
    
    # Check server health
    if ! check_server; then
        exit 1
    fi
    
    # Run tests
    if [[ -n "$TEST_NAME" ]]; then
        run_specific_test "$TEST_NAME"
    else
        run_all_tests
    fi
}

# Run main function with all arguments
main "$@"