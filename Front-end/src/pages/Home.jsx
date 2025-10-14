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
      </div>
    </div>
  );
}
