# PriceFlow AI: System Architecture & ML Documentation

## Overview
PriceFlow AI is a full-stack Dynamic Pricing System built to optimize e-commerce product prices in real-time. It maximizes revenue, profit, or margin by forecasting consumer demand using Machine Learning models, and it enforces safety governance constraints to prevent erratic or unprofitable pricing behaviors.

This document breaks down the step-by-step build process of the entire application and details the underlying mathematical and machine learning techniques used.

---

## 1. System Architecture

The application is segregated into a decoupled Client-Server architecture:

### Frontend (User Interface)
- **Framework:** React 19 via Vite.
- **Language:** TypeScript for strong typing.
- **Styling:** Tailwind CSS combined with raw CSS variables for global Light/Dark mode and glassmorphism UI tokens.
- **Key Features:**
  - **Dashboard:** Real-time KPIs and Revenue/Profit area charts built with Recharts.
  - **Product Catalog:** A dynamically resizing grid of products with slide-out details panels showing 14-day demand history.
  - **Simulation Lab:** "What-if" scenario runner to compare current vs. optimized strategies.
  - **Safety & Governance:** Control room to set global constraints (e.g., maximum price change %, minimum required margin) and view audit logs.
  - **Manual Prediction Lab:** Drag-and-drop CSV parser with form inputs for localized model inference.
  - **Global Currency Engine:** React Context-based state manager that intercepts all monetary values and dynamically converts them to USD, EUR, GBP, or NGN.

### Backend (API & ML Engine)
- **Framework:** FastAPI (Python).
- **Core ML Libraries:** Scikit-learn, XGBoost, Pandas, NumPy.
- **Responsibilities:**
  1. Parsing and serving product mock data.
  2. Training ML models on historical demand data.
  3. Running the Optimization Engine to generate exact recommended price points.

---

## 2. Step-by-Step Build Process

### Phase 1: Data Generation & Environment Setup
- Initialized the Python virtual environment and installed dependencies (`fastapi`, `uvicorn`, `scikit-learn`, `xgboost`, `pandas`).
- Developed `generator.py` to create a highly realistic synthetic dataset (`dynamic_pricing_dataset_realistic.csv`). The dataset incorporates nuanced real-world features such as seasonality (winter/summer/monsoon), day-of-week multipliers, holiday spikes, competitor pricing gravity, and marketing spend elasticity.

### Phase 2: Machine Learning Pipeline
- Implemented `Trainer` classes to handle data ingestion and preprocessing (One-Hot Encoding for categorical variables, Standard Scaling for numerical variables).
- Integrated two distinct demand prediction models (Ridge Regression & XGBoost).
- Created endpoints to trigger model re-training and handle inference.

### Phase 3: The Optimization Engine
- Developed the `PriceOptimizer` class.
- Rather than blindly accepting the highest price, the optimizer was programmed to respect predefined safety constraints (price floors derived from cost + minimum margin, price ceilings, and max daily change percentages).
- Implemented "Shadow", "Canary", and "Live" rollout modes to simulate enterprise deployment safety.

### Phase 4: Frontend Scaffolding
- Initialized the React + Vite application.
- Configured Tailwind CSS, installing Lucide-React for iconography and Recharts for interactive data visualization.
- Built out the navigation sidebar, Topbar, and routing architecture (`react-router-dom`).

### Phase 5: Feature Implementation & Polish
- **UI/UX:** Applied modern glassmorphism aesthetics, utilizing deep vibrant colors and backdrop blurs.
- **Theming:** Implemented CSS variables to allow seamless toggling between Light and Dark mode.
- **Currency Context:** Added real-time global currency formatting logic (`useCurrency` hook).
- **Responsiveness:** Fixed CSS flexbox and text truncation overflow issues to ensure grid items resize cleanly across all device widths.

---

## 3. Machine Learning Techniques

The core objective of the ML layer is to predict **Demand (units sold)** given a specific **Price** and current market conditions. 

### Feature Engineering
Before feeding data into the model, the backend extracts and transforms key features:
- **Temporal Features:** Month, Day of week, Season, Holiday proximity.
- **Market Features:** Competitor price differences (`Competitor_Price - Our_Price`).
- **Internal Features:** Marketing spend, historical lag features (demand from 1 day ago, 7 days ago), stock levels, and product category.

### Prediction Models
The system evaluates demand using two distinct algorithms, allowing for fallback and comparison:

1. **Ridge Regression (L2 Regularized Linear Model)**
   - **How it works:** A linear regression model that adds a penalty equivalent to the square of the magnitude of coefficients. 
   - **Why it’s used:** It prevents overfitting when dealing with highly correlated features (multicollinearity, e.g., competitor price vs. base price). It acts as a highly interpretable, fast baseline model.

2. **XGBoost Regressor (Extreme Gradient Boosting)**
   - **How it works:** An ensemble learning method that builds decision trees sequentially. Each new tree attempts to correct the residual errors made by the previous trees.
   - **Why it’s used:** XGBoost excels at capturing non-linear relationships and complex interactions (e.g., how the elasticity of demand changes specifically during a "Holiday" combined with "High Marketing Spend"). It provides the highest accuracy for the production engine.

### The Optimization Algorithm (Discrete Search)
Once the ML model learns the demand curve $D(p)$, the system must find the optimal price $p^*$. The `PriceOptimizer` engine uses a constrained discrete grid search:

1. **Boundary Calculation:** It establishes a strict floor (based on `Cost * (1 + Min_Margin)`) and a ceiling.
2. **Discretization:** The price range is divided into 100 discrete steps.
3. **Simulation:** For each step $p_i$, the engine asks the ML model: *"If we price at $p_i$, what will the demand be?"*
4. **Objective Maximization:** Depending on the user's objective, it calculates the score for that step:
   - **Revenue:** $Score = p_i \times Predicted\_Demand$
   - **Profit:** $Score = (p_i - Cost) \times Predicted\_Demand$
   - **Margin:** $Score = \frac{p_i - Cost}{p_i} \times Predicted\_Demand$
5. **Constraint Check:** The engine filters out any prices that exceed the `max_change_percent` limit.
6. **Selection:** The price $p_i$ that yields the highest score is returned as the `suggested_price`.
