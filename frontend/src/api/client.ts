import type { 
  Product, 
  ProductWithHistory, 
  OptimizationResult, 
  SimulationRequest, 
  SimulationResult, 
  DashboardKPIs, 
  RevenueDataPoint, 
  CategoryDataPoint, 
  ModelMetrics, 
  FeatureImportance,
  TransactionHistory
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

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

  // Dashboard APIs
  async getKPIs(): Promise<DashboardKPIs> {
    return this.fetch<DashboardKPIs>('/dashboard/kpis');
  }

  async getRevenueChart(): Promise<RevenueDataPoint[]> {
    return this.fetch<RevenueDataPoint[]>('/dashboard/revenue-chart');
  }

  async getCategories(): Promise<CategoryDataPoint[]> {
    return this.fetch<CategoryDataPoint[]>('/dashboard/categories');
  }

  // Product APIs
  async getProducts(): Promise<Product[]> {
    return this.fetch<Product[]>('/products');
  }

  async getProduct(id: string): Promise<ProductWithHistory> {
    return this.fetch<ProductWithHistory>(`/products/${id}`);
  }

  async getProductHistory(id: string): Promise<TransactionHistory[]> {
    return this.fetch<TransactionHistory[]>(`/products/${id}/history`);
  }

  // Optimization & Simulation
  async optimizeBatch(): Promise<OptimizationResult[]> {
    return this.fetch<OptimizationResult[]>('/optimize', { method: 'POST' });
  }

  async optimizeSingle(id: string): Promise<OptimizationResult> {
    return this.fetch<OptimizationResult>(`/optimize/${id}`, { method: 'POST' });
  }

  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    return this.fetch<SimulationResult>('/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async applyPrice(productId: string, newPrice: number): Promise<void> {
    return this.fetch<void>('/price/apply', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, new_price: newPrice }),
    });
  }

  // ML Models APIs
  async getModelMetrics(): Promise<ModelMetrics> {
    return this.fetch<ModelMetrics>('/models/metrics');
  }

  async getFeatureImportance(productId: string): Promise<FeatureImportance[]> {
    return this.fetch<FeatureImportance[]>(`/models/${productId}/importance`);
  }
}

export const api = new ApiClient();
