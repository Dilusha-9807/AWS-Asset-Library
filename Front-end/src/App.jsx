import { useState } from 'react';
import './App.css';

import Home from './pages/Home';
import AssetsLibrary from './pages/AssetsLibrary';
import CostDashboard from './pages/CostDashboard';

function App() {
  const [view, setView] = useState('home');

  return (
    <div>
      {view === 'home' && <Home onGoTo={(v) => setView(v)} />}
  {view === 'costs' && <CostDashboard onBack={() => setView('home')} />}
  {view === 'assets' && <AssetsLibrary onBack={() => setView('home')} />}
    </div>
  );
}

export default App;
