/**
 * PriceFlow AI — Price Optimization Engine
 *
 * Implements constrained revenue/profit optimization
 * with safety rails, rate limiting, and rollout controls.
 */

const PriceOptimizer = (() => {

  // ─── Default Configuration ────────────────────────────────────────
  const DEFAULT_CONFIG = {
    objective: 'revenue',        // 'revenue' | 'profit' | 'margin'
    minMargin: 0.10,             // 10% minimum margin above cost
    maxChangePercent: 0.15,      // Max ±15% change per adjustment
    priceSteps: 100,             // Granularity of price search
    rolloutMode: 'shadow',       // 'shadow' | 'canary' | 'live'
    canaryPercent: 10,           // % of traffic in canary mode
    rateLimit: 24,               // Hours between price changes
  };

  let config = { ...DEFAULT_CONFIG };
  let priceChangeLog = [];
  let lockedProducts = new Set();

  // ─── Optimizer Core ───────────────────────────────────────────────

  function optimize(product, features = {}) {
    const floor = computeFloor(product);
    const ceiling = computeCeiling(product);
    const currentPrice = product.currentPrice || product.basePrice;

    // Rate limit check
    const lastChange = getLastChange(product.id);
    const hoursAgo = lastChange
      ? (Date.now() - lastChange.timestamp) / (1000 * 60 * 60)
      : Infinity;
    const rateLimited = hoursAgo < config.rateLimit;

    // Locked check
    const isLocked = lockedProducts.has(product.id);

    // Generate candidate prices
    const step = (ceiling - floor) / config.priceSteps;
    let bestPrice = currentPrice;
    let bestScore = -Infinity;
    let bestDemand = 0;
    const scores = [];

    for (let price = floor; price <= ceiling; price += step) {
      // Apply max change constraint
      const changePct = (price - currentPrice) / currentPrice;
      if (Math.abs(changePct) > config.maxChangePercent) continue;

      const priceToBase = price / product.basePrice;
      const f = {
        ...features,
        priceToBase,
        priceToCompetitor: price / (features.competitorPrice || product.basePrice),
      };

      const prediction = PredictionModels.ensemblePredict(product, f);
      const demand = prediction.predicted;

      let score;
      switch (config.objective) {
        case 'profit':
          score = (price - product.cost) * demand;
          break;
        case 'margin':
          score = ((price - product.cost) / price) * demand;
          break;
        case 'revenue':
        default:
          score = price * demand;
          break;
      }

      scores.push({ price: Math.round(price * 100) / 100, demand, score: Math.round(score * 100) / 100 });

      if (score > bestScore) {
        bestScore = score;
        bestPrice = price;
        bestDemand = demand;
      }
    }

    bestPrice = Math.round(bestPrice * 100) / 100;
    const changePct = ((bestPrice - currentPrice) / currentPrice * 100);
    const revenueImpact = bestPrice * bestDemand - currentPrice * bestDemand;
    const profitImpact = (bestPrice - product.cost) * bestDemand - (currentPrice - product.cost) * bestDemand;

    return {
      productId: product.id,
      currentPrice,
      suggestedPrice: bestPrice,
      floor: Math.round(floor * 100) / 100,
      ceiling: Math.round(ceiling * 100) / 100,
      changePercent: Math.round(changePct * 100) / 100,
      predictedDemand: bestDemand,
      expectedRevenue: Math.round(bestPrice * bestDemand * 100) / 100,
      expectedProfit: Math.round((bestPrice - product.cost) * bestDemand * 100) / 100,
      revenueImpact: Math.round(revenueImpact * 100) / 100,
      profitImpact: Math.round(profitImpact * 100) / 100,
      margin: Math.round((bestPrice - product.cost) / bestPrice * 100 * 100) / 100,
      objective: config.objective,
      rateLimited,
      isLocked,
      canApply: !rateLimited && !isLocked && config.rolloutMode !== 'shadow',
      rolloutMode: config.rolloutMode,
      scores, // Full score curve for charts
      timestamp: Date.now(),
    };
  }

  function batchOptimize(products, features = {}) {
    const results = products.map(p => {
      const history = DataEngine.getProductHistory(p.id);
      const latestRecord = history[history.length - 1] || {};
      const f = {
        ...features,
        isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
        holidayBoost: DataEngine.getHolidayProximity(new Date()).boost,
        competitorPrice: latestRecord.competitorPrice || p.basePrice,
        stockLevel: p.currentStock < 20 ? 'low' : p.currentStock < 80 ? 'medium' : 'high',
        demandLag7: latestRecord.demand || 30,
        month: new Date().getMonth(),
      };
      return optimize(p, f);
    });

    // Aggregate metrics
    const totalCurrentRevenue = results.reduce((s, r) => s + r.currentPrice * r.predictedDemand, 0);
    const totalOptimizedRevenue = results.reduce((s, r) => s + r.expectedRevenue, 0);
    const totalRevenueImpact = totalOptimizedRevenue - totalCurrentRevenue;
    const avgChangePercent = results.reduce((s, r) => s + Math.abs(r.changePercent), 0) / results.length;

    return {
      results,
      summary: {
        totalProducts: products.length,
        totalCurrentRevenue: Math.round(totalCurrentRevenue),
        totalOptimizedRevenue: Math.round(totalOptimizedRevenue),
        totalRevenueImpact: Math.round(totalRevenueImpact),
        revenueLift: Math.round(totalRevenueImpact / totalCurrentRevenue * 100 * 100) / 100,
        avgChangePercent: Math.round(avgChangePercent * 100) / 100,
        priceIncreases: results.filter(r => r.changePercent > 0.5).length,
        priceDecreases: results.filter(r => r.changePercent < -0.5).length,
        unchanged: results.filter(r => Math.abs(r.changePercent) <= 0.5).length,
      },
    };
  }

  // ─── Safety Rails ─────────────────────────────────────────────────

  function computeFloor(product) {
    return product.cost * (1 + config.minMargin);
  }

  function computeCeiling(product) {
    return product.msrp || product.basePrice * 1.5;
  }

  function validatePrice(product, price) {
    const floor = computeFloor(product);
    const ceiling = computeCeiling(product);
    const currentPrice = product.currentPrice || product.basePrice;
    const changePct = Math.abs((price - currentPrice) / currentPrice);

    const violations = [];
    if (price < floor) violations.push(`Below floor ($${floor.toFixed(2)})`);
    if (price > ceiling) violations.push(`Above ceiling ($${ceiling.toFixed(2)})`);
    if (changePct > config.maxChangePercent)
      violations.push(`Exceeds max change (${(config.maxChangePercent * 100).toFixed(0)}%)`);
    if (lockedProducts.has(product.id)) violations.push('Product is locked');

    return {
      valid: violations.length === 0,
      violations,
      floor: Math.round(floor * 100) / 100,
      ceiling: Math.round(ceiling * 100) / 100,
      maxChange: config.maxChangePercent,
    };
  }

  // ─── Price Application & Audit ────────────────────────────────────

  function applyPrice(product, newPrice, reason = 'Optimizer recommendation') {
    if (config.rolloutMode === 'shadow') {
      return { applied: false, reason: 'Shadow mode — price not applied' };
    }

    const validation = validatePrice(product, newPrice);
    if (!validation.valid) {
      return { applied: false, reason: validation.violations.join('; ') };
    }

    const entry = {
      productId: product.id,
      productName: product.name,
      oldPrice: product.currentPrice || product.basePrice,
      newPrice: Math.round(newPrice * 100) / 100,
      changePercent: Math.round((newPrice - (product.currentPrice || product.basePrice)) / (product.currentPrice || product.basePrice) * 100 * 100) / 100,
      reason,
      rolloutMode: config.rolloutMode,
      canaryPercent: config.rolloutMode === 'canary' ? config.canaryPercent : 100,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    };

    priceChangeLog.unshift(entry);
    product.currentPrice = entry.newPrice;

    return { applied: true, entry };
  }

  function getLastChange(productId) {
    return priceChangeLog.find(e => e.productId === productId);
  }

  // ─── Configuration ───────────────────────────────────────────────

  function setConfig(newConfig) {
    config = { ...config, ...newConfig };
  }

  function getConfig() {
    return { ...config };
  }

  function lockProduct(productId) {
    lockedProducts.add(productId);
  }

  function unlockProduct(productId) {
    lockedProducts.delete(productId);
  }

  function isLocked(productId) {
    return lockedProducts.has(productId);
  }

  function getChangeLog() {
    return [...priceChangeLog];
  }

  function clearChangeLog() {
    priceChangeLog = [];
  }

  // ─── What-If Scenario ────────────────────────────────────────────

  function whatIf(product, scenario) {
    const features = {
      isWeekend: scenario.isWeekend ?? false,
      holidayBoost: scenario.holidayBoost ?? 0,
      competitorPrice: scenario.competitorPrice ?? product.basePrice,
      stockLevel: scenario.stockLevel ?? 'medium',
      demandLag7: scenario.demandLag7 ?? 30,
      month: scenario.month ?? new Date().getMonth(),
    };
    return optimize(product, features);
  }

  // ─── Public API ──────────────────────────────────────────────────
  return {
    optimize,
    batchOptimize,
    validatePrice,
    applyPrice,
    whatIf,
    setConfig,
    getConfig,
    lockProduct,
    unlockProduct,
    isLocked,
    getChangeLog,
    clearChangeLog,
    computeFloor,
    computeCeiling,
  };
})();
