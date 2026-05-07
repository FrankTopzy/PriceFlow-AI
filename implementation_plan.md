# PriceFlow AI — Full-Stack Dynamic Pricing System

Rebuild the dynamic pricing dashboard as a **full-stack ML application** with a Python backend (FastAPI + scikit-learn + LightGBM) and a React + TypeScript responsive frontend.

## Proposed Architecture

```
C:\Users\adeoy\.gemini\antigravity\scratch\
├── backend/
│   ├── main.py                # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── data/
│   │   └── generator.py       # Synthetic data generation (products, transactions)
│   ├── models/
│   │   ├── ridge_model.py     # Ridge Regression demand predictor
│   │   ├── gbm_model.py       # LightGBM demand predictor
│   │   └── trainer.py         # Model training pipeline
│   ├── optimizer/
│   │   └── engine.py          # Price optimization engine + safety rails
│   └── schemas.py             # Pydantic request/response schemas
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css            # Global design system
        ├── api/
        │   └── client.ts        # API client (fetch wrapper)
        ├── types/
        │   └── index.ts         # TypeScript interfaces
        ├── components/
        │   ├── Layout.tsx        # Sidebar + topbar + routing
        │   ├── KPIStrip.tsx      # KPI cards row
        │   ├── RevenueChart.tsx  # Revenue area chart
        │   ├── CategoryChart.tsx # Doughnut chart
        │   ├── TopMovers.tsx     # Top movers list
        │   ├── ProductGrid.tsx   # Product cards grid
        │   ├── ProductCard.tsx   # Individual product card
        │   ├── ProductDetail.tsx # Slide-in detail panel
        │   ├── SimulationLab.tsx # What-if scenario UI
        │   └── SafetyPanel.tsx   # Safety rails + audit log
        └── pages/
            ├── Dashboard.tsx
            ├── Products.tsx
            ├── Simulation.tsx
            └── Safety.tsx
```

---

## Proposed Changes

### Backend (Python / FastAPI)

#### [NEW] `backend/requirements.txt`
```
fastapi==0.115.0
uvicorn==0.30.0
pandas==2.2.0
numpy==1.26.0
scikit-learn==1.5.0
lightgbm==4.5.0
pydantic==2.9.0
```

#### [NEW] `backend/data/generator.py`
- 20 products across 4 categories (same catalog as the prototype)
- Generate 90-day synthetic transaction history per product using log-linear demand model with noise
- Feature engineering: price lags, demand lags, price-to-base ratio, competitor ratio, temporal features

#### [NEW] `backend/models/ridge_model.py`
- scikit-learn `Ridge` regression on `log(demand) ~ log(price/base) + weekend + holiday + competitor_ratio + stock`
- Returns coefficients (interpretable for defence presentation)
- Computes R², MAE, MAPE on held-out test set

#### [NEW] `backend/models/gbm_model.py`
- LightGBM regressor with Poisson objective on all engineered features
- Returns feature importance rankings
- Computes R², MAE, MAPE

#### [NEW] `backend/models/trainer.py`
- Trains both models on generated data at startup
- Provides `predict(product_id, features)` → ensemble prediction (60% GBM + 40% Ridge)
- Caches trained models in memory

#### [NEW] `backend/optimizer/engine.py`
- Discrete search over candidate prices in [floor, ceiling] range
- Objectives: revenue, profit, margin (user-selectable)
- Safety rails: min margin, max change %, rate limiting
- Rollout modes: shadow / canary / live
- What-if scenario support

#### [NEW] `backend/schemas.py`
- Pydantic models for all API request/response types

#### [NEW] `backend/main.py`
**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List all products with current prices |
| GET | `/api/products/{id}` | Single product with history |
| GET | `/api/products/{id}/history` | 90-day transaction history |
| POST | `/api/optimize` | Batch optimize all products |
| POST | `/api/optimize/{id}` | Optimize single product |
| POST | `/api/simulate` | What-if scenario |
| GET | `/api/dashboard/kpis` | Dashboard KPI metrics |
| GET | `/api/dashboard/revenue-chart` | Aggregated revenue data |
| GET | `/api/dashboard/categories` | Revenue by category |
| GET | `/api/models/metrics` | Model performance metrics |
| GET | `/api/models/{id}/importance` | Feature importance for product |
| POST | `/api/price/apply` | Apply price change |
| GET | `/api/price/log` | Price change audit log |
| GET | `/api/config` | Current config |
| PUT | `/api/config` | Update safety/rollout config |

---

### Frontend (React + TypeScript + Vite)

#### [NEW] Project scaffold via `npx create-vite`
- React + TypeScript template
- Dependencies: `recharts`, `react-router-dom`, `lucide-react` (icons)

#### [NEW] `src/index.css`
- Same dark theme design system from the prototype (CSS custom properties)
- Glassmorphism, responsive breakpoints, animations

#### [NEW] `src/types/index.ts`
- TypeScript interfaces for Product, History, Optimization, Simulation, Config, etc.

#### [NEW] `src/api/client.ts`
- Typed fetch wrapper for all backend endpoints
- Base URL configuration

#### [NEW] `src/components/Layout.tsx`
- Responsive sidebar (collapses to hamburger on mobile)
- Top bar with rollout/objective toggles
- React Router outlet

#### [NEW] Pages: `Dashboard.tsx`, `Products.tsx`, `Simulation.tsx`, `Safety.tsx`
- Each page fetches data from the Python API
- Uses Recharts for all visualizations
- Fully responsive with CSS Grid/Flexbox

---

## User Review Required

> [!IMPORTANT]
> **LightGBM installation** may require C++ build tools on Windows. If it fails, I'll fall back to **XGBoost** or **scikit-learn's GradientBoostingRegressor** which installs cleanly.

> [!IMPORTANT]
> **Frontend framework:** I'll use **Vite + React 18 + TypeScript** with **Recharts** for charts (React-native charting, better than wrapping Chart.js). Is this acceptable?

## Verification Plan

### Automated
- Start backend: `uvicorn main:app --reload` → verify API responses with curl
- Start frontend: `npm run dev` → verify all pages render
- Test all API endpoints return valid JSON

### Manual
- Navigate through all 4 sections
- Run a simulation scenario
- Apply a price change in Live mode
- Verify responsive layout on mobile viewport
