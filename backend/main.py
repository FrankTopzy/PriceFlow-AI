"""
PriceFlow AI — FastAPI Application
REST API serving dynamic pricing predictions and optimization.

Tools & Technologies:
  - Python 3.13
  - FastAPI (web framework)
  - Pandas & NumPy (data processing)
  - Scikit-learn (Ridge Regression)
  - XGBoost (Gradient Boosted model)
"""

import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data.generator import generate_and_save_datasets, PRODUCTS, CATEGORIES
from models.trainer import ModelTrainer
from optimizer.engine import PriceOptimizer
from schemas import (
    ProductOut, HistoryRecord, ModelMetrics, FeatureImportance,
    OptimizationResult, BatchOptimizationResponse, BatchOptimizationSummary,
    SimulationRequest, ConfigUpdate, PriceApplyRequest,
    DemandCurvePoint, KPIResponse,
)

# ─── App Init ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PriceFlow AI — Dynamic Pricing API",
    description="ML-driven dynamic pricing system using Ridge Regression and XGBoost",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global State ────────────────────────────────────────────────────────────

trainer = ModelTrainer()
optimizer = None
products_list = []
products_df = None
history_df = None
features_df = None
data_error = None


def validate_dataframes(products: pd.DataFrame, history: pd.DataFrame):
    """Validate that the datasets are related to pricing and match the expected schema."""
    required_product_cols = {'id', 'base_price', 'cost'}
    required_history_cols = {'product_id', 'price', 'demand', 'date'}
    
    # 1. Schema Check
    if not required_product_cols.issubset(products.columns):
        missing = required_product_cols - set(products.columns)
        raise ValueError(f"Invalid Product Dataset: Missing columns {missing}")
        
    if not required_history_cols.issubset(history.columns):
        missing = required_history_cols - set(history.columns)
        raise ValueError(f"Invalid Transaction Dataset: Missing columns {missing}")

    # 2. Relationship Check
    product_ids = set(products['id'].unique())
    history_ids = set(history['product_id'].unique())
    
    if not history_ids.issubset(product_ids):
        unlinked = history_ids - product_ids
        raise ValueError(f"Unrelated Dataset: History contains product IDs {list(unlinked)[:5]} not found in catalog")

    # 3. Data Sanity Check
    if (products['base_price'] <= 0).any():
        raise ValueError("Invalid Data: Base prices must be positive")
    
    print("[SUCCESS] Dataset validation passed")


@app.on_event("startup")
def startup():
    """Load/Generate data, train models, and initialize optimizer on startup."""
    global optimizer, products_list, products_df, history_df, features_df, data_error

    data_dir = os.path.join(os.path.dirname(__file__), "data")
    products_path = os.path.join(data_dir, "products.csv")
    history_path = os.path.join(data_dir, "transactions.csv")
    features_path = os.path.join(data_dir, "features.csv")

    try:
        # Try to load existing datasets (to support user "uploads")
        if os.path.exists(products_path) and os.path.exists(history_path):
            print("Verifying user-provided datasets...")
            products_df = pd.read_csv(products_path)
            history_df = pd.read_csv(history_path)
            
            # CRITICAL: Validate the datasets
            try:
                validate_dataframes(products_df, history_df)
                data_error = None
            except ValueError as ve:
                data_error = f"FATAL DATA ERROR: {str(ve)}"
                print(f"\n{'!'*80}\n{data_error}\n{'!'*80}\n")
                # RAISE error to stop the system as requested
                raise RuntimeError(data_error)

            if os.path.exists(features_path):
                features_df = pd.read_csv(features_path)
            else:
                from data.generator import engineer_features
                features_df = engineer_features(history_df)
        else:
            # Only generate synthetic if files are missing
            print("Missing datasets, generating defaults...")
            products_df, history_df, features_df = generate_and_save_datasets(data_dir)
            data_error = None

    except Exception as e:
        data_error = f"System Error: {str(e)}"
        print(f"[CRITICAL] {data_error}")
        return

    # Build products list
    products_list = []
    for _, row in products_df.iterrows():
        p_id = row['id']
        prod_history = history_df[history_df["product_id"] == p_id]
        latest = prod_history.sort_values("date").iloc[-1] if not prod_history.empty else {}
        
        products_list.append({
            "id": p_id,
            "name": row['name'],
            "category": row['category'],
            "cost": float(row['cost']),
            "base_price": float(row['base_price']),
            "msrp": float(row.get('msrp', row['base_price'] * 1.2)),
            "elasticity": float(row.get('elasticity', -1.5)),
            "brand": row.get('brand', 'Unknown'),
            "image": row.get('image', ''),
            "current_price": float(latest.get("price", row["base_price"])),
            "current_stock": int(latest.get("stock", 100)),
        })

    # Train models
    trainer.train_all(features_df)

    # Init optimizer
    optimizer = PriceOptimizer(trainer)
    optimizer.set_current_prices(products_list)

    print(f"PriceFlow AI ready — {len(products_list)} products loaded")


def check_data_ready():
    """Helper to ensure models are trained and data is valid before serving requests."""
    if data_error:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Dataset Integration Error",
                "message": data_error,
                "action": "Please ensure your CSV files match the PriceFlow schema and products are correctly linked."
            }
        )
    if not trainer.is_ready:
        raise HTTPException(status_code=503, detail="Models still training...")


@app.get("/")
def root():
    """Welcome message and API status."""
    if data_error:
        return {
            "status": "error",
            "message": data_error,
            "version": "1.0.0"
        }
    return {
        "status": "online",
        "message": "Welcome to PriceFlow AI API",
        "documentation": "/docs",
        "version": "1.0.0"
    }


# ─── Product Endpoints ───────────────────────────────────────────────────────

@app.get("/api/products", response_model=list[ProductOut])
def get_products():
    """List all products with current prices."""
    check_data_ready()
    return [ProductOut(**p) for p in products_list]


@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    """Get a single product with full details."""
    check_data_ready()
    product = _find_product(product_id)
    ctx = trainer.get_latest_context(product_id)
    return {**product, "latest_context": ctx}


@app.get("/api/products/{product_id}/history", response_model=list[HistoryRecord])
def get_product_history(product_id: str):
    """Get 90-day transaction history for a product."""
    check_data_ready()
    _find_product(product_id)
    prod_hist = history_df[history_df["product_id"] == product_id].sort_values("date")
    return [
        HistoryRecord(
            date=row["date"], price=row["price"], demand=int(row["demand"]),
            revenue=row["revenue"], profit=row["profit"],
            competitor_price=row["competitor_price"], stock=int(row["stock"]),
            is_weekend=int(row["is_weekend"]), holiday_boost=row["holiday_boost"],
        )
        for _, row in prod_hist.iterrows()
    ]


# ─── Model Endpoints ────────────────────────────────────────────────────────

@app.get("/api/models/metrics", response_model=list[ModelMetrics])
def get_model_metrics():
    """Get performance metrics for both trained models."""
    check_data_ready()
    return [ModelMetrics(**m) for m in trainer.get_all_metrics()]


@app.get("/api/models/{product_id}/importance", response_model=list[FeatureImportance])
def get_feature_importance(product_id: str):
    """Get XGBoost feature importance for a product."""
    check_data_ready()
    _find_product(product_id)
    return [FeatureImportance(**f) for f in trainer.get_feature_importance(product_id)]


@app.get("/api/models/{product_id}/demand-curve", response_model=list[DemandCurvePoint])
def get_demand_curve(product_id: str):
    """Generate demand curve across price range."""
    check_data_ready()
    product = _find_product(product_id)
    ctx = trainer.get_latest_context(product_id)
    curve = trainer.generate_demand_curve(product, ctx)
    return [DemandCurvePoint(**pt) for pt in curve]


@app.get("/api/models/coefficients")
def get_ridge_coefficients():
    """Get Ridge model coefficients for interpretability."""
    check_data_ready()
    return trainer.get_ridge_coefficients()


# ─── Optimization Endpoints ─────────────────────────────────────────────────

@app.post("/api/optimize", response_model=BatchOptimizationResponse)
def batch_optimize():
    """Batch optimize all products."""
    check_data_ready()
    result = optimizer.batch_optimize(products_list)
    return BatchOptimizationResponse(
        results=[OptimizationResult(**r) for r in result["results"]],
        summary=BatchOptimizationSummary(**result["summary"]),
    )


@app.post("/api/optimize/{product_id}", response_model=OptimizationResult)
def optimize_product(product_id: str):
    """Optimize a single product."""
    check_data_ready()
    product = _find_product(product_id)
    result = optimizer.optimize(product)
    return OptimizationResult(**result)


@app.post("/api/simulate", response_model=OptimizationResult)
def run_simulation(req: SimulationRequest):
    """Run a what-if simulation scenario."""
    check_data_ready()
    product = _find_product(req.product_id)
    scenario = {
        "competitor_price": req.competitor_price or product["base_price"],
        "stock_level": req.stock_level or "medium",
        "is_weekend": req.is_weekend,
        "holiday_boost": req.holiday_boost or 0,
        "month": req.month if req.month is not None else 6,
        "demand_lag_7d": req.demand_lag_7d or 30,
    }
    result = optimizer.what_if(product, scenario)
    return OptimizationResult(**result)


# ─── Dashboard Endpoints ────────────────────────────────────────────────────

@app.get("/api/dashboard/kpis", response_model=KPIResponse)
def get_dashboard_kpis():
    """Get dashboard KPI metrics."""
    check_data_ready()
    batch = optimizer.batch_optimize(products_list)
    s = batch["summary"]
    results = batch["results"]
    avg_margin = round(sum(r["margin"] for r in results) / len(results), 2) if results else 0
    return KPIResponse(
        total_optimized_revenue=s["total_optimized_revenue"],
        revenue_lift=s["revenue_lift"],
        active_products=s["total_products"],
        avg_margin=avg_margin,
        price_increases=s["price_increases"],
        price_decreases=s["price_decreases"],
        unchanged=s["unchanged"],
    )


@app.get("/api/dashboard/revenue-chart")
def get_revenue_chart():
    """Aggregated 30-day revenue data for dashboard chart."""
    dates = sorted(history_df["date"].unique())[-30:]
    actual = []
    optimized = []
    for date in dates:
        day_data = history_df[history_df["date"] == date]
        day_rev = float(day_data["revenue"].sum())
        # Simulated optimized lift
        lift = 1.08
        actual.append({"date": date, "revenue": round(day_rev, 2)})
        optimized.append({"date": date, "revenue": round(day_rev * lift, 2)})
    return {"actual": actual, "optimized": optimized}


@app.get("/api/dashboard/categories")
def get_category_breakdown():
    """Revenue breakdown by category."""
    batch = optimizer.batch_optimize(products_list)
    cat_revenue = {}
    for i, result in enumerate(batch["results"]):
        cat = products_list[i]["category"]
        cat_revenue[cat] = cat_revenue.get(cat, 0) + result["expected_revenue"]
    cat_info = {c["name"]: c for c in CATEGORIES}
    return [
        {"name": name, "revenue": round(rev, 2), "color": cat_info.get(name, {}).get("color", "#6366f1")}
        for name, rev in cat_revenue.items()
    ]


# ─── Price & Config Endpoints ───────────────────────────────────────────────

@app.post("/api/price/apply")
def apply_price(req: PriceApplyRequest):
    """Apply a price change."""
    product = _find_product(req.product_id)
    result = optimizer.apply_price(req.product_id, req.new_price, product["name"], req.reason)
    if result["applied"]:
        # Update the products_list
        for p in products_list:
            if p["id"] == req.product_id:
                p["current_price"] = req.new_price
    return result


@app.get("/api/price/log")
def get_price_log():
    """Get price change audit log."""
    return optimizer.get_change_log()


@app.get("/api/config")
def get_config():
    """Get current optimizer configuration."""
    return optimizer.get_config()


@app.put("/api/config")
def update_config(req: ConfigUpdate):
    """Update optimizer configuration."""
    updates = req.model_dump(exclude_none=True)
    optimizer.update_config(updates)
    return {"status": "ok", "config": optimizer.get_config()}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _find_product(product_id: str) -> dict:
    for p in products_list:
        if p["id"] == product_id:
            return p
    raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
