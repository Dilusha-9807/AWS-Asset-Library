import React from 'react';
import '../../App.css';

export default function AssetsInventory({ onBack }) {
  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back to list</button>
      <h1>Assets Inventory</h1>
      <div className="content-section">
        <p>Assets inventory management interface will be implemented here.</p>
        {/* TODO: Implement assets inventory management interface */}
      </div>
    </div>
  );
}