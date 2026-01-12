#!/usr/bin/env python3
from flask import Flask, request, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)

# ---------------------------------------
# Configuration
# ---------------------------------------
SAVE_PATH_ASSETS = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_assets"
SAVE_PATH_COST = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data"
SAVE_PATH_OS_EDB = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_os_edb_versions"
SAVE_PATH_OS_EDB_FO = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_os_edb_versions_fo"
SAVE_PATH_VALIDATION_LOGS = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_validation_logs"
SAVE_PATH_VALIDATION_LOGS_FO = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_validation_logs_fo"
SAVE_PATH_VALIDATION_LOGS_DR = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_validation_logs_dr"
SAVE_PATH_VALIDATION_LOGS_DR_FO = "/works/d_dilusha/app_assets_lib/AWS-Asset-Library/Front-end/public/data_validation_logs_dr_fo"

# Map sender IP → file name
ASSETS_FILE_MAP = {
    "172.21.195.109": "us_assets.json",
    "172.21.227.27": "uk_assets.json",
    "172.23.125.36": "difc_assets.json",
    "172.20.191.9": "asia_assets.json",
    "172.20.183.120": "feed_assets.json",
    "10.46.10.10": "hk_assets.json"
}

COST_FILE_MAP = {
    "172.21.195.109": "us_cost.json",
    "172.21.227.27": "uk_cost.json",
    "172.23.125.36": "difc_cost.json",
    "172.20.191.9": "asia_cost.json",
    "172.20.183.120": "feed_cost.json",
    "10.46.10.10": "hk_cost.json"
}

EDB_OS_FILE_MAP = {
    "172.21.195.109": "us_os_edb.json",
    "172.21.227.27": "uk_os_edb.json",
    "172.23.125.36": "difc_os_edb.json",
    "172.20.191.9": "asia_os_edb.json",
    "172.20.183.120": "feed_os_edb.json",
    "10.46.10.10": "hk_os_edb.json"
}

EDB_OS_FO_FILE_MAP = {
    "172.21.195.200": "us_os_edb.json",
    "172.21.227.160": "uk_os_edb.json",
    "172.23.125.37": "difc_os_edb.json",
    "172.20.191.10": "asia_os_edb.json",
    "172.20.166.120": "feed_os_edb.json",
    "10.46.10.5": "hk_os_edb.json"  
}

VALIDATION_LOGS_FILE_MAP = {
    "172.21.195.109": "us_validation_logs.json",
    "172.21.227.27": "uk_validation_logs.json",
    "172.23.125.36": "difc_validation_logs.json",
    "172.20.191.9": "asia_validation_logs.json",
    "172.20.183.120": "feed_validation_logs.json",
    "10.46.10.10": "hk_validation_logs.json"
}

VALIDATION_LOGS_FO_FILE_MAP = {
    "172.21.195.200": "us_validation_logs_fo.json",
    "172.21.227.160": "uk_validation_logs_fo.json",
    "172.23.125.37": "difc_validation_logs_fo.json",
    "172.20.191.10": "asia_validation_logs_fo.json",
    "172.20.166.120": "feed_validation_logs_fo.json",
    "10.46.10.5": "hk_validation_logs_fo.json"
}

VALIDATION_LOGS_DR_FILE_MAP = {
    "172.21.195.109": "us_validation_logs_dr.json",
    "172.21.227.27": "uk_validation_logs_dr.json",
    "172.23.125.36": "difc_validation_logs_dr.json",
    "172.20.191.9": "asia_validation_logs_dr.json",
    "172.20.183.120": "feed_validation_logs_dr.json",
    "10.46.10.10": "hk_validation_logs_dr.json"
}
VALIDATION_LOGS_DR_FO_FILE_MAP = {

    "172.21.195.200": "us_validation_logs_dr_fo.json",
    "172.21.227.160": "uk_validation_logs_dr_fo.json",
    "172.23.125.37": "difc_validation_logs_dr_fo.json",
    "172.20.191.10": "asia_validation_logs_dr_fo.json",
    "172.20.166.120": "feed_validation_logs_dr_fo.json",
    "10.46.10.5": "hk_validation_logs_dr_fo.json"
}

# ---------------------------------------
# Helper: Save JSON to file
# ---------------------------------------
def save_json_file(save_path, file_name, data):
    os.makedirs(save_path, exist_ok=True)
    file_path = os.path.join(save_path, file_name)
    try:
        with open(file_path, "w") as f:
            json.dump(data, f, indent=4)
        print(f"[{datetime.now()}] Saved JSON to: {file_path}")
    except Exception as e:
        print(f"[{datetime.now()}] Failed to save JSON ({file_name}): {e}")


# ---------------------------------------
# POST Endpoint
# ---------------------------------------
@app.route("/upload", methods=["POST"])
def upload_json():
    client_ip = request.remote_addr
    print(f"[{datetime.now()}] Received POST from {client_ip}")

    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"status": "error", "message": "Invalid JSON"}), 400

    # Determine JSON type: default to 'assets' if missing
    json_type = data.get("type", "assets").lower()

    if json_type == "assets":
        file_map = ASSETS_FILE_MAP
        save_path = SAVE_PATH_ASSETS
    elif json_type == "cost":
        file_map = COST_FILE_MAP
        save_path = SAVE_PATH_COST
    elif json_type == "os_edb_versions":
        file_map = EDB_OS_FILE_MAP
        save_path = SAVE_PATH_OS_EDB
    elif json_type == "os_edb_versions_fo":
        file_map = EDB_OS_FO_FILE_MAP
        save_path = SAVE_PATH_OS_EDB_FO
    elif json_type == "validation_logs":
        file_map = VALIDATION_LOGS_FILE_MAP
        save_path = SAVE_PATH_VALIDATION_LOGS
    elif json_type == "validation_logs_fo":
        file_map = VALIDATION_LOGS_FO_FILE_MAP
        save_path = SAVE_PATH_VALIDATION_LOGS_FO
    elif json_type == "validation_logs_dr":
        file_map = VALIDATION_LOGS_DR_FILE_MAP
        save_path = SAVE_PATH_VALIDATION_LOGS_DR
    elif json_type == "validation_logs_dr_fo":
        file_map = VALIDATION_LOGS_DR_FO_FILE_MAP
        save_path = SAVE_PATH_VALIDATION_LOGS_DR_FO
    else:
        msg = f"Unknown JSON type '{json_type}' from {client_ip}"
        print(f"[{datetime.now()}] {msg}")
        return jsonify({"status": "error", "message": msg}), 400

    # Get target file name
    file_name = file_map.get(client_ip)
    if not file_name:
        msg = f"No target file configured for IP {client_ip} and type {json_type}"
        print(f"[{datetime.now()}] {msg}")
        return jsonify({"status": "error", "message": msg}), 400

    # Save JSON
    save_json_file(save_path, file_name, data)

    return jsonify({"status": "success", "message": f"Data saved for {client_ip}"}), 200


# ---------------------------------------
# Main entry point
# ---------------------------------------
if __name__ == "__main__":
    os.makedirs(SAVE_PATH_ASSETS, exist_ok=True)
    os.makedirs(SAVE_PATH_COST, exist_ok=True)
    os.makedirs(SAVE_PATH_OS_EDB, exist_ok=True)
    os.makedirs(SAVE_PATH_OS_EDB_FO, exist_ok=True)
    print(f"JSON listener started on port 5152...")
    print(f"Assets path: {SAVE_PATH_ASSETS}")
    print(f"Cost path: {SAVE_PATH_COST}")
    app.run(host="0.0.0.0", port=5152)

