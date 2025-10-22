import React from 'react';

export default function ResourceTable({ service, details }) {
  if (!details || details.length === 0) return <div>No resource details.</div>;

  // calculate total from available numeric fields (cost_usd or amount_usd or amount)
  const totalCost = details.reduce((sum, d) => sum + (Number(d.cost_usd ?? d.amount_usd ?? d.amount ?? 0) || 0), 0);

  const svcName = (service || '').toLowerCase();
  if (svcName.includes('ec2') || svcName.includes('compute')) {
    return (
      <table className="cost-table" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th>Instance Type</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.instance_type ?? d.usage_type ?? d.tag}</td>
              <td>${(Number(d.cost_usd ?? d.amount_usd ?? d.amount ?? 0)).toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: '#f5f7fa' }}>
            <td style={{ textAlign: 'right' }}>Total</td>
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
