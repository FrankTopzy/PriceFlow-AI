/**
 * PriceFlow AI — Main Application Controller
 * Orchestrates data loading, optimization, and rendering.
 */

const App = (() => {
  let products = [];
  let optimizationResults = null;

  // ─── Initialization ──────────────────────────────────────────────
  function init() {
    console.log('🚀 PriceFlow AI initializing...');

    // Load products
    products = DataEngine.getProducts();

    // Initialize UI controls
    UI.initNavigation();
    UI.initRolloutToggle();
    UI.initObjectiveSelector();
    UI.initFilters();
    UI.updateRolloutIndicator('shadow');

    // Close panel handlers
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
      btn.addEventListener('click', UI.closeProductDetail);
    });

    // Run initial batch optimization
    optimizationResults = PriceOptimizer.batchOptimize(products);

    // Render dashboard
    renderDashboard();

    // Render products section in background
    renderProducts();

    console.log('✅ PriceFlow AI ready', { products: products.length, results: optimizationResults.summary });
  }

  // ─── Dashboard Section ───────────────────────────────────────────
  function renderDashboard() {
    if (!optimizationResults) {
      optimizationResults = PriceOptimizer.batchOptimize(products);
    }
    const summary = optimizationResults.summary;

    // KPI counters
    const totalRevEl = document.getElementById('kpi-total-revenue');
    const liftEl = document.getElementById('kpi-revenue-lift');
    const productsEl = document.getElementById('kpi-active-products');
    const avgMarginEl = document.getElementById('kpi-avg-margin');

    if (totalRevEl) UI.animateCounter(totalRevEl, summary.totalOptimizedRevenue, '$');
    if (liftEl) {
      const liftVal = Math.abs(summary.revenueLift);
      const prefix = summary.revenueLift >= 0 ? '+' : '-';
      UI.animateCounter(liftEl, liftVal, prefix, '%');
    }
    if (productsEl) productsEl.textContent = summary.totalProducts;
    if (avgMarginEl) {
      const avgMargin = optimizationResults.results.reduce((s, r) => s + r.margin, 0) / optimizationResults.results.length;
      UI.animateCounter(avgMarginEl, avgMargin, '', '%');
    }

    // Sub-stats
    const incrEl = document.getElementById('stat-increases');
    const decrEl = document.getElementById('stat-decreases');
    const unchEl = document.getElementById('stat-unchanged');
    if (incrEl) incrEl.textContent = summary.priceIncreases;
    if (decrEl) decrEl.textContent = summary.priceDecreases;
    if (unchEl) unchEl.textContent = summary.unchanged;

    // Revenue chart
    renderAggregateRevenueChart();

    // Category breakdown
    renderCategoryBreakdown();

    // Top movers
    renderTopMovers();
  }

  function renderAggregateRevenueChart() {
    // Aggregate all product histories
    const allHistory = {};
    const allOptimized = {};

    products.forEach(p => {
      const history = DataEngine.getProductHistory(p.id);
      history.forEach(h => {
        if (!allHistory[h.date]) {
          allHistory[h.date] = 0;
          allOptimized[h.date] = 0;
        }
        allHistory[h.date] += h.revenue;
        // Simulate optimized revenue (5-12% lift with some variance)
        const lift = 1.05 + Math.abs(p.elasticity) * 0.015;
        allOptimized[h.date] += h.revenue * lift;
      });
    });

    const dates = Object.keys(allHistory).sort();
    const last30 = dates.slice(-30);

    const historyArr = last30.map(d => ({ date: d, revenue: Math.round(allHistory[d]) }));
    const optimizedArr = last30.map(d => ({ date: d, revenue: Math.round(allOptimized[d]) }));

    Charts.renderRevenueChart('revenue-overview-chart', historyArr, optimizedArr);
  }

  function renderCategoryBreakdown() {
    const categories = DataEngine.getCategories();
    const categoryRevenue = categories.map((cat, idx) => {
      const catProducts = optimizationResults.results.filter((_, i) => products[i].categoryIndex === idx);
      const revenue = catProducts.reduce((s, r) => s + r.expectedRevenue, 0);
      return { name: cat.name, revenue: Math.round(revenue), color: cat.color };
    });
    Charts.renderCategoryBreakdown('category-chart', categoryRevenue);
  }

  function renderTopMovers() {
    const container = document.getElementById('top-movers-list');
    if (!container) return;

    const sorted = optimizationResults.results
      .map((r, i) => ({ ...r, product: products[i] }))
      .sort((a, b) => Math.abs(b.revenueImpact) - Math.abs(a.revenueImpact))
      .slice(0, 5);

    container.innerHTML = sorted.map(r => `
      <div class="mover-item" data-product-id="${r.productId}">
        <div class="mover-info">
          <div class="mover-img-container">
            <img src="${r.product.image}" alt="${r.product.name}" class="mover-img">
          </div>
          <div>
            <div class="mover-name">${r.product.name}</div>
            <div class="mover-price">${UI.formatCurrency(r.currentPrice)} → ${UI.formatCurrency(r.suggestedPrice)}</div>
          </div>
        </div>
        <div class="mover-impact ${r.revenueImpact >= 0 ? 'positive' : 'negative'}">
          ${r.revenueImpact >= 0 ? '+' : ''}$${Math.abs(r.revenueImpact).toLocaleString()}
        </div>
      </div>
    `).join('');

    // Click to open detail
    container.querySelectorAll('.mover-item').forEach(item => {
      item.addEventListener('click', () => {
        const pid = item.dataset.productId;
        const idx = products.findIndex(p => p.id === pid);
        if (idx >= 0) {
          UI.openProductDetail(products[idx], optimizationResults.results[idx]);
        }
      });
    });
  }

  // ─── Products Section ────────────────────────────────────────────
  function renderProducts() {
    optimizationResults = PriceOptimizer.batchOptimize(products);
    const container = document.getElementById('product-grid');
    if (!container) return;

    const filters = UI.getFilters();

    let items = optimizationResults.results.map((r, i) => ({
      ...r,
      product: products[i],
      index: i,
    }));

    // Filter by category
    if (filters.category !== 'all') {
      items = items.filter(item => item.product.category.name === filters.category);
    }

    // Sort
    switch (filters.sortBy) {
      case 'revenue-impact':
        items.sort((a, b) => Math.abs(b.revenueImpact) - Math.abs(a.revenueImpact));
        break;
      case 'change-percent':
        items.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
        break;
      case 'price-high':
        items.sort((a, b) => b.suggestedPrice - a.suggestedPrice);
        break;
      case 'price-low':
        items.sort((a, b) => a.suggestedPrice - b.suggestedPrice);
        break;
      case 'elasticity':
        items.sort((a, b) => Math.abs(b.product.elasticity) - Math.abs(a.product.elasticity));
        break;
      default:
        break;
    }

    container.innerHTML = items.map(item => {
      const p = item.product;
      const elastLabel = DataEngine.getElasticityLabel(p.elasticity);
      const isIncrease = item.changePercent > 0;
      const stockClass = p.currentStock < 20 ? 'stock-low' : p.currentStock < 80 ? 'stock-medium' : 'stock-high';

      return `
        <div class="product-card" data-product-index="${item.index}">
          <div class="product-card-header">
            <div class="product-category-badge" style="background: ${p.category.color}20; color: ${p.category.color}">
              ${p.category.icon} ${p.category.name}
            </div>
            <div class="stock-indicator ${stockClass}">
              <span class="stock-dot"></span> ${p.currentStock} in stock
            </div>
          </div>
          <div class="product-image-container">
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy">
          </div>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-brand">${p.brand}</p>

          <div class="price-comparison">
            <div class="price-current">
              <span class="price-label">Current</span>
              <span class="price-value">${UI.formatCurrency(item.currentPrice)}</span>
            </div>
            <div class="price-arrow">${isIncrease ? '↗' : '↘'}</div>
            <div class="price-suggested">
              <span class="price-label">Suggested</span>
              <span class="price-value ${isIncrease ? 'price-up' : 'price-down'}">${UI.formatCurrency(item.suggestedPrice)}</span>
            </div>
          </div>

          <div class="product-change-badge ${isIncrease ? 'change-up' : 'change-down'}">
            ${UI.formatPercent(item.changePercent)}
          </div>

          <div class="product-sparkline">
            <canvas id="spark-${p.id}" height="40"></canvas>
          </div>

          <div class="product-meta">
            <div class="meta-item">
              <span class="meta-label">Elasticity</span>
              <span class="meta-value" style="color: ${elastLabel.color}">${p.elasticity.toFixed(1)} (${elastLabel.label})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Revenue Impact</span>
              <span class="meta-value ${item.revenueImpact >= 0 ? 'positive' : 'negative'}">
                ${item.revenueImpact >= 0 ? '+' : ''}$${Math.abs(item.revenueImpact).toLocaleString()}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Margin</span>
              <span class="meta-value">${item.margin.toFixed(1)}%</span>
            </div>
          </div>

          <button class="btn btn-primary product-detail-btn">View Analysis →</button>
        </div>
      `;
    }).join('');

    // Render sparklines
    items.forEach(item => {
      const history = DataEngine.getProductHistory(item.product.id);
      const last14 = history.slice(-14).map(h => h.demand);
      Charts.renderSparkline('spark-' + item.product.id, last14, item.product.category.color);
    });

    // Click handlers
    container.querySelectorAll('.product-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const idx = parseInt(card.dataset.productIndex);
        UI.openProductDetail(products[idx], optimizationResults.results[idx]);
      });
    });

    // Update product count
    const countEl = document.getElementById('product-count');
    if (countEl) countEl.textContent = `${items.length} products`;
  }

  // ─── Simulation Section ──────────────────────────────────────────
  function renderSimulation() {
    const productSelect = document.getElementById('sim-product-select');
    if (productSelect && productSelect.options.length <= 1) {
      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.category.icon} ${p.name}`;
        productSelect.appendChild(opt);
      });
    }

    // Bind simulation controls
    const runBtn = document.getElementById('sim-run-btn');
    if (runBtn && !runBtn._bound) {
      runBtn._bound = true;
      runBtn.addEventListener('click', runSimulation);
    }
  }

  function runSimulation() {
    const productId = document.getElementById('sim-product-select')?.value;
    if (!productId) {
      UI.showToast('Please select a product', 'warning');
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const scenario = {
      competitorPrice: parseFloat(document.getElementById('sim-competitor-price')?.value) || product.basePrice,
      stockLevel: document.getElementById('sim-stock-level')?.value || 'medium',
      isWeekend: document.getElementById('sim-is-weekend')?.checked || false,
      holidayBoost: parseFloat(document.getElementById('sim-holiday-boost')?.value) || 0,
      month: parseInt(document.getElementById('sim-month')?.value) || new Date().getMonth(),
      demandLag7: parseFloat(document.getElementById('sim-demand-lag')?.value) || 30,
    };

    const result = PriceOptimizer.whatIf(product, scenario);

    // Display results
    const resultsDiv = document.getElementById('sim-results');
    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `
        <div class="sim-result-grid">
          <div class="sim-result-card">
            <span class="sim-result-label">Optimal Price</span>
            <span class="sim-result-value highlight">${UI.formatCurrency(result.suggestedPrice)}</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Current Price</span>
            <span class="sim-result-value">${UI.formatCurrency(result.currentPrice)}</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Change</span>
            <span class="sim-result-value ${result.changePercent >= 0 ? 'positive' : 'negative'}">${UI.formatPercent(result.changePercent)}</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Predicted Demand</span>
            <span class="sim-result-value">${result.predictedDemand} units</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Expected Revenue</span>
            <span class="sim-result-value">${UI.formatCurrency(result.expectedRevenue)}</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Expected Profit</span>
            <span class="sim-result-value">${UI.formatCurrency(result.expectedProfit)}</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Margin</span>
            <span class="sim-result-value">${result.margin.toFixed(1)}%</span>
          </div>
          <div class="sim-result-card">
            <span class="sim-result-label">Revenue Impact</span>
            <span class="sim-result-value ${result.revenueImpact >= 0 ? 'positive' : 'negative'}">
              ${result.revenueImpact >= 0 ? '+' : ''}$${Math.abs(result.revenueImpact).toLocaleString()}
            </span>
          </div>
        </div>
      `;
    }

    // Render simulation charts
    const demandCurve = PredictionModels.generateDemandCurve(product, scenario);
    setTimeout(() => {
      Charts.renderDemandCurve('sim-demand-chart', demandCurve,
        result.currentPrice, result.suggestedPrice,
        result.floor, result.ceiling);
      Charts.renderRevenueCurve('sim-revenue-chart', demandCurve,
        result.currentPrice, result.suggestedPrice);
    }, 50);

    UI.showToast('Simulation complete!', 'success');
  }

  // ─── Safety Section ──────────────────────────────────────────────
  function renderSafety() {
    const config = PriceOptimizer.getConfig();

    // Config values
    const minMarginInput = document.getElementById('safety-min-margin');
    const maxChangeInput = document.getElementById('safety-max-change');
    const rateLimitInput = document.getElementById('safety-rate-limit');

    if (minMarginInput) minMarginInput.value = (config.minMargin * 100).toFixed(0);
    if (maxChangeInput) maxChangeInput.value = (config.maxChangePercent * 100).toFixed(0);
    if (rateLimitInput) rateLimitInput.value = config.rateLimit;

    // Save button
    const saveBtn = document.getElementById('safety-save-btn');
    if (saveBtn && !saveBtn._bound) {
      saveBtn._bound = true;
      saveBtn.addEventListener('click', () => {
        PriceOptimizer.setConfig({
          minMargin: parseFloat(minMarginInput.value) / 100,
          maxChangePercent: parseFloat(maxChangeInput.value) / 100,
          rateLimit: parseInt(rateLimitInput.value),
        });
        UI.showToast('Safety parameters updated', 'success');
      });
    }

    // Render change log
    renderChangeLog();
  }

  function renderChangeLog() {
    const container = document.getElementById('change-log-list');
    if (!container) return;

    const log = PriceOptimizer.getChangeLog();
    if (log.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">📋</span><p>No price changes recorded yet</p></div>';
      return;
    }

    container.innerHTML = log.map(entry => `
      <div class="log-entry">
        <div class="log-entry-header">
          <span class="log-product">${entry.productName}</span>
          <span class="log-time">${new Date(entry.timestamp).toLocaleString()}</span>
        </div>
        <div class="log-entry-body">
          <span class="log-price">${UI.formatCurrency(entry.oldPrice)} → ${UI.formatCurrency(entry.newPrice)}</span>
          <span class="log-change ${entry.changePercent >= 0 ? 'positive' : 'negative'}">${UI.formatPercent(entry.changePercent)}</span>
          <span class="log-mode badge badge-${entry.rolloutMode}">${entry.rolloutMode.toUpperCase()}</span>
        </div>
        <div class="log-reason">${entry.reason}</div>
      </div>
    `).join('');
  }

  // ─── Public API ──────────────────────────────────────────────────
  return {
    init,
    renderDashboard,
    renderProducts,
    renderSimulation,
    renderSafety,
    getProducts: () => products,
    getOptimizationResults: () => optimizationResults,
  };
})();

// ─── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
