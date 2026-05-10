"""
PriceFlow AI — Synthetic Data Generator
Generates realistic product catalog, transaction history, and competitor data.
Outputs CSV files to the data/ directory.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

# ─── Product Catalog ─────────────────────────────────────────────────────────

CATEGORIES = [
    {"name": "Electronics", "icon": "⚡", "color": "#6366f1"},
    {"name": "Fashion", "icon": "👗", "color": "#ec4899"},
    {"name": "Home & Living", "icon": "🏠", "color": "#14b8a6"},
    {"name": "Food & Beverage", "icon": "🍕", "color": "#f59e0b"},
]

PRODUCTS = [
    # Electronics
    {"id": "E001", "name": "Wireless Earbuds Pro", "category": "Electronics", "cost": 18, "base_price": 49.99, "msrp": 79.99, "elasticity": -2.1, "brand": "SoundCore"},
    {"id": "E002", "name": "Smart Watch Ultra", "category": "Electronics", "cost": 85, "base_price": 199.99, "msrp": 299.99, "elasticity": -1.8, "brand": "TechFit"},
    {"id": "E003", "name": "Portable Charger 20K", "category": "Electronics", "cost": 12, "base_price": 34.99, "msrp": 49.99, "elasticity": -2.5, "brand": "PowerMax"},
    {"id": "E004", "name": "Bluetooth Speaker", "category": "Electronics", "cost": 22, "base_price": 59.99, "msrp": 89.99, "elasticity": -1.9, "brand": "SoundCore"},
    {"id": "E005", "name": "USB-C Hub 7-in-1", "category": "Electronics", "cost": 15, "base_price": 39.99, "msrp": 59.99, "elasticity": -1.6, "brand": "ConnectPro"},
    # Fashion
    {"id": "F001", "name": "Premium Hoodie", "category": "Fashion", "cost": 14, "base_price": 54.99, "msrp": 79.99, "elasticity": -2.3, "brand": "UrbanThread"},
    {"id": "F002", "name": "Running Sneakers V2", "category": "Fashion", "cost": 28, "base_price": 89.99, "msrp": 129.99, "elasticity": -1.7, "brand": "StrideFlex"},
    {"id": "F003", "name": "Leather Crossbody Bag", "category": "Fashion", "cost": 20, "base_price": 64.99, "msrp": 99.99, "elasticity": -1.5, "brand": "CraftLeather"},
    {"id": "F004", "name": "Aviator Sunglasses", "category": "Fashion", "cost": 8, "base_price": 29.99, "msrp": 49.99, "elasticity": -2.8, "brand": "ShadeCraft"},
    {"id": "F005", "name": "Slim Fit Chinos", "category": "Fashion", "cost": 16, "base_price": 49.99, "msrp": 69.99, "elasticity": -2.0, "brand": "UrbanThread"},
    # Home & Living
    {"id": "H001", "name": "Scented Candle Set", "category": "Home & Living", "cost": 6, "base_price": 24.99, "msrp": 39.99, "elasticity": -3.0, "brand": "GlowHaus"},
    {"id": "H002", "name": "Memory Foam Pillow", "category": "Home & Living", "cost": 12, "base_price": 44.99, "msrp": 64.99, "elasticity": -1.9, "brand": "DreamRest"},
    {"id": "H003", "name": "Plant Grow Light", "category": "Home & Living", "cost": 10, "base_price": 29.99, "msrp": 44.99, "elasticity": -2.2, "brand": "GreenGlow"},
    {"id": "H004", "name": "Ceramic Dinner Set", "category": "Home & Living", "cost": 25, "base_price": 79.99, "msrp": 119.99, "elasticity": -1.4, "brand": "ArtisanHome"},
    {"id": "H005", "name": "Essential Oil Diffuser", "category": "Home & Living", "cost": 9, "base_price": 34.99, "msrp": 54.99, "elasticity": -2.4, "brand": "GlowHaus"},
    # Food & Beverage
    {"id": "D001", "name": "Artisan Coffee Beans 1kg", "category": "Food & Beverage", "cost": 8, "base_price": 22.99, "msrp": 34.99, "elasticity": -1.3, "brand": "BeanCraft"},
    {"id": "D002", "name": "Organic Matcha Powder", "category": "Food & Beverage", "cost": 10, "base_price": 29.99, "msrp": 44.99, "elasticity": -1.6, "brand": "ZenLeaf"},
    {"id": "D003", "name": "Protein Bar Box (12pk)", "category": "Food & Beverage", "cost": 7, "base_price": 19.99, "msrp": 29.99, "elasticity": -2.6, "brand": "FuelBar"},
    {"id": "D004", "name": "Hot Sauce Collection", "category": "Food & Beverage", "cost": 5, "base_price": 16.99, "msrp": 24.99, "elasticity": -2.9, "brand": "FireKitchen"},
    {"id": "D005", "name": "Trail Mix Premium 500g", "category": "Food & Beverage", "cost": 4, "base_price": 12.99, "msrp": 19.99, "elasticity": -3.2, "brand": "NutHarvest"},
]

# ─── Holiday Calendar ────────────────────────────────────────────────────────

HOLIDAYS = [
    {"month": 1, "day": 1, "name": "New Year", "boost": 0.15},
    {"month": 2, "day": 14, "name": "Valentines Day", "boost": 0.20},
    {"month": 4, "day": 15, "name": "Easter", "boost": 0.10},
    {"month": 5, "day": 12, "name": "Mothers Day", "boost": 0.18},
    {"month": 6, "day": 15, "name": "Summer Sale", "boost": 0.25},
    {"month": 10, "day": 31, "name": "Halloween", "boost": 0.12},
    {"month": 11, "day": 25, "name": "Black Friday", "boost": 0.40},
    {"month": 11, "day": 28, "name": "Cyber Monday", "boost": 0.35},
    {"month": 12, "day": 25, "name": "Christmas", "boost": 0.30},
]


def get_holiday_proximity(date: datetime) -> dict:
    """Calculate proximity to nearest holiday and its demand boost factor."""
    min_dist = 365
    closest_boost = 0.0
    closest_name = None
    for h in HOLIDAYS:
        h_date = datetime(date.year, h["month"], h["day"])
        diff = abs((date - h_date).days)
        if diff < min_dist:
            min_dist = diff
            closest_boost = h["boost"]
            closest_name = h["name"]
    factor = closest_boost if min_dist <= 3 else closest_boost * max(0, 1 - min_dist / 14)
    return {"distance": min_dist, "boost": round(factor, 4), "name": closest_name}


def generate_product_catalog() -> pd.DataFrame:
    """Generate the product catalog DataFrame."""
    df = pd.DataFrame(PRODUCTS)
    return df


def generate_transaction_history(days: int = 90) -> pd.DataFrame:
    """Generate synthetic transaction history for all products."""
    records = []
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for product in PRODUCTS:
        base_demand = 30 + abs(product["elasticity"]) * 8
        pid = product["id"]

        for d in range(days, -1, -1):
            date = today - timedelta(days=d)
            day_of_week = date.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            month = date.month
            holiday = get_holiday_proximity(date)

            # Price varies around base (simulating past adjustments)
            price_factor = 1 + 0.15 * np.sin(2 * np.pi * d / 30) + np.random.normal(0, 0.03)
            price = max(product["cost"] * 1.1, product["base_price"] * price_factor)
            price = round(price, 2)

            # Demand model: log-linear with noise
            price_ratio = price / product["base_price"]
            demand = base_demand * (price_ratio ** product["elasticity"])

            # Weekend boost
            if is_weekend:
                demand *= 1.15

            # Holiday boost
            demand *= (1 + holiday["boost"])

            # Seasonal patterns
            if product["category"] == "Fashion" and month in [5, 6, 7, 8]:
                demand *= 1.12
            if product["category"] == "Food & Beverage" and (month >= 11 or month <= 2):
                demand *= 1.18

            # Random noise
            demand *= (1 + np.random.normal(0, 0.08))
            demand = max(1, round(demand))

            # Competitor price
            competitor_price = round(product["base_price"] * (1 + np.random.uniform(-0.15, 0.15)), 2)

            # Stock level
            stock = max(5, round(200 - demand * 2 + np.random.uniform(-20, 20)))

            revenue = round(price * demand, 2)
            profit = round((price - product["cost"]) * demand, 2)
            margin = round((price - product["cost"]) / price * 100, 2) if price > 0 else 0

            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "product_id": pid,
                "product_name": product["name"],
                "category": product["category"],
                "brand": product["brand"],
                "cost": product["cost"],
                "base_price": product["base_price"],
                "price": price,
                "demand": demand,
                "revenue": revenue,
                "profit": profit,
                "margin": margin,
                "competitor_price": competitor_price,
                "stock": stock,
                "is_weekend": is_weekend,
                "day_of_week": day_of_week,
                "month": month,
                "holiday_name": holiday["name"],
                "holiday_boost": holiday["boost"],
                "elasticity": product["elasticity"],
            })

    df = pd.DataFrame(records)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features for ML models."""
    featured = df.copy()

    # Group by product for lag features
    for pid in featured["product_id"].unique():
        mask = featured["product_id"] == pid
        prod_data = featured.loc[mask].sort_values("date")

        # Price features
        featured.loc[mask, "price_lag_7d"] = prod_data["price"].rolling(7, min_periods=1).mean().values
        featured.loc[mask, "price_to_base"] = (prod_data["price"] / prod_data["base_price"]).values
        featured.loc[mask, "price_to_competitor"] = (prod_data["price"] / prod_data["competitor_price"]).values

        # Demand lags
        featured.loc[mask, "demand_lag_1d"] = prod_data["demand"].shift(1).fillna(prod_data["demand"].iloc[0]).values
        featured.loc[mask, "demand_lag_7d"] = prod_data["demand"].rolling(7, min_periods=1).mean().values
        featured.loc[mask, "demand_lag_30d"] = prod_data["demand"].rolling(30, min_periods=1).mean().values

        # Stock level encoding
        stock_vals = prod_data["stock"].values
        featured.loc[mask, "stock_level"] = pd.cut(
            stock_vals, bins=[0, 20, 80, 999], labels=[0, 1, 2]
        ).astype(float)

    # Log transforms for the regression model
    featured["log_price_ratio"] = np.log(featured["price_to_base"].clip(lower=0.01))
    featured["log_demand"] = np.log(featured["demand"].clip(lower=1))

    return featured


def generate_and_save_datasets(output_dir: str = None):
    """Generate all datasets and save to CSV files."""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))

    try:
        os.makedirs(output_dir, exist_ok=True)

        # Product catalog
        catalog = generate_product_catalog()
        catalog.to_csv(os.path.join(output_dir, "products.csv"), index=False)
        print(f"[SUCCESS] Saved products.csv ({len(catalog)} products)")

        # Transaction history
        history = generate_transaction_history(days=90)
        history.to_csv(os.path.join(output_dir, "transactions.csv"), index=False)
        print(f"[SUCCESS] Saved transactions.csv ({len(history)} records)")

        # Engineered features
        features = engineer_features(history)
        features.to_csv(os.path.join(output_dir, "features.csv"), index=False)
        print(f"[SUCCESS] Saved features.csv ({len(features)} records, {len(features.columns)} columns)")

        # Holiday calendar
        holidays_df = pd.DataFrame(HOLIDAYS)
        holidays_df.to_csv(os.path.join(output_dir, "holidays.csv"), index=False)
        print(f"[SUCCESS] Saved holidays.csv ({len(holidays_df)} holidays)")

        # Categories
        categories_df = pd.DataFrame(CATEGORIES)
        categories_df.to_csv(os.path.join(output_dir, "categories.csv"), index=False)
        print(f"[SUCCESS] Saved categories.csv ({len(categories_df)} categories)")
    except (OSError, IOError) as e:
        print(f"[WARNING] Read-only filesystem detected or permission denied: {e}")
        print("Backend will continue using in-memory datasets generated during this session.")
        # Ensure we still have the core data for the return statement
        catalog = generate_product_catalog()
        history = generate_transaction_history(days=90)
        features = engineer_features(history)

    return catalog, history, features


if __name__ == "__main__":
    generate_and_save_datasets()
