#!/bin/bash

echo "🧪 E-Voting System - Centralized Test Runner"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests with error handling
run_tests() {
    local test_type=$1
    local description=$2
    local project=$3
    
    echo ""
    echo -e "${BLUE}Testing $description...${NC}"
    echo "Type: $test_type"
    
    if [ -n "$project" ]; then
        echo "Running: npm run test:$project"
        npm run test:$project
    else
        echo "Running: npm test"
        npm test
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $description tests passed${NC}"
    else
        echo -e "${RED}❌ $description tests failed (exit code: $exit_code)${NC}"
    fi
    
    echo "----------------------------------------"
    return $exit_code
}

# Function to run coverage tests
run_coverage() {
    local test_type=$1
    local description=$2
    local project=$3
    
    echo ""
    echo -e "${BLUE}Running Coverage for $description...${NC}"
    echo "Type: $test_type"
    
    if [ -n "$project" ]; then
        echo "Running: npm run test:$project:coverage"
        npm run test:$project:coverage
    else
        echo "Running: npm run test:coverage"
        npm run test:coverage
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $description coverage completed${NC}"
    else
        echo -e "${RED}❌ $description coverage failed (exit code: $exit_code)${NC}"
    fi
    
    echo "----------------------------------------"
    return $exit_code
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "tests" ]; then
    echo -e "${RED}Error: Please run this script from the e-voting root directory${NC}"
    echo "Expected files: package.json, tests/ directory"
    exit 1
fi

# Parse command line arguments
MODE="all"
COVERAGE=false
PROJECT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --coverage          Run tests with coverage"
            echo "  --project TYPE      Run tests for specific project (backend, react-native, react-web)"
            echo "  --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Run all tests"
            echo "  $0 --coverage               # Run all tests with coverage"
            echo "  $0 --project backend        # Run only backend tests"
            echo "  $0 --project react-native --coverage  # Run React Native tests with coverage"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run tests based on mode
if [ "$COVERAGE" = true ]; then
    if [ -n "$PROJECT" ]; then
        run_coverage "$PROJECT" "$PROJECT" "$PROJECT"
    else
        run_coverage "all" "All Components" ""
    fi
else
    if [ -n "$PROJECT" ]; then
        run_tests "$PROJECT" "$PROJECT" "$PROJECT"
    else
        run_tests "all" "All Components" ""
    fi
fi

# Summary
echo ""
echo -e "${BLUE}🎯 Test Summary Complete!${NC}"
if [ "$COVERAGE" = true ]; then
    echo "Coverage reports are available in the 'coverage' directory"
    echo "Open coverage/lcov-report/index.html in your browser for detailed reports"
fi
echo ""
echo "Available commands:"
echo "  npm test                    # Run all tests"
echo "  npm run test:coverage       # Run all tests with coverage"
echo "  npm run test:backend        # Run backend tests only"
echo "  npm run test:react-native   # Run React Native tests only"
echo "  npm run test:react-web      # Run React web tests only"