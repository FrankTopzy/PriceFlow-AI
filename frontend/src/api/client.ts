import type { 
  ProductWithHistory, 
  OptimizationResult, 
  KPIResponse,
  RevenueChartResponse,
  CategoryDataPoint, 
  BatchOptimizationResponse,
  CatalogProduct,
  ModelMetrics, 
  FeatureImportance,
  TransactionHistory,
  PriceLogEntry,
  OptimizerConfig,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api';

class ApiClient {
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  async getKPIs(): Promise<KPIResponse> {
    return this.fetch<KPIResponse>('/dashboard/kpis');
  }

  async getRevenueChart(): Promise<RevenueChartResponse> {
    return this.fetch<RevenueChartResponse>('/dashboard/revenue-chart');
  }

  async getCategories(): Promise<CategoryDataPoint[]> {
    return this.fetch<CategoryDataPoint[]>('/dashboard/categories');
  }

  // ── Products ─────────────────────────────────────────────────────────────
  async getProducts(): Promise<CatalogProduct[]> {
    return this.fetch<CatalogProduct[]>('/products');
  }

  async getProduct(id: string): Promise<ProductWithHistory> {
    return this.fetch<ProductWithHistory>(`/products/${id}`);
  }

  async getProductHistory(id: string): Promise<TransactionHistory[]> {
    return this.fetch<TransactionHistory[]>(`/products/${id}/history`);
  }

  // ── Optimization ─────────────────────────────────────────────────────────
  async optimizeBatch(): Promise<BatchOptimizationResponse> {
    return this.fetch<BatchOptimizationResponse>('/optimize', { method: 'POST' });
  }

  async optimizeSingle(id: string): Promise<OptimizationResult> {
    return this.fetch<OptimizationResult>(`/optimize/${id}`, { method: 'POST' });
  }

  // ── Simulation ───────────────────────────────────────────────────────────
  /**
   * Run a what-if scenario. Matches the backend SimulationRequest schema.
   * All optional fields default server-side.
   */
  async simulate(req: {
    product_id: string;
    competitor_price?: number | null;
    stock_level?: string | null;
    is_weekend?: boolean;
    holiday_boost?: number;
    month?: number;
    demand_lag_7d?: number;
  }): Promise<OptimizationResult> {
    return this.fetch<OptimizationResult>('/simulate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // ── Price Management ──────────────────────────────────────────────────────
  async applyPrice(productId: string, newPrice: number, reason?: string): Promise<{ applied: boolean; message: string }> {
    return this.fetch('/price/apply', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, new_price: newPrice, reason: reason ?? 'Manual override' }),
    });
  }

  async getPriceLog(): Promise<PriceLogEntry[]> {
    return this.fetch<PriceLogEntry[]>('/price/log');
  }

  // ── Config ────────────────────────────────────────────────────────────────
  async getConfig(): Promise<OptimizerConfig> {
    return this.fetch<OptimizerConfig>('/config');
  }

  async updateConfig(updates: Partial<OptimizerConfig>): Promise<{ status: string; config: OptimizerConfig }> {
    return this.fetch('/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ── ML Models ─────────────────────────────────────────────────────────────
  async getModelMetrics(): Promise<ModelMetrics[]> {
    return this.fetch<ModelMetrics[]>('/models/metrics');
  }

  async getFeatureImportance(productId: string): Promise<FeatureImportance[]> {
    return this.fetch<FeatureImportance[]>(`/models/${productId}/importance`);
  }

  async getDemandCurve(productId: string): Promise<{ price: number; demand: number; revenue: number }[]> {
    return this.fetch(`/models/${productId}/demand-curve`);
  }
}

export const api = new ApiClient();
