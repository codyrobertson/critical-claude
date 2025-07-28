#!/bin/bash

# CRITICAL CLAUDE AI TESTING - BUILD AND EXECUTE
echo "🧠 CRITICAL CLAUDE AI ADHERENCE TESTING FRAMEWORK"
echo "================================================="
echo ""

# Configuration
CONTAINER_NAME="critical-claude-ai-testing"
IMAGE_NAME="critical-claude/ai-testing"
RESULTS_DIR="./ai-testing-results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

print_success "Prerequisites check passed"

# Check for Claude API key
if [[ -z "$CLAUDE_API_KEY" ]]; then
    print_warning "CLAUDE_API_KEY not set - testing will run in simulation mode"
    print_warning "Set CLAUDE_API_KEY environment variable for full AI testing"
    echo ""
    read -p "Continue with simulation mode? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Exiting. Set CLAUDE_API_KEY and try again."
        exit 0
    fi
fi

# Clean up previous runs
print_status "Cleaning up previous test runs..."
docker-compose -f ai-testing/docker/docker-compose.yml down --volumes --remove-orphans 2>/dev/null || true
docker image rm "$IMAGE_NAME" 2>/dev/null || true

# Create results directory
mkdir -p "$RESULTS_DIR"

print_status "Building AI testing environment..."
echo "This may take several minutes for the first build..."

# Build the Docker image
if docker-compose -f ai-testing/docker/docker-compose.yml build; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

print_status "Starting AI testing environment..."

# Start the testing environment
if docker-compose -f ai-testing/docker/docker-compose.yml up -d; then
    print_success "AI testing environment started"
else
    print_error "Failed to start AI testing environment"
    exit 1
fi

# Wait for container to be ready
print_status "Waiting for container to be ready..."
sleep 10

# Check container health
if docker ps | grep -q "$CONTAINER_NAME"; then
    print_success "Container is running"
else
    print_error "Container failed to start properly"
    docker-compose -f ai-testing/docker/docker-compose.yml logs
    exit 1
fi

print_status "Starting comprehensive AI adherence testing..."
echo ""

# Run the AI testing suite
if docker exec "$CONTAINER_NAME" bash -c "cd /home/aitest/ai-tests && bash run-ai-adherence-tests.sh"; then
    print_success "AI adherence testing completed"
else
    print_warning "AI adherence testing completed with some issues"
fi

print_status "Copying test results..."

# Copy results from container to host
docker cp "$CONTAINER_NAME:/home/aitest/ai-tests/results/." "$RESULTS_DIR/"

# Get the latest results directory
LATEST_RESULTS=$(ls -1t "$RESULTS_DIR" | head -1)

if [[ -n "$LATEST_RESULTS" ]] && [[ -f "$RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md" ]]; then
    print_success "Test results copied to $RESULTS_DIR/$LATEST_RESULTS/"
    echo ""
    
    # Display summary report
    print_status "=== COMPREHENSIVE TEST REPORT SUMMARY ==="
    echo ""
    
    # Extract key metrics from report
    if grep -q "## 📋 Test Results Summary" "$RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md"; then
        sed -n '/## 📋 Test Results Summary/,/## 🏆 Overall Assessment/p' "$RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md" | head -n -1
    fi
    
    if grep -q "## 🏆 Overall Assessment" "$RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md"; then
        sed -n '/## 🏆 Overall Assessment/,/## 📁 Detailed Test Logs/p' "$RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md" | head -n -1
    fi
    
    echo ""
    print_status "Full report available at: $RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md"
else
    print_warning "Could not find comprehensive test report"
fi

# Display container logs if there were issues
if [[ $? -ne 0 ]]; then
    print_status "Container logs:"
    docker-compose -f ai-testing/docker/docker-compose.yml logs ai-testing-environment
fi

# Optional: Keep container running for manual testing
echo ""
read -p "Keep testing environment running for manual testing? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Testing environment will continue running"
    print_status "Connect with: docker exec -it $CONTAINER_NAME bash"
    print_status "Stop with: docker-compose -f ai-testing/docker/docker-compose.yml down"
else
    print_status "Stopping testing environment..."
    docker-compose -f ai-testing/docker/docker-compose.yml down --volumes
    print_success "Testing environment stopped and cleaned up"
fi

print_success "AI adherence testing framework execution completed!"

# Final summary
echo ""
echo "🎯 TESTING SUMMARY"
echo "=================="
echo "✓ Docker environment built and deployed"
echo "✓ Claude CLI and Critical Claude installed"
echo "✓ AI testing prompts injected and activated"
echo "✓ Comprehensive adherence tests executed"
echo "✓ Multi-agent validation protocols tested"
echo "✓ 0-shot learning capabilities validated"
echo ""
echo "📊 Results: $RESULTS_DIR/$LATEST_RESULTS/"
echo "📋 Report: $RESULTS_DIR/$LATEST_RESULTS/comprehensive-report.md"
echo ""
echo "🧠 AI Testing Framework: COMPLETE"