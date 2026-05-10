"""
PriceFlow AI — XGBoost Demand Model
High-performance gradient boosted model using all engineered features.
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, r2_score


class XGBoostDemandModel:
    """XGBoost model for demand prediction with feature importance."""

    FEATURE_COLS = [
        "log_price_ratio", "is_weekend", "holiday_boost",
        "price_to_competitor", "stock_level", "month",
        "demand_lag_1d", "demand_lag_7d", "demand_lag_30d",
    ]

    def __init__(self):
        self.model = XGBRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            objective="reg:squarederror",
            random_state=42,
            verbosity=0,
        )
        self.is_trained = False
        self.metrics = {}
        self.feature_importance_data = []

    def train(self, df: pd.DataFrame):
        """Train XGBoost on engineered features."""
        train_df = df.dropna(subset=self.FEATURE_COLS + ["demand"])
        X = train_df[self.FEATURE_COLS].values
        y = train_df["demand"].values

        # 80/20 split
        split = int(len(X) * 0.8)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        y_pred = np.maximum(y_pred, 1)

        self.metrics = {
            "model_name": "XGBoost Regressor",
            "r2": round(float(r2_score(y_test, y_pred)), 4),
            "mae": round(float(mean_absolute_error(y_test, y_pred)), 2),
            "mape": round(float(np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 1))) * 100), 2),
            "n_features": len(self.FEATURE_COLS),
        }

        # Feature importance
        importances = self.model.feature_importances_
        total = importances.sum()
        labels = {
            "log_price_ratio": "Price Ratio",
            "is_weekend": "Day of Week",
            "holiday_boost": "Holiday Proximity",
            "price_to_competitor": "Competitor Price",
            "stock_level": "Stock Level",
            "month": "Month",
            "demand_lag_1d": "Demand Lag (1d)",
            "demand_lag_7d": "Demand Lag (7d)",
            "demand_lag_30d": "Demand Lag (30d)",
        }
        self.feature_importance_data = sorted(
            [{"name": labels.get(col, col), "value": round(float(imp / total * 100), 1)}
             for col, imp in zip(self.FEATURE_COLS, importances)],
            key=lambda x: x["value"], reverse=True,
        )

        self.is_trained = True
        print(f"XGBoost model trained — R²={self.metrics['r2']}, MAE={self.metrics['mae']}, MAPE={self.metrics['mape']}%")

    def predict(self, features: dict) -> dict:
        """Predict demand for given features."""
        if not self.is_trained:
            raise RuntimeError("Model not trained yet")

        X = np.array([[
            features.get("log_price_ratio", 0),
            features.get("is_weekend", 0),
            features.get("holiday_boost", 0),
            features.get("price_to_competitor", 1),
            features.get("stock_level", 1),
            features.get("month", 6),
            features.get("demand_lag_1d", 30),
            features.get("demand_lag_7d", 30),
            features.get("demand_lag_30d", 30),
        ]])

        demand = float(self.model.predict(X)[0])
        sigma = 0.09

        return {
            "predicted": max(1, round(demand)),
            "lower": max(1, round(demand * np.exp(-1.96 * sigma))),
            "upper": round(demand * np.exp(1.96 * sigma)),
        }

    def get_metrics(self) -> dict:
        return self.metrics

    def get_feature_importance(self) -> list[dict]:
        return self.feature_importance_data
