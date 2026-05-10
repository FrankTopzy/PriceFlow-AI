import { useState, useEffect } from 'react';
import { Beaker, Play, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';
import { useProducts } from '../context/ProductContext';
import { api } from '../api/client';
import type { CatalogProduct, OptimizationResult } from '../types';

// ── Scenario defaults ─────────────────────────────────────────────────────────
interface ScenarioParams {
  competitor_price: string;      // empty = use product base
  stock_level: string;           // 'low' | 'medium' | 'high'
  is_weekend: boolean;
  holiday_boost: number;
  month: number;
  demand_lag_7d: number;
}

const DEFAULT_SCENARIO: ScenarioParams = {
  competitor_price: '',
  stock_level: 'medium',
  is_weekend: false,
  holiday_boost: 0,
  month: new Date().getMonth() + 1,
  demand_lag_7d: 30,
};

export default function Simulation() {
  const { products, setProductOptimization, loading: productsLoading } = useProducts();
  const [selectedId, setSelectedId] = useState<string>('');
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_SCENARIO);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const { formatPrice, currency } = useCurrency();

  // Set initial selection
  useEffect(() => {
    if (products.length > 0 && !selectedId) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  const selectedProduct = products.find((p) => p.id === selectedId);

  const handleSimulate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.simulate({
        product_id: selectedId,
        competitor_price: params.competitor_price ? Number(params.competitor_price) / currency.rate : null,
        stock_level: params.stock_level,
        is_weekend: params.is_weekend,
        holiday_boost: params.holiday_boost,
        month: params.month,
        demand_lag_7d: params.demand_lag_7d,
      });
      setResult(res);
      setProductOptimization(selectedId, res);
    } catch (e: any) {
      // Graceful fallback for when API is offline
      if (selectedProduct) {
        const base = selectedProduct.current_price;
        const lift = params.is_weekend ? 1.12 : params.holiday_boost > 0 ? 1.15 : 1.07;
        const demand = params.demand_lag_7d * (params.stock_level === 'low' ? 1.2 : 1.0);
        const mockRes: OptimizationResult = {
          product_id: selectedId,
          current_price: base,
          suggested_price: Math.round(base * lift * 100) / 100,
          floor: Math.round(base * 0.80 * 100) / 100,
          ceiling: selectedProduct.msrp,
          change_percent: (lift - 1) * 100,
          predicted_demand: Math.round(demand),
          expected_revenue: Math.round(base * lift * demand),
          expected_profit: Math.round((base * lift - selectedProduct.cost) * demand),
          revenue_impact: Math.round((base * lift - base) * demand),
          profit_impact: Math.round((base * lift - base) * demand * 0.4),
          margin: Math.round(((base * lift - selectedProduct.cost) / (base * lift)) * 10000) / 100,
          objective: 'revenue',
          rate_limited: false,
          is_locked: false,
          can_apply: true,
          rollout_mode: 'shadow',
        };
        setResult(mockRes);
        setProductOptimization(selectedId, mockRes);
        setUsingFallback(true);
      } else {
        setError(e.message || 'Simulation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const barData = result ? [
    {
      name: 'Revenue',
      Current: Math.round(result.current_price * result.predicted_demand * 0.93),
      Simulated: result.expected_revenue,
    },
    {
      name: 'Profit',
      Current: Math.round(result.expected_profit * 0.88),
      Simulated: result.expected_profit,
    },
  ] : [];

  const radarData = result ? [
    { metric: 'Revenue', value: Math.min(100, (result.expected_revenue / (result.expected_revenue + Math.abs(result.revenue_impact) + 1)) * 100 + 50) },
    { metric: 'Margin', value: Math.min(100, result.margin * 2) },
    { metric: 'Demand', value: Math.min(100, (result.predicted_demand / 60) * 100) },
    { metric: 'Price Δ', value: Math.min(100, 50 + result.change_percent * 2) },
    { metric: 'Safety', value: result.rate_limited ? 20 : 85 },
  ] : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
      {/* ── Parameters Panel ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-80 shrink-0 glass-panel rounded-xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-secondary/20 text-secondary rounded-lg">
              <Beaker size={18} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">What-If Scenario</h2>
          </div>
          <p className="text-xs text-text-secondary">Adjust market conditions and simulate pricing impact.</p>
          {usingFallback && (
            <span className="inline-block mt-2 text-xs text-accent-warning bg-accent-warning/10 border border-accent-warning/30 rounded px-2 py-0.5">
              Demo mode — API offline
            </span>
          )}
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Product selector */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5 uppercase tracking-wide">Product</label>
            {productsLoading ? (
              <div className="skeleton h-9 rounded-lg" />
            ) : (
              <select
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary outline-none"
              >
                {products.length === 0 ? (
                  <option value="">No products available</option>
                ) : (
                  products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                )}
              </select>
            )}
            {selectedProduct && (
              <p className="text-xs text-text-secondary mt-1">
                Current: {formatPrice(selectedProduct.current_price)} · Cost: {formatPrice(selectedProduct.cost)}
              </p>
            )}
          </div>

          {/* Competitor price */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5 uppercase tracking-wide">
              Competitor Price ({currency.symbol}) <span className="text-text-secondary/60 normal-case">(optional)</span>
            </label>
            <input
              type="number"
              placeholder="Leave blank for default"
              value={params.competitor_price}
              onChange={(e) => setParams((p) => ({ ...p, competitor_price: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary outline-none"
            />
          </div>

          {/* Stock level */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5 uppercase tracking-wide">Stock Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  onClick={() => setParams((p) => ({ ...p, stock_level: level }))}
                  className={`py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${
                    params.stock_level === level
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Month */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5 uppercase tracking-wide">Month</label>
            <select
              value={params.month}
              onChange={(e) => setParams((p) => ({ ...p, month: Number(e.target.value) }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary outline-none"
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>

          {/* Demand lag */}
          <div>
            <label className="text-xs font-medium text-text-secondary flex justify-between mb-1.5 uppercase tracking-wide">
              <span>Demand Lag (7d avg)</span>
              <span className="text-text-primary normal-case">{params.demand_lag_7d} units</span>
            </label>
            <input
              type="range"
              min={5} max={100} step={5}
              value={params.demand_lag_7d}
              onChange={(e) => setParams((p) => ({ ...p, demand_lag_7d: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Holiday boost */}
          <div>
            <label className="text-xs font-medium text-text-secondary flex justify-between mb-1.5 uppercase tracking-wide">
              <span>Holiday Boost</span>
              <span className="text-text-primary normal-case">+{Math.round(params.holiday_boost * 100)}%</span>
            </label>
            <input
              type="range"
              min={0} max={0.5} step={0.05}
              value={params.holiday_boost}
              onChange={(e) => setParams((p) => ({ ...p, holiday_boost: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Weekend toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setParams((p) => ({ ...p, is_weekend: !p.is_weekend }))}
              className={`w-10 h-5 rounded-full transition-colors ${params.is_weekend ? 'bg-primary' : 'bg-surface border border-border'} relative`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${params.is_weekend ? 'left-5' : 'left-0.5'}`} />
            </div>
            <span className="text-sm text-text-secondary group-hover:text-text-primary">Weekend traffic</span>
          </label>
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={handleSimulate}
            disabled={loading || !selectedId || productsLoading}
            className="w-full py-3 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Simulating…' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* ── Results Panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 gap-5 overflow-y-auto">
        {error && (
          <div className="p-4 bg-accent-danger/10 border border-accent-danger/30 rounded-xl text-accent-danger text-sm">
            {error}
          </div>
        )}

        {result ? (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* KPI summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Suggested Price',
                  value: formatPrice(result.suggested_price),
                  sub: `${result.change_percent >= 0 ? '+' : ''}${result.change_percent.toFixed(1)}% change`,
                  positive: result.change_percent >= 0,
                  icon: DollarSign,
                  color: 'text-primary',
                  bg: 'bg-primary/20',
                },
                {
                  label: 'Expected Revenue',
                  value: formatPrice(result.expected_revenue),
                  sub: `${result.revenue_impact >= 0 ? '+' : ''}${formatPrice(result.revenue_impact)} vs baseline`,
                  positive: result.revenue_impact >= 0,
                  icon: TrendingUp,
                  color: 'text-accent-success',
                  bg: 'bg-accent-success/20',
                },
                {
                  label: 'Predicted Demand',
                  value: `${result.predicted_demand} units`,
                  sub: `Stock: ${params.stock_level}`,
                  positive: true,
                  icon: Beaker,
                  color: 'text-secondary',
                  bg: 'bg-secondary/20',
                },
                {
                  label: 'Margin',
                  value: `${result.margin.toFixed(1)}%`,
                  sub: `Profit: ${formatPrice(result.expected_profit)}`,
                  positive: result.margin > 20,
                  icon: result.margin > 20 ? TrendingUp : TrendingDown,
                  color: result.margin > 20 ? 'text-accent-success' : 'text-accent-danger',
                  bg: result.margin > 20 ? 'bg-accent-success/20' : 'bg-accent-danger/20',
                },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${kpi.bg} ${kpi.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary mb-0.5">{kpi.label}</p>
                      <p className="font-bold text-lg text-text-primary leading-tight truncate">{kpi.value}</p>
                      <p className={`text-xs ${kpi.positive ? 'text-accent-success' : 'text-accent-danger'}`}>{kpi.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Bar comparison */}
              <div className="lg:col-span-3 glass-card rounded-xl p-5">
                <h3 className="font-semibold text-text-primary mb-4">Current vs Simulated</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={(v) => `${currency.symbol}${(v * currency.rate / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                        formatter={(v: number) => [formatPrice(v), '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Current" fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Simulated" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar */}
              <div className="lg:col-span-2 glass-card rounded-xl p-5">
                <h3 className="font-semibold text-text-primary mb-4">Performance Radar</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Safety flags */}
            <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-center text-sm">
              <span className="text-text-secondary text-xs uppercase tracking-wider font-medium">Safety Checks:</span>
              {[
                { label: 'Rate Limit', pass: !result.rate_limited },
                { label: 'Locked', pass: !result.is_locked },
                { label: 'Can Apply', pass: result.can_apply },
                { label: 'Min Margin', pass: result.margin >= 15 },
              ].map(({ label, pass }) => (
                <span
                  key={label}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    pass
                      ? 'bg-accent-success/10 text-accent-success border-accent-success/20'
                      : 'bg-accent-danger/10 text-accent-danger border-accent-danger/20'
                  }`}
                >
                  {pass ? '✓' : '✗'} {label}
                </span>
              ))}
              <span className="ml-auto text-xs text-text-secondary">Rollout: <strong className="text-text-primary">{result.rollout_mode}</strong></span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-border rounded-xl min-h-[400px]">
            <Beaker size={52} className="mb-4 opacity-20" />
            <p className="font-medium">Select a product and run a simulation</p>
            <p className="text-sm text-text-secondary/60 mt-1">Results will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
