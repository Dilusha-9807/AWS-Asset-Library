import React from 'react';
import '../App.css';

export default function Home({ onGoTo }) {
  return (
    <div className="home-container">
      <h1>Welcome</h1>
      <p className="home-sub">Choose a section to continue</p>
      <div className="home-grid">
        <section className="home-card" onClick={() => onGoTo('assets')} role="button" tabIndex={0}>
          <h2>Assets Library</h2>
          <p>Browse and manage your AWS assets and metadata.</p>
          <button className="home-cta">Open Assets Library</button>
        </section>

        <section className="home-card" onClick={() => onGoTo('costs')} role="button" tabIndex={0}>
          <h2>Resources Cost Management</h2>
          <p>View cost breakdowns and resource-level charges.</p>
          <button className="home-cta">Open Cost Management</button>
        </section>

        <section className="home-card" onClick={() => onGoTo('inventory')} role="button" tabIndex={0}>
          <h2>Assets Inventory</h2>
          <p>Track and manage your complete assets inventory.</p>
          <button className="home-cta">Open Inventory</button>
        </section>

        <section className="home-card" onClick={() => onGoTo('versions')} role="button" tabIndex={0}>
          <h2>EDB & OS Versions</h2>
          <p>Monitor database and operating system versions.</p>
          <button className="home-cta">View Versions</button>
        </section>

        <section className="home-card" onClick={() => onGoTo('backups')} role="button" tabIndex={0}>
          <h2>Backup Logs</h2>
          <p>Review and monitor backup operation logs.</p>
          <button className="home-cta">View Backup Logs</button>
        </section>
      </div>
    </div>
  );
}
