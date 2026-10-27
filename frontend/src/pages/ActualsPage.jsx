import { useApiData } from '../hooks/useApiData';
import { getActualsJan2026 } from '../services/api';
import { LoadingState, ErrorState, CustomTooltip } from '../components/Shared';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush,
  BarChart, Bar
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Zap, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

function HalfHourlyChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map(d => ({
      time: format(parseISO(d.startTime), 'dd/MM HH:mm'),
      'Actual Wind (MW)': d.generation,
    }));
  }, [data]);

  const maxGen = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map(d => d['Actual Wind (MW)']));
  }, [chartData]);

  const avgGen = useMemo(() => {
    if (!chartData.length) return 0;
    return (chartData.reduce((s, d) => s + d['Actual Wind (MW)'], 0) / chartData.length).toFixed(0);
  }, [chartData]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">
            <Zap size={15} style={{ color: 'var(--accent-green)' }} />
            Actual Wind Generation — January 2026 (30-min resolution)
          </div>
          <div className="section-subtitle">
            FUELHH dataset · fuelType=WIND · National GB generation (MW)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{maxGen.toLocaleString()} MW</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{parseInt(avgGen).toLocaleString()} MW</div>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false} interval={95} />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`} width={42}
          />
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toLocaleString()} MW`} />} />
          <Brush dataKey="time" height={20} stroke="rgba(34,197,94,0.2)" fill="rgba(9,16,35,0.9)" travellerWidth={6} />
          <Area
            type="monotone"
            dataKey="Actual Wind (MW)"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="url(#gradActual)"
            dot={false}
            activeDot={{ r: 3, fill: '#22c55e' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DailyStats({ data }) {
  const dailyData = useMemo(() => {
    if (!data?.data) return [];
    const byDay = {};
    data.data.forEach(d => {
      const day = d.settlementDate || d.startTime.substring(0, 10);
      if (!byDay[day]) byDay[day] = { sum: 0, count: 0, max: 0, min: Infinity };
      byDay[day].sum += d.generation;
      byDay[day].count++;
      byDay[day].max = Math.max(byDay[day].max, d.generation);
      byDay[day].min = Math.min(byDay[day].min, d.generation);
    });
    return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([date, s]) => ({
      date: format(parseISO(date), 'dd/MM'),
      'Avg MW': Math.round(s.sum / s.count),
      'Max MW': s.max,
    }));
  }, [data]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="section-title">
            <BarChart3 size={15} style={{ color: 'var(--accent-blue)' }} />
            Daily Average & Peak Actual Wind Generation
          </div>
          <div className="section-subtitle">Day-by-day variability across January 2026</div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#3b82f6' }} />
            Daily Average
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'rgba(59,130,246,0.3)' }} />
            Daily Peak
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dailyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill: '#4a5a7a', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`} width={42}
          />
          <Tooltip content={<CustomTooltip formatter={v => `${v?.toLocaleString()} MW`} />} />
          <Bar dataKey="Max MW" fill="rgba(59,130,246,0.2)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Avg MW" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ActualsPage() {
  const { data, loading, error } = useApiData(getActualsJan2026);

  if (loading) return (
    <div className="container">
      <LoadingState message="Fetching wind actuals from Elexon BMRS FUELHH dataset..." />
    </div>
  );

  if (error) return <div className="container"><ErrorState message={error} /></div>;

  const totalPoints = data?.count || 0;
  const totalEnergy = data?.data
    ? (data.data.reduce((s, d) => s + d.generation * 0.5, 0) / 1000).toFixed(0)
    : '—';
  const maxGen = data?.data ? Math.max(...data.data.map(d => d.generation)) : 0;
  const avgGen = data?.data
    ? Math.round(data.data.reduce((s, d) => s + d.generation, 0) / data.data.length)
    : 0;

  return (
    <div className="container">
      <div className="page-header fade-up">
        <div className="page-header-eyebrow">FUELHH Dataset — Elexon BMRS</div>
        <h1 className="page-title">Actual Wind Generation</h1>
        <p className="page-subtitle">
          National GB actual wind power generation for January 2026 at 30-minute settlement period resolution.
          Source: Elexon BMRS FUELHH dataset, fuelType=WIND.
        </p>
      </div>

      {/* Stats */}
      <div className="section fade-up stagger-1">
        <div className="grid-4">
          <div className="metric-card">
            <div className="card-title"><Zap size={12} />Total Data Points</div>
            <div className="card-value">{totalPoints.toLocaleString()}</div>
            <div className="card-delta">30-min settlement periods</div>
          </div>
          <div className="metric-card green">
            <div className="card-title"><TrendingUp size={12} />Peak Generation</div>
            <div className="card-value">{maxGen.toLocaleString()}</div>
            <div className="card-unit" style={{ display: 'inline' }}> MW</div>
            <div className="card-delta">Maximum during January 2026</div>
          </div>
          <div className="metric-card">
            <div className="card-title"><BarChart3 size={12} />Average Generation</div>
            <div className="card-value">{avgGen.toLocaleString()}</div>
            <div className="card-unit" style={{ display: 'inline' }}> MW</div>
            <div className="card-delta">Monthly mean output</div>
          </div>
          <div className="metric-card purple">
            <div className="card-title"><Clock size={12} />Total Energy</div>
            <div className="card-value">{parseInt(totalEnergy).toLocaleString()}</div>
            <div className="card-unit" style={{ display: 'inline' }}> GWh</div>
            <div className="card-delta">Estimated wind energy January 2026</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="section fade-up stagger-2">
        <HalfHourlyChart data={data} />
      </div>

      <div className="section fade-up stagger-3">
        <DailyStats data={data} />
      </div>

      {/* Data table (first 20 rows) */}
      <div className="section fade-up stagger-4">
        <div className="section-header">
          <div className="section-title">
            <Clock size={15} />
            Recent Actuals (Latest 20 entries)
          </div>
        </div>
        <div className="chart-container" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Start Time (UTC)</th>
                <th>Settlement Date</th>
                <th>Period</th>
                <th>Wind Generation (MW)</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.slice(-20).reverse().map((row, i) => (
                <tr key={i}>
                  <td className="mono" style={{ color: 'var(--text-accent)', fontSize: '0.8rem' }}>
                    {format(parseISO(row.startTime), 'dd MMM yyyy HH:mm')}
                  </td>
                  <td>{row.settlementDate}</td>
                  <td>SP {row.settlementPeriod}</td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                    {row.generation?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
