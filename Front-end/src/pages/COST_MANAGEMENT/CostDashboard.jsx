import React, { useEffect, useState } from 'react';
import '../../App.css';
import Modal from './_Modal';
import ResourceTable from './_ResourceTable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, LineElement, Title, Tooltip, Legend);

const accountFiles = [
  'asia_cost.json',
  'difc_cost.json',
  'feed_cost.json',
  'hk_cost.json',
  'uk_cost.json',
  'us_cost.json',
];

export default function CostDashboard({ onBack }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, service: '', details: [] });
  const [graphModal, setGraphModal] = useState({
    open: false,
    accountName: '',
    loading: false,
    error: '',
    activeTab: 'daily',
    dailyChartData: null,
    monthlyChartData: null,
    dailyTotals: null,
    monthlyTotals: null,
    dailyDetailMetric: '',
  });

  const closeGraphModal = () => {
    setGraphModal({
      open: false,
      accountName: '',
      loading: false,
      error: '',
      activeTab: 'daily',
      dailyChartData: null,
      monthlyChartData: null,
      dailyTotals: null,
      monthlyTotals: null,
      dailyDetailMetric: '',
    });
  };

  const getMonthlyFileForAccount = (account) => {
    if (account?._sourceFile) return account._sourceFile;
    const name = String(account?.account_name || '').toLowerCase();
    const env = name.replace(/^prod[-_]/, '').replace(/\s+/g, '');
    return env ? `${env}_cost.json` : null;
  };

  const buildDailyChartData = (monthlyJson) => {
    const byDate = new Map();

    const classifyService = (serviceName) => {
      const svcName = String(serviceName || '').toLowerCase();
      if (svcName.includes('ec2 - other') || (svcName.includes('ec2') && svcName.includes('other'))) {
        return 'ec2Other';
      }
      if (svcName.includes('elastic compute cloud') || svcName.includes('ec2') || svcName.includes('compute')) {
        return 'ec2';
      }
      if (svcName.includes('simple storage service') || svcName.includes('s3') || svcName.includes('storage')) {
        return 's3';
      }
      if (svcName.includes('elastic file system') || svcName.includes('efs')) {
        return 'efs';
      }
      return null;
    };

    const putPoint = (date, key, value) => {
      if (!date) return;
      const row = byDate.get(date) || { ec2: 0, s3: 0, ec2Other: 0, efs: 0 };
      row[key] = Number(value || 0);
      byDate.set(date, row);
    };

    if (Array.isArray(monthlyJson?.services)) {
      monthlyJson.services.forEach((svc) => {
        const targetKey = classifyService(svc?.service);
        if (!targetKey) return;

        (svc?.daily_costs || []).forEach((d) => {
          putPoint(d?.date, targetKey, d?.cost_usd);
        });
      });
    } else if (Array.isArray(monthlyJson?.daily_costs)) {
      monthlyJson.daily_costs.forEach((day) => {
        const date = day?.date;
        (day?.services || []).forEach((svc) => {
          const targetKey = classifyService(svc?.service);
          if (targetKey) putPoint(date, targetKey, svc?.cost_usd);
        });
      });
    }

    const labels = Array.from(byDate.keys()).sort();
    const ec2Data = labels.map((d) => byDate.get(d)?.ec2 ?? 0);
    const s3Data = labels.map((d) => byDate.get(d)?.s3 ?? 0);
    const ec2OtherData = labels.map((d) => byDate.get(d)?.ec2Other ?? 0);
    const efsData = labels.map((d) => byDate.get(d)?.efs ?? 0);

    if (labels.length === 0) return null;

    return {
      labels,
      datasets: [
        {
          label: 'EC2',
          data: ec2Data,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25,118,210,0.15)',
          tension: 0.25,
          pointRadius: 2,
        },
        {
          label: 'S3',
          data: s3Data,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.15)',
          tension: 0.25,
          pointRadius: 2,
        },
        {
          label: 'EC2 - Other',
          data: ec2OtherData,
          borderColor: '#ef6c00',
          backgroundColor: 'rgba(239,108,0,0.18)',
          tension: 0.25,
          pointRadius: 2,
        },
        {
          label: 'EFS',
          data: efsData,
          borderColor: '#6a1b9a',
          backgroundColor: 'rgba(106,27,154,0.15)',
          tension: 0.25,
          pointRadius: 2,
        },
      ],
    };
  };

  const buildMonthlyChartData = (monthlyJson) => {
    const byMonth = new Map();

    const classifyService = (serviceName) => {
      const svcName = String(serviceName || '').toLowerCase();
      if (svcName.includes('ec2 - other') || (svcName.includes('ec2') && svcName.includes('other'))) {
        return 'ec2Other';
      }
      if (svcName.includes('elastic compute cloud') || svcName.includes('ec2') || svcName.includes('compute')) {
        return 'ec2';
      }
      if (svcName.includes('simple storage service') || svcName.includes('s3') || svcName.includes('storage')) {
        return 's3';
      }
      if (svcName.includes('elastic file system') || svcName.includes('efs')) {
        return 'efs';
      }
      return null;
    };

    const putPoint = (month, key, value) => {
      if (!month) return;
      const row = byMonth.get(month) || { ec2: 0, s3: 0, ec2Other: 0, efs: 0 };
      row[key] = Number(value || 0);
      byMonth.set(month, row);
    };

    if (Array.isArray(monthlyJson?.services)) {
      monthlyJson.services.forEach((svc) => {
        const targetKey = classifyService(svc?.service);
        if (!targetKey) return;

        (svc?.monthly_costs || []).forEach((d) => {
          putPoint(d?.month, targetKey, d?.cost_usd);
        });
      });
    }

    const labels = Array.from(byMonth.keys());
    const ec2Data = labels.map((d) => byMonth.get(d)?.ec2 ?? 0);
    const s3Data = labels.map((d) => byMonth.get(d)?.s3 ?? 0);
    const ec2OtherData = labels.map((d) => byMonth.get(d)?.ec2Other ?? 0);
    const efsData = labels.map((d) => byMonth.get(d)?.efs ?? 0);

    if (labels.length === 0) return null;

    return {
      labels,
      datasets: [
        {
          label: 'EC2',
          data: ec2Data,
          backgroundColor: 'rgba(25,118,210,0.65)',
          borderColor: '#1976d2',
          borderWidth: 1,
        },
        {
          label: 'S3',
          data: s3Data,
          backgroundColor: 'rgba(46,125,50,0.65)',
          borderColor: '#2e7d32',
          borderWidth: 1,
        },
        {
          label: 'EC2 - Other',
          data: ec2OtherData,
          backgroundColor: 'rgba(239,108,0,0.7)',
          borderColor: '#ef6c00',
          borderWidth: 1,
        },
        {
          label: 'EFS',
          data: efsData,
          backgroundColor: 'rgba(106,27,154,0.65)',
          borderColor: '#6a1b9a',
          borderWidth: 1,
        },
      ],
    };
  };

  const buildDailyTotals = (monthlyJson) => {
    const totals = new Map();

    const addPoint = (date, value) => {
      if (!date) return;
      totals.set(date, (totals.get(date) || 0) + Number(value || 0));
    };

    if (Array.isArray(monthlyJson?.services)) {
      monthlyJson.services.forEach((svc) => {
        (svc?.daily_costs || []).forEach((day) => {
          addPoint(day?.date, day?.cost_usd);
        });
      });
    } else if (Array.isArray(monthlyJson?.daily_costs)) {
      monthlyJson.daily_costs.forEach((day) => {
        (day?.services || []).forEach((svc) => {
          addPoint(day?.date, svc?.cost_usd);
        });
      });
    }

    return totals;
  };

  const buildMonthlyTotals = (monthlyJson) => {
    const totals = new Map();

    if (Array.isArray(monthlyJson?.services)) {
      monthlyJson.services.forEach((svc) => {
        (svc?.monthly_costs || []).forEach((monthEntry) => {
          if (!monthEntry?.month) return;
          totals.set(
            monthEntry.month,
            (totals.get(monthEntry.month) || 0) + Number(monthEntry.cost_usd || 0)
          );
        });
      });
    }

    return totals;
  };

  const formatCurrency = (value) =>
    `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatTooltipTotal = (value) => formatCurrency(value);

  const buildTooltipCallbacks = (totalsMap, periodLabel) => ({
    footer: function (items) {
      const label = items?.[0]?.label;
      return label ? `Total for ${periodLabel}: ${formatTooltipTotal(totalsMap?.get(label))}` : '';
    },
    label: function (context) {
      const val = Number(context.parsed?.y || 0);
      return `${context.dataset.label}: $${val.toFixed(2)}`;
    },
  });

  const buildDailyTooltipCallbacks = (totalsMap) => ({
    label: function (context) {
      return `${context.dataset.label}: ${formatCurrency(context.parsed?.y)}`;
    },
    footer: function (items) {
      const label = items?.[0]?.label;
      return label ? `Total for Day: ${formatCurrency(totalsMap?.get(label))}` : '';
    },
  });

  const buildTotalChartData = (labels, totalsMap, datasetLabel) => {
    if (!Array.isArray(labels) || labels.length === 0) return null;

    return {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: labels.map((label) => Number(totalsMap?.get(label) || 0)),
          borderColor: '#000000',
          backgroundColor: 'rgba(0,0,0,0.8)',
          tension: 0.25,
          pointRadius: 2,
        },
      ],
    };
  };

  const handleOpenCostGraph = async (account) => {
    const monthlyFile = getMonthlyFileForAccount(account);
    setGraphModal({
      open: true,
      accountName: account?.account_name || 'Account',
      loading: true,
      error: '',
      activeTab: 'daily',
      dailyChartData: null,
      monthlyChartData: null,
      dailyDetailMetric: '',
    });

    if (!monthlyFile) {
      setGraphModal((prev) => ({
        ...prev,
        loading: false,
        error: 'Could not determine monthly cost file for this account.',
      }));
      return;
    }

    try {
      const res = await fetch(`/data_monthly_cost/${monthlyFile}`);
      if (!res.ok) {
        throw new Error(`Failed to load ${monthlyFile}: HTTP ${res.status}`);
      }
      const json = await res.json();
      const dailyChartData = buildDailyChartData(json);
      const monthlyChartData = buildMonthlyChartData(json);
      const dailyTotals = buildDailyTotals(json);
      const monthlyTotals = buildMonthlyTotals(json);
      if (!dailyChartData && !monthlyChartData) {
        throw new Error('No EC2/S3/EC2 - Other cost series found in monthly data file.');
      }
      setGraphModal((prev) => ({
        ...prev,
        loading: false,
        dailyChartData,
        monthlyChartData,
        dailyTotals,
        monthlyTotals,
      }));
    } catch (e) {
      setGraphModal((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || 'Failed to load monthly cost graph data.',
      }));
    }
  };

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
              normalized._sourceFile = file;
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
              loaded.push({ account_name: json.account_name || file, region: json.region || '', date_range: json.date_range || json.month || '', services: servicesWithCosts, _sourceFile: file });
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

  const dailyChartLabels = graphModal.dailyChartData?.labels || [];
  const dailyEc2Series = graphModal.dailyChartData?.datasets?.find((d) => d.label === 'EC2');
  const dailyS3Series = graphModal.dailyChartData?.datasets?.find((d) => d.label === 'S3');
  const dailyEc2OtherSeries = graphModal.dailyChartData?.datasets?.find((d) => d.label === 'EC2 - Other');
  const dailyEfsSeries = graphModal.dailyChartData?.datasets?.find((d) => d.label === 'EFS');
  const monthlyChartLabels = graphModal.monthlyChartData?.labels || [];
  const monthlyEc2Series = graphModal.monthlyChartData?.datasets?.find((d) => d.label === 'EC2');
  const monthlyS3Series = graphModal.monthlyChartData?.datasets?.find((d) => d.label === 'S3');
  const monthlyEc2OtherSeries = graphModal.monthlyChartData?.datasets?.find((d) => d.label === 'EC2 - Other');
  const monthlyEfsSeries = graphModal.monthlyChartData?.datasets?.find((d) => d.label === 'EFS');
  const dailyTotalChartData = buildTotalChartData(dailyChartLabels, graphModal.dailyTotals, 'Total Cost');
  const monthlyTotalChartData = buildTotalChartData(monthlyChartLabels, graphModal.monthlyTotals, 'Total Cost');
  const hasDailySeries = Boolean(dailyEc2Series || dailyS3Series || dailyEc2OtherSeries || dailyEfsSeries);
  const hasMonthlySeries = Boolean(monthlyEc2Series || monthlyS3Series || monthlyEc2OtherSeries || monthlyEfsSeries);
  const hasDailyTotalSeries = Boolean(dailyTotalChartData);
  const hasMonthlyTotalSeries = Boolean(monthlyTotalChartData);

  const dailyCombinedDatasets = [
    dailyEc2Series,
    dailyS3Series,
    dailyEc2OtherSeries,
    dailyEfsSeries,
  ]
    .filter(Boolean)
    .map((series) => ({ ...series, pointRadius: 2 }));

  if (dailyTotalChartData?.datasets?.[0]) {
    dailyCombinedDatasets.push({
      ...dailyTotalChartData.datasets[0],
      label: 'Total for Day',
      borderColor: '#111827',
      backgroundColor: 'rgba(17,24,39,0.12)',
      tension: 0.25,
      pointRadius: 2,
    });
  }

  const dailyCombinedChartData = dailyChartLabels.length
    ? { labels: dailyChartLabels, datasets: dailyCombinedDatasets }
    : null;

  const dailyDetailConfigs = [
    { key: 'ec2', label: 'EC2', series: dailyEc2Series, yTitle: 'EC2 Cost (USD)', color: '#1976d2' },
    { key: 's3', label: 'S3', series: dailyS3Series, yTitle: 'S3 Cost (USD)', color: '#2e7d32' },
    {
      key: 'ec2Other',
      label: 'EC2 - Other',
      series: dailyEc2OtherSeries,
      yTitle: 'EC2 - Other Cost (USD)',
      color: '#ef6c00',
    },
    { key: 'efs', label: 'EFS', series: dailyEfsSeries, yTitle: 'EFS Cost (USD)', color: '#6a1b9a' },
    {
      key: 'total',
      label: 'Total for Day',
      series: dailyTotalChartData?.datasets?.[0]
        ? { ...dailyTotalChartData.datasets[0], label: 'Total for Day' }
        : null,
      yTitle: 'Total Cost (USD)',
      color: '#111827',
    },
  ];

  const selectedDailyConfig = dailyDetailConfigs.find(
    (cfg) => cfg.key === graphModal.dailyDetailMetric && cfg.series
  );

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
                    <td>
                      <button
                        className="view-res-btn"
                        onClick={() => handleOpenCostGraph(account)}
                        title="View EC2, S3, and EC2 - Other cost trends"
                      >
                        Analysis
                      </button>
                    </td>
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

      {graphModal.open && (
        <Modal onClose={closeGraphModal} contentClassName="graph-modal-content">
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>{graphModal.accountName} Cost Graph</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8, marginBottom: 12 }}>
            <button
              className="view-res-btn"
              onClick={() => setGraphModal((prev) => ({ ...prev, activeTab: 'daily' }))}
              style={{ opacity: graphModal.activeTab === 'daily' ? 1 : 0.65 }}
            >
              Daily Cost Data
            </button>
            <button
              className="view-res-btn"
              onClick={() => setGraphModal((prev) => ({ ...prev, activeTab: 'monthly' }))}
              style={{ opacity: graphModal.activeTab === 'monthly' ? 1 : 0.65 }}
            >
              Monthly Cost Data
            </button>
          </div>

          {graphModal.loading && <p>Loading cost graph...</p>}
          {!graphModal.loading && graphModal.error && (
            <p style={{ color: 'var(--danger, #b00020)' }}>{graphModal.error}</p>
          )}
          {!graphModal.loading && !graphModal.error && graphModal.activeTab === 'daily' && hasDailySeries && (
            <div style={{ minWidth: 720, maxWidth: '100%', display: 'grid', gap: 16 }}>
              {!graphModal.dailyDetailMetric && dailyCombinedChartData && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ height: 470 }}>
                    <Line
                      data={dailyCombinedChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                          legend: { position: 'top' },
                          tooltip: { callbacks: buildDailyTooltipCallbacks(graphModal.dailyTotals) },
                        },
                        scales: {
                          x: {
                            title: { display: true, text: 'Date' },
                          },
                          y: {
                            type: 'linear',
                            title: { display: true, text: 'Cost (USD)' },
                            ticks: {
                              callback: function (value) {
                                return `$${value}`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                      gap: 8,
                    }}
                  >
                    {dailyDetailConfigs.map((cfg) => (
                      <button
                        key={cfg.key}
                        className="view-res-btn"
                        disabled={!cfg.series}
                        onClick={() =>
                          setGraphModal((prev) => ({ ...prev, dailyDetailMetric: cfg.key }))
                        }
                        style={{
                          fontSize: 12,
                          padding: '6px 10px',
                          background: cfg.color,
                          border: `1px solid ${cfg.color}`,
                          color: '#fff',
                          opacity: cfg.series ? 1 : 0.55,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDailyConfig?.series && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      className="view-res-btn"
                      onClick={() =>
                        setGraphModal((prev) => ({ ...prev, dailyDetailMetric: '' }))
                      }
                      style={{ fontSize: 12, padding: '6px 10px' }}
                    >
                      Back
                    </button>
                  </div>
                  <div style={{ height: 320 }}>
                <Line
                  data={{
                    labels: dailyChartLabels,
                    datasets: [selectedDailyConfig.series],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: buildDailyTooltipCallbacks(graphModal.dailyTotals) },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Date' },
                      },
                      y: {
                        type: 'linear',
                        title: { display: true, text: selectedDailyConfig.yTitle },
                        ticks: {
                          callback: function (value) {
                            return `$${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
                  </div>
                </div>
              )}
            </div>
          )}
          {!graphModal.loading && !graphModal.error && graphModal.activeTab === 'monthly' && hasMonthlySeries && (
            <div style={{ minWidth: 720, maxWidth: '100%', display: 'grid', gap: 16 }}>
              {monthlyEc2Series && <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: monthlyChartLabels,
                    datasets: [monthlyEc2Series],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: buildTooltipCallbacks(graphModal.monthlyTotals, 'month') },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Month' },
                      },
                      y: {
                        title: { display: true, text: 'EC2 Monthly Cost (USD)' },
                        ticks: {
                          callback: function (value) {
                            return `$${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>}

              {monthlyS3Series && <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: monthlyChartLabels,
                    datasets: [monthlyS3Series],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: buildTooltipCallbacks(graphModal.monthlyTotals, 'month') },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Month' },
                      },
                      y: {
                        title: { display: true, text: 'S3 Monthly Cost (USD)' },
                        ticks: {
                          callback: function (value) {
                            return `$${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>}

              {monthlyEc2OtherSeries && <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: monthlyChartLabels,
                    datasets: [monthlyEc2OtherSeries],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: buildTooltipCallbacks(graphModal.monthlyTotals, 'month') },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Month' },
                      },
                      y: {
                        title: { display: true, text: 'EC2 - Other Monthly Cost (USD)' },
                        ticks: {
                          callback: function (value) {
                            return `$${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>}

              {monthlyEfsSeries && <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: monthlyChartLabels,
                    datasets: [monthlyEfsSeries],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: buildTooltipCallbacks(graphModal.monthlyTotals, 'month') },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Month' },
                      },
                      y: {
                        title: { display: true, text: 'EFS Monthly Cost (USD)' },
                        ticks: {
                          callback: function (value) {
                            return `$${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>}

              {hasMonthlyTotalSeries && <div style={{ height: 280, marginTop: 8 }}>
                <Bar
                  data={monthlyTotalChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { callbacks: buildTooltipCallbacks(graphModal.monthlyTotals, 'month') },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Month' },
                      },
                      y: {
                        type: 'linear',
                        title: { display: true, text: 'Total Cost (USD)' },
                        ticks: {
                          callback: function (value) {
                            return `$${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>}
            </div>
          )}
          {!graphModal.loading && !graphModal.error && graphModal.activeTab === 'monthly' && !hasMonthlySeries && (
            <p style={{ color: 'var(--danger, #b00020)' }}>Monthly EC2/S3/EC2 - Other series could not be rendered for this account.</p>
          )}
          {!graphModal.loading && !graphModal.error && graphModal.activeTab === 'daily' && !hasDailySeries && (
            <p style={{ color: 'var(--danger, #b00020)' }}>Daily EC2/S3/EC2 - Other series could not be rendered for this account.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
