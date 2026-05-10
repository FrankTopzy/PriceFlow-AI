"""
PriceFlow AI — Pydantic Schemas
Request/response models for the FastAPI endpoints.
"""

from pydantic import BaseModel
from typing import Optional


class ProductOut(BaseModel):
    id: str
    name: str
    category: str
    cost: float
    base_price: float
    msrp: float
    elasticity: float
    brand: str
    current_price: float
    current_stock: int


class HistoryRecord(BaseModel):
    date: str
    price: float
    demand: int
    revenue: float
    profit: float
    competitor_price: float
    stock: int
    is_weekend: int
    holiday_boost: float


class ModelMetrics(BaseModel):
    model_name: str
    r2: float
    mae: float
    mape: float
    n_features: int


class FeatureImportance(BaseModel):
    name: str
    value: float


class OptimizationResult(BaseModel):
    product_id: str
    current_price: float
    suggested_price: float
    floor: float
    ceiling: float
    change_percent: float
    predicted_demand: int
    expected_revenue: float
    expected_profit: float
    revenue_impact: float
    profit_impact: float
    margin: float
    objective: str
    rate_limited: bool
    is_locked: bool
    can_apply: bool
    rollout_mode: str


class BatchOptimizationSummary(BaseModel):
    total_products: int
    total_current_revenue: float
    total_optimized_revenue: float
    total_revenue_impact: float
    revenue_lift: float
    avg_change_percent: float
    price_increases: int
    price_decreases: int
    unchanged: int


class BatchOptimizationResponse(BaseModel):
    results: list[OptimizationResult]
    summary: BatchOptimizationSummary


class SimulationRequest(BaseModel):
    product_id: str
    competitor_price: Optional[float] = None
    stock_level: Optional[str] = "medium"
    is_weekend: Optional[bool] = False
    holiday_boost: Optional[float] = 0.0
    month: Optional[int] = None
    demand_lag_7d: Optional[float] = 30.0


class ConfigUpdate(BaseModel):
    objective: Optional[str] = None
    min_margin: Optional[float] = None
    max_change_percent: Optional[float] = None
    rollout_mode: Optional[str] = None
    rate_limit: Optional[int] = None


class PriceApplyRequest(BaseModel):
    product_id: str
    new_price: float
    reason: Optional[str] = "Optimizer recommendation"


class SalesPredictRequest(BaseModel):
    item_weight: float
    item_fat_content: str
    item_visibility: float
    item_type: str
    item_mrp: float
    outlet_establishment_year: int
    outlet_size: str
    outlet_location_type: str
    outlet_type: str


class SalesPredictResponse(BaseModel):
    predicted_sales: float
    confidence_score: float
    advice: str


class DemandCurvePoint(BaseModel):
    price: float
    demand: int
    revenue: float
    profit: float


class KPIResponse(BaseModel):
    total_optimized_revenue: float
    revenue_lift: float
    active_products: int
    avg_margin: float
    price_increases: int
    price_decreases: int
    unchanged: int
