import React from 'react';
import '../../App.css';

export default function EdbOsVersions({ onBack }) {
  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back to list</button>
      <h1>EDB & OS Versions</h1>
      <div className="content-section">
        <p>EDB and Operating System versions dashboard will be implemented here.</p>
        {/* TODO: Implement EDB and OS versions tracking interface */}
      </div>
    </div>
  );
}