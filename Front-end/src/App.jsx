
import { useEffect, useState } from 'react';
import './App.css';

const accountFiles = [
  'acc1.json',
  'acc2.json',
  'acc3.json',
  'difc_dev.json',
];

function App() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, service: '', details: [] });

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const data = await Promise.all(
          accountFiles.map(file =>
            fetch(`/data/${file}`).then(res => {
              if (!res.ok) throw new Error(`Failed to load ${file}`);
              return res.json();
            })
          )
        );
        setAccounts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  if (loading) return <div>Loading AWS account cost data...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div className="dashboard-container">
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
                    <th>Resources</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {account.services.map((svc, idx2) => (
                    <tr key={idx2}>
                      <td>{svc.service}</td>
                      <td>${svc.cost_usd.toLocaleString()}</td>
                      <td>{svc.resources}</td>
                      <td>
                        <button className="view-res-btn" onClick={() => setModal({ open: true, service: svc.service, details: svc.details })}>
                          View Resources
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
                    <td colSpan={1} style={{textAlign:'right'}}>Total</td>
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
          <h2 style={{marginTop:0}}>{modal.service} Resources</h2>
          <ResourceTable service={modal.service} details={modal.details} />
        </Modal>
      )}
    </div>
  );

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
}
}

function ResourceTable({ service, details }) {
  if (!details || details.length === 0) return <div>No resource details.</div>;

  // Helper to sum cost_usd
  const totalCost = details.reduce((sum, d) => sum + (Number(d.cost_usd) || 0), 0);

  if (service.includes('EC2')) {
    return (
      <table className="cost-table" style={{marginTop: 0}}>
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
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td colSpan={2} style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  } else if (service.includes('S3')) {
    return (
      <table className="cost-table" style={{marginTop: 0}}>
        <thead>
          <tr>
            <th>Bucket</th>
            <th>Storage (GB)</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.bucket}</td>
              <td>{d.storage_gb}</td>
              <td>${d.cost_usd.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td colSpan={2} style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  } else if (service.includes('RDS')) {
    return (
      <table className="cost-table" style={{marginTop: 0}}>
        <thead>
          <tr>
            <th>DB Engine</th>
            <th>Instance Class</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.db_engine}</td>
              <td>{d.instance_class}</td>
              <td>${d.cost_usd.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td colSpan={2} style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  } else if (service.includes('Lambda')) {
    return (
      <table className="cost-table" style={{marginTop: 0}}>
        <thead>
          <tr>
            <th>Function</th>
            <th>Invocations</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.function}</td>
              <td>{d.invocations.toLocaleString()}</td>
              <td>${d.cost_usd.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td colSpan={2} style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  } else if (service.includes('CloudWatch')) {
    return (
      <table className="cost-table" style={{marginTop: 0}}>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.metric}</td>
              <td>${d.cost_usd.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  } else if (service.includes('DynamoDB')) {
    return (
      <table className="cost-table" style={{marginTop: 0}}>
        <thead>
          <tr>
            <th>Table</th>
            <th>Read Capacity</th>
            <th>Write Capacity</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              <td>{d.table}</td>
              <td>{d.read_capacity}</td>
              <td>{d.write_capacity}</td>
              <td>${d.cost_usd.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td colSpan={3} style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  } else {
    // Fallback: show all keys/values
    const allKeys = Array.from(new Set(details.flatMap(d => Object.keys(d))));
    return (
      <table className="cost-table" style={{marginTop: 0}}>
        <thead>
          <tr>
            {allKeys.map(k => <th key={k}>{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => (
            <tr key={i}>
              {allKeys.map(k => <td key={k}>{d[k]}</td>)}
            </tr>
          ))}
          <tr style={{fontWeight:'bold', background:'#f5f7fa'}}>
            <td colSpan={allKeys.length-1} style={{textAlign:'right'}}>Total</td>
            <td>${totalCost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}

export default App;
