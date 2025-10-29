import React, { useEffect, useState } from 'react';
import '../../App.css';
import Modal from './_Modal';
import ResourceTable from './_ResourceTable';

const accountFiles = [
  'asia_cost.json',
  'difc_cost.json',
  'feed_cost.json',
  'uk_cost.json',
  'us_cost.json',
];

export default function CostDashboard({ onBack }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, service: '', details: [] });

  useEffect(() => {
    let mounted = true;
    async function fetchAccounts() {
      try {
        const results = await Promise.allSettled(
          accountFiles.map(file =>
            fetch(`/data/${file}`)
              .then(res => {
                if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
                return res.json();
              })
              .then(json => ({ file, json }))
          )
        );

        const loaded = [];
        const errors = [];

        results.forEach(r => {
          if (r.status === 'fulfilled') {
            const { file, json } = r.value;
            // normalize JSON formats: allow objects with `services` or `daily_costs`
            if (json && Array.isArray(json.services)) {
              // normalize service details: copy amount_usd -> cost_usd when present
              const normalized = JSON.parse(JSON.stringify(json));
              normalized.services = normalized.services.map(svc => {
                const svcCopy = { ...svc };
                if (Array.isArray(svcCopy.details)) {
                  svcCopy.details = svcCopy.details.map(d => ({ ...d, cost_usd: Number(d.cost_usd ?? d.amount_usd ?? d.cost_usd ?? 0) }));
                }
                return svcCopy;
              });
              loaded.push(normalized);
            } else if (json && Array.isArray(json.daily_costs)) {
              // convert daily_costs -> services summary
              const svcMap = new Map();
              json.daily_costs.forEach(day => {
                (day.services || []).forEach(svc => {
                  const name = svc.service || 'unknown';
                  const entry = svcMap.get(name) || { service: name, cost_usd: 0, resources: 0, details: [] };
                  entry.cost_usd = (entry.cost_usd || 0) + (Number(svc.cost_usd) || 0);
                  // resources/ details are not available in daily format - skip or leave empty
                  svcMap.set(name, entry);
                });
              });
              const services = Array.from(svcMap.values());
              // ensure service details have cost_usd
              const servicesWithCosts = services.map(s => ({ ...s, details: (s.details || []).map(d => ({ ...d, cost_usd: Number(d.cost_usd ?? d.amount_usd ?? 0) })) }));
              loaded.push({ account_name: json.account_name || file, region: json.region || '', date_range: json.date_range || json.month || '', services: servicesWithCosts });
            } else {
              // unknown format - skip but record
              console.warn('Skipping unsupported cost file format:', file);
              errors.push(`Unsupported format for ${file}`);
            }
          } else {
            errors.push(r.reason?.message || JSON.stringify(r.reason));
          }
        });

        if (mounted) {
          if (loaded.length === 0) {
            setError(errors.join('; ') || 'No cost files could be loaded');
          } else {
            setAccounts(loaded);
          }
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAccounts();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="dashboard-container">Loading AWS account cost data...</div>;
  if (error) return <div className="dashboard-container" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1>AWS Cost Dashboard</h1>

      <div className="accounts-grid">
        {accounts.map((account, idx) => {
          const key = account.account_id || account.account_name || idx;
          const accountTotal = account.services.reduce((sum, svc) => sum + (Number(svc.cost_usd) || 0), 0);
          return (
            <div key={key} className="account-section">
              <h2>{account.account_name}{account.account_id ? ` (${account.account_id})` : ''}</h2>
              <p><b>Region:</b> {account.region} | <b>Date Range:</b> {account.date_range}</p>
              <table className="cost-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Cost (USD)</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {account.services.map((svc, idx2) => (
                    <tr key={idx2}>
                      <td>{svc.service}</td>
                      <td>${svc.cost_usd.toLocaleString()}</td>
                      <td>
                        <button className="view-res-btn" onClick={() => setModal({ open: true, service: svc.service, details: svc.details })}>
                          View Resources
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', background: '#f5f7fa' }}>
                    <td colSpan={1} style={{ textAlign: 'right' }}>Total</td>
                    <td>${accountTotal.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <Modal onClose={() => setModal({ open: false, service: '', details: [] })}>
          <h2 style={{ marginTop: 0 }}>{modal.service} Resources</h2>
          <ResourceTable service={modal.service} details={modal.details} />
        </Modal>
      )}
    </div>
  );
}
