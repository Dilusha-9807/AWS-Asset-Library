import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function EdbOsVersions({ onBack }) {
  const [regionsData, setRegionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [persistedMap, setPersistedMap] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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

  // Load persisted values from backup JSON file via backend API
  useEffect(() => {
    let mounted = true;
    async function loadPersisted() {
      try {
        // Use backend API to get data from JSON file
        const res = await fetch('/api/edb-os-backup');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ipMap = await res.json();
        
        if (mounted) setPersistedMap(ipMap || {});
      } catch (e) {
        console.warn('Failed to load persisted EDB/OS values from backup API:', e);
        // Fallback: try loading directly from JSON file
        try {
          const res = await fetch('/data_backup/edb_os_versions_backup.json');
          if (res.ok) {
            const json = await res.json();
            const ipMap = {};
            if (json && Array.isArray(json.servers)) {
              json.servers.forEach(server => {
                if (server && server.ip) {
                  const ipKey = (server.ip || '').trim();
                  ipMap[ipKey] = {
                    release_date: server.release_date || '',
                    last_applied_date: server.last_applied_date || '',
                    next_update: server.next_update || '',
                    skip: server.skip || 'No',
                    reason_for_skip: server.reason_for_skip || '',
                    upgrade_history: server.upgrade_history || '',
                    upgrade_notes: server.upgrade_notes || '',
                  };
                }
              });
            }
            if (mounted) setPersistedMap(ipMap);
          }
        } catch (fallbackError) {
          console.warn('Fallback load also failed:', fallbackError);
          if (mounted) setPersistedMap({});
        }
      }
    }
    loadPersisted();
    return () => { mounted = false; };
  }, []);

  async function savePersisted(ip, values) {
    try {
      // Use backend API to update JSON file
      const res = await fetch('/api/edb-os-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, values }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const result = await res.json();
      if (result.ok) {
        // Update local state to reflect saved changes
        setPersistedMap(prev => ({
          ...prev,
          [ip]: {
            ...(prev[ip] || {}),
            ...values,
          },
        }));
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (e) {
      console.warn('Failed to persist EDB/OS values:', e);
      throw e; // Re-throw so handleSave can catch it
    }
  }

  // Server row component to handle state per row
  const ServerRow = ({ server, region, onShowSuccess }) => {
    const ipKey = (server.ip || '').trim();
    const initial = persistedMap[ipKey] || {};

    // Initialize from persisted map (fallback defaults)
    const [releaseDate, setReleaseDate] = useState(() => {
      return initial.release_date || '';
    });
    const [lastAppliedDate, setLastAppliedDate] = useState(() => {
      return initial.last_applied_date || '';
    });
    const [nextUpdate, setNextUpdate] = useState(() => {
      return initial.next_update || '';
    });
    const [skip, setSkip] = useState(() => {
      return initial.skip || '';
    });
    const [skipReason, setSkipReason] = useState(() => {
      return initial.reason_for_skip || '';
    });
    const [upgradeHistory, setUpgradeHistory] = useState(() => {
      return initial.upgrade_history || '';
    });
    const [upgradeNotes, setUpgradeNotes] = useState(() => {
      return initial.upgrade_notes || '';
    });

    // State to track if saving
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // 'success' or 'error'

    // Generic handler for date changes (no auto-save)
    const handleDateChange = (setter) => (e) => {
      const newDate = e.target.value;
      setter(newDate);
    };

    // Generic handler for text changes (no auto-save)
    const handleTextChange = (setter) => (e) => {
      const value = e.target.value;
      setter(value);
    };

    // Save all fields for this row
    const handleSave = async () => {
      setIsSaving(true);
      setSaveStatus('');
      
      const values = {
        release_date: releaseDate,
        last_applied_date: lastAppliedDate,
        next_update: nextUpdate,
        skip: skip,
        reason_for_skip: skipReason,
        upgrade_history: upgradeHistory,
        upgrade_notes: upgradeNotes,
      };

      try {
        await savePersisted(ipKey, values);
        setSaveStatus('success');
        // Show popup message
        if (onShowSuccess) {
          onShowSuccess();
        }
        setTimeout(() => setSaveStatus(''), 2000); // Clear status after 2 seconds
      } catch (e) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 2000);
      } finally {
        setIsSaving(false);
      }
    };

    // Format date for display (e.g., "2025-11-03" to "Nov 3, 2025")
    const formattedDate = lastAppliedDate ? new Date(lastAppliedDate).toLocaleDateString() : '';
    const formattedNextUpdate = nextUpdate ? new Date(nextUpdate).toLocaleDateString() : '';

    return (
      <tr>
        <td>{server.ip}</td>
        <td>{server.ec2_name}</td>
        <td>{server.edb_version}</td>
        <td>{server.os_version}</td>
        <td>
          <div className="date-cell">
            <span className="date-display">
              {releaseDate ? new Date(releaseDate).toLocaleDateString() : 'Not set'}
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
                value={releaseDate}
                onChange={handleDateChange(setReleaseDate)}
                className="date-input"
              />
            </label>
          </div>
        </td>
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
                onChange={handleDateChange(setLastAppliedDate)}
                className="date-input"
              />
            </label>
          </div>
        </td>
        <td>
          <div className="date-cell">
            <span className="date-display">
              {formattedNextUpdate || 'Not set'}
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
                value={nextUpdate}
                onChange={handleDateChange(setNextUpdate)}
                className="date-input"
              />
            </label>
          </div>
        </td>
        <td>
          <select 
            value={skip}
            onChange={handleTextChange(setSkip)}
            className="small-input"
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </td>
        <td>
          <textarea
            value={skipReason}
            onChange={handleTextChange(setSkipReason)}
            placeholder="Reason for skip"
            className="small-input"
            rows="2"
          />
        </td>
        <td>
          <textarea
            value={upgradeHistory}
            onChange={handleTextChange(setUpgradeHistory)}
            placeholder="Enter upgrade history"
            className="small-input"
            rows="2"
          />
        </td>
        <td>
          <textarea
            value={upgradeNotes}
            onChange={handleTextChange(setUpgradeNotes)}
            placeholder="Enter upgrade notes"
            className="small-input"
            rows="2"
          />
        </td>
        <td>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="save-btn"
            title="Save changes for this row"
          >
            {isSaving ? 'Saving...' : saveStatus === 'success' ? '✓ Saved' : saveStatus === 'error' ? '✗ Error' : 'Save'}
          </button>
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
          <th>Release Date</th>
          <th>Last Applied Date</th>
          <th>Next Update</th>
          <th>Skip</th>
          <th>Reason For Skip</th>
          <th>Upgrade History</th>
          <th>Upgrade Notes</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {servers.map((server) => (
          <ServerRow 
            key={`${server.ip}-${server.ec2_name}`}
            server={server}
            region={region}
            onShowSuccess={() => setShowSuccessPopup(true)}
          />
        ))}
      </tbody>
    </table>
  );

  // Auto-hide success popup after 3 seconds
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back to list</button>
      <h1>EDB & OS Versions</h1>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <span className="success-icon">✓</span>
            <span className="success-message">Changes saved</span>
          </div>
        </div>
      )}

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

          .small-input {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 4px;
            font-size: 0.9em;
          }

          textarea.small-input {
            resize: vertical;
            min-height: 60px;
          }

          select.small-input {
            background-color: white;
            height: 28px;
          }

          .nested-table th,
          .nested-table td {
            min-width: 120px;
            max-width: 200px;
          }

          .nested-table td textarea,
          .nested-table td input[type="text"] {
            width: calc(100% - 16px);
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

          .save-btn {
            padding: 6px 12px;
            background-color: var(--primary-color, #0066cc);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 500;
            transition: background-color 0.2s, opacity 0.2s;
            min-width: 80px;
          }

          .save-btn:hover:not(:disabled) {
            background-color: var(--primary-hover, #0052a3);
          }

          .save-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .save-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .success-popup {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .success-popup-content {
            background-color: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.95em;
            font-weight: 500;
            min-width: 180px;
          }

          .success-icon {
            font-size: 1.2em;
            font-weight: bold;
          }

          .success-message {
            flex: 1;
          }
        `}</style>
      </div>
    </div>
  );
}