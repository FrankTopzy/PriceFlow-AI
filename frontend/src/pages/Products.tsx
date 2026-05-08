import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import type { Product, ProductWithHistory } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithHistory | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{ price: number; margin: number } | null>(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fallback mock data in case backend isn't ready
        const mockProducts: Product[] = Array.from({ length: 12 }).map((_, i) => ({
          product_id: `prod_${i}`,
          name: `Wireless Headphones Model ${i}`,
          category: 'Electronics',
          base_price: 199.99,
          current_price: 189.99 + (i * 5),
          min_price: 150,
          max_price: 250,
          competitor_price: 195.00,
          stock_level: 150 - (i * 10),
          cost: 80,
        }));
        setProducts(mockProducts);

        // Uncomment when backend is fully online
        // const data = await api.getProducts();
        // setProducts(data);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = async (id: string) => {
    setDetailLoading(true);
    try {
      // Mock detail fetch
      const prod = products.find(p => p.product_id === id)!;
      const history = Array.from({ length: 14 }).map((_, i) => ({
        date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
        price: prod.current_price * (1 + (Math.random() * 0.05 - 0.025)),
        demand: Math.floor(40 + Math.random() * 20),
        revenue: 0,
        profit: 0,
        competitor_price: prod.competitor_price,
      })).map(h => ({ ...h, revenue: h.price * h.demand, profit: (h.price - prod.cost) * h.demand }));
      
      setSelectedProduct({ ...prod, history });

      // Uncomment when backend is fully online
      // const data = await api.getProduct(id);
      // setSelectedProduct(data);
      setOptimizationResult(null); // Reset optimization result on new product click
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOptimizeClick = async () => {
    setIsOptimizing(true);
    try {
      // Uncomment to use real backend API
      // const result = await api.optimizeSingle(selectedProduct!.product_id);
      // setOptimizationResult({ price: result.recommended_price, margin: result.margin });

      // Mock delay and result
      await new Promise(resolve => setTimeout(resolve, 1200));
      setOptimizationResult({
        price: selectedProduct!.current_price * (1 + (Math.random() * 0.15 - 0.05)),
        margin: 35 + Math.random() * 10
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (loading) return <div className="animate-pulse">Loading products...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Main Grid */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${selectedProduct ? 'hidden lg:block lg:w-2/3 lg:pr-4' : 'w-full'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold">Product Catalog</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:border-primary outline-none">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Apparel</option>
            </select>
            <input 
              type="text" 
              placeholder="Search products..." 
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:border-primary outline-none w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          {products.map(p => (
            <ProductCard key={p.product_id} product={p} onClick={handleProductClick} />
          ))}
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      {selectedProduct && (
        <div className="w-full lg:w-1/3 glass-panel border border-border rounded-xl flex flex-col animate-fade-in absolute lg:static right-0 top-0 bottom-0 z-20">
          {detailLoading ? (
            <div className="p-6 flex-1 flex items-center justify-center">Loading details...</div>
          ) : (
            <>
              <div className="p-6 border-b border-border flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">{selectedProduct.name}</h3>
                  <span className="text-sm text-text-secondary">{selectedProduct.category} | ID: {selectedProduct.product_id}</span>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-xs text-text-secondary mb-1">Current Price</div>
                    <div className="text-xl font-bold">{formatPrice(selectedProduct.current_price)}</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-xs text-text-secondary mb-1">Competitor Price</div>
                    <div className="text-xl font-bold">{selectedProduct.competitor_price ? formatPrice(selectedProduct.competitor_price) : 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-xs text-text-secondary mb-1">Stock Level</div>
                    <div className="text-xl font-bold">{selectedProduct.stock_level} units</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-xs text-text-secondary mb-1">Unit Cost</div>
                    <div className="text-xl font-bold">{formatPrice(selectedProduct.cost)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-text-secondary">14-Day Demand History</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedProduct.history}>
                        <defs>
                          <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                        />
                        <Area type="monotone" dataKey="demand" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorDemand)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {optimizationResult && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg animate-fade-in flex justify-between items-center">
                    <div>
                      <div className="text-xs text-primary/80 mb-1">Recommended Optimal Price</div>
                      <div className="text-2xl font-bold text-primary">{formatPrice(optimizationResult.price)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-primary/80 mb-1">Expected Margin</div>
                      <div className="text-lg font-semibold text-primary">{optimizationResult.margin.toFixed(1)}%</div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleOptimizeClick}
                  disabled={isOptimizing}
                  className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isOptimizing ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Optimizing...</>
                  ) : (
                    "Run Optimization Model"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
