import React from 'react';
import '../../App.css';

export default function BackupLogs({ onBack }) {
  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back to list</button>
      <h1>Backup Logs</h1>
      <div className="content-section">
        <p>Backup logs monitoring interface will be implemented here.</p>
        {/* TODO: Implement backup logs monitoring interface */}
      </div>
    </div>
  );
}