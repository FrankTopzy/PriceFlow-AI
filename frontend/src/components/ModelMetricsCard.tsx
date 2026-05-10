import { useState, useEffect } from 'react';
import { Brain, BarChart2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import type { ModelMetrics } from '../types';

const MODEL_COLORS: Record<string, string> = {
  ridge: '#3b82f6',
  xgboost: '#8b5cf6',
  gbm: '#10b981',
  ensemble: '#f59e0b',
};

function getModelColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('ridge')) return MODEL_COLORS.ridge;
  if (normalized.includes('xgboost')) return MODEL_COLORS.xgboost;
  if (normalized.includes('gbm')) return MODEL_COLORS.gbm;
  if (normalized.includes('ensemble')) return MODEL_COLORS.ensemble;
  return '#6366f1';
}

function r2Color(r2: number): string {
  if (r2 >= 0.85) return 'text-accent-success';
  if (r2 >= 0.7) return 'text-accent-warning';
  return 'text-accent-danger';
}

interface Props {
  className?: string;
}

export default function ModelMetricsCard({ className = '' }: Props) {
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getModelMetrics()
      .then(setMetrics)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Brain size={20} className="text-secondary" />
          <h3 className="font-semibold text-text-primary">ML Model Performance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-surface/50 border border-border space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-6 w-16" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || metrics.length === 0) {
    return (
      <div className={`glass-card rounded-xl p-6 flex items-center gap-3 text-text-secondary ${className}`}>
        <AlertCircle size={18} className="text-accent-warning shrink-0" />
        <p className="text-sm">
          {error
            ? 'Backend offline — model metrics unavailable.'
            : 'No model metrics returned yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-secondary/20 text-secondary rounded-lg">
          <Brain size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">ML Model Performance</h3>
          <p className="text-xs text-text-secondary">Ensemble = 60% XGBoost + 40% Ridge</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-accent-success bg-accent-success/10 px-2.5 py-1 rounded-full">
          <BarChart2 size={12} />
          Live metrics
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const color = getModelColor(m.model_name);
          return (
            <div
              key={m.model_name}
              className="p-4 rounded-xl bg-surface/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ color, backgroundColor: `${color}20` }}
                >
                  {m.model_name}
                </span>
              </div>

              {/* R² */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary">R² Score</span>
                  <span className={`font-bold ${r2Color(m.r2)}`}>{m.r2.toFixed(4)}</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(m.r2 * 100, 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>

              {/* MAE / MAPE */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-surface rounded-lg">
                  <div className="text-text-secondary mb-0.5">MAE</div>
                  <div className="font-semibold text-text-primary">{m.mae.toFixed(2)}</div>
                </div>
                <div className="text-center p-2 bg-surface rounded-lg">
                  <div className="text-text-secondary mb-0.5">MAPE</div>
                  <div className="font-semibold text-text-primary">{m.mape.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
