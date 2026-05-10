// ─── Products ─────────────────────────────────────────────────────────────────

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
  image?: string;
}

export interface TransactionHistory {
  date: string;
  price: number;
  demand: number;
  revenue: number;
  profit: number;
  competitor_price: number | null;
  stock?: number;
  is_weekend?: number;
  holiday_boost?: number;
}

export interface ProductWithHistory extends Product {
  history: TransactionHistory[];
}

/** Row from GET /api/products (backend ProductOut) */
export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  cost: number;
  base_price: number;
  msrp: number;
  elasticity: number;
  brand: string;
  current_price: number;
  current_stock: number;
  image?: string;
}

// ─── Optimization ─────────────────────────────────────────────────────────────

/** Single-product optimization result from POST /api/optimize or /api/optimize/{id} */
export interface OptimizationResult {
  product_id: string;
  current_price: number;
  suggested_price: number;
  floor: number;
  ceiling: number;
  change_percent: number;
  predicted_demand: number;
  expected_revenue: number;
  expected_profit: number;
  revenue_impact: number;
  profit_impact: number;
  margin: number;
  objective: string;
  rate_limited: boolean;
  is_locked: boolean;
  can_apply: boolean;
  rollout_mode: string;
}

export interface BatchOptimizationSummary {
  total_products: number;
  total_current_revenue: number;
  total_optimized_revenue: number;
  total_revenue_impact: number;
  revenue_lift: number;
  avg_change_percent: number;
  price_increases: number;
  price_decreases: number;
  unchanged: number;
}

export interface BatchOptimizationResponse {
  results: OptimizationResult[];
  summary: BatchOptimizationSummary;
}

// ─── Simulation ───────────────────────────────────────────────────────────────

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

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

// ─── ML Models ────────────────────────────────────────────────────────────────

export interface ModelMetrics {
  model_name: string;
  r2: number;
  mae: number;
  mape: number;
  n_features: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

// ─── Price & Config ───────────────────────────────────────────────────────────

export interface PriceLogEntry {
  timestamp: string;
  product_id: string;
  product_name: string;
  old_price: number;
  new_price: number;
  reason: string;
  applied: boolean;
  rollout_mode: string;
}

export interface OptimizerConfig {
  objective: string;
  rollout_mode: string;
  min_margin_pct: number;
  max_increase_pct: number;
  max_decrease_pct: number;
  rate_limit_hours: number;
}
