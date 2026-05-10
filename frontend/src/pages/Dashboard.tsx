import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, Activity, Package, ArrowUpRight } from 'lucide-react';
import type { RevenueChartResponse, CategoryDataPoint, BatchOptimizationResponse, CatalogProduct } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import ModelMetricsCard from '../components/ModelMetricsCard';

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

function mergeRevenueSeries(chart: RevenueChartResponse): { date: string; actual: number; optimized: number }[] {
  const { actual, optimized } = chart;
  return actual.map((row, i) => ({
    date: row.date,
    actual: row.revenue,
    optimized: optimized[i]?.revenue ?? row.revenue,
  }));
}

function fallbackBatch(summaryOverrides?: Partial<BatchOptimizationResponse['summary']>): BatchOptimizationResponse {
  const summary = {
    total_products: 20,
    total_current_revenue: 98000,
    total_optimized_revenue: 124500,
    total_revenue_impact: 26500,
    revenue_lift: 12.5,
    avg_change_percent: 4.2,
    price_increases: 12,
    price_decreases: 5,
    unchanged: 3,
    ...summaryOverrides,
  };
  return {
    summary,
    results: [],
  };
}

export default function Dashboard() {
  const [batch, setBatch] = useState<BatchOptimizationResponse | null>(null);
  const [revenueMerged, setRevenueMerged] = useState<{ date: string; actual: number; optimized: number }[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const { formatPrice, currency } = useCurrency();

  useEffect(() => {
    const load = async () => {
      try {
        const [opt, revChart, cats, products] = await Promise.all([
          api.optimizeBatch(),
          api.getRevenueChart(),
          api.getCategories(),
          api.getProducts(),
        ]);
        setBatch(opt);
        setRevenueMerged(mergeRevenueSeries(revChart));
        setCategoryData(cats);
        setCatalog(products);
        setUsingFallback(false);
      } catch (e) {
        console.warn('Dashboard API unavailable, using fallback data:', e);
        const fb = fallbackBatch();
        setBatch(fb);
        setRevenueMerged(
          Array.from({ length: 30 }).map((_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
            actual: 3800 + Math.random() * 1200,
            optimized: 4100 + Math.random() * 1300,
          }))
        );
        setCategoryData([
          { name: 'Electronics', revenue: 45000, color: '#3b82f6' },
          { name: 'Fashion', revenue: 32000, color: '#8b5cf6' },
          { name: 'Home & Living', revenue: 28000, color: '#10b981' },
          { name: 'Food & Beverage', revenue: 19500, color: '#f59e0b' },
        ]);
        setCatalog([]);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avgMargin = useMemo(() => {
    if (!batch?.results.length) return null;
    const m = batch.results.reduce((s, r) => s + r.margin, 0) / batch.results.length;
    return Math.round(m * 100) / 100;
  }, [batch]);

  const topMovers = useMemo(() => {
    if (!batch?.results.length) return [];
    const nameById = new Map(catalog.map((p) => [p.id, p.name]));
    return [...batch.results]
      .sort((a, b) => Math.abs(b.revenue_impact) - Math.abs(a.revenue_impact))
      .slice(0, 5)
      .map((r) => ({
        ...r,
        name: nameById.get(r.product_id) ?? r.product_id,
        image: catalog.find(p => p.id === r.product_id)?.image
      }));
  }, [batch, catalog]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card h-80 rounded-xl" />
          <div className="glass-card h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const summary = batch?.summary;
  const marginPercent =
    avgMargin !== null ? avgMargin : usingFallback ? 34.2 : undefined;

  const kpiCards = [
    {
      icon: DollarSign,
      label: 'Total optimized revenue',
      value: formatPrice(summary?.total_optimized_revenue ?? 0, false),
      sub: summary
        ? `${summary.revenue_lift >= 0 ? '+' : ''}${summary.revenue_lift}% vs current baseline`
        : '—',
      subPositive: (summary?.revenue_lift ?? 0) >= 0,
      bg: 'bg-primary/20',
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Revenue lift',
      value: `${summary?.revenue_lift?.toFixed(1) ?? '0'}%`,
      sub: summary ? `${formatPrice(summary.total_revenue_impact, false)} absolute impact` : '—',
      subPositive: (summary?.total_revenue_impact ?? 0) >= 0,
      bg: 'bg-accent-success/20',
      color: 'text-accent-success',
    },
    {
      icon: Package,
      label: 'Active products',
      value: String(summary?.total_products ?? 0),
      sub: summary
        ? `${summary.price_increases} ↑  ${summary.price_decreases} ↓  ${summary.unchanged} ─`
        : '—',
      subPositive: true,
      bg: 'bg-secondary/20',
      color: 'text-secondary',
    },
    {
      icon: Activity,
      label: 'Average margin',
      value: marginPercent !== undefined ? `${marginPercent}%` : '—',
      sub: 'After optimization',
      subPositive: true,
      bg: 'bg-accent-warning/20',
      color: 'text-accent-warning',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Real-time pricing intelligence across your product portfolio
          </p>
        </div>
        {usingFallback && (
          <span className="text-xs text-accent-warning bg-accent-warning/10 border border-accent-warning/30 rounded-lg px-3 py-1.5 self-start">
            Demo data — start the API at http://127.0.0.1:8000 for live metrics
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card p-6 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{card.label}</p>
                <h3 className="text-2xl font-bold">{card.value}</h3>
                <div
                  className={`text-xs mt-2 font-medium ${
                    card.subPositive ? 'text-accent-success' : 'text-accent-danger'
                  }`}
                >
                  {card.sub}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue: actual vs optimized */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h3 className="font-semibold text-lg">Revenue: actual vs optimized (30 days)</h3>
            <span className="text-xs text-text-secondary">Last 30 days · aligned with implementation plan</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueMerged} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-secondary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    `${currency.symbol}${((val * currency.rate) / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: number, name: string) => [
                    formatPrice(value),
                    name === 'actual' ? 'Actual' : 'Optimized',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="actual"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashActual)"
                />
                <Area
                  type="monotone"
                  dataKey="optimized"
                  name="optimized"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashOpt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top movers */}
        <div className="glass-card rounded-xl p-6 flex flex-col">
          <h3 className="font-semibold text-lg mb-4">Top revenue movers</h3>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px]">
            {topMovers.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Run batch optimization with the API to see per-product impact rankings.
              </p>
            ) : (
              topMovers.map((row) => (
                <div
                  key={row.product_id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface/50 border border-border/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="mover-img-container">
                      <img src={row.image} alt={row.name} className="mover-img" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate" title={row.name}>
                        {row.name}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {row.change_percent >= 0 ? '+' : ''}
                        {row.change_percent.toFixed(1)}% price · {formatPrice(row.suggested_price)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-0.5 text-sm font-semibold shrink-0 ${
                      row.revenue_impact >= 0 ? 'text-accent-success' : 'text-accent-danger'
                    }`}
                  >
                    {row.revenue_impact >= 0 ? '+' : ''}
                    {formatPrice(row.revenue_impact, false)}
                    <ArrowUpRight size={14} className="opacity-70" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown + model metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category pie */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-6 text-text-primary">Revenue by category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="revenue"
                  nameKey="name"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: cat.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                  }}
                />
                <span className="text-text-secondary truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ML model metrics */}
        <ModelMetricsCard className="lg:col-span-3" />
      </div>
    </div>
  );
}
