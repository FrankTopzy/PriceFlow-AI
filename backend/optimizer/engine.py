"""
PriceFlow AI — Price Optimization Engine
Constrained revenue/profit optimization with safety rails and rollout controls.
"""

import time
from typing import Optional


class PriceOptimizer:
    """Optimizes prices subject to safety constraints."""

    def __init__(self, trainer):
        self.trainer = trainer
        self.config = {
            "objective": "revenue",
            "min_margin": 0.10,
            "max_change_percent": 0.15,
            "price_steps": 100,
            "rollout_mode": "shadow",
            "canary_percent": 10,
            "rate_limit": 24,
        }
        self.price_change_log = []
        self.locked_products = set()
        self.current_prices = {}

    def set_current_prices(self, products: list[dict]):
        """Initialize current prices from product catalog."""
        for p in products:
            self.current_prices[p["id"]] = p.get("current_price", p["base_price"])

    def get_current_price(self, product_id: str, base_price: float) -> float:
        return self.current_prices.get(product_id, base_price)

    def compute_floor(self, product: dict) -> float:
        return round(product["cost"] * (1 + self.config["min_margin"]), 2)

    def compute_ceiling(self, product: dict) -> float:
        return round(product.get("msrp", product["base_price"] * 1.5), 2)

    def optimize(self, product: dict, context: dict = None) -> dict:
        """Find the optimal price for a single product."""
        if context is None:
            context = self.trainer.get_latest_context(product["id"])

        floor = self.compute_floor(product)
        ceiling = self.compute_ceiling(product)
        current_price = self.get_current_price(product["id"], product["base_price"])
        cost = product["cost"]
        steps = self.config["price_steps"]
        step_size = (ceiling - floor) / steps

        # Rate limit check
        last_change = self._get_last_change(product["id"])
        hours_ago = (time.time() - last_change["timestamp"]) / 3600 if last_change else float("inf")
        rate_limited = hours_ago < self.config["rate_limit"]
        is_locked = product["id"] in self.locked_products

        best_price = current_price
        best_score = -float("inf")
        best_demand = 0

        for i in range(steps + 1):
            price = round(floor + step_size * i, 2)

            # Max change constraint
            change_pct = abs((price - current_price) / current_price) if current_price > 0 else 0
            if change_pct > self.config["max_change_percent"]:
                continue

            pred = self.trainer.predict_at_price(product, price, context)
            demand = pred["predicted"]

            if self.config["objective"] == "profit":
                score = (price - cost) * demand
            elif self.config["objective"] == "margin":
                score = ((price - cost) / price) * demand if price > 0 else 0
            else:
                score = price * demand

            if score > best_score:
                best_score = score
                best_price = price
                best_demand = demand

        best_price = round(best_price, 2)
        change_pct = round((best_price - current_price) / current_price * 100, 2) if current_price > 0 else 0
        revenue_impact = round(best_price * best_demand - current_price * best_demand, 2)
        profit_impact = round((best_price - cost) * best_demand - (current_price - cost) * best_demand, 2)
        margin = round((best_price - cost) / best_price * 100, 2) if best_price > 0 else 0

        return {
            "product_id": product["id"],
            "current_price": current_price,
            "suggested_price": best_price,
            "floor": floor,
            "ceiling": ceiling,
            "change_percent": change_pct,
            "predicted_demand": best_demand,
            "expected_revenue": round(best_price * best_demand, 2),
            "expected_profit": round((best_price - cost) * best_demand, 2),
            "revenue_impact": revenue_impact,
            "profit_impact": profit_impact,
            "margin": margin,
            "objective": self.config["objective"],
            "rate_limited": rate_limited,
            "is_locked": is_locked,
            "can_apply": not rate_limited and not is_locked and self.config["rollout_mode"] != "shadow",
            "rollout_mode": self.config["rollout_mode"],
        }

    def batch_optimize(self, products: list[dict]) -> dict:
        """Optimize all products and return results + summary."""
        results = []
        for p in products:
            ctx = self.trainer.get_latest_context(p["id"])
            result = self.optimize(p, ctx)
            results.append(result)

        total_current = sum(r["current_price"] * r["predicted_demand"] for r in results)
        total_optimized = sum(r["expected_revenue"] for r in results)
        total_impact = total_optimized - total_current
        lift = round(total_impact / total_current * 100, 2) if total_current > 0 else 0

        summary = {
            "total_products": len(products),
            "total_current_revenue": round(total_current, 2),
            "total_optimized_revenue": round(total_optimized, 2),
            "total_revenue_impact": round(total_impact, 2),
            "revenue_lift": lift,
            "avg_change_percent": round(sum(abs(r["change_percent"]) for r in results) / len(results), 2) if results else 0,
            "price_increases": sum(1 for r in results if r["change_percent"] > 0.5),
            "price_decreases": sum(1 for r in results if r["change_percent"] < -0.5),
            "unchanged": sum(1 for r in results if abs(r["change_percent"]) <= 0.5),
        }

        return {"results": results, "summary": summary}

    def apply_price(self, product_id: str, new_price: float, product_name: str = "", reason: str = "Optimizer recommendation") -> dict:
        """Apply a price change (respects rollout mode)."""
        if self.config["rollout_mode"] == "shadow":
            return {"applied": False, "reason": "Shadow mode — price not applied"}

        old_price = self.current_prices.get(product_id, new_price)
        change_pct = round((new_price - old_price) / old_price * 100, 2) if old_price > 0 else 0

        entry = {
            "product_id": product_id,
            "product_name": product_name,
            "old_price": old_price,
            "new_price": round(new_price, 2),
            "change_percent": change_pct,
            "reason": reason,
            "rollout_mode": self.config["rollout_mode"],
            "timestamp": time.time(),
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        self.price_change_log.insert(0, entry)
        self.current_prices[product_id] = round(new_price, 2)
        return {"applied": True, "entry": entry}

    def what_if(self, product: dict, scenario: dict) -> dict:
        """Run a what-if scenario."""
        context = {
            "is_weekend": scenario.get("is_weekend", False),
            "holiday_boost": scenario.get("holiday_boost", 0),
            "competitor_price": scenario.get("competitor_price", product["base_price"]),
            "stock_level": scenario.get("stock_level", "medium"),
            "month": scenario.get("month", 6),
            "demand_lag_1d": scenario.get("demand_lag_7d", 30),
            "demand_lag_7d": scenario.get("demand_lag_7d", 30),
            "demand_lag_30d": scenario.get("demand_lag_7d", 30),
        }
        return self.optimize(product, context)

    def update_config(self, updates: dict):
        for k, v in updates.items():
            if v is not None and k in self.config:
                self.config[k] = v

    def get_config(self) -> dict:
        return {**self.config}

    def get_change_log(self) -> list[dict]:
        return list(self.price_change_log)

    def lock_product(self, product_id: str):
        self.locked_products.add(product_id)

    def unlock_product(self, product_id: str):
        self.locked_products.discard(product_id)

    def _get_last_change(self, product_id: str) -> Optional[dict]:
        for entry in self.price_change_log:
            if entry["product_id"] == product_id:
                return entry
        return None
