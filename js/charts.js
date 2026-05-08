/**
 * PriceFlow AI — Chart Rendering Module
 * Uses Chart.js for all visualizations.
 */

const Charts = (() => {
  // Color palette
  const COLORS = {
    primary: '#6366f1',
    primaryLight: 'rgba(99, 102, 241, 0.15)',
    secondary: '#06b6d4',
    secondaryLight: 'rgba(6, 182, 212, 0.15)',
    accent: '#f59e0b',
    accentLight: 'rgba(245, 158, 11, 0.15)',
    success: '#22c55e',
    successLight: 'rgba(34, 197, 94, 0.15)',
    danger: '#ef4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    grid: 'rgba(148, 163, 184, 0.08)',
    tooltip: 'rgba(15, 23, 42, 0.95)',
  };

  const chartInstances = {};

  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  }

  // ─── Shared Chart Options ────────────────────────────────────────
  function baseOptions(title = '') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: COLORS.text, font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true },
        },
        title: {
          display: !!title,
          text: title,
          color: COLORS.text,
          font: { family: 'Inter', size: 14, weight: '600' },
          padding: { bottom: 16 },
        },
        tooltip: {
          backgroundColor: COLORS.tooltip,
          titleColor: COLORS.text,
          bodyColor: COLORS.textMuted,
          borderColor: 'rgba(99, 102, 241, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
        },
      },
      scales: {
        x: {
          ticks: { color: COLORS.textMuted, font: { family: 'Inter', size: 11 } },
          grid: { color: COLORS.grid },
        },
        y: {
          ticks: { color: COLORS.textMuted, font: { family: 'JetBrains Mono', size: 11 } },
          grid: { color: COLORS.grid },
        },
      },
    };
  }

  // ─── Revenue Overview Chart ──────────────────────────────────────
  function renderRevenueChart(canvasId, history, optimizedHistory) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = history.map(h => {
      const d = new Date(h.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const opts = baseOptions();
    opts.scales.y.ticks.callback = (v) => '$' + v.toLocaleString();

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual Revenue',
            data: history.map(h => h.revenue),
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primaryLight,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
          {
            label: 'Optimized Projection',
            data: optimizedHistory.map(h => h.revenue),
            borderColor: COLORS.success,
            backgroundColor: COLORS.successLight,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            borderWidth: 2,
            borderDash: [6, 3],
          },
        ],
      },
      options: opts,
    });
    return chartInstances[canvasId];
  }

  // ─── Demand Curve Chart ──────────────────────────────────────────
  function renderDemandCurve(canvasId, curveData, currentPrice, suggestedPrice, floor, ceiling) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const opts = baseOptions();
    opts.scales.x.title = { display: true, text: 'Price ($)', color: COLORS.textMuted, font: { family: 'Inter' } };
    opts.scales.y.title = { display: true, text: 'Predicted Demand (units)', color: COLORS.textMuted, font: { family: 'Inter' } };

    // Annotations for floor/ceiling/current/suggested
    opts.plugins.annotation = {
      annotations: {
        floorLine: {
          type: 'line', xMin: floor, xMax: floor,
          borderColor: COLORS.danger, borderDash: [4, 4], borderWidth: 1.5,
          label: { display: true, content: 'Floor', position: 'start', backgroundColor: COLORS.danger, font: { size: 10 } },
        },
        ceilingLine: {
          type: 'line', xMin: ceiling, xMax: ceiling,
          borderColor: COLORS.danger, borderDash: [4, 4], borderWidth: 1.5,
          label: { display: true, content: 'Ceiling', position: 'start', backgroundColor: COLORS.danger, font: { size: 10 } },
        },
        currentLine: {
          type: 'line', xMin: currentPrice, xMax: currentPrice,
          borderColor: COLORS.accent, borderWidth: 2,
          label: { display: true, content: `Current $${currentPrice}`, position: 'end', backgroundColor: COLORS.accent, font: { size: 10 } },
        },
        suggestedLine: {
          type: 'line', xMin: suggestedPrice, xMax: suggestedPrice,
          borderColor: COLORS.success, borderWidth: 2,
          label: { display: true, content: `Suggested $${suggestedPrice}`, position: 'end', backgroundColor: COLORS.success, font: { size: 10 } },
        },
      },
    };

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curveData.map(d => '$' + d.price.toFixed(2)),
        datasets: [
          {
            label: 'Ensemble Demand',
            data: curveData.map(d => d.demand),
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primaryLight,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2.5,
          },
          {
            label: 'Confidence Band (Upper)',
            data: curveData.map(d => d.demandUpper),
            borderColor: 'transparent',
            backgroundColor: COLORS.primaryLight,
            fill: '+1',
            pointRadius: 0,
            borderWidth: 0,
          },
          {
            label: 'Confidence Band (Lower)',
            data: curveData.map(d => d.demandLower),
            borderColor: 'transparent',
            backgroundColor: COLORS.primaryLight,
            fill: '-1',
            pointRadius: 0,
            borderWidth: 0,
          },
        ],
      },
      options: opts,
    });
    return chartInstances[canvasId];
  }

  // ─── Revenue Curve Chart ─────────────────────────────────────────
  function renderRevenueCurve(canvasId, curveData, currentPrice, suggestedPrice) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const opts = baseOptions();
    opts.scales.x.title = { display: true, text: 'Price ($)', color: COLORS.textMuted, font: { family: 'Inter' } };
    opts.scales.y.title = { display: true, text: 'Expected Revenue ($)', color: COLORS.textMuted, font: { family: 'Inter' } };
    opts.scales.y.ticks.callback = (v) => '$' + v.toLocaleString();

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curveData.map(d => '$' + d.price.toFixed(2)),
        datasets: [
          {
            label: 'Revenue',
            data: curveData.map(d => d.revenue),
            borderColor: COLORS.secondary,
            backgroundColor: COLORS.secondaryLight,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2.5,
          },
          {
            label: 'Profit',
            data: curveData.map(d => d.profit),
            borderColor: COLORS.success,
            backgroundColor: COLORS.successLight,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
            borderDash: [5, 3],
          },
        ],
      },
      options: opts,
    });
    return chartInstances[canvasId];
  }

  // ─── Feature Importance Bar Chart ────────────────────────────────
  function renderFeatureImportance(canvasId, importanceData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const opts = baseOptions();
    opts.indexAxis = 'y';
    opts.scales.x.ticks.callback = (v) => v + '%';
    opts.plugins.legend.display = false;

    const gradient = importanceData.map((_, i) => {
      const t = i / importanceData.length;
      return `hsl(${240 - t * 60}, 70%, ${55 + t * 10}%)`;
    });

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: importanceData.map(d => d.name),
        datasets: [{
          data: importanceData.map(d => d.value),
          backgroundColor: gradient,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 20,
        }],
      },
      options: opts,
    });
    return chartInstances[canvasId];
  }

  // ─── Price History Timeline ──────────────────────────────────────
  function renderPriceHistory(canvasId, history) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = history.map(h => {
      const d = new Date(h.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const opts = baseOptions();
    opts.scales.y.ticks.callback = (v) => '$' + v.toFixed(2);
    opts.scales.y1 = {
      position: 'right',
      ticks: { color: COLORS.textMuted, font: { family: 'JetBrains Mono', size: 11 } },
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Demand (units)', color: COLORS.textMuted },
    };

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Price',
            data: history.map(h => h.price),
            borderColor: COLORS.accent,
            backgroundColor: COLORS.accentLight,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Competitor Price',
            data: history.map(h => h.competitorPrice),
            borderColor: COLORS.danger,
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 4],
            yAxisID: 'y',
          },
          {
            label: 'Demand',
            data: history.map(h => h.demand),
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primaryLight,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y1',
          },
        ],
      },
      options: opts,
    });
    return chartInstances[canvasId];
  }

  // ─── Sparkline (Mini chart for product cards) ─────────────────────
  function renderSparkline(canvasId, data, color = COLORS.primary) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });
    return chartInstances[canvasId];
  }

  // ─── Category Revenue Doughnut ───────────────────────────────────
  function renderCategoryBreakdown(canvasId, categoryData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.map(c => c.name),
        datasets: [{
          data: categoryData.map(c => c.revenue),
          backgroundColor: categoryData.map(c => c.color),
          borderColor: 'rgba(10, 14, 39, 0.8)',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: COLORS.text, font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: COLORS.tooltip,
            titleColor: COLORS.text,
            bodyColor: COLORS.textMuted,
            cornerRadius: 8,
            padding: 12,
            callbacks: { label: (ctx) => ` $${ctx.parsed.toLocaleString()}` },
          },
        },
      },
    });
    return chartInstances[canvasId];
  }

  return {
    renderRevenueChart,
    renderDemandCurve,
    renderRevenueCurve,
    renderFeatureImportance,
    renderPriceHistory,
    renderSparkline,
    renderCategoryBreakdown,
    destroyChart,
    COLORS,
  };
})();
