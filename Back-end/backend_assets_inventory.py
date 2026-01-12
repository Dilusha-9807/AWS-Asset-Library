#!/usr/bin/env python3
"""
Assets Inventory Backup API Server

This server provides API endpoints to read and update the assets_inventory.json file.

Endpoints:
  GET  /api/assets-inventory-backup  - Get all backup data as a map keyed by IP
  POST /api/assets-inventory-backup  - Update backup data for a specific IP

Usage:
  1. Install dependencies:
     pip install -r requirements.txt
  
  2. Run the server:
     python backend_assets_inventory.py
  
  3. Server will run on http://localhost:5154

The server automatically handles CORS and updates the JSON file in real-time.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ---------------------------------------
# Configuration
# ---------------------------------------
# Path to the backup JSON file
# Adjust this path based on your system
BACKUP_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "Front-end", "public", "data_backup", "assets_inventory.json"
)

# Alternative: Use absolute path (uncomment and adjust if needed)
# BACKUP_JSON_PATH = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_backup/assets_inventory.json"


# ---------------------------------------
# Helper: Read JSON file
# ---------------------------------------
def read_backup_json():
    """Read the backup JSON file and return the data structure."""
    try:
        if not os.path.exists(BACKUP_JSON_PATH):
            # Create default structure if file doesn't exist
            default_data = {
                "type": "assets_inventory_backup",
                "servers": []
            }
            os.makedirs(os.path.dirname(BACKUP_JSON_PATH), exist_ok=True)
            with open(BACKUP_JSON_PATH, "w") as f:
                json.dump(default_data, f, indent=4)
            return default_data
        
        with open(BACKUP_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure proper structure
            if not isinstance(data, dict):
                data = {"type": "assets_inventory_backup", "servers": []}
            if "servers" not in data or not isinstance(data["servers"], list):
                data["servers"] = []
            return data
    except json.JSONDecodeError as e:
        print(f"[{datetime.now()}] JSON decode error: {e}")
        return {"type": "assets_inventory_backup", "servers": []}
    except Exception as e:
        print(f"[{datetime.now()}] Error reading backup JSON: {e}")
        return {"type": "assets_inventory_backup", "servers": []}


# ---------------------------------------
# Helper: Write JSON file
# ---------------------------------------
def write_backup_json(data):
    """Write data to the backup JSON file."""
    try:
        os.makedirs(os.path.dirname(BACKUP_JSON_PATH), exist_ok=True)
        with open(BACKUP_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"[{datetime.now()}] Updated backup JSON: {BACKUP_JSON_PATH}")
        return True
    except Exception as e:
        print(f"[{datetime.now()}] Error writing backup JSON: {e}")
        return False


# ---------------------------------------
# GET Endpoint: Get all backup data
# ---------------------------------------
@app.route("/api/assets-inventory-backup", methods=["GET"])
def get_backup_data():
    """Get all backup data as a map keyed by IP."""
    try:
        data = read_backup_json()
        ip_map = {}
        
        for server in data.get("servers", []):
            if server and "ip" in server:
                ip_key = str(server["ip"]).strip()
                ip_map[ip_key] = {
                    "asset_custodian": server.get("asset_custodian", ""),
                    "asset_owner": server.get("asset_owner", ""),
                    "risk_owner": server.get("risk_owner", ""),
                    "asset_classification": server.get("asset_classification", ""),
                    "data_classification": server.get("data_classification", ""),
                }
        
        return jsonify(ip_map), 200
    except Exception as e:
        print(f"[{datetime.now()}] Error in GET /api/assets-inventory-backup: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------
# POST Endpoint: Update backup data for an IP
# ---------------------------------------
@app.route("/api/assets-inventory-backup", methods=["POST"])
def update_backup_data():
    """Update backup data for a specific IP."""
    try:
        body = request.get_json(force=True)
        
        if not body:
            return jsonify({"ok": False, "error": "No data provided"}), 400
        
        ip = body.get("ip")
        values = body.get("values", {})
        
        if not ip:
            return jsonify({"ok": False, "error": "IP address is required"}), 400
        
        ip = str(ip).strip()
        
        # Allowed fields
        allowed_fields = [
            "asset_custodian",
            "asset_owner",
            "risk_owner",
            "asset_classification",
            "data_classification"
        ]
        
        # Read current data
        data = read_backup_json()
        servers = data.get("servers", [])
        
        # Find existing server entry
        server_index = None
        for i, server in enumerate(servers):
            if server and str(server.get("ip", "")).strip() == ip:
                server_index = i
                break
        
        # Prepare updates (only allowed fields)
        updates = {}
        for field in allowed_fields:
            if field in values:
                updates[field] = values[field]
        
        # Update or create server entry
        if server_index is not None:
            # Update existing entry
            servers[server_index].update(updates)
            servers[server_index]["ip"] = ip  # Ensure IP is set
            print(f"[{datetime.now()}] Updated entry for IP: {ip}")
        else:
            # Create new entry
            new_entry = {"ip": ip}
            new_entry.update(updates)
            servers.append(new_entry)
            print(f"[{datetime.now()}] Created new entry for IP: {ip}")
        
        # Save updated data
        data["servers"] = servers
        if write_backup_json(data):
            return jsonify({"ok": True, "message": f"Data updated for IP {ip}"}), 200
        else:
            return jsonify({"ok": False, "error": "Failed to write backup file"}), 500
            
    except Exception as e:
        print(f"[{datetime.now()}] Error in POST /api/assets-inventory-backup: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


# ---------------------------------------
# Main entry point
# ---------------------------------------
if __name__ == "__main__":
    # Ensure backup directory exists
    os.makedirs(os.path.dirname(BACKUP_JSON_PATH), exist_ok=True)
    
    print(f"[{datetime.now()}] Assets Inventory Backup API server starting...")
    print(f"Backup JSON path: {BACKUP_JSON_PATH}")
    print(f"Server will run on http://0.0.0.0:5154")
    
    app.run(host="0.0.0.0", port=5154, debug=True)

