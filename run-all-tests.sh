#!/bin/bash

echo "🧪 Running Unit Tests for E-Voting System"
echo "=========================================="

# Function to run tests in a directory
run_tests() {
    local dir=$1
    local name=$2
    
    echo ""
    echo "Testing $name..."
    echo "Directory: $dir"
    
    if [ -d "$dir" ]; then
        cd "$dir"
        if [ -f "package.json" ]; then
            echo "Running: npm test"
            npm test
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
run_tests "src/evoting_localstorage/evoting_fron" "Main Voting App"
run_tests "src/evoting_localstorage/BallotAudit" "Ballot Audit App"
run_tests "src/evoting_localstorage/VoterVerification" "Voter Verification App"

# React Web Apps
run_tests "src/evoting_localstorage/admin_webpage" "Admin Webpage"
run_tests "src/evoting_localstorage/verification-webpage" "Verification Webpage"
run_tests "src/evoting_localstorage/bulletin" "Bulletin Board"
run_tests "src/evoting_localstorage/demo" "Demo App"

# Backend Services
run_tests "src/evoting_localstorage/project_evoting" "Election Server"
run_tests "src/evoting_localstorage/verification_server" "Verification Server"

echo ""
echo "🎯 Test Summary Complete!"
echo "Check the output above for PASS/FAIL status"