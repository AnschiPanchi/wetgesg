import { useMemo, useState } from 'react';
import { useApiData } from '../hooks/useApiData';
import { getAccuracyMetrics } from '../services/api';
import { LoadingState, ErrorState, MetricCard, CustomTooltip } from '../components/Shared';
import {
  ComposedChart, AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
  Brush
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  Target, TrendingUp, AlertCircle, Wind, Activity, Info, ArrowUp, ArrowDown
} from 'lucide-react';

// === Actual vs Forecast time series ===
function ActualVsForecastChart({ timeSeries }) {
  const data = useMemo(() => {
    return timeSeries?.map(d => ({
      time: format(parseISO(d.startTime), 'dd/MM HH:mm'),
      'Actual (MW)': d.actual,
      'Day-Ahead Forecast (MW)': d.forecast,
    })) || [];
  }, [timeSeries]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">
            <Activity size={15} style={{ color: 'var(--accent-blue)' }} />
            Actual vs Day-Ahead Forecast — January 2026
          </div>
          <div className="section-subtitle">
            Hourly comparison of actual wind generation (FUELHH, averaged) vs. day-ahead forecast (WINDFOR)
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#22c55e' }} />
            Actual
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#3b82f6' }} />
            Forecast
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradAct2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradFor2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false} interval={47} />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`} width={42}
          />
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toLocaleString()} MW`} />} />
          <Brush dataKey="time" height={20} stroke="rgba(99,179,237,0.2)" fill="rgba(9,16,35,0.9)" travellerWidth={6} />
          <Area type="monotone" dataKey="Actual (MW)" stroke="#22c55e" strokeWidth={1.5} fill="url(#gradAct2)" dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="Day-Ahead Forecast (MW)" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="0" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// === Forecast Error over time ===
function ErrorTimeSeriesChart({ timeSeries }) {
  const data = useMemo(() => {
    return timeSeries?.map(d => ({
      time: format(parseISO(d.startTime), 'dd/MM HH:mm'),
      'Error (MW)': d.error,
    })) || [];
  }, [timeSeries]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">
            <TrendingUp size={15} style={{ color: 'var(--accent-amber)' }} />
            Forecast Error Over Time (Forecast − Actual)
          </div>
          <div className="section-subtitle">
            Positive = over-forecast · Negative = under-forecast (MW)
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }} />
            Forecast Error
          </div>
          <div className="legend-item">
            <div style={{ width: 10, height: 2, background: '#ef4444', borderTop: '2px dashed #ef4444' }} />
            <span>Zero line</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradErr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false} interval={47} />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)}GW`} width={52}
          />
          <Tooltip content={<CustomTooltip formatter={v => `${v > 0 ? '+' : ''}${v?.toLocaleString()} MW`} />} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
          <Area
            type="monotone"
            dataKey="Error (MW)"
            stroke="#f59e0b"
            strokeWidth={1.5}
            fill="url(#gradErr)"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// === Per-day MAE bar chart ===
function PerDayMAEChart({ perDay }) {
  const data = useMemo(() => {
    return perDay?.map(d => ({
      date: format(parseISO(d.date), 'dd/MM'),
      'MAE (MW)': d.mae,
      'RMSE (MW)': d.rmse,
      bias: d.bias,
    })) || [];
  }, [perDay]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">
            <Target size={15} style={{ color: 'var(--accent-purple)' }} />
            Daily MAE & RMSE — Per Day Breakdown
          </div>
          <div className="section-subtitle">Days with higher MAE indicate more difficult forecast conditions (e.g., rapid wind ramp events)</div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#a855f7' }} />
            MAE
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'rgba(168,85,247,0.35)' }} />
            RMSE
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(1)}GW`} width={48}
          />
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toLocaleString()} MW`} />} />
          <Bar dataKey="RMSE (MW)" fill="rgba(168,85,247,0.25)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="MAE (MW)" fill="#a855f7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// === Per-day table ===
function PerDayTable({ perDay }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    if (!perDay) return [];
    return [...perDay].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [perDay, sortKey, sortDir]);

  const toggle = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <span style={{ opacity: 0.3 }}>↕</span>;
    return sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  return (
    <div className="chart-container" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr>
            {[
              { k: 'date', label: 'Date' },
              { k: 'mae', label: 'MAE (MW)' },
              { k: 'rmse', label: 'RMSE (MW)' },
              { k: 'bias', label: 'Bias (MW)' },
              { k: 'mape', label: 'MAPE (%)' },
              { k: 'n_points', label: 'Points' },
            ].map(col => (
              <th
                key={col.k}
                onClick={() => toggle(col.k)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {col.label} <SortIcon k={col.k} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              <td className="mono" style={{ color: 'var(--text-accent)' }}>{row.date}</td>
              <td style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                {row.mae?.toLocaleString()}
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{row.rmse?.toLocaleString()}</td>
              <td style={{
                color: row.bias > 200 ? 'var(--accent-amber)' :
                  row.bias < -200 ? 'var(--accent-red)' : 'var(--accent-green)',
                fontWeight: 500
              }}>
                {row.bias > 0 ? '+' : ''}{row.bias?.toLocaleString()}
              </td>
              <td>{row.mape?.toFixed(1)}%</td>
              <td style={{ color: 'var(--text-muted)' }}>{row.n_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AccuracyPage() {
  const { data, loading, error } = useApiData(getAccuracyMetrics);
  const [view, setView] = useState('charts');

  if (loading) return (
    <div className="container">
      <LoadingState message="Computing forecast accuracy metrics..." />
    </div>
  );
  if (error) return <div className="container"><ErrorState message={error} /></div>;

  const { overall, perDay, timeSeries } = data || {};

  return (
    <div className="container">
      <div className="page-header fade-up">
        <div className="page-header-eyebrow">Quantitative Accuracy Evaluation</div>
        <h1 className="page-title">Forecast Accuracy Analysis</h1>
        <p className="page-subtitle">
          Comprehensive evaluation of WINDFOR day-ahead forecasts against FUELHH actuals
          for January 2026. Metrics are computed over matched hourly data points using gate-closure-selected forecasts.
        </p>
      </div>

      {/* KPI Row */}
      <div className="section fade-up stagger-1">
        <div className="grid-4">
          <MetricCard
            title="MAE"
            value={overall?.mae?.toLocaleString()}
            unit="MW"
            subtitle={`~${((overall?.mae || 0) / 1000).toFixed(2)} GW average deviation`}
            icon={Target}
          />
          <MetricCard
            title="RMSE"
            value={overall?.rmse?.toLocaleString()}
            unit="MW"
            subtitle="Penalises large errors more"
            icon={TrendingUp}
            colorClass="purple"
          />
          <MetricCard
            title="MAPE"
            value={overall?.mape?.toFixed(1)}
            unit="%"
            subtitle="Mean absolute % error"
            icon={AlertCircle}
            colorClass="amber"
          />
          <MetricCard
            title="Forecast Bias"
            value={(overall?.bias > 0 ? '+' : '') + overall?.bias?.toLocaleString()}
            unit="MW"
            subtitle={overall?.bias > 0 ? 'Systematic over-forecast' : 'Systematic under-forecast'}
            icon={Wind}
            colorClass={Math.abs(overall?.bias || 0) < 200 ? 'green' : 'amber'}
          />
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="section fade-up stagger-2">
        <div className="grid-3">
          <div className="card">
            <div className="card-title"><Activity size={12} />Pearson Correlation</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="card-value" style={{ color: 'var(--accent-green)' }}>
                {overall?.correlation?.toFixed(3)}
              </span>
            </div>
            <div className="card-delta">
              {overall?.correlation > 0.9 ? '✅ Excellent correlation' :
                overall?.correlation > 0.8 ? '⚠️ Good correlation' : '❌ Poor correlation'}
            </div>
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${(overall?.correlation || 0) * 100}%`, background: 'var(--gradient-green)' }} />
            </div>
          </div>
          <div className="card">
            <div className="card-title"><Target size={12} />Skill Score vs Persistence</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="card-value" style={{ color: overall?.skillScore > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {overall?.skillScore != null ? `${(overall.skillScore * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="card-delta">
              {overall?.skillScore > 0
                ? `Forecast beats persistence by ${(overall.skillScore * 100).toFixed(1)}%`
                : 'Forecast does not beat persistence'}
            </div>
            {overall?.skillScore != null && (
              <div className="progress-bar" style={{ marginTop: 12 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, overall.skillScore * 100))}%`,
                    background: overall.skillScore > 0 ? 'var(--gradient-green)' : 'var(--gradient-amber)'
                  }}
                />
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title"><Info size={12} />Dataset Info</div>
            <div className="info-row">
              <span className="info-row-label">Matched points</span>
              <span className="info-row-value">{overall?.nPoints?.toLocaleString()}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Actuals resolution</span>
              <span className="info-row-value">30-min → hourly avg</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Forecast type</span>
              <span className="info-row-value">Day-ahead (gate closure D-1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="section fade-up stagger-3">
        <div className="section-header">
          <div className="tabs">
            <button className={`tab ${view === 'charts' ? 'active' : ''}`} onClick={() => setView('charts')}>
              Charts
            </button>
            <button className={`tab ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
              Per-Day Table
            </button>
          </div>
        </div>

        {view === 'charts' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ActualVsForecastChart timeSeries={timeSeries} />
            <ErrorTimeSeriesChart timeSeries={timeSeries} />
            <PerDayMAEChart perDay={perDay} />
          </div>
        ) : (
          <PerDayTable perDay={perDay} />
        )}
      </div>

      {/* Interpretation guide */}
      <div className="section fade-up">
        <div className="chart-container">
          <div className="section-title" style={{ marginBottom: 16 }}>
            <Info size={15} style={{ color: 'var(--accent-blue)' }} />
            How to Interpret These Metrics for Procurement Decisions
          </div>
          <div className="grid-3" style={{ gap: 16 }}>
            {[
              {
                title: 'MAE (Mean Absolute Error)',
                desc: 'The average MW error in the forecast. Use this to size your procurement buffer — if MAE = 1,000 MW, consider purchasing 1 GW more from the backup market.',
                badge: 'badge-blue',
                label: 'Procurement Buffer'
              },
              {
                title: 'Bias',
                desc: 'Systematic tendency to over- or under-forecast. A positive bias means you need less additional procurement; negative means more. Adjust your baseline accordingly.',
                badge: 'badge-amber',
                label: 'Systematic Adjustment'
              },
              {
                title: 'MAPE & Skill Score',
                desc: 'MAPE gives % context for varying generation levels. Skill Score > 0% means the forecast beats simple persistence — giving confidence in using it for decisions.',
                badge: 'badge-green',
                label: 'Forecast Confidence'
              },
            ].map((item, i) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span className={`badge ${item.badge}`} style={{ marginBottom: 8, display: 'inline-block' }}>{item.label}</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
