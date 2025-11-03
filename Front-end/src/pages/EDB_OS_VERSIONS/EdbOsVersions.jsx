import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function EdbOsVersions({ onBack }) {
  const [regionsData, setRegionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all region JSON files on mount
  useEffect(() => {
    setLoading(true);
    const files = [
      'us_os_edb.json',
      'uk_os_edb.json',
      'asia_os_edb.json',
      'difc_os_edb.json',
      'feed_os_edb.json',
    ];

    Promise.all(files.map(f =>
      fetch('/data_os_edb_versions/' + f).then(res => {
        if (!res.ok) throw new Error(`${f} HTTP ${res.status}`);
        return res.json();
      })
    ))
      .then(results => {
        // results is an array of region objects
        setRegionsData(results || []);
        setError(null);
      })
      .catch(err => {
        setError('Failed to load region data');
        console.error('Error loading region JSONs:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to render server details table
  const renderServersTable = (servers) => (
    <table className="nested-table">
      <thead>
        <tr>
          <th>IP</th>
          <th>EC2 Name</th>
          <th>EDB Version</th>
          <th>OS Version</th>
        </tr>
      </thead>
      <tbody>
        {servers.map((server, idx) => (
          <tr key={(server.ip || '') + '-' + idx}>
            <td>{server.ip}</td>
            <td>{server.ec2_name}</td>
            <td>{server.edb_version}</td>
            <td>{server.os_version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back to list</button>
      <h1>EDB & OS Versions</h1>

      <div className="content-section">
        {loading && <p>Loading data...</p>}
        {error && <p style={{ color: 'var(--danger, #b00020)' }}>{error}</p>}

        <div className="versions-table">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Region</th>
                <th style={{ width: '13%' }}>AWS Account</th>
                <th style={{ width: '79%' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {/* Map each expected region to a row */}
              {['DIFC', 'FEED', 'ASIA', 'UK', 'US'].map(regionName => {
                const r = regionsData.find(d => (d.environment || '').toLowerCase() === regionName.toLowerCase());
                return (
                  <tr key={regionName}>
                    <td>{regionName}</td>
                    <td>{r?.aws_account_id || 'Not configured'}</td>
                    <td>
                      <div className="details-section">
                        {loading && <p>Loading data...</p>}
                        {error && <p style={{ color: 'var(--danger, #b00020)' }}>{error}</p>}
                        {!loading && !error && r?.servers ? (
                          renderServersTable(r.servers)
                        ) : (
                          !loading && !r && <p>No data available for {regionName} region.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <style jsx>{`
          .versions-table {
            margin-top: 1rem;
            overflow-x: auto;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .data-table th,
          .data-table td {
            padding: 0.75rem;
            text-align: left;
            border: 1px solid var(--border-color, #ddd);
          }
          
          .expand-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            font-weight: bold;
            color: var(--primary-color, #0066cc);
          }
          
          .expanded {
            background-color: var(--highlight-bg, #f8f9fa);
          }
          
          .details-section {
            padding: 1rem 0;
          }
          
          .nested-table {
            width: 100%;
            margin-top: 0.5rem;
            border-collapse: collapse;
          }
          
          .nested-table th,
          .nested-table td {
            padding: 0.5rem;
            border: 1px solid var(--border-color, #ddd);
            background: white;
          }
          
          .nested-table th {
            background: var(--table-header-bg, #f1f3f5);
          }
        `}</style>
      </div>
    </div>
  );
}