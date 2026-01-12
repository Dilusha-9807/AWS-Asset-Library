#!/bin/bash
# Backend Services Starter for Linux/Mac
# This script starts all backend services in the background

echo "============================================================"
echo "AWS Asset Library - Backend Services Starter"
echo "============================================================"
echo ""

# Change to the script directory
cd "$(dirname "$0")"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed or not in PATH"
    echo "Please install Python3"
    exit 1
fi

# Run the Python script that manages all backends
echo "Starting all backend services..."
echo ""
python3 run_all_backends.py

