import React, { useState } from 'react';
import '../App.css';
import AssetDetail from './AssetDetail';

export default function AssetsLibrary({ onBack }) {
  const [selected, setSelected] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'detail'

  const options = [
    'DIFC PROD',
    'ASIA PROD',
    'FEED PROD',
    'UK PROD',
    'US PROD',
    'HK PROD',
  ];

  function openDetail(name) {
    setSelected(name);
    setView('detail');
  }

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      {view === 'list' && (
        <div>
          <h1>Assets Library</h1>
          <p>Select an account to view its assets</p>
          <div className="assets-list" style={{ marginTop: 16 }}>
            {options.map(o => (
              <button key={o} className="assets-btn" onClick={() => openDetail(o)}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {view === 'detail' && (
        <div>
          <AssetDetail name={selected} onBack={() => setView('list')} />
        </div>
      )}
    </div>
  );
}
