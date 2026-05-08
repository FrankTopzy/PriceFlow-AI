import { useState } from 'react';
import { ShieldAlert, ShieldCheck, Settings, History, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function Safety() {
  const auditLogs = [
    { id: 'log_1', date: '2026-05-07 14:30', product: 'Wireless Headphones', old: 189.99, new: 195.50, reason: 'Demand surge detected', status: 'Applied' },
    { id: 'log_2', date: '2026-05-07 10:15', product: 'Smart Watch Series 5', old: 299.00, new: 285.00, reason: 'Competitor price drop', status: 'Applied' },
    { id: 'log_3', date: '2026-05-06 22:45', product: 'Bluetooth Speaker', old: 59.99, new: 65.00, reason: 'Low stock threshold', status: 'Blocked by Max Change Rail' },
    { id: 'log_4', date: '2026-05-06 09:00', product: 'Noise Cancelling Earbuds', old: 149.99, new: 152.00, reason: 'Routine optimization', status: 'Applied' },
  ];

  const [maxInc, setMaxInc] = useState(10);
  const [maxDec, setMaxDec] = useState(15);
  const [minMargin, setMinMargin] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { formatPrice } = useCurrency();

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      // Simulate API call to backend /api/config
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-danger/20 text-accent-danger rounded-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Safety Rails & Governance</h2>
            <p className="text-text-secondary text-sm">Control the autonomous boundaries of the pricing engine.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 border border-border rounded-lg flex items-center gap-2 transition-colors ${
            saved ? 'bg-accent-success/20 text-accent-success border-accent-success/50' : 'bg-surface hover:bg-surface/80'
          }`}
        >
          {isSaving ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
          ) : saved ? (
            <Check size={18} />
          ) : (
            <Settings size={18} />
          )}
          {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent-success" /> Global Constraints
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-sm text-text-secondary block mb-2">Max Price Increase (per 24h)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  className="flex-1 accent-primary" 
                  min="1" max="25" 
                  value={maxInc} 
                  onChange={(e) => setMaxInc(Number(e.target.value))} 
                />
                <span className="w-12 text-right font-medium">{maxInc}%</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Max Price Decrease (per 24h)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  className="flex-1 accent-primary" 
                  min="1" max="25" 
                  value={maxDec} 
                  onChange={(e) => setMaxDec(Number(e.target.value))} 
                />
                <span className="w-12 text-right font-medium">{maxDec}%</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Minimum Margin Protection</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  className="flex-1 accent-primary" 
                  min="5" max="50" 
                  value={minMargin} 
                  onChange={(e) => setMinMargin(Number(e.target.value))} 
                />
                <span className="w-12 text-right font-medium">{minMargin}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-card rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <History size={18} className="text-primary" />
            <h3 className="font-semibold">Price Change Audit Log</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-[1000px] text-left text-sm">
              <thead className="text-text-secondary bg-surface/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Price Change</th>
                  <th className="px-6 py-4 font-medium">Trigger Reason</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">{log.date}</td>
                    <td className="px-6 py-4 font-medium">{log.product}</td>
                    <td className="px-6 py-4">
                      <span className="line-through text-text-secondary mr-2">{formatPrice(log.old)}</span>
                      <span className={log.new > log.old ? 'text-accent-success' : 'text-accent-danger'}>
                        {formatPrice(log.new)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{log.reason}</td>
                    <td className="px-2 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                        log.status === 'Applied' 
                          ? 'bg-accent-success/10 text-accent-success border border-accent-success/20' 
                          : 'bg-accent-danger/10 text-accent-danger border border-accent-danger/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
