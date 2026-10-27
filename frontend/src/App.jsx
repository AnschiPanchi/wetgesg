import { useState } from 'react';
import './index.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ForecastsPage from './pages/ForecastsPage';
import ActualsPage from './pages/ActualsPage';
import AccuracyPage from './pages/AccuracyPage';

const PAGES = {
  dashboard: Dashboard,
  forecasts: ForecastsPage,
  actuals: ActualsPage,
  accuracy: AccuracyPage,
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const PageComponent = PAGES[activePage] || Dashboard;

  return (
    <div className="page-layout">
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        <PageComponent onNavigate={setActivePage} />
      </main>
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        <span>WindWatch UK · Built for GridBricks Assignment</span>
        <span>Data: Elexon BMRS · Period: January 2026</span>
        <span>FUELHH (Actuals) + WINDFOR (Forecasts)</span>
      </footer>
    </div>
  );
}
