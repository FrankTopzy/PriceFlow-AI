import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import type { DashboardKPIs, RevenueDataPoint, CategoryDataPoint } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice, currency } = useCurrency();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fallback data if API is not running
        setKpis({
          revenue: { label: 'Total Revenue', value: 124500, change: 12.5 },
          profit: { label: 'Net Profit', value: 42300, change: 8.2 },
          margin: { label: 'Avg Margin', value: '34.2%', change: -1.1 },
          active_optimizations: { label: 'Active Models', value: '24', change: 4.0 }
        });

        const revData = Array.from({ length: 30 }).map((_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          revenue: 4000 + Math.random() * 2000,
          profit: 1500 + Math.random() * 800
        }));
        setRevenueData(revData);

        setCategoryData([
          { category: 'Electronics', revenue: 45000 },
          { category: 'Apparel', revenue: 32000 },
          { category: 'Home', revenue: 28000 },
          { category: 'Beauty', revenue: 19500 },
        ]);
        
        // try {
        //   const [k, r, c] = await Promise.all([
        //     api.getKPIs(),
        //     api.getRevenueChart(),
        //     api.getCategories()
        //   ]);
        //   setKpis(k); setRevenueData(r); setCategoryData(c);
        // } catch (e) {
        //   console.warn("Using fallback data, API might be down:", e);
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4">Loading dashboard...</div>;

  const kpiCards = [
    { icon: DollarSign, data: kpis?.revenue, color: 'text-primary', bg: 'bg-primary/20' },
    { icon: TrendingUp, data: kpis?.profit, color: 'text-accent-success', bg: 'bg-accent-success/20' },
    { icon: Activity, data: kpis?.margin, color: 'text-secondary', bg: 'bg-secondary/20' },
    { icon: AlertTriangle, data: kpis?.active_optimizations, color: 'text-accent-warning', bg: 'bg-accent-warning/20' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          const isPositive = (card.data?.change ?? 0) >= 0;
          return (
            <div key={i} className="glass-card p-6 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{card.data?.label}</p>
                <h3 className="text-2xl font-bold">
                  {typeof card.data?.value === 'number' ? formatPrice(card.data.value, false) : card.data?.value}
                </h3>
                <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${isPositive ? 'text-accent-success' : 'text-accent-danger'}`}>
                  {isPositive ? '+' : ''}{card.data?.change}%
                  <span className="text-text-secondary ml-1 font-normal">vs last month</span>
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
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Revenue & Profit Overview</h3>
            <select className="bg-background border border-border rounded-lg px-3 py-1 text-sm text-text-secondary focus:outline-none focus:border-primary">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${currency.symbol}${(val * currency.rate / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: number) => [formatPrice(value), undefined]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-6">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  stroke="none"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-text-secondary">{cat.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
