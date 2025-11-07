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

    // Helper function to fetch and merge data
    const fetchAndMergeData = async () => {
      try {
        const mainResults = await Promise.all(files.map(f =>
          fetch('/data_os_edb_versions/' + f).then(res => {
            if (!res.ok) throw new Error(`${f} HTTP ${res.status}`);
            return res.json();
          })
        ));

        const foResults = await Promise.all(files.map(f =>
          fetch('/data_os_edb_versions_fo/' + f).then(res => {
            if (!res.ok) return null; // If file doesn't exist in _fo, skip it
            return res.json();
          }).catch(() => null) // Handle 404s gracefully
        ));

        // Merge the results
        const mergedResults = mainResults.map((mainData, index) => {
          const foData = foResults[index];
          if (!foData) return mainData;

          return {
            ...mainData,
            servers: [...mainData.servers, ...foData.servers]
          };
        });

        setRegionsData(mergedResults || []);
        setError(null);
      } catch (err) {
        setError('Failed to load region data');
        console.error('Error loading region JSONs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMergeData();
  }, []);

  // (last-applied-date helpers removed — ServerRow manages localStorage per-row)

  // Server row component to handle state per row
  const ServerRow = ({ server, region }) => {
    const storageKey = `last_applied_date_${region}_${server.ip}_${server.ec2_name}`;
    const [lastAppliedDate, setLastAppliedDate] = useState(() => {
      return localStorage.getItem(storageKey) || '';
    });

    const handleDateChange = (e) => {
      const newDate = e.target.value;
      setLastAppliedDate(newDate);
      localStorage.setItem(storageKey, newDate);
    };

    // Format date for display (e.g., "2025-11-03" to "Nov 3, 2025")
    const formattedDate = lastAppliedDate ? new Date(lastAppliedDate).toLocaleDateString() : '';

    return (
      <tr>
        <td>{server.ip}</td>
        <td>{server.ec2_name}</td>
        <td>{server.edb_version}</td>
        <td>{server.os_version}</td>
        <td>
          <div className="date-cell">
            <span className="date-display">
              {formattedDate || 'Not set'}
            </span>
            <label className="calendar-label">
              <button 
                className="calendar-button" 
                onClick={(e) => {
                  e.preventDefault();
                  const dateInput = e.currentTarget.parentElement.querySelector('input[type="date"]');
                  dateInput.showPicker();
                }}
                title="Select date"
              >
                📅
              </button>
              <input
                type="date"
                value={lastAppliedDate}
                onChange={handleDateChange}
                className="date-input"
              />
            </label>
          </div>
        </td>
      </tr>
    );
  };

  // Helper to render server details table
  const renderServersTable = (servers, region) => (
    <table className="nested-table">
      <thead>
        <tr>
          <th>IP</th>
          <th>EC2 Name</th>
          <th>EDB Version</th>
          <th>OS Version</th>
          <th>Last applied date</th>
        </tr>
      </thead>
      <tbody>
        {servers.map((server) => (
          <ServerRow 
            key={`${server.ip}-${server.ec2_name}`}
            server={server}
            region={region}
          />
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
                          renderServersTable(r.servers, regionName)
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

          .date-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: space-between;
          }

          .date-display {
            color: var(--text-color, #333);
          }

          .calendar-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 4px;
            font-size: 1rem;
            display: flex;
            align-items: center;
            opacity: 0.7;
            transition: opacity 0.2s;
          }

          .calendar-button:hover {
            opacity: 1;
          }

          .calendar-label {
            position: relative;
            display: inline-flex;
            align-items: center;
          }

          .date-input {
            position: absolute;
            width: 1px;
            height: 1px;
            opacity: 0;
            pointer-events: none;
          }

          .date-input::-webkit-calendar-picker-indicator {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            opacity: 0;
            cursor: pointer;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 4px;
            min-width: 130px;
          }
        `}</style>
      </div>
    </div>
  );
}