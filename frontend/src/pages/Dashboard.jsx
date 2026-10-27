import { useApiData } from '../hooks/useApiData';
import { getSummary, getAccuracyMetrics, getDayAheadForecasts } from '../services/api';
import { LoadingState, ErrorState, MetricCard, CustomTooltip } from '../components/Shared';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Wind, TrendingUp, AlertCircle, Target, Zap, BarChart3, ArrowRight, Info } from 'lucide-react';

function GlowCard({ children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(17,28,53,0.9), rgba(9,16,35,0.95))',
      border: '1px solid rgba(99,179,237,0.12)',
      borderRadius: 16,
      padding: '24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      ...style
    }}>
      {children}
    </div>
  );
}

function HeroStats({ summary }) {
  const h = summary?.headline || {};
  return (
    <div className="grid-4 fade-up">
      <MetricCard
        title="MAE — Mean Abs Error"
        value={h.mae_mw != null ? h.mae_mw.toLocaleString() : '—'}
        unit="MW"
        subtitle="Average forecast deviation"
        icon={Target}
      />
      <MetricCard
        title="RMSE"
        value={h.rmse_mw != null ? h.rmse_mw.toLocaleString() : '—'}
        unit="MW"
        subtitle="Root mean square error"
        icon={TrendingUp}
        colorClass="purple"
      />
      <MetricCard
        title="MAPE"
        value={h.mape_pct != null ? h.mape_pct.toFixed(1) : '—'}
        unit="%"
        subtitle="Mean absolute % error"
        icon={AlertCircle}
        colorClass="amber"
      />
      <MetricCard
        title="Forecast Bias"
        value={h.bias_mw != null ? (h.bias_mw > 0 ? '+' : '') + h.bias_mw.toLocaleString() : '—'}
        unit="MW"
        subtitle={h.bias_mw > 0 ? 'Over-forecasting on average' : h.bias_mw < 0 ? 'Under-forecasting on average' : 'Balanced'}
        icon={Wind}
        colorClass={h.bias_mw > 0 ? 'amber' : 'green'}
      />
    </div>
  );
}

function ForecastChart({ data }) {
  const chartData = data?.data?.slice(0, 168).map(d => ({
    time: format(parseISO(d.startTime), 'dd MMM HH:mm'),
    'Day-Ahead Forecast': d.generation,
  })) || [];

  return (
    <GlowCard>
      <div className="chart-header">
        <div>
          <div className="section-title">
            <Wind size={16} style={{ color: 'var(--accent-cyan)' }} />
            Latest Day-Ahead Wind Forecast — January 2026
          </div>
          <div className="section-subtitle">Forecast profile used for day-ahead market procurement decisions (MW)</div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#06b6d4' }} />
            Day-Ahead Forecast
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#4a5a7a', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={23}
          />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${(v/1000).toFixed(0)}GW`}
            width={42}
          />
          <Tooltip
            content={<CustomTooltip formatter={v => `${v?.toLocaleString()} MW`} />}
          />
          <Area
            type="monotone"
            dataKey="Day-Ahead Forecast"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#gradForecast)"
            dot={false}
            activeDot={{ r: 4, fill: '#06b6d4' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlowCard>
  );
}

function QuickInsights({ summary, accuracy }) {
  const overall = accuracy?.overall;
  const correlation = overall?.correlation;
  const skillScore = overall?.skillScore;
  const nPoints = overall?.nPoints;

  return (
    <GlowCard>
      <div className="section-title" style={{ marginBottom: 16 }}>
        <Info size={16} style={{ color: 'var(--accent-purple)' }} />
        Key Insights
      </div>

      <div className="info-row">
        <span className="info-row-label">Analysis Period</span>
        <span className="info-row-value">January 2026 (full month)</span>
      </div>
      <div className="info-row">
        <span className="info-row-label">Data Points Matched</span>
        <span className="info-row-value">{nPoints?.toLocaleString() || '—'} hourly periods</span>
      </div>
      <div className="info-row">
        <span className="info-row-label">Forecast vs Actual Correlation</span>
        <span className="info-row-value" style={{ color: 'var(--accent-green)' }}>
          {correlation != null ? `r = ${correlation.toFixed(3)}` : '—'}
        </span>
      </div>
      <div className="info-row">
        <span className="info-row-label">Forecast Skill Score</span>
        <span className="info-row-value" style={{ color: skillScore > 0 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
          {skillScore != null ? `${(skillScore * 100).toFixed(1)}% better than persistence` : '—'}
        </span>
      </div>
      <div className="info-row">
        <span className="info-row-label">Forecast Source</span>
        <span className="info-row-value">Elexon BMRS WINDFOR dataset</span>
      </div>
      <div className="info-row">
        <span className="info-row-label">Gate Closure Applied</span>
        <span className="info-row-value">Day-1 23:00 UTC</span>
      </div>
    </GlowCard>
  );
}

export default function Dashboard({ onNavigate }) {
  const { data: summary, loading: loadS, error: errS } = useApiData(getSummary);
  const { data: accuracy, loading: loadA } = useApiData(getAccuracyMetrics);
  const { data: forecasts, loading: loadF } = useApiData(getDayAheadForecasts);

  const loading = loadS || loadA || loadF;

  if (loading) return (
    <div className="container">
      <LoadingState message="Loading January 2026 wind data from Elexon BMRS..." />
    </div>
  );

  if (errS) return (
    <div className="container">
      <ErrorState message={errS} />
    </div>
  );

  return (
    <div className="container">
      {/* Hero Header */}
      <div className="page-header fade-up">
        <div className="page-header-eyebrow">UK Day-Ahead Market Intelligence</div>
        <h1 className="page-title">Wind Power Forecasting Dashboard</h1>
        <p className="page-subtitle">
          Monitor wind generation forecasts and evaluate forecast accuracy for GB national grid.
          Data powered by Elexon BMRS — January 2026 analysis period.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">
              <BarChart3 size={16} style={{ color: 'var(--accent-blue)' }} />
              Forecast Accuracy — January 2026 Overview
            </div>
            <div className="section-subtitle">Day-ahead forecast vs. actual generation (FUELHH vs. WINDFOR)</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('accuracy')}>
            Full Analysis <ArrowRight size={13} />
          </button>
        </div>
        <HeroStats summary={summary} />
      </div>

      {/* Main chart + insights */}
      <div className="section">
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <ForecastChart data={forecasts} />
          <QuickInsights summary={summary} accuracy={accuracy} />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="section fade-up">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('forecasts')}>
            <Wind size={15} />
            Explore Forecasts
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('accuracy')}>
            <BarChart3 size={15} />
            Accuracy Analysis
          </button>
          <button className="btn btn-ghost" onClick={() => onNavigate('actuals')}>
            <Zap size={15} />
            View Actuals
          </button>
        </div>
      </div>
    </div>
  );
}
