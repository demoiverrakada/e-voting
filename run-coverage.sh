#!/bin/bash

echo "📊 Running Test Coverage for E-Voting System"
echo "============================================="

# Function to run coverage tests in a directory
run_coverage() {
    local dir=$1
    local name=$2
    
    echo ""
    echo "📈 Testing Coverage for $name..."
    echo "Directory: $dir"
    
    if [ -d "$dir" ]; then
        cd "$dir"
        if [ -f "package.json" ]; then
            # Check if test:coverage script exists
            if npm run | grep -q "test:coverage"; then
                echo "Running: npm run test:coverage"
                npm run test:coverage
            elif npm run | grep -q "test:ci"; then
                echo "Running: npm run test:ci"
                npm run test:ci
            else
                echo "Running: npm test -- --coverage --watchAll=false"
                npm test -- --coverage --watchAll=false
            fi
            echo "Exit code: $?"
        else
            echo "No package.json found"
        fi
        cd - > /dev/null
    else
        echo "Directory not found: $dir"
    fi
    echo "----------------------------------------"
}

# React Native Apps
run_coverage "src/evoting_localstorage/evoting_fron" "Main Voting App"
run_coverage "src/evoting_localstorage/BallotAudit" "Ballot Audit App"
run_coverage "src/evoting_localstorage/VoterVerification" "Voter Verification App"

# React Web Apps
run_coverage "src/evoting_localstorage/admin_webpage" "Admin Webpage"
run_coverage "src/evoting_localstorage/verification-webpage" "Verification Webpage"
run_coverage "src/evoting_localstorage/bulletin" "Bulletin Board"
run_coverage "src/evoting_localstorage/demo" "Demo App"

# Backend Services
run_coverage "src/evoting_localstorage/project_evoting" "Election Server"
run_coverage "src/evoting_localstorage/verification_server" "Verification Server"

echo ""
echo "🎯 Coverage Summary Complete!"
echo "Check individual coverage directories for detailed HTML reports"
echo "Coverage reports are available in each component's 'coverage' folder"