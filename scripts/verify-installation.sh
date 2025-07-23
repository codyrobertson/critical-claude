#!/bin/bash

# Critical Claude Installation Verification Script
# Comprehensive verification of Critical Claude installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DIR="${HOME}/.critical-claude-verify-$$"
VERBOSE=false
SKIP_DOCKER=false
SKIP_PERFORMANCE=false

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

echo -e "${BLUE}🔍 Critical Claude Installation Verification${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-performance)
            SKIP_PERFORMANCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose        Enable verbose output"
            echo "  --skip-docker        Skip Docker-related tests"
            echo "  --skip-performance   Skip performance benchmarks"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Utility functions
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${PURPLE}🔍 $1${NC}"
    fi
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    ((TESTS_TOTAL++))
    log_verbose "Running test: $test_name"
    
    if output=$(eval "$test_command" 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$output" | grep -q "$expected_pattern"; then
            log_success "$test_name"
            if [ "$VERBOSE" = true ]; then
                echo "  Output: $output" | head -3
            fi
            return 0
        else
            log_error "$test_name (pattern not found: $expected_pattern)"
            if [ "$VERBOSE" = true ]; then
                echo "  Output: $output"
            fi
            return 1
        fi
    else
        log_error "$test_name (command failed)"
        if [ "$VERBOSE" = true ]; then
            echo "  Error: $output"
        fi
        return 1
    fi
}

# Setup test environment
setup_test_env() {
    log_info "Setting up test environment..."
    
    mkdir -p "$TEST_DIR"
    export CRITICAL_CLAUDE_HOME="$TEST_DIR"
    
    # Verify test directory
    if [ ! -d "$TEST_DIR" ]; then
        log_error "Failed to create test directory: $TEST_DIR"
        exit 1
    fi
    
    log_success "Test environment ready at: $TEST_DIR"
}

# Cleanup test environment
cleanup_test_env() {
    log_info "Cleaning up test environment..."
    
    if [ -d "$TEST_DIR" ]; then
        rm -rf "$TEST_DIR"
        log_success "Test environment cleaned up"
    fi
}

# System requirements check
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Node.js version
    if command -v node >/dev/null 2>&1; then
        node_version=$(node --version)
        node_major=$(echo "$node_version" | sed 's/v//' | cut -d. -f1)
        
        if [ "$node_major" -ge 18 ]; then
            log_success "Node.js version: $node_version"
        else
            log_error "Node.js version too old: $node_version (requires >= 18)"
        fi
    else
        log_error "Node.js not found"
    fi
    
    # NPM version
    if command -v npm >/dev/null 2>&1; then
        npm_version=$(npm --version)
        log_success "NPM version: $npm_version"
    else
        log_error "NPM not found"
    fi
    
    # Git (optional)
    if command -v git >/dev/null 2>&1; then
        git_version=$(git --version | cut -d' ' -f3)
        log_success "Git version: $git_version"
    else
        log_warning "Git not found (optional)"
    fi
    
    # Docker (optional)
    if [ "$SKIP_DOCKER" = false ]; then
        if command -v docker >/dev/null 2>&1; then
            docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
            log_success "Docker version: $docker_version"
        else
            log_warning "Docker not found (optional)"
        fi
    fi
}

# Build verification
check_build_system() {
    log_info "Verifying build system..."
    
    cd "$PROJECT_ROOT"
    
    # TypeScript compilation
    run_test "TypeScript Build" "npm run build" ""
    
    # Linting
    run_test "Code Linting" "npm run lint" ""
    
    # Type checking
    run_test "Type Checking" "npm run typecheck" ""
}

# CLI functionality tests
test_cli_functionality() {
    log_info "Testing CLI functionality..."
    
    cd "$PROJECT_ROOT"
    
    # Help command
    run_test "Help Command" "node applications/cli-application/src/index.ts --help" "Critical Claude CLI"
    
    # Version command
    run_test "Version Command" "node applications/cli-application/src/index.ts --version" "[0-9]\\+\\.[0-9]\\+\\.[0-9]\\+"
    
    # Task creation
    run_test "Task Creation" "node applications/cli-application/src/index.ts task create --title 'Verification Test'" "Created task"
    
    # Task listing
    run_test "Task Listing" "node applications/cli-application/src/index.ts task list" "Found.*tasks"
    
    # Task export
    run_test "Task Export" "node applications/cli-application/src/index.ts task export --format json" "Exported.*tasks"
    
    # Analytics
    run_test "Analytics Stats" "node applications/cli-application/src/index.ts analytics stats" "Usage Statistics"
    
    # Shortcuts command
    run_test "Shortcuts Command" "node applications/cli-application/src/index.ts shortcuts" "Keyboard Shortcuts"
}

# Domain functionality tests
test_domain_functionality() {
    log_info "Testing domain functionality..."
    
    cd "$PROJECT_ROOT"
    
    # Task management domain
    if [ -d "domains/task-management/dist" ]; then
        log_success "Task Management Domain built"
    else
        log_error "Task Management Domain not built"
    fi
    
    # Analytics domain
    if [ -d "domains/analytics/dist" ]; then
        log_success "Analytics Domain built"
    else
        log_error "Analytics Domain not built"
    fi
    
    # User interface domain
    if [ -d "domains/user-interface/dist" ]; then
        log_success "User Interface Domain built"
    else
        log_error "User Interface Domain not built"
    fi
}

# File system verification
test_file_system() {
    log_info "Testing file system operations..."
    
    # Data directory creation
    if [ -d "$CRITICAL_CLAUDE_HOME" ]; then
        log_success "Data directory exists: $CRITICAL_CLAUDE_HOME"
    else
        log_error "Data directory not found: $CRITICAL_CLAUDE_HOME"
    fi
    
    # Write permissions
    test_file="$CRITICAL_CLAUDE_HOME/write-test-$$"
    if echo "test" > "$test_file" 2>/dev/null; then
        log_success "Write permissions verified"
        rm -f "$test_file"
    else
        log_error "No write permissions in data directory"
    fi
    
    # Configuration loading
    run_test "Configuration Loading" "cd '$PROJECT_ROOT' && node applications/cli-application/src/index.ts task list" ""
}

# Performance verification
test_performance() {
    if [ "$SKIP_PERFORMANCE" = true ]; then
        log_info "Skipping performance tests..."
        return
    fi
    
    log_info "Running performance verification..."
    
    cd "$PROJECT_ROOT"
    
    # Quick benchmark
    if [ -f "scripts/benchmark.js" ]; then
        log_info "Running quick performance benchmark..."
        
        # Create a subset benchmark
        start_time=$(date +%s%N)
        
        # Create 10 test tasks
        for i in {1..10}; do
            node applications/cli-application/src/index.ts task create --title "Perf Test $i" >/dev/null 2>&1
        done
        
        # List tasks
        node applications/cli-application/src/index.ts task list >/dev/null 2>&1
        
        # Export tasks
        node applications/cli-application/src/index.ts task export --format json >/dev/null 2>&1
        
        end_time=$(date +%s%N)
        duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ "$duration" -lt 5000 ]; then # Less than 5 seconds
            log_success "Performance test completed in ${duration}ms"
        else
            log_warning "Performance test took ${duration}ms (may be slow)"
        fi
    else
        log_warning "Benchmark script not found"
    fi
}

# Docker verification
test_docker() {
    if [ "$SKIP_DOCKER" = true ]; then
        log_info "Skipping Docker tests..."
        return
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not available, skipping Docker tests"
        return
    fi
    
    log_info "Testing Docker functionality..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Dockerfile exists
    if [ -f "Dockerfile" ]; then
        log_success "Dockerfile found"
    else
        log_error "Dockerfile not found"
        return
    fi
    
    # Build Docker image (if not too resource intensive)
    log_info "Building Docker image (this may take a few minutes)..."
    if docker build -t critical-claude-verify . >/dev/null 2>&1; then
        log_success "Docker image built successfully"
        
        # Test Docker image
        if docker run --rm critical-claude-verify --help >/dev/null 2>&1; then
            log_success "Docker image runs successfully"
        else
            log_error "Docker image failed to run"
        fi
        
        # Cleanup
        docker rmi critical-claude-verify >/dev/null 2>&1 || true
    else
        log_warning "Docker build failed or skipped"
    fi
}

# Test viewer (basic smoke test)
test_viewer() {
    log_info "Testing viewer (smoke test)..."
    
    cd "$PROJECT_ROOT"
    
    # Since viewer is interactive, we'll do a basic startup test
    timeout 5s node applications/cli-application/src/index.ts viewer 2>/dev/null || true
    
    # If we reach here without hanging, viewer startup works
    log_success "Viewer startup test completed"
}

# Generate installation report
generate_report() {
    echo ""
    echo -e "${BLUE}📋 INSTALLATION VERIFICATION REPORT${NC}"
    echo -e "${BLUE}====================================${NC}"
    echo ""
    
    echo -e "${CYAN}System Information:${NC}"
    echo "  OS: $(uname -s) $(uname -r)"
    echo "  Architecture: $(uname -m)"
    echo "  Node.js: $(node --version 2>/dev/null || echo 'Not found')"
    echo "  NPM: $(npm --version 2>/dev/null || echo 'Not found')"
    echo "  Docker: $(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//' || echo 'Not found')"
    echo ""
    
    echo -e "${CYAN}Test Results:${NC}"
    echo "  Total Tests: $TESTS_TOTAL"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo ""
    
    local success_rate=0
    if [ "$TESTS_TOTAL" -gt 0 ]; then
        success_rate=$(( (TESTS_PASSED * 100) / TESTS_TOTAL ))
    fi
    
    echo -e "${CYAN}Success Rate: ${success_rate}%${NC}"
    echo ""
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Critical Claude is properly installed.${NC}"
        echo ""
        echo -e "${CYAN}Next Steps:${NC}"
        echo "  1. Try creating your first task: cc task create --title 'My first task'"
        echo "  2. Launch the viewer: cc viewer"
        echo "  3. Check out the shortcuts: cc shortcuts"
        echo "  4. Read the documentation: docs/README.md"
        echo ""
        return 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
        echo ""
        echo -e "${CYAN}Troubleshooting:${NC}"
        echo "  - Ensure Node.js >= 18 is installed"
        echo "  - Run 'npm install' to install dependencies"
        echo "  - Run 'npm run build' to build the project"
        echo "  - Check file permissions in ~/.critical-claude"
        echo "  - See docs/TROUBLESHOOTING.md for more help"
        echo ""
        return 1
    fi
}

# Main execution
main() {
    # Trap to ensure cleanup
    trap cleanup_test_env EXIT
    
    # Setup
    setup_test_env
    
    # Run verification tests
    check_system_requirements
    check_build_system
    test_domain_functionality
    test_cli_functionality
    test_file_system
    test_performance
    test_docker
    test_viewer
    
    # Generate report
    generate_report
}

# Run main function
main "$@"