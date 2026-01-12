#!/usr/bin/env python3
"""
Backend Services Manager

This script runs all backend services in the background using separate processes.
Each service runs in its own process for better isolation and stability.

Services:
  - backend_5152.py (port 5152) - Main upload service
  - backend_edb_os_backup.py (port 5153) - EDB/OS Versions backup API
  - backend_assets_inventory.py (port 5154) - Assets Inventory backup API

Usage:
  python run_all_backends.py

To stop all services, press Ctrl+C or close the terminal.
"""
import subprocess
import sys
import os
import signal
import time
from pathlib import Path

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.absolute()

# Backend scripts to run
BACKEND_SCRIPTS = [
    {
        "name": "Main Upload Service",
        "script": "backend_5152.py",
        "port": 5152
    },
    {
        "name": "EDB/OS Versions Backup API",
        "script": "backend_edb_os_backup.py",
        "port": 5153
    },
    {
        "name": "Assets Inventory Backup API",
        "script": "backend_assets_inventory.py",
        "port": 5154
    }
]

# Store process references
processes = []


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully by stopping all processes."""
    print("\n\n[Shutting down] Stopping all backend services...")
    for proc in processes:
        if proc.poll() is None:  # Process is still running
            print(f"  Stopping {proc.args[1]}...")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    print("[Shutdown complete] All services stopped.")
    sys.exit(0)


def run_backend(script_info):
    """Run a single backend script in a subprocess."""
    script_path = SCRIPT_DIR / script_info["script"]
    
    if not script_path.exists():
        print(f"[ERROR] Script not found: {script_path}")
        return None
    
    print(f"[Starting] {script_info['name']} on port {script_info['port']}...")
    
    try:
        # Run the script in a subprocess
        # Use python executable from current environment
        # Output to console so we can see logs from all services
        proc = subprocess.Popen(
            [sys.executable, str(script_path)],
            cwd=str(SCRIPT_DIR),
            stdout=sys.stdout,
            stderr=sys.stderr,
            text=True,
            bufsize=1
        )
        
        print(f"[Started] {script_info['name']} (PID: {proc.pid})")
        return proc
    except Exception as e:
        print(f"[ERROR] Failed to start {script_info['name']}: {e}")
        return None


def monitor_processes():
    """Monitor all processes and restart if they crash."""
    while True:
        for i, proc in enumerate(processes):
            if proc is None:
                continue
                
            # Check if process has terminated
            if proc.poll() is not None:
                script_info = BACKEND_SCRIPTS[i]
                print(f"\n[WARNING] {script_info['name']} has stopped (exit code: {proc.returncode})")
                print(f"[Restarting] {script_info['name']}...")
                
                # Restart the process
                new_proc = run_backend(script_info)
                if new_proc:
                    processes[i] = new_proc
                else:
                    print(f"[ERROR] Failed to restart {script_info['name']}")
        
        time.sleep(5)  # Check every 5 seconds


def main():
    """Main function to start all backend services."""
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("=" * 60)
    print("AWS Asset Library - Backend Services Manager")
    print("=" * 60)
    print(f"Working directory: {SCRIPT_DIR}")
    print(f"Python executable: {sys.executable}")
    print("=" * 60)
    print()
    
    # Start all backend services
    for script_info in BACKEND_SCRIPTS:
        proc = run_backend(script_info)
        processes.append(proc)
        time.sleep(1)  # Small delay between starts
    
    # Check if all services started successfully
    failed = sum(1 for p in processes if p is None)
    if failed > 0:
        print(f"\n[ERROR] {failed} service(s) failed to start. Exiting.")
        signal_handler(None, None)
        return
    
    print("\n" + "=" * 60)
    print("All backend services are running!")
    print("=" * 60)
    print("\nServices:")
    for i, script_info in enumerate(BACKEND_SCRIPTS):
        if processes[i]:
            print(f"  ✓ {script_info['name']} - http://localhost:{script_info['port']} (PID: {processes[i].pid})")
    print("\nPress Ctrl+C to stop all services.")
    print("=" * 60)
    print()
    
    # Monitor processes (restart if they crash)
    try:
        monitor_processes()
    except KeyboardInterrupt:
        signal_handler(None, None)


if __name__ == "__main__":
    main()

