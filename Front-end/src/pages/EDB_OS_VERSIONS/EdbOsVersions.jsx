import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function EdbOsVersions({ onBack }) {
  const [usData, setUsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRegion, setExpandedRegion] = useState(null);

  // Fetch US data on mount
  useEffect(() => {
    setLoading(true);
    fetch('/data_os_edb_versions/us_os_edb.json')
      .then(res => res.json())
      .then(data => {
        setUsData(data);
        setError(null);
      })
      .catch(err => {
        setError('Failed to load US region data');
        console.error('Error loading US data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Toggle region expansion
  const toggleRegion = (regionId) => {
    setExpandedRegion(expandedRegion === regionId ? null : regionId);
  };

  // Helper to render server details table
  const renderServersTable = (servers) => (
    <table className="nested-table">
      <thead>
        <tr>
          <th>IP</th>
          <th>Port</th>
          <th>EC2 Name</th>
          <th>EDB Version</th>
          <th>OS Version</th>
        </tr>
      </thead>
      <tbody>
        {servers.map((server, idx) => (
          <tr key={server.ip + '-' + server.port + '-' + idx}>
            <td>{server.ip}</td>
            <td>{server.port}</td>
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
                <th style={{ width: '10%' }}>Region</th>
                <th style={{ width: '20%' }}>AWS Account</th>
                <th style={{ width: '15%' }}>Server Count</th>
                <th style={{ width: '55%' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {/* US Region - with actual data */}
              <tr className={expandedRegion === 'us' ? 'expanded' : ''}>
                <td>
                  <button 
                    className="expand-btn"
                    onClick={() => toggleRegion('us')}
                  >
                    {expandedRegion === 'us' ? '▼' : '▶'} US
                  </button>
                </td>
                <td>{usData?.aws_account_id || 'Loading...'}</td>
                <td>{usData?.servers?.length || 0} servers</td>
                <td>
                  {expandedRegion === 'us' && usData?.servers && (
                    <div className="details-section">
                      {renderServersTable(usData.servers)}
                    </div>
                  )}
                </td>
              </tr>

              {/* Other regions - placeholders */}
              {['DIFC', 'ASIA', 'UK', 'FEED'].map(region => (
                <tr key={region} className={expandedRegion === region.toLowerCase() ? 'expanded' : ''}>
                  <td>
                    <button 
                      className="expand-btn"
                      onClick={() => toggleRegion(region.toLowerCase())}
                    >
                      {expandedRegion === region.toLowerCase() ? '▼' : '▶'} {region}
                    </button>
                  </td>
                  <td>Not configured</td>
                  <td>0 servers</td>
                  <td>
                    {expandedRegion === region.toLowerCase() && (
                      <div className="details-section">
                        <p>No data available for {region} region.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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