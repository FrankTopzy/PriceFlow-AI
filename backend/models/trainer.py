"""
PriceFlow AI — Model Training Pipeline
Trains both Ridge and XGBoost models, provides ensemble predictions.
"""

import numpy as np
import pandas as pd
from models.ridge_model import RidgeDemandModel
from models.xgb_model import XGBoostDemandModel


class ModelTrainer:
    """Trains and manages both prediction models."""

    def __init__(self):
        self.ridge = RidgeDemandModel(alpha=1.0)
        self.xgb = XGBoostDemandModel()
        self.features_df = None
        self.is_ready = False

    def train_all(self, features_df: pd.DataFrame):
        """Train both models on the engineered features DataFrame."""
        if features_df is None or features_df.empty:
            raise ValueError("Training Failed: Feature dataset is empty or missing.")
        
        # Ensure minimal required columns for ML
        ml_req = {"log_price_ratio", "log_demand"}
        if not ml_req.issubset(features_df.columns):
            raise ValueError(f"Training Blocked: Dataset lacks required ML features {ml_req}")

        self.features_df = features_df
        print("Training models...")
        self.ridge.train(features_df)
        self.xgb.train(features_df)
        self.is_ready = True
        print("All models trained and ready")

    def ensemble_predict(self, features: dict) -> dict:
        """Ensemble prediction: 60% XGBoost + 40% Ridge."""
        if not self.is_ready:
            raise RuntimeError("Models not trained")

        ridge_pred = self.ridge.predict(features)
        xgb_pred = self.xgb.predict(features)

        predicted = round(0.6 * xgb_pred["predicted"] + 0.4 * ridge_pred["predicted"])
        lower = min(ridge_pred["lower"], xgb_pred["lower"])
        upper = max(ridge_pred["upper"], xgb_pred["upper"])

        return {
            "predicted": max(1, predicted),
            "lower": max(1, lower),
            "upper": upper,
            "ridge_prediction": ridge_pred["predicted"],
            "xgb_prediction": xgb_pred["predicted"],
            "confidence": 0.95,
        }

    def predict_at_price(self, product: dict, price: float, context: dict = None) -> dict:
        """Predict demand at a specific price point for a product."""
        if context is None:
            context = {}

        base_price = product.get("base_price", price)
        price_ratio = price / base_price if base_price > 0 else 1
        competitor_price = context.get("competitor_price", base_price)

        # Get recent demand lags from history
        features = {
            "log_price_ratio": float(np.log(max(0.01, price_ratio))),
            "is_weekend": int(context.get("is_weekend", 0)),
            "holiday_boost": float(context.get("holiday_boost", 0)),
            "price_to_competitor": float(price / competitor_price) if competitor_price > 0 else 1.0,
            "stock_level": {"low": 0, "medium": 1, "high": 2}.get(context.get("stock_level", "medium"), 1),
            "month": int(context.get("month", 6)),
            "demand_lag_1d": float(context.get("demand_lag_1d", 30)),
            "demand_lag_7d": float(context.get("demand_lag_7d", 30)),
            "demand_lag_30d": float(context.get("demand_lag_30d", 30)),
        }

        return self.ensemble_predict(features)

    def generate_demand_curve(self, product: dict, context: dict = None, points: int = 50) -> list[dict]:
        """Generate demand/revenue/profit curve across a price range."""
        cost = product["cost"]
        floor = cost * 1.1
        ceiling = product.get("msrp", product["base_price"] * 1.5)
        step = (ceiling - floor) / points

        curve = []
        for i in range(points + 1):
            price = round(floor + step * i, 2)
            pred = self.predict_at_price(product, price, context)
            demand = pred["predicted"]
            curve.append({
                "price": price,
                "demand": demand,
                "revenue": round(price * demand, 2),
                "profit": round((price - cost) * demand, 2),
            })
        return curve

    def get_all_metrics(self) -> list[dict]:
        return [self.ridge.get_metrics(), self.xgb.get_metrics()]

    def get_feature_importance(self, product_id: str = None) -> list[dict]:
        return self.xgb.get_feature_importance()

    def get_ridge_coefficients(self) -> list[dict]:
        return self.ridge.get_coefficients()

    def get_latest_context(self, product_id: str) -> dict:
        """Get the latest context features for a product from the training data."""
        if self.features_df is None:
            return {}
        prod_data = self.features_df[self.features_df["product_id"] == product_id]
        if prod_data.empty:
            return {}
        latest = prod_data.sort_values("date").iloc[-1]
        return {
            "is_weekend": int(latest.get("is_weekend", 0)),
            "holiday_boost": float(latest.get("holiday_boost", 0)),
            "competitor_price": float(latest.get("competitor_price", latest.get("base_price", 50))),
            "stock_level": {0: "low", 1: "medium", 2: "high"}.get(int(latest.get("stock_level", 1)), "medium"),
            "month": int(latest.get("month", 6)),
            "demand_lag_1d": float(latest.get("demand_lag_1d", 30)),
            "demand_lag_7d": float(latest.get("demand_lag_7d", 30)),
            "demand_lag_30d": float(latest.get("demand_lag_30d", 30)),
        }
