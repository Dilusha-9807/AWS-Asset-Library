import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function AssetsInventory({ onBack }) {
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

  // Server row component with persistent fields (stored in localStorage)
  const ServerRow = ({ server, region }) => {
    const keyPrefix = `${region}_${server.ip}_${server.ec2_name}`;

    const [assetCustodian, setAssetCustodian] = useState(() => {
      return localStorage.getItem(`asset_custodian_${keyPrefix}`) || '';
    });
    const [assetOwner, setAssetOwner] = useState(() => {
      return localStorage.getItem(`asset_owner_${keyPrefix}`) || '';
    });
    const [riskOwner, setRiskOwner] = useState(() => {
      return localStorage.getItem(`risk_owner_${keyPrefix}`) || '';
    });
    const [assetClassification, setAssetClassification] = useState(() => {
      return localStorage.getItem(`asset_classification_${keyPrefix}`) || '';
    });
    const [dataClassification, setDataClassification] = useState(() => {
      return localStorage.getItem(`data_classification_${keyPrefix}`) || '';
    });

    const onTextChange = (setter, storageKey) => (e) => {
      const v = e.target.value;
      setter(v);
  try { localStorage.setItem(storageKey, v); } catch { /* ignore */ }
    };

    const onSelectChange = (setter, storageKey) => (e) => {
      const v = e.target.value;
      setter(v);
  try { localStorage.setItem(storageKey, v); } catch { /* ignore */ }
    };

    return (
      <tr>
        <td>{server.ip}</td>
        <td>{server.ec2_name}</td>

        <td>
          <input
            type="text"
            value={assetCustodian}
            onChange={onTextChange(setAssetCustodian, `asset_custodian_${keyPrefix}`)}
            placeholder="Asset Custodian"
            className="small-input"
          />
        </td>

        <td>
          <input
            type="text"
            value={assetOwner}
            onChange={onTextChange(setAssetOwner, `asset_owner_${keyPrefix}`)}
            placeholder="Asset Owner"
            className="small-input"
          />
        </td>

        <td>
          <input
            type="text"
            value={riskOwner}
            onChange={onTextChange(setRiskOwner, `risk_owner_${keyPrefix}`)}
            placeholder="Risk Owner"
            className="small-input"
          />
        </td>

        <td>
          <select
            value={assetClassification}
            onChange={onSelectChange(setAssetClassification, `asset_classification_${keyPrefix}`)}
            className="select-input"
          >
            <option value="">Select</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </td>

        <td>
          <select
            value={dataClassification}
            onChange={onSelectChange(setDataClassification, `data_classification_${keyPrefix}`)}
            className="select-input"
          >
            <option value="">Select</option>
            <option value="Confidential">Confidential</option>
            <option value="Non-Confidential (Internal)">Non-Confidential (Internal)</option>
          </select>
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
          <th>Asset Custodian</th>
          <th>Asset Owner</th>
          <th>Risk Owner</th>
          <th>Asset Classification</th>
          <th>Data Classification</th>
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
      <h1>Assets Inventory</h1>

      <div className="content-section">
        {loading && <p>Loading data...</p>}
        {error && <p style={{ color: 'var(--danger, #b00020)' }}>{error}</p>}

        <div className="versions-table">
          <table className="data-table">
            <thead>
              <tr>
                  <th style={{ width: '15%' }}>Region</th>
                  <th style={{ width: '85%' }}>Details</th>
                </tr>
            </thead>
            <tbody>
              {/* Map each expected region to a row */}
              {['DIFC', 'FEED', 'ASIA', 'UK', 'US'].map(regionName => {
                const r = regionsData.find(d => (d.environment || '').toLowerCase() === regionName.toLowerCase());
                return (
                  <tr key={regionName}>
                      <td>{regionName}</td>
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

          .small-input,
          .select-input {
            padding: 6px 8px;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 4px;
            min-width: 160px;
            background: white;
          }
        `}</style>
      </div>
    </div>
  );
}