import { useState } from 'react';
import { Beaker, Play, Save, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

export default function Simulation() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { formatPrice, currency } = useCurrency();

  const handleSimulate = () => {
    setLoading(true);
    setTimeout(() => {
      setResults({
        metrics: [
          { name: 'Revenue', current: 125000, simulated: 138500 },
          { name: 'Profit', current: 42000, simulated: 49200 },
          { name: 'Demand', current: 8500, simulated: 8100 },
        ]
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
      {/* Parameters Panel */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden shrink-0 lg:h-full">
        <div className="p-6 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/20 text-secondary rounded-lg">
              <Beaker size={20} />
            </div>
            <h2 className="text-xl font-bold">Scenario Parameters</h2>
          </div>
          <p className="text-sm text-text-secondary">Adjust external factors to simulate their impact on optimal pricing.</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary flex justify-between">
              <span>Competitor Aggressiveness</span>
              <span className="text-text-primary">Medium</span>
            </label>
            <input type="range" className="w-full accent-secondary" min="1" max="100" defaultValue="50" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary flex justify-between">
              <span>Market Demand Shift</span>
              <span className="text-text-primary">+5%</span>
            </label>
            <input type="range" className="w-full accent-secondary" min="-50" max="50" defaultValue="5" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Seasonality</label>
            <select className="w-full bg-surface border border-border rounded-lg p-3 text-sm focus:border-secondary outline-none">
              <option>Current Month</option>
              <option>Q4 Holiday Season</option>
              <option>Summer Slump</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input type="checkbox" id="weekend" className="w-4 h-4 accent-secondary bg-surface border-border rounded" />
            <label htmlFor="weekend" className="text-sm">Simulate Weekend Traffic</label>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface/30 flex gap-4">
          <button 
            onClick={handleSimulate}
            disabled={loading}
            className="flex-1 py-3 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
            Run Simulation
          </button>
          <button className="p-3 border border-border rounded-lg hover:bg-white/5 transition-colors">
            <Save size={18} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Results Panel */}
      <div className="w-full lg:w-2/3 glass-panel rounded-xl p-6 flex flex-col flex-1 min-h-[500px]">
        <h2 className="text-xl font-bold mb-6">Impact Analysis</h2>
        
        {results ? (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-5 rounded-xl border border-secondary/30 bg-secondary/10">
                <div className="text-sm text-text-secondary mb-1">Projected Revenue Lift</div>
                <div className="text-3xl font-bold text-secondary">+10.8%</div>
              </div>
              <div className="p-5 rounded-xl border border-accent-success/30 bg-accent-success/10">
                <div className="text-sm text-text-secondary mb-1">Projected Profit Lift</div>
                <div className="text-3xl font-bold text-accent-success">+17.1%</div>
              </div>
              <div className="p-5 rounded-xl border border-border bg-surface">
                <div className="text-sm text-text-secondary mb-1">Volume Impact</div>
                <div className="text-3xl font-bold">-4.7%</div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3340" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    tickFormatter={(val) => {
                      // Only format revenue and profit, not demand
                      if (val > 10000) return `${currency.symbol}${(val * currency.rate / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--border-color)', opacity: 0.4 }} 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} 
                    formatter={(value: number, name: string, props: any) => {
                      if (props.payload.name === 'Demand') return [value.toLocaleString(), name];
                      return [formatPrice(value, false), name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Current Strategy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="simulated" name="Simulated Optimal" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-border rounded-xl">
            <Beaker size={48} className="mb-4 opacity-20" />
            <p>Configure parameters and run a simulation to see the impact analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
