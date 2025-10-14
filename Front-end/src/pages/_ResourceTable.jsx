import React from 'react';

export default function ResourceTable({ service, details }) {
  if (!details || details.length === 0) return <div>No resource details.</div>;

  const totalCost = details.reduce((sum, d) => sum + (Number(d.cost_usd) || 0), 0);

  if (service.includes('EC2')) {
    return (
      <table className="cost-table" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th>Instance Type</th>
            <th>Count</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.instance_type}</td>
              <td>{d.count}</td>
              <td>${d.cost_usd.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: '#f5f7fa' }}>
            <td colSpan={2} style={{ textAlign: 'right' }}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  // Fallback: show raw keys
  const allKeys = Array.from(new Set(details.flatMap(d => Object.keys(d))));
  return (
    <table className="cost-table" style={{ marginTop: 0 }}>
      <thead>
        <tr>
          {allKeys.map(k => <th key={k}>{k}</th>)}
        </tr>
      </thead>
      <tbody>
        {details.map((d, i) => (
          <tr key={i}>
            {allKeys.map(k => <td key={k}>{String(d[k] ?? '')}</td>)}
          </tr>
        ))}
        <tr style={{ fontWeight: 'bold', background: '#f5f7fa' }}>
          <td colSpan={allKeys.length - 1} style={{ textAlign: 'right' }}>Total</td>
          <td>${totalCost.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  );
}
