import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import type { CatalogProduct, OptimizationResult, TransactionHistory } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { X, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';

// ── Fallback mock products ────────────────────────────────────────────────────
const MOCK_PRODUCTS: CatalogProduct[] = Array.from({ length: 12 }).map((_, i) => {
  const categories = ['Electronics', 'Fashion', 'Home & Living', 'Food & Beverage'];
  const names = [
    'Wireless Headphones Pro', 'Smart Watch Ultra', 'Bluetooth Speaker', 'Noise-Cancel Earbuds',
    'Running Shoes Elite', 'Denim Jacket Classic', 'Yoga Mat Premium', 'Protein Powder XL',
    'Coffee Maker Deluxe', 'LED Desk Lamp', 'Mechanical Keyboard', 'Gaming Mouse RGB',
  ];
  return {
    id: `mock_${i}`,
    name: names[i % names.length],
    category: categories[i % categories.length],
    cost: 60 + i * 5,
    base_price: 150 + i * 12,
    msrp: 200 + i * 15,
    elasticity: -1.5 - (i % 3) * 0.3,
    brand: 'Demo Brand',
    current_price: 140 + i * 10,
    current_stock: Math.max(15, 200 - i * 12),
  };
});

// ── Generate mock history from product ───────────────────────────────────────
function mockHistory(p: CatalogProduct, days = 14): TransactionHistory[] {
  return Array.from({ length: days }).map((_, i) => {
    const price = p.current_price * (1 + (Math.sin(i) * 0.03));
    const demand = Math.floor(35 + Math.sin(i * 0.8) * 15 + Math.random() * 10);
    return {
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split('T')[0],
      price,
      demand,
      revenue: price * demand,
      profit: (price - p.cost) * demand,
      competitor_price: null,
    };
  });
}

export default function Products() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  const { formatPrice } = useCurrency();

  // Load products
  useEffect(() => {
    api.getProducts()
      .then((data) => { setProducts(data); setUsingFallback(false); })
      .catch(() => { setProducts(MOCK_PRODUCTS); setUsingFallback(true); })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))].sort();
    return ['All', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'All' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  const handleProductClick = async (id: string) => {
    const prod = products.find((p) => p.id === id)!;
    setSelectedProduct(prod);
    setOptimizationResult(null);
    setDetailLoading(true);
    try {
      const hist = await api.getProductHistory(id);
      setHistory(hist);
    } catch {
      setHistory(mockHistory(prod));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedProduct) return;
    setIsOptimizing(true);
    setOptimizationResult(null);
    try {
      const result = await api.optimizeSingle(selectedProduct.id);
      setOptimizationResult(result);
    } catch {
      // fallback mock
      const basePrice = selectedProduct.current_price;
      setOptimizationResult({
        product_id: selectedProduct.id,
        current_price: basePrice,
        suggested_price: Math.round(basePrice * 1.07 * 100) / 100,
        floor: Math.round(basePrice * 0.80 * 100) / 100,
        ceiling: selectedProduct.msrp,
        change_percent: 7.0,
        predicted_demand: 48,
        expected_revenue: Math.round(basePrice * 1.07 * 48),
        expected_profit: Math.round((basePrice * 1.07 - selectedProduct.cost) * 48),
        revenue_impact: Math.round(basePrice * 1.07 * 48 - basePrice * 44),
        profit_impact: Math.round((basePrice * 1.07 - selectedProduct.cost) * 48 - (basePrice - selectedProduct.cost) * 44),
        margin: Math.round(((basePrice * 1.07 - selectedProduct.cost) / (basePrice * 1.07)) * 10000) / 100,
        objective: 'revenue',
        rate_limited: false,
        is_locked: false,
        can_apply: true,
        rollout_mode: 'shadow',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyPrice = async () => {
    if (!selectedProduct || !optimizationResult) return;
    try {
      await api.applyPrice(selectedProduct.id, optimizationResult.suggested_price, 'Applied from Products page');
      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, current_price: optimizationResult.suggested_price } : p
        )
      );
      setSelectedProduct((prev) => prev ? { ...prev, current_price: optimizationResult.suggested_price } : prev);
      setOptimizationResult(null);
    } catch (e) {
      console.error('Apply price failed', e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Main Grid */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${selectedProduct ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Product Catalog</h2>
            {usingFallback && (
              <p className="text-xs text-accent-warning mt-0.5">Demo data — API offline</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:border-primary outline-none w-full sm:w-52"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:border-primary outline-none"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
              <Search size={40} className="opacity-20 mb-3" />
              <p>No products match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onClick={handleProductClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      {selectedProduct && (
        <div className="w-full lg:w-[380px] shrink-0 glass-panel border border-border rounded-xl flex flex-col animate-fade-in overflow-hidden absolute lg:static inset-0 z-20 lg:z-auto">
          {/* Header */}
          <div className="p-5 border-b border-border flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{selectedProduct.name}</h3>
              <span className="text-xs text-text-secondary">{selectedProduct.category} · {selectedProduct.id}</span>
            </div>
            <button
              onClick={() => { setSelectedProduct(null); setOptimizationResult(null); }}
              className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Current Price', value: formatPrice(selectedProduct.current_price) },
                { label: 'MSRP', value: formatPrice(selectedProduct.msrp) },
                { label: 'Unit Cost', value: formatPrice(selectedProduct.cost) },
                { label: 'In Stock', value: `${selectedProduct.current_stock.toLocaleString()} units` },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-surface rounded-lg border border-border">
                  <div className="text-xs text-text-secondary mb-1">{label}</div>
                  <div className="font-bold text-text-primary">{value}</div>
                </div>
              ))}
            </div>

            {/* Demand history chart */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                {detailLoading ? 'Loading history…' : '14-Day Demand'}
              </h4>
              {detailLoading ? (
                <div className="skeleton h-40 rounded-lg" />
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.slice(-14)}>
                      <defs>
                        <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(v: number, name: string) => [name === 'revenue' ? formatPrice(v) : v.toLocaleString(), name]}
                      />
                      <Area type="monotone" dataKey="demand" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#demandGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Revenue history */}
            {!detailLoading && history.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Daily Revenue</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history.slice(-14)} barSize={8}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(v: number) => [formatPrice(v), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Optimization result */}
            {optimizationResult && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl animate-fade-in space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Optimization Result</span>
                  <span className="text-xs text-accent-success bg-accent-success/10 px-2 py-0.5 rounded-full">
                    {optimizationResult.rollout_mode}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-text-secondary text-xs mb-0.5">Suggested Price</div>
                    <div className="font-bold text-2xl text-primary">{formatPrice(optimizationResult.suggested_price)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-0.5">Change</div>
                    <div className={`font-bold text-lg ${optimizationResult.change_percent >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {optimizationResult.change_percent >= 0 ? '+' : ''}{optimizationResult.change_percent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-0.5">Expected Revenue</div>
                    <div className="font-semibold text-text-primary">{formatPrice(optimizationResult.expected_revenue)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-0.5">Margin</div>
                    <div className="font-semibold text-text-primary">{optimizationResult.margin.toFixed(1)}%</div>
                  </div>
                </div>
                {optimizationResult.can_apply && (
                  <button
                    onClick={handleApplyPrice}
                    className="w-full py-2 bg-accent-success hover:bg-accent-success/90 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Apply Price Change
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Optimize button */}
          <div className="p-5 border-t border-border">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isOptimizing ? (
                <><RefreshCw size={16} className="animate-spin" /> Optimizing…</>
              ) : (
                'Run Optimization Model'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
