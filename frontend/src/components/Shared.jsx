import { Loader2, AlertTriangle } from 'lucide-react';

export function LoadingState({ message = 'Loading data from Elexon BMRS...' }) {
  return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>This may take a moment for large datasets</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-wrapper">
      <AlertTriangle size={32} />
      <p style={{ fontWeight: 600 }}>Failed to load data</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 400 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ marginTop: 8 }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function MetricCard({ title, value, unit, subtitle, colorClass, icon: Icon }) {
  return (
    <div className={`metric-card ${colorClass || ''}`}>
      <div className="card-title">
        {Icon && <Icon size={13} />}
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="card-value">{value ?? '—'}</span>
        {unit && <span className="card-unit">{unit}</span>}
      </div>
      {subtitle && <div className="card-delta">{subtitle}</div>}
    </div>
  );
}

export function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', flex: 1, fontSize: '0.8rem' }}>{entry.name}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
