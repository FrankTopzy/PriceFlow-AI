/**
 * PriceFlow AI — UI Interactions Module
 * Handles navigation, modals, animations, filtering, and interactive elements.
 */

const UI = (() => {

  let currentSection = 'dashboard';
  let selectedProduct = null;
  let filterCategory = 'all';
  let sortBy = 'revenue-impact';

  // ─── Navigation ──────────────────────────────────────────────────
  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        navigateTo(section);
      });
    });
  }

  function navigateTo(sectionId) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update sections
    document.querySelectorAll('.main-section').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    const target = document.getElementById('section-' + sectionId);
    if (target) {
      target.style.display = 'block';
      requestAnimationFrame(() => target.classList.add('active'));
    }

    currentSection = sectionId;

    // Trigger section-specific rendering
    if (sectionId === 'dashboard') App.renderDashboard();
    else if (sectionId === 'products') App.renderProducts();
    else if (sectionId === 'simulation') App.renderSimulation();
    else if (sectionId === 'safety') App.renderSafety();
  }

  // ─── Modal System ────────────────────────────────────────────────
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('modal-open');

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modalId);
    });

    // Close on Escape
    const handler = (e) => {
      if (e.key === 'Escape') {
        closeModal(modalId);
        document.removeEventListener('keydown', handler);
      }
    };
    document.addEventListener('keydown', handler);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  // ─── Product Detail Panel ────────────────────────────────────────
  function openProductDetail(product, optimization) {
    selectedProduct = product;
    const panel = document.getElementById('product-detail-panel');
    if (!panel) return;

    // Populate header
    panel.querySelector('.detail-product-name').textContent = product.name;
    panel.querySelector('.detail-product-category').textContent = product.category.icon + ' ' + product.category.name;
    panel.querySelector('.detail-product-brand').textContent = product.brand;

    // Pricing summary
    const elastLabel = DataEngine.getElasticityLabel(product.elasticity);
    panel.querySelector('.detail-current-price').textContent = '$' + product.currentPrice.toFixed(2);
    panel.querySelector('.detail-suggested-price').textContent = '$' + optimization.suggestedPrice.toFixed(2);

    const changeBadge = panel.querySelector('.detail-change-badge');
    const changePct = optimization.changePercent;
    changeBadge.textContent = (changePct >= 0 ? '+' : '') + changePct.toFixed(2) + '%';
    changeBadge.className = 'detail-change-badge badge ' + (changePct >= 0 ? 'badge-success' : 'badge-danger');

    panel.querySelector('.detail-floor').textContent = '$' + optimization.floor.toFixed(2);
    panel.querySelector('.detail-ceiling').textContent = '$' + optimization.ceiling.toFixed(2);
    panel.querySelector('.detail-margin').textContent = optimization.margin.toFixed(1) + '%';
    panel.querySelector('.detail-elasticity').textContent = product.elasticity.toFixed(1);
    panel.querySelector('.detail-elasticity-label').textContent = elastLabel.label;
    panel.querySelector('.detail-elasticity-label').style.color = elastLabel.color;

    // Expected metrics
    panel.querySelector('.detail-exp-revenue').textContent = '$' + optimization.expectedRevenue.toLocaleString();
    panel.querySelector('.detail-exp-demand').textContent = optimization.predictedDemand + ' units';
    panel.querySelector('.detail-exp-profit').textContent = '$' + optimization.expectedProfit.toLocaleString();
    panel.querySelector('.detail-revenue-impact').textContent =
      (optimization.revenueImpact >= 0 ? '+$' : '-$') + Math.abs(optimization.revenueImpact).toLocaleString();

    // Charts
    const history = DataEngine.getProductHistory(product.id);
    const demandCurve = PredictionModels.generateDemandCurve(product, {
      isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
      holidayBoost: DataEngine.getHolidayProximity(new Date()).boost,
      competitorPrice: history[history.length - 1]?.competitorPrice || product.basePrice,
      stockLevel: product.currentStock < 20 ? 'low' : product.currentStock < 80 ? 'medium' : 'high',
      demandLag7: history.slice(-7).reduce((s, h) => s + h.demand, 0) / 7,
      month: new Date().getMonth(),
    });

    setTimeout(() => {
      Charts.renderDemandCurve('detail-demand-chart', demandCurve,
        product.currentPrice, optimization.suggestedPrice,
        optimization.floor, optimization.ceiling);
      Charts.renderRevenueCurve('detail-revenue-chart', demandCurve,
        product.currentPrice, optimization.suggestedPrice);
      Charts.renderPriceHistory('detail-history-chart', history);

      // Feature importance
      const models = PredictionModels.createModels(product);
      Charts.renderFeatureImportance('detail-importance-chart', models.gbm.getFeatureImportance());

      // Model metrics
      const ridgeMetrics = models.ridge.getMetrics();
      const gbmMetrics = models.gbm.getMetrics();
      renderModelMetrics(panel, ridgeMetrics, gbmMetrics);
    }, 100);

    // Apply button
    const applyBtn = panel.querySelector('.detail-apply-btn');
    const config = PriceOptimizer.getConfig();
    if (config.rolloutMode === 'shadow') {
      applyBtn.textContent = '🔒 Shadow Mode (View Only)';
      applyBtn.disabled = true;
      applyBtn.classList.add('btn-disabled');
    } else {
      applyBtn.textContent = config.rolloutMode === 'canary'
        ? `🧪 Apply to ${config.canaryPercent}% (Canary)` : '🚀 Apply Price (Live)';
      applyBtn.disabled = false;
      applyBtn.classList.remove('btn-disabled');
      applyBtn.onclick = () => {
        const result = PriceOptimizer.applyPrice(product, optimization.suggestedPrice);
        if (result.applied) {
          showToast('Price updated successfully!', 'success');
          closeProductDetail();
          App.renderProducts();
        } else {
          showToast(result.reason, 'error');
        }
      };
    }

    panel.classList.add('open');
    document.body.classList.add('panel-open');
  }

  function renderModelMetrics(panel, ridge, gbm) {
    const container = panel.querySelector('.model-metrics-grid');
    if (!container) return;
    container.innerHTML = `
      <div class="model-card">
        <div class="model-card-header">
          <span class="model-icon">📐</span>
          <span class="model-name">${ridge.model}</span>
        </div>
        <div class="model-stats">
          <div class="model-stat"><span class="stat-label">R²</span><span class="stat-value">${ridge.r2}</span></div>
          <div class="model-stat"><span class="stat-label">MAE</span><span class="stat-value">${ridge.mae}</span></div>
          <div class="model-stat"><span class="stat-label">MAPE</span><span class="stat-value">${ridge.mape}</span></div>
          <div class="model-stat"><span class="stat-label">Features</span><span class="stat-value">${ridge.features}</span></div>
        </div>
      </div>
      <div class="model-card">
        <div class="model-card-header">
          <span class="model-icon">🌲</span>
          <span class="model-name">${gbm.model}</span>
        </div>
        <div class="model-stats">
          <div class="model-stat"><span class="stat-label">R²</span><span class="stat-value">${gbm.r2}</span></div>
          <div class="model-stat"><span class="stat-label">MAE</span><span class="stat-value">${gbm.mae}</span></div>
          <div class="model-stat"><span class="stat-label">MAPE</span><span class="stat-value">${gbm.mape}</span></div>
          <div class="model-stat"><span class="stat-label">Features</span><span class="stat-value">${gbm.features}</span></div>
        </div>
      </div>
    `;
  }

  function closeProductDetail() {
    const panel = document.getElementById('product-detail-panel');
    if (panel) {
      panel.classList.remove('open');
      document.body.classList.remove('panel-open');
    }
    selectedProduct = null;
  }

  // ─── Toast Notifications ─────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ─── Counter Animation ───────────────────────────────────────────
  function animateCounter(element, target, prefix = '', suffix = '', duration = 1200) {
    const start = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const range = target - start;
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = start + range * eased;

      if (Math.abs(target) >= 1000) {
        element.textContent = prefix + Math.round(current).toLocaleString() + suffix;
      } else {
        element.textContent = prefix + current.toFixed(2) + suffix;
      }

      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ─── Rollout Mode Toggle ─────────────────────────────────────────
  function initRolloutToggle() {
    const buttons = document.querySelectorAll('.rollout-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        PriceOptimizer.setConfig({ rolloutMode: mode });
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateRolloutIndicator(mode);
        showToast(`Rollout mode changed to ${mode.toUpperCase()}`, 'info');
      });
    });
  }

  function updateRolloutIndicator(mode) {
    const indicator = document.getElementById('rollout-indicator');
    if (!indicator) return;
    const labels = { shadow: '👁️ Shadow', canary: '🧪 Canary', live: '🚀 Live' };
    const colors = { shadow: '#94a3b8', canary: '#f59e0b', live: '#22c55e' };
    indicator.textContent = labels[mode] || mode;
    indicator.style.color = colors[mode] || '#94a3b8';
    indicator.style.borderColor = colors[mode] || '#94a3b8';
  }

  // ─── Objective Selector ──────────────────────────────────────────
  function initObjectiveSelector() {
    const buttons = document.querySelectorAll('.objective-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const objective = btn.dataset.objective;
        PriceOptimizer.setConfig({ objective });
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(`Objective changed to ${objective.toUpperCase()}`, 'info');
        // Re-render current section
        if (currentSection === 'products') App.renderProducts();
        else if (currentSection === 'dashboard') App.renderDashboard();
      });
    });
  }

  // ─── Filter & Sort ───────────────────────────────────────────────
  function initFilters() {
    const categoryBtns = document.querySelectorAll('.filter-category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterCategory = btn.dataset.category;
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        App.renderProducts();
      });
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        sortBy = sortSelect.value;
        App.renderProducts();
      });
    }
  }

  function getFilters() {
    return { category: filterCategory, sortBy };
  }

  // ─── Utility ─────────────────────────────────────────────────────
  function formatCurrency(n) {
    return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPercent(n) {
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  return {
    initNavigation,
    navigateTo,
    openModal,
    closeModal,
    openProductDetail,
    closeProductDetail,
    showToast,
    animateCounter,
    initRolloutToggle,
    updateRolloutIndicator,
    initObjectiveSelector,
    initFilters,
    getFilters,
    formatCurrency,
    formatPercent,
    getCurrentSection: () => currentSection,
    getSelectedProduct: () => selectedProduct,
  };
})();
