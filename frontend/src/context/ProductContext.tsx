import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CatalogProduct, OptimizationResult } from '../types';
import { api } from '../api/client';

interface ProductContextType {
  products: CatalogProduct[];
  optimizations: Record<string, OptimizationResult>;
  loading: boolean;
  usingFallback: boolean;
  refreshProducts: () => Promise<void>;
  updateProductPrice: (productId: string, newPrice: number) => void;
  setProductOptimization: (productId: string, result: OptimizationResult) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [optimizations, setOptimizations] = useState<Record<string, OptimizationResult>>({});
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
      setUsingFallback(false);
    } catch (e) {
      console.warn('ProductContext: API offline, using existing or empty state');
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, current_price: newPrice } : p))
    );
  };

  const setProductOptimization = (productId: string, result: OptimizationResult) => {
    setOptimizations((prev) => ({
      ...prev,
      [productId]: result,
    }));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        optimizations,
        loading,
        usingFallback,
        refreshProducts,
        updateProductPrice,
        setProductOptimization,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
