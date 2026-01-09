import React, { useState } from 'react';
import '../../App.css';

const ENV_CONFIG = [
  { id: 'difc', label: 'DIFC' },
  { id: 'asia', label: 'ASIA' },
  { id: 'feed', label: 'FEED' },
  { id: 'uk', label: 'UK' },
  { id: 'us', label: 'US' },
];

// Map for FO/BO + Daily/DR → public JSON path
function getLogPath(envId, scope, logType) {
  const baseName = `${envId}_validations`;
  const drName = `${envId}_validations_dr`;

  if (scope === 'FO' && logType === 'daily') {
    return `/data_validation_logs_fo/${baseName}.json`;
  }
  if (scope === 'FO' && logType === 'dr') {
    return `/data_validation_logs_dr_fo/${drName}.json`;
  }
  if (scope === 'BO' && logType === 'daily') {
    return `/data_validation_logs/${baseName}.json`;
  }
  if (scope === 'BO' && logType === 'dr') {
    return `/data_validation_logs_dr/${drName}.json`;
  }
  return null;
}

export default function BackupLogs({ onBack }) {
  const [selected, setSelected] = useState(null); // { envId, scope, logType, label }
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null); // { env, type }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = async (envId, scope, logType, label) => {
    const path = getLogPath(envId, scope, logType);
    if (!path) return;

    setSelected({ envId, scope, logType, label });
    setLoading(true);
    setError(null);
    setLogs([]);
    setMeta(null);

    try {
      const res = await fetch(path);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const dataArray = Array.isArray(json.data) ? json.data : [];
      setLogs(dataArray);
      setMeta({ env: json.env || envId, type: json.type || 'validation_logs' });
    } catch (e) {
      console.error('Failed to load validation logs:', e);
      setError('Failed to load validation logs for this section.');
    } finally {
      setLoading(false);
    }
  };

  // Function to render log lines with highlighting for inconsistencies
  const renderLogLines = (logArray) => {
    if (!Array.isArray(logArray) || logArray.length === 0) return null;

    return logArray.map((line, index) => {
      if (!line || line.trim() === '') {
        return <div key={index} style={{ height: '1em' }}></div>;
      }

      const lineStr = String(line);
      const lowerLine = lineStr.toLowerCase();

      // Check for inconsistency messages - highlight if contains "Inconsistencies found" but not "No inconsistencies found"
      const hasInconsistency = lowerLine.includes('inconsistencies found') && 
                               !lowerLine.includes('no inconsistencies found');

      // Check for DR progress line - highlight if NOT exactly "progress: done (0 inconsistencies, 0 warnings, 0 errors)"
      const isProgressLine = lowerLine.trim().startsWith('progress:');
      const isAllZeros = lineStr.trim() === 'progress: done (0 inconsistencies, 0 warnings, 0 errors)';

      if (hasInconsistency) {
        // Highlight inconsistency lines in carmine red
        return (
          <div 
            key={index} 
            style={{ 
              color: '#DC143C', 
              fontWeight: 'bold',
              backgroundColor: '#FFE4E1',
              padding: '2px 4px',
              margin: '1px 0'
            }}
          >
            {lineStr}
          </div>
        );
      }

      if (isProgressLine && !isAllZeros) {
        // Highlight DR progress lines that are NOT "all zeros" in carmine red
        return (
          <div 
            key={index} 
            style={{ 
              color: '#DC143C', 
              fontWeight: 'bold',
              backgroundColor: '#FFE4E1',
              padding: '2px 4px',
              margin: '1px 0'
            }}
          >
            {lineStr}
          </div>
        );
      }

      // Regular line
      return (
        <div key={index} style={{ color: '#e3e8ff' }}>
          {lineStr}
        </div>
      );
    });
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '52%', width: '52%' }}>
      <div className="header-row">
        <button className="back-btn" onClick={onBack}>← Back to list</button>
        <h1 style={{ margin: 0 }}>Backup Logs</h1>
      </div>

      <div className="content-section" style={{ width: '100%' }}>
        {/* Table-style hierarchy with three columns */}
        <div className="backup-table-container">
          {ENV_CONFIG.map((env) => (
            <table key={env.id} className="backup-table">
              <tbody>
                {/* FO/SGX Section */}
                <tr>
                  <td rowSpan={env.id === 'asia' ? 2 : 4} className="env-cell">
                    <div className="flowchart-node flowchart-env-node">
                      {env.label}
                    </div>
                  </td>
                  <td rowSpan={env.id === 'asia' ? 1 : 2} className="scope-cell">
                    <div className="flowchart-node flowchart-scope-node">
                      {env.id === 'feed' ? 'SGX' : 'FO'}
                    </div>
                  </td>
                  <td className="validation-cell">
                    <button
                      className="flowchart-leaf-btn"
                      onClick={() =>
                        handleSelect(env.id, 'FO', 'daily', `${env.label} - ${env.id === 'feed' ? 'SGX' : 'FO'} Daily backup validations`)
                      }
                    >
                      Daily Backup Validations
                    </button>
                  </td>
                </tr>
                {env.id !== 'asia' && (
                  <tr>
                    <td className="validation-cell">
                      <button
                        className="flowchart-leaf-btn"
                        onClick={() =>
                          handleSelect(env.id, 'FO', 'dr', `${env.label} - ${env.id === 'feed' ? 'SGX' : 'FO'} DR backup validations`)
                        }
                      >
                        DR Backup Validations
                      </button>
                    </td>
                  </tr>
                )}
                {/* BO/NV Section */}
                <tr>
                  <td rowSpan={env.id === 'asia' ? 1 : 2} className="scope-cell">
                    <div className="flowchart-node flowchart-scope-node">
                      {env.id === 'feed' ? 'NV' : 'BO'}
                    </div>
                  </td>
                  <td className="validation-cell">
                    <button
                      className="flowchart-leaf-btn"
                      onClick={() =>
                        handleSelect(env.id, 'BO', 'daily', `${env.label} - ${env.id === 'feed' ? 'NV' : 'BO'} Daily backup validations`)
                      }
                    >
                      Daily Backup Validations
                    </button>
                  </td>
                </tr>
                {env.id !== 'asia' && (
                  <tr>
                    <td className="validation-cell">
                      <button
                        className="flowchart-leaf-btn"
                        onClick={() =>
                          handleSelect(env.id, 'BO', 'dr', `${env.label} - ${env.id === 'feed' ? 'NV' : 'BO'} DR backup validations`)
                        }
                      >
                        DR Backup Validations
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ))}
        </div>

        {/* Logs modal */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'left' }}>Backup validation logs</h2>
              <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#666', textAlign: 'left' }}>
                {selected.label}
                {meta?.env ? ` (${meta.env})` : ''}
              </p>

              {loading && <p style={{ textAlign: 'left' }}>Loading logs...</p>}
              {error && <p style={{ color: 'var(--danger, #b00020)', textAlign: 'left' }}>{error}</p>}

              {!loading && !error && logs.length === 0 && (
                <p style={{ color: '#666', textAlign: 'left' }}>No log entries available for this selection.</p>
              )}

              {!loading && !error && logs.length > 0 && (
                <div className="backup-logs-output" style={{ maxHeight: '60vh', textAlign: 'left' }}>
                  {renderLogLines(logs)}
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button className="view-res-btn" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .backup-table-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            padding: 1rem 0;
            width: 100%;
            max-width: 100%;
          }

          /* Table styling */
          .backup-table {
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
            margin-bottom: 1rem;
            table-layout: fixed;
          }

          .backup-table td {
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            vertical-align: middle;
          }

          .backup-table td:first-child {
            width: 20%;
          }

          .backup-table td:nth-child(2) {
            width: 15%;
          }

          .backup-table td:nth-child(3) {
            width: 65%;
          }

          .backup-table tbody tr:last-child td {
            border-bottom: none;
          }

          .backup-table tbody tr:last-child .env-cell,
          .backup-table tbody tr:last-child .scope-cell {
            border-bottom: none;
          }

          /* Cell styling */
          .env-cell {
            text-align: center;
            vertical-align: middle;
            border-right: 2px solid #ddd;
          }

          .scope-cell {
            text-align: center;
            vertical-align: middle;
            border-right: 2px solid #ddd;
          }

          .validation-cell {
            vertical-align: middle;
          }

          /* Nodes */
          .flowchart-node {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
            border: 2px solid #1976d2;
            display: inline-block;
            text-align: center;
          }

          .flowchart-node:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(25, 118, 210, 0.3);
          }

          .flowchart-env-node {
            font-size: 1.1rem;
            padding: 14px 24px;
          }

          .flowchart-scope-node {
            background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
            font-size: 0.95rem;
            padding: 10px 18px;
            border: 2px solid #42a5f5;
          }

          /* Leaf Buttons */
          .flowchart-leaf-btn {
            padding: 10px 16px;
            border-radius: 8px;
            border: 2px solid #90caf9;
            background: #e3f2fd;
            color: #1565c0;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
            width: 80%;
            max-width: 400px;
            box-shadow: 0 2px 6px rgba(144, 202, 249, 0.2);
            text-align: center;
          }

          .flowchart-leaf-btn:hover {
            background: #bbdefb;
            border-color: #42a5f5;
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(66, 165, 245, 0.3);
          }

          .flowchart-leaf-btn:active {
            transform: translateY(0);
          }

          .backup-logs-output {
            overflow: auto;
            padding: 12px 14px;
            background: #0b1020;
            color: #e3e8ff;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
            font-size: 0.82rem;
            line-height: 1.6;
            border: 1px solid #1c2238;
            text-align: left;
          }

          @media (max-width: 768px) {
            .backup-table {
              font-size: 0.9rem;
            }

            .backup-table th,
            .backup-table td {
              padding: 0.75rem 0.5rem;
            }

            .flowchart-node {
              padding: 8px 12px;
              font-size: 0.9rem;
            }

            .flowchart-leaf-btn {
              padding: 8px 12px;
              font-size: 0.85rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}