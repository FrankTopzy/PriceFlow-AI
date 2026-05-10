import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, ShieldCheck, Settings, History, Check, RefreshCw,
  ChevronUp, ChevronDown, AlertCircle, Lock, Unlock, Zap,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import type { PriceLogEntry, OptimizerConfig } from '../types';

// ── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK_LOGS: PriceLogEntry[] = [
  {
    timestamp: '2026-05-07 14:30',
    product_id: 'p001',
    product_name: 'Wireless Headphones Pro',
    old_price: 189.99,
    new_price: 195.50,
    reason: 'Demand surge detected',
    applied: true,
    rollout_mode: 'live',
  },
  {
    timestamp: '2026-05-07 10:15',
    product_id: 'p002',
    product_name: 'Smart Watch Ultra',
    old_price: 299.00,
    new_price: 285.00,
    reason: 'Competitor price drop',
    applied: true,
    rollout_mode: 'canary',
  },
  {
    timestamp: '2026-05-06 22:45',
    product_id: 'p003',
    product_name: 'Bluetooth Speaker',
    old_price: 59.99,
    new_price: 65.00,
    reason: 'Low stock threshold',
    applied: false,
    rollout_mode: 'shadow',
  },
  {
    timestamp: '2026-05-06 09:00',
    product_id: 'p004',
    product_name: 'Noise-Cancel Earbuds',
    old_price: 149.99,
    new_price: 152.00,
    reason: 'Routine optimization',
    applied: true,
    rollout_mode: 'live',
  },
];

const DEFAULT_CONFIG: OptimizerConfig = {
  objective: 'revenue',
  rollout_mode: 'shadow',
  min_margin_pct: 20,
  max_increase_pct: 10,
  max_decrease_pct: 15,
  rate_limit_hours: 24,
};

const ROLLOUT_MODES = ['shadow', 'canary', 'live'];
const OBJECTIVES    = ['revenue', 'profit', 'margin'];

export default function Safety() {
  const [logs, setLogs] = useState<PriceLogEntry[]>([]);
  const [config, setConfig] = useState<OptimizerConfig>(DEFAULT_CONFIG);
  const [localConfig, setLocalConfig] = useState<OptimizerConfig>(DEFAULT_CONFIG);
  const [logsLoading, setLogsLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const { formatPrice } = useCurrency();

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLogsLoading(true);
    else setIsRefreshingLogs(true);
    try {
      const data = await api.getPriceLog();
      setLogs(data);
    } catch {
      if (!silent) { setLogs(FALLBACK_LOGS); setUsingFallback(true); }
    } finally {
      setLogsLoading(false);
      setIsRefreshingLogs(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const data = await api.getConfig();
      setConfig(data);
      setLocalConfig(data);
    } catch {
      setUsingFallback(true);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchConfig();
  }, [fetchLogs, fetchConfig]);

  const isDirty = JSON.stringify(localConfig) !== JSON.stringify(config);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await api.updateConfig(localConfig);
      setConfig(res.config);
      setLocalConfig(res.config);
      setSaveStatus('saved');
    } catch {
      // fallback: just accept locally
      setConfig(localConfig);
      setSaveStatus('saved');
      setUsingFallback(true);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const RolloutBadge = ({ mode }: { mode: string }) => {
    const styles: Record<string, string> = {
      live:   'bg-accent-danger/10 text-accent-danger border-accent-danger/30',
      canary: 'bg-accent-warning/10 text-accent-warning border-accent-warning/30',
      shadow: 'bg-accent-success/10 text-accent-success border-accent-success/30',
    };
    const Icons: Record<string, React.ReactNode> = {
      live:   <Zap size={10} />,
      canary: <Unlock size={10} />,
      shadow: <Lock size={10} />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[mode] ?? 'bg-surface text-text-secondary border-border'}`}>
        {Icons[mode]}
        {mode}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-danger/20 text-accent-danger rounded-xl">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Safety Rails &amp; Governance</h1>
            <p className="text-sm text-text-secondary">Control the autonomous boundaries of the pricing engine.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {usingFallback && (
            <span className="text-xs text-accent-warning bg-accent-warning/10 border border-accent-warning/30 rounded-lg px-3 py-1.5">
              Demo mode — API offline
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all border ${
              saveStatus === 'saved'
                ? 'bg-accent-success/20 text-accent-success border-accent-success/40'
                : saveStatus === 'error'
                ? 'bg-accent-danger/20 text-accent-danger border-accent-danger/40'
                : isDirty
                ? 'bg-primary text-white border-primary/40 hover:bg-primary/90'
                : 'bg-surface text-text-secondary border-border cursor-default'
            }`}
          >
            {isSaving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check size={14} />
            ) : (
              <Settings size={14} />
            )}
            {isSaving ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : isDirty ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Config Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Global Constraints */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-text-primary">
              <ShieldCheck size={16} className="text-accent-success" />
              Global Constraints
            </h3>

            {configLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Max Increase */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-text-secondary">Max Price Increase / 24h</label>
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <ChevronUp size={14} className="text-accent-success" />
                      {localConfig.max_increase_pct}%
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={30}
                    value={localConfig.max_increase_pct}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, max_increase_pct: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Max Decrease */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-text-secondary">Max Price Decrease / 24h</label>
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <ChevronDown size={14} className="text-accent-danger" />
                      {localConfig.max_decrease_pct}%
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={30}
                    value={localConfig.max_decrease_pct}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, max_decrease_pct: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Min Margin */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-text-secondary">Minimum Margin Floor</label>
                    <span className="font-semibold text-text-primary">{localConfig.min_margin_pct}%</span>
                  </div>
                  <input
                    type="range" min={5} max={60}
                    value={localConfig.min_margin_pct}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, min_margin_pct: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Rate limit */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-text-secondary">Rate Limit Window</label>
                    <span className="font-semibold text-text-primary">{localConfig.rate_limit_hours}h</span>
                  </div>
                  <input
                    type="range" min={1} max={72}
                    value={localConfig.rate_limit_hours}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, rate_limit_hours: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Objective & Rollout Mode */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-text-primary">
              <Zap size={16} className="text-primary" />
              Engine Settings
            </h3>
            {configLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-10 rounded-lg" />
                <div className="skeleton h-10 rounded-lg" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary block mb-1.5 uppercase tracking-wide">Optimisation Objective</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OBJECTIVES.map((obj) => (
                      <button
                        key={obj}
                        onClick={() => setLocalConfig((c) => ({ ...c, objective: obj }))}
                        className={`py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${
                          localConfig.objective === obj
                            ? 'bg-primary/20 border-primary/40 text-primary'
                            : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                        }`}
                      >
                        {obj}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary block mb-1.5 uppercase tracking-wide">Rollout Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLLOUT_MODES.map((mode) => {
                      const active = localConfig.rollout_mode === mode;
                      const danger = mode === 'live';
                      return (
                        <button
                          key={mode}
                          onClick={() => setLocalConfig((c) => ({ ...c, rollout_mode: mode }))}
                          className={`py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${
                            active
                              ? danger
                                ? 'bg-accent-danger/20 border-accent-danger/40 text-accent-danger'
                                : 'bg-primary/20 border-primary/40 text-primary'
                              : 'bg-surface border-border text-text-secondary hover:border-primary/30'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                  {localConfig.rollout_mode === 'live' && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-accent-danger bg-accent-danger/5 border border-accent-danger/20 rounded-lg p-2">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      Live mode applies prices immediately. Use with caution.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Audit Log ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass-card rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-primary" />
              <h3 className="font-semibold text-text-primary">Price Change Audit Log</h3>
              <span className="text-xs text-text-secondary bg-surface border border-border px-2 py-0.5 rounded-full">
                {logs.length} entries
              </span>
            </div>
            <button
              onClick={() => fetchLogs(true)}
              disabled={isRefreshingLogs}
              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={isRefreshingLogs ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {logsLoading ? (
              <div className="p-5 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-text-secondary">
                <History size={40} className="opacity-20 mb-3" />
                <p className="text-sm">No price changes recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm min-w-[600px]">
                <thead className="text-text-secondary bg-surface/60 border-b border-border sticky top-0">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Timestamp</th>
                    <th className="px-5 py-3 text-left font-medium">Product</th>
                    <th className="px-5 py-3 text-left font-medium">Price Change</th>
                    <th className="px-5 py-3 text-left font-medium">Reason</th>
                    <th className="px-5 py-3 text-left font-medium">Mode</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-surface/30 transition-colors">
                      <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap text-xs">
                        {log.timestamp}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-text-primary max-w-[160px]">
                        <div className="truncate" title={log.product_name}>{log.product_name}</div>
                        <div className="text-xs text-text-secondary">{log.product_id}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-text-secondary text-xs">{formatPrice(log.old_price)}</span>
                          <span className="text-xs text-text-secondary">→</span>
                          <span className={`font-semibold ${log.new_price > log.old_price ? 'text-accent-success' : 'text-accent-danger'}`}>
                            {formatPrice(log.new_price)}
                          </span>
                          <span className={`text-xs ${log.new_price > log.old_price ? 'text-accent-success' : 'text-accent-danger'}`}>
                            ({log.new_price > log.old_price ? '+' : ''}{(((log.new_price - log.old_price) / log.old_price) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs max-w-[180px]">
                        <div className="truncate" title={log.reason}>{log.reason}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <RolloutBadge mode={log.rollout_mode} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          log.applied
                            ? 'bg-accent-success/10 text-accent-success border-accent-success/20'
                            : 'bg-accent-danger/10 text-accent-danger border-accent-danger/20'
                        }`}>
                          {log.applied ? <Check size={10} /> : <AlertCircle size={10} />}
                          {log.applied ? 'Applied' : 'Blocked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}
