import { useState } from 'react';
import { useApiData } from '../hooks/useApiData';
import { getDayAheadForecasts, getLatestSnapshot, getForecastsByDate } from '../services/api';
import { LoadingState, ErrorState, CustomTooltip } from '../components/Shared';
import {
  ComposedChart, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Brush
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Wind, Calendar, Clock, Info, ChevronLeft, ChevronRight } from 'lucide-react';

const JAN_DATES = Array.from({ length: 31 }, (_, i) => {
  const d = new Date(2026, 0, i + 1);
  return format(d, 'yyyy-MM-dd');
});

function PublishVersionsChart({ dateData }) {
  if (!dateData?.data?.length) return null;

  const versions = dateData.data;
  const colors = ['#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#a855f7'];

  // Build unified time series
  const allTimes = new Set();
  versions.forEach(v => v.forecasts.forEach(f => allTimes.add(f.startTime)));
  const sortedTimes = Array.from(allTimes).sort();

  const chartData = sortedTimes.map(t => {
    const row = { time: format(parseISO(t), 'HH:mm') };
    versions.forEach((v, i) => {
      const f = v.forecasts.find(x => x.startTime === t);
      if (f) row[`v${i + 1}`] = f.generation;
    });
    return row;
  });

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">Forecast Versions for {dateData.targetDate}</div>
          <div className="section-subtitle">
            {versions.length} forecast runs — showing how predictions evolved (MW)
          </div>
        </div>
        <div className="chart-legend">
          {versions.map((v, i) => (
            <div key={i} className="legend-item">
              <div className="legend-dot" style={{ background: colors[i % colors.length] }} />
              {format(parseISO(v.publishTime), 'dd MMM HH:mm')}
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`} width={42}
          />
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toLocaleString()} MW`} />} />
          {versions.map((_, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={`v${i + 1}`}
              stroke={colors[i % colors.length]}
              strokeWidth={i === versions.length - 1 ? 2.5 : 1.5}
              dot={false}
              strokeOpacity={i === versions.length - 1 ? 1 : 0.5}
              name={`Run ${i + 1}`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DayAheadForecastChart({ data }) {
  if (!data?.data) return null;

  const chartData = data.data.map(d => ({
    time: format(parseISO(d.startTime), 'dd/MM HH:mm'),
    'Day-Ahead Forecast (MW)': d.generation,
  }));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">
            <Wind size={15} style={{ color: 'var(--accent-cyan)' }} />
            Day-Ahead Wind Forecast — Full January 2026
          </div>
          <div className="section-subtitle">
            Forecast selected at gate closure (day before delivery) — used for market procurement decisions
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#06b6d4' }} />
            Day-Ahead Forecast
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradDA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
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
          <Area
            type="monotone"
            dataKey="Day-Ahead Forecast (MW)"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#gradDA)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ForecastsPage() {
  const [selectedDate, setSelectedDate] = useState(JAN_DATES[0]);
  const [dateIdx, setDateIdx] = useState(0);

  const { data: daForecasts, loading: loadDA, error: errDA } = useApiData(getDayAheadForecasts);
  const { data: byDate, loading: loadDate } = useApiData(
    () => getForecastsByDate(selectedDate),
    [selectedDate]
  );

  const setDate = (idx) => {
    setDateIdx(idx);
    setSelectedDate(JAN_DATES[idx]);
  };

  if (loadDA) return (
    <div className="container">
      <LoadingState message="Fetching wind forecasts from Elexon BMRS WINDFOR dataset..." />
    </div>
  );

  if (errDA) return (
    <div className="container"><ErrorState message={errDA} /></div>
  );

  return (
    <div className="container">
      <div className="page-header fade-up">
        <div className="page-header-eyebrow">WINDFOR Dataset — Elexon BMRS</div>
        <h1 className="page-title">Wind Generation Forecasts</h1>
        <p className="page-subtitle">
          Explore day-ahead wind generation forecasts for January 2026.
          Each forecast represents the prediction available at gate closure (day before delivery),
          which drives procurement decisions in the UK day-ahead electricity market.
        </p>
      </div>

      {/* Info Banner */}
      <div className="section fade-up stagger-1">
        <div style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 12,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <Info size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Day-Ahead Gate Closure Logic</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
              For each delivery hour in January 2026, we select the most recent forecast published
              before 23:00 UTC on the preceding day. This mirrors the real-world constraint faced by
              traders when submitting bids to the UK day-ahead electricity market.
            </p>
          </div>
        </div>
      </div>

      {/* Full month chart */}
      <div className="section fade-up stagger-2">
        <DayAheadForecastChart data={daForecasts} />
      </div>

      {/* Per-date breakdown */}
      <div className="section fade-up stagger-3">
        <div className="section-header">
          <div>
            <div className="section-title">
              <Calendar size={16} style={{ color: 'var(--accent-purple)' }} />
              Forecast Versions by Delivery Date
            </div>
            <div className="section-subtitle">
              See all forecast runs available for a specific delivery date
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setDate(Math.max(0, dateIdx - 1))}
              disabled={dateIdx === 0}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="date-picker-wrapper">
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="date"
                value={selectedDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setDateIdx(JAN_DATES.indexOf(e.target.value));
                }}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setDate(Math.min(30, dateIdx + 1))}
              disabled={dateIdx === 30}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {loadDate ? (
          <LoadingState message="Loading forecast versions..." />
        ) : (
          <PublishVersionsChart dateData={byDate} />
        )}
      </div>

      {/* Stats row */}
      {daForecasts && (
        <div className="section fade-up stagger-4">
          <div className="grid-3">
            <div className="card">
              <div className="card-title"><Wind size={12} />Total Forecast Points</div>
              <div className="card-value">{daForecasts.count?.toLocaleString()}</div>
              <div className="card-delta">Hourly periods in January 2026</div>
            </div>
            <div className="card">
              <div className="card-title"><Clock size={12} />Coverage</div>
              <div className="card-value">31</div>
              <div className="card-delta">Days of day-ahead forecasts</div>
            </div>
            <div className="card">
              <div className="card-title"><Calendar size={12} />Forecast Resolution</div>
              <div className="card-value">1 hr</div>
              <div className="card-delta">WINDFOR hourly generation (MW)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
