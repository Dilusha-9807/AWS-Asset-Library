# Backend Services

This directory contains all backend services for the AWS Asset Library application.

## Services

1. **backend_5152.py** (Port 5152)
   - Main upload service for receiving JSON data from external sources
   - Handles assets, cost, and OS/EDB version data uploads

2. **backend_edb_os_backup.py** (Port 5153)
   - EDB/OS Versions backup API
   - Manages `edb_os_versions_backup.json` file
   - Provides GET and POST endpoints for EDB/OS version data

3. **backend_assets_inventory.py** (Port 5154)
   - Assets Inventory backup API
   - Manages `assets_inventory.json` file
   - Provides GET and POST endpoints for assets inventory data

## Quick Start

### Option 1: Run All Services with One Command (Recommended)

**Windows:**
```bash
cd Back-end
start_backends.bat
```

**Linux/Mac:**
```bash
cd Back-end
chmod +x start_backends.sh
./start_backends.sh
```

**Or use Python directly (Cross-platform):**
```bash
cd Back-end
python run_all_backends.py
```

This will start all three services in separate processes in the background.

### Option 2: Run Services Individually

If you need to run services separately:

```bash
# Terminal 1 - Main upload service
python backend_5152.py

# Terminal 2 - EDB/OS Versions backup API
python backend_edb_os_backup.py

# Terminal 3 - Assets Inventory backup API
python backend_assets_inventory.py
```

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Features

- **Automatic Process Management**: All services run in separate processes
- **Auto-restart**: If a service crashes, it will automatically restart
- **Graceful Shutdown**: Press Ctrl+C to stop all services cleanly
- **Process Monitoring**: The manager monitors all services and restarts them if needed

## Stopping Services

Press `Ctrl+C` in the terminal where `run_all_backends.py` is running. This will gracefully stop all services.

## Ports

- **5152**: Main upload service
- **5153**: EDB/OS Versions backup API
- **5154**: Assets Inventory backup API

Make sure these ports are not in use by other applications.

## Troubleshooting

### Port Already in Use

If you get an error that a port is already in use:
1. Check if another instance of the service is running
2. Stop the existing process
3. Or change the port in the respective backend script

### Services Not Starting

1. Check if Python is installed: `python --version`
2. Check if dependencies are installed: `pip install -r requirements.txt`
3. Check the error messages in the console output

### Windows Issues

If the batch file doesn't work:
1. Make sure Python is in your PATH
2. Try running directly: `python run_all_backends.py`
3. Check that all backend scripts exist in the Back-end directory

