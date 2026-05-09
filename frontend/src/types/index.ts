export interface Product {
  product_id: string;
  name: string;
  category: string;
  base_price: number;
  current_price: number;
  min_price: number;
  max_price: number;
  competitor_price: number | null;
  stock_level: number;
  cost: number;
}

export interface TransactionHistory {
  date: string;
  price: number;
  demand: number;
  revenue: number;
  profit: number;
  competitor_price: number | null;
}

export interface ProductWithHistory extends Product {
  history: TransactionHistory[];
}

export interface OptimizationResult {
  product_id: string;
  recommended_price: number;
  expected_demand: number;
  expected_revenue: number;
  expected_profit: number;
  margin: number;
  confidence: number;
  explanation: string;
}

export interface SimulationRequest {
  scenario_name: string;
  price_changes: Record<string, number>;
}

export interface SimulationResult {
  total_revenue_change: number;
  total_profit_change: number;
  product_impacts: Record<string, {
    old_demand: number;
    new_demand: number;
    old_revenue: number;
    new_revenue: number;
  }>;
}

export interface KPI {
  label: string;
  value: number | string;
  change: number; // percentage change
}

export interface KPIResponse {
  total_optimized_revenue: number;
  revenue_lift: number;
  active_products: number;
  avg_margin: number;
  price_increases: number;
  price_decreases: number;
  unchanged: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
}

export interface RevenueChartResponse {
  actual: RevenueChartPoint[];
  optimized: RevenueChartPoint[];
}

export interface CategoryDataPoint {
  name: string;
  revenue: number;
  color?: string;
}

export interface ModelMetrics {
  r2: number;
  mae: number;
  mape: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}
