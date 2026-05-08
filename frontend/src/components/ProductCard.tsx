import { Package, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface ProductCardProps {
  product: Product;
  onClick: (id: string) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  // Mock some optimal data for display if we haven't optimized yet
  const optimalPrice = product.current_price * (1 + (Math.random() * 0.1 - 0.03));
  const difference = ((optimalPrice - product.current_price) / product.current_price) * 100;
  
  const isPositive = difference > 0;
  const isWarning = product.stock_level < 50;

  return (
    <div 
      className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/50 group"
      onClick={() => onClick(product.product_id)}
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-surface border border-border group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-[15px] truncate" title={product.name}>{product.name}</h4>
            <span className="text-xs text-text-secondary truncate block" title={product.category}>{product.category}</span>
          </div>
        </div>
        {isWarning && (
          <div className="text-accent-warning shrink-0" title="Low Stock">
            <AlertTriangle size={16} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-surface/50 border border-border min-w-0">
          <div className="text-xs text-text-secondary mb-1 truncate">Current Price</div>
          <div className="font-bold text-lg truncate" title={formatPrice(product.current_price)}>{formatPrice(product.current_price)}</div>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 min-w-0">
          <div className="text-xs text-primary/80 mb-1 truncate">Optimal Price</div>
          <div className="font-bold text-lg text-primary truncate" title={formatPrice(optimalPrice)}>{formatPrice(optimalPrice)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className={isPositive ? 'text-accent-success' : 'text-accent-danger'} />
          <span className={`text-xs font-medium ${isPositive ? 'text-accent-success' : 'text-accent-danger'}`}>
            {isPositive ? '+' : ''}{difference.toFixed(1)}% margin impact
          </span>
        </div>
        <ArrowRight size={16} className="text-text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
}
