import React, { useEffect, useState } from 'react';
import '../App.css';

export default function AssetDetail({ name, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // local modal state for selected volume
  const [volModal, setVolModal] = useState(null);

  const mapping = {
    'DIFC PROD': '/data_assets/difc_assets.json',
    'ASIA PROD': '/data_assets/asia_assets.json',
    'FEED PROD': '/data_assets/feed_assets.json',
    'UK PROD': '/data_assets/uk_assets.json',
    'US PROD': '/data_assets/us_assets.json',
  };

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const url = mapping[name];
      if (!url) {
        setError('No data file mapped for this account');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [name]);

  if (loading) return <div className="dashboard-container">Loading assets...</div>;
  if (error) return <div className="dashboard-container" style={{ color: 'red' }}>Error: {error}</div>;

  const ec2 = data?.Resources?.EC2 || [];

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back to list</button>
      <h1>{name} — EC2 Resources</h1>
      <p>Region: {data.Region} | Timestamp: {data.Timestamp}</p>

      {ec2.length === 0 ? (
        <p>No EC2 resources found.</p>
      ) : (
        <table className="cost-table">
          <thead>
            <tr>
              <th>InstanceId</th>
              <th>Name</th>
              <th>Type</th>
              <th>State</th>
              <th>AZ</th>
              <th>Private IP</th>
              <th>Launch Time</th>
              <th>Volumes</th>
            </tr>
          </thead>
          <tbody>
            {ec2.map((i) => (
              <tr key={i.InstanceId}>
                <td>{i.InstanceId}</td>
                <td>{i.Name}</td>
                <td>{i.InstanceType}</td>
                <td>{i.State}</td>
                <td>{i.AvailabilityZone}</td>
                <td>{i.PrivateIP}</td>
                <td>{i.LaunchTime}</td>
                <td>
                  {i.Volumes?.length ? (
                    <button
                      className="view-res-btn"
                      onClick={() => setVolModal({ instanceId: i.InstanceId, volumes: i.Volumes })}
                    >
                      Volumes ({i.Volumes.length})
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {volModal && (
        <div className="modal-overlay" onClick={() => setVolModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setVolModal(null)}>×</button>
            <h3>Volumes for {volModal.instanceId}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>VolumeId</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Size (GiB)</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>IOPS</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Throughput</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Encrypted</th>
                </tr>
              </thead>
              <tbody>
                {volModal.volumes.map(v => (
                  <tr key={v.VolumeId}>
                    <td style={{ padding: 6 }}>{v.VolumeId}</td>
                    <td style={{ padding: 6 }}>{v.SizeGiB}</td>
                    <td style={{ padding: 6 }}>{v.VolumeType}</td>
                    <td style={{ padding: 6 }}>{v.IOPS || '-'}</td>
                    <td style={{ padding: 6 }}>{v.Throughput || '-'}</td>
                    <td style={{ padding: 6 }}>{v.Encrypted ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <button className="view-res-btn" onClick={() => setVolModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
