import { useState } from 'react';
import './App.css';

import Home from './pages/Home';
import AssetsLibrary from './pages/EC2_S3_DETAILS/AssetsLibrary';
import CostDashboard from './pages/COST_MANAGEMENT/CostDashboard';
import AssetsInventory from './pages/ASSETS_INVENTORY/AssetsInventory';
import EdbOsVersions from './pages/EDB_OS_VERSIONS/EdbOsVersions';
import BackupLogs from './pages/BACKUP_LOGS/BackupLogs';

function App() {
  const [view, setView] = useState('home');

  return (
    <div>
      {view === 'home' && <Home onGoTo={(v) => setView(v)} />}
      {view === 'costs' && <CostDashboard onBack={() => setView('home')} />}
      {view === 'assets' && <AssetsLibrary onBack={() => setView('home')} />}
      {view === 'inventory' && <AssetsInventory onBack={() => setView('home')} />}
      {view === 'versions' && <EdbOsVersions onBack={() => setView('home')} />}
      {view === 'backups' && <BackupLogs onBack={() => setView('home')} />}
    </div>
  );
}

export default App;
