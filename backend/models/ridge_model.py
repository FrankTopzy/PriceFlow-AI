"""
PriceFlow AI — Ridge Regression Demand Model
Interpretable log-linear model using scikit-learn Ridge.

Model: ln(demand) = β₀ + β₁·ln(price/base) + β₂·weekend + β₃·holiday_boost
                   + β₄·ln(price/competitor) + β₅·stock_level + β₆·month_sin
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score


class RidgeDemandModel:
    """Interpretable Ridge Regression model for demand prediction."""

    FEATURE_COLS = [
        "log_price_ratio", "is_weekend", "holiday_boost",
        "price_to_competitor", "stock_level", "month",
    ]

    def __init__(self, alpha: float = 1.0):
        self.model = Ridge(alpha=alpha)
        self.is_trained = False
        self.metrics = {}
        self.coefficients = {}

    def train(self, df: pd.DataFrame):
        """Train the Ridge model on engineered features."""
        train_df = df.dropna(subset=self.FEATURE_COLS + ["log_demand"])
        X = train_df[self.FEATURE_COLS].values
        y = train_df["log_demand"].values

        # 80/20 split
        split = int(len(X) * 0.8)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        self.model.fit(X_train, y_train)

        # Predictions
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)

        # Convert back from log space for metrics
        demand_actual = np.exp(y_test)
        demand_pred = np.exp(y_pred_test)

        self.metrics = {
            "model_name": "Ridge Regression",
            "r2": round(r2_score(y_test, y_pred_test), 4),
            "mae": round(mean_absolute_error(demand_actual, demand_pred), 2),
            "mape": round(np.mean(np.abs((demand_actual - demand_pred) / demand_actual)) * 100, 2),
            "n_features": len(self.FEATURE_COLS),
        }

        # Store named coefficients
        self.coefficients = {
            name: round(float(coef), 4)
            for name, coef in zip(self.FEATURE_COLS, self.model.coef_)
        }
        self.coefficients["intercept"] = round(float(self.model.intercept_), 4)
        self.is_trained = True

        print(f"📐 Ridge model trained — R²={self.metrics['r2']}, MAE={self.metrics['mae']}, MAPE={self.metrics['mape']}%")

    def predict(self, features: dict) -> dict:
        """Predict demand for given features. Returns demand + confidence interval."""
        if not self.is_trained:
            raise RuntimeError("Model not trained yet")

        X = np.array([[
            features.get("log_price_ratio", 0),
            features.get("is_weekend", 0),
            features.get("holiday_boost", 0),
            features.get("price_to_competitor", 1),
            features.get("stock_level", 1),
            features.get("month", 6),
        ]])

        log_demand = self.model.predict(X)[0]
        demand = np.exp(log_demand)
        sigma = 0.12  # Residual std dev (estimated)

        return {
            "predicted": max(1, round(demand)),
            "lower": max(1, round(np.exp(log_demand - 1.96 * sigma))),
            "upper": round(np.exp(log_demand + 1.96 * sigma)),
        }

    def get_metrics(self) -> dict:
        return self.metrics

    def get_coefficients(self) -> list[dict]:
        """Return named coefficients for interpretability."""
        labels = {
            "log_price_ratio": "Price Elasticity",
            "is_weekend": "Weekend Effect",
            "holiday_boost": "Holiday Sensitivity",
            "price_to_competitor": "Competitor Sensitivity",
            "stock_level": "Stock Effect",
            "month": "Seasonality",
        }
        return [
            {"name": labels.get(k, k), "value": round(abs(v) / max(abs(v) for v in self.coefficients.values() if v != self.coefficients.get("intercept", 0)) * 100, 1) if self.coefficients else 0}
            for k, v in self.coefficients.items() if k != "intercept"
        ]
