import { Wind, Zap, BarChart3, Home, Activity } from 'lucide-react';

export default function Navbar({ activePage, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'forecasts', label: 'Forecasts', icon: Wind },
    { id: 'actuals', label: 'Actuals', icon: Zap },
    { id: 'accuracy', label: 'Accuracy', icon: BarChart3 },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-logo">💨</div>
          <div>
            <div className="navbar-title">WindWatch UK</div>
            <div className="navbar-subtitle">Day-Ahead Wind Power Intelligence</div>
          </div>
        </div>

        <div className="navbar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${activePage === id ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-green">
            <Activity size={9} />
            LIVE
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jan 2026</span>
        </div>
      </div>
    </nav>
  );
}
