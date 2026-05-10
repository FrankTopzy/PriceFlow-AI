import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import type { CatalogProduct, Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';

type CardProduct = Product | CatalogProduct;

function productKey(p: CardProduct): string {
  if ('product_id' in p && p.product_id) return p.product_id;
  if ('id' in p && (p as CatalogProduct).id) return (p as CatalogProduct).id;
  return '';
}

function stockUnits(p: CardProduct): number {
  if ('stock_level' in p && typeof p.stock_level === 'number') return p.stock_level;
  if ('current_stock' in p && typeof (p as CatalogProduct).current_stock === 'number')
    return (p as CatalogProduct).current_stock;
  return 0;
}

/** Deterministic "optimal price" derived from the product ID string (no Math.random). */
function deriveOptimalPrice(p: CardProduct): number {
  const key = productKey(p);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  // Normalise hash to [-0.08, +0.12] offset from current price
  const factor = -0.08 + ((hash % 1000) / 1000) * 0.20;
  return Math.round(p.current_price * (1 + factor) * 100) / 100;
}

interface ProductCardProps {
  product: CardProduct;
  onClick: (id: string) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const optimalPrice = deriveOptimalPrice(product);
  const difference = ((optimalPrice - product.current_price) / product.current_price) * 100;
  const isPositive = difference > 0;
  const stock = stockUnits(product);
  const isWarning = stock < 50;

  return (
    <div
      className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/50 group"
      onClick={() => onClick(productKey(product))}
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-surface border border-border group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-[15px] truncate text-text-primary" title={product.name}>
              {product.name}
            </h4>
            <span className="text-xs text-text-secondary truncate block" title={product.category}>
              {product.category}
            </span>
          </div>
        </div>
        {isWarning && (
          <div className="text-accent-warning shrink-0" title="Low Stock">
            <AlertTriangle size={16} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-surface/50 border border-border min-w-0">
          <div className="text-xs text-text-secondary mb-1">Current</div>
          <div className="font-bold truncate" title={formatPrice(product.current_price)}>
            {formatPrice(product.current_price)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 min-w-0">
          <div className="text-xs text-primary/80 mb-1">Optimal</div>
          <div className="font-bold text-primary truncate" title={formatPrice(optimalPrice)}>
            {formatPrice(optimalPrice)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          {isPositive
            ? <TrendingUp size={13} className="text-accent-success" />
            : <TrendingDown size={13} className="text-accent-danger" />
          }
          <span className={`text-xs font-medium ${isPositive ? 'text-accent-success' : 'text-accent-danger'}`}>
            {isPositive ? '+' : ''}{difference.toFixed(1)}% opportunity
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <span>{stock.toLocaleString()} in stock</span>
          <ArrowRight size={14} className="text-text-secondary group-hover:text-primary transition-colors group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
