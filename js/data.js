/**
 * PriceFlow AI — Synthetic Data Engine
 * Generates realistic product catalogs, historical transactions,
 * competitor pricing, and engineered features for demand prediction.
 */

const DataEngine = (() => {
  // Seeded random for reproducibility
  let _seed = 42;
  function seededRandom() {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
  }
  function randBetween(min, max) {
    return min + seededRandom() * (max - min);
  }
  function randInt(min, max) {
    return Math.floor(randBetween(min, max + 1));
  }
  function gaussianRandom(mean = 0, std = 1) {
    const u1 = seededRandom();
    const u2 = seededRandom();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z * std + mean;
  }

  // ─── Product Catalog ─────────────────────────────────────────────
  const CATEGORIES = [
    { name: 'Electronics', icon: '⚡', color: '#6366f1' },
    { name: 'Fashion', icon: '👗', color: '#ec4899' },
    { name: 'Home & Living', icon: '🏠', color: '#14b8a6' },
    { name: 'Food & Beverage', icon: '🍕', color: '#f59e0b' },
  ];

  const PRODUCTS = [
    // Electronics
    { id: 'E001', name: 'Wireless Earbuds Pro', category: 0, cost: 18, basePrice: 49.99, msrp: 79.99, elasticity: -2.1, brand: 'SoundCore', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80' },
    { id: 'E002', name: 'Smart Watch Ultra', category: 0, cost: 85, basePrice: 199.99, msrp: 299.99, elasticity: -1.8, brand: 'TechFit', image: 'https://images.unsplash.com/photo-1544117518-2b041580c79d?w=800&q=80' },
    { id: 'E003', name: 'Portable Charger 20K', category: 0, cost: 12, basePrice: 34.99, msrp: 49.99, elasticity: -2.5, brand: 'PowerMax', image: 'https://images.unsplash.com/photo-1609091839311-d536819bc248?w=800&q=80' },
    { id: 'E004', name: 'Bluetooth Speaker', category: 0, cost: 22, basePrice: 59.99, msrp: 89.99, elasticity: -1.9, brand: 'SoundCore', image: 'https://images.unsplash.com/photo-1608156639585-b3a034ef9199?w=800&q=80' },
    { id: 'E005', name: 'USB-C Hub 7-in-1', category: 0, cost: 15, basePrice: 39.99, msrp: 59.99, elasticity: -1.6, brand: 'ConnectPro', image: 'https://images.unsplash.com/photo-1562770584-eaf50b017307?w=800&q=80' },
    // Fashion
    { id: 'F001', name: 'Premium Hoodie', category: 1, cost: 14, basePrice: 54.99, msrp: 79.99, elasticity: -2.3, brand: 'UrbanThread', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80' },
    { id: 'F002', name: 'Running Sneakers V2', category: 1, cost: 28, basePrice: 89.99, msrp: 129.99, elasticity: -1.7, brand: 'StrideFlex', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
    { id: 'F003', name: 'Leather Crossbody Bag', category: 1, cost: 20, basePrice: 64.99, msrp: 99.99, elasticity: -1.5, brand: 'CraftLeather', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
    { id: 'F004', name: 'Aviator Sunglasses', category: 1, cost: 8, basePrice: 29.99, msrp: 49.99, elasticity: -2.8, brand: 'ShadeCraft', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80' },
    { id: 'F005', name: 'Slim Fit Chinos', category: 1, cost: 16, basePrice: 49.99, msrp: 69.99, elasticity: -2.0, brand: 'UrbanThread', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80' },
    // Home & Living
    { id: 'H001', name: 'Scented Candle Set', category: 2, cost: 6, basePrice: 24.99, msrp: 39.99, elasticity: -3.0, brand: 'GlowHaus', image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=800&q=80' },
    { id: 'H002', name: 'Memory Foam Pillow', category: 2, cost: 12, basePrice: 44.99, msrp: 64.99, elasticity: -1.9, brand: 'DreamRest', image: 'https://images.unsplash.com/photo-1595191830227-705777799c39?w=800&q=80' },
    { id: 'H003', name: 'Plant Grow Light', category: 2, cost: 10, basePrice: 29.99, msrp: 44.99, elasticity: -2.2, brand: 'GreenGlow', image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e5f?w=800&q=80' },
    { id: 'H004', name: 'Ceramic Dinner Set', category: 2, cost: 25, basePrice: 79.99, msrp: 119.99, elasticity: -1.4, brand: 'ArtisanHome', image: 'https://images.unsplash.com/photo-1577113310929-212b130fca6a?w=800&q=80' },
    { id: 'H005', name: 'Essential Oil Diffuser', category: 2, cost: 9, basePrice: 34.99, msrp: 54.99, elasticity: -2.4, brand: 'GlowHaus', image: 'https://images.unsplash.com/photo-1608501821300-4f99e58baf77?w=800&q=80' },
    // Food & Beverage
    { id: 'D001', name: 'Artisan Coffee Beans 1kg', category: 3, cost: 8, basePrice: 22.99, msrp: 34.99, elasticity: -1.3, brand: 'BeanCraft', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80' },
    { id: 'D002', name: 'Organic Matcha Powder', category: 3, cost: 10, basePrice: 29.99, msrp: 44.99, elasticity: -1.6, brand: 'ZenLeaf', image: 'https://images.unsplash.com/photo-1582733315328-d46ed995e38a?w=800&q=80' },
    { id: 'D003', name: 'Protein Bar Box (12pk)', category: 3, cost: 7, basePrice: 19.99, msrp: 29.99, elasticity: -2.6, brand: 'FuelBar', image: 'https://images.unsplash.com/photo-1622484210800-403487c06830?w=800&q=80' },
    { id: 'D004', name: 'Hot Sauce Collection', category: 3, cost: 5, basePrice: 16.99, msrp: 24.99, elasticity: -2.9, brand: 'FireKitchen', image: 'https://images.unsplash.com/photo-1594921129803-c1aa574488ae?w=800&q=80' },
    { id: 'D005', name: 'Trail Mix Premium 500g', category: 3, cost: 4, basePrice: 12.99, msrp: 19.99, elasticity: -3.2, brand: 'NutHarvest', image: 'https://images.unsplash.com/photo-1536591375315-1b83cc9065ce?w=800&q=80' },
  ];

  // ─── Holiday / Event Calendar ────────────────────────────────────
  const HOLIDAYS = [
    { month: 0, day: 1, name: 'New Year', boost: 0.15 },
    { month: 1, day: 14, name: 'Valentine\'s Day', boost: 0.20 },
    { month: 3, day: 15, name: 'Easter', boost: 0.10 },
    { month: 4, day: 12, name: 'Mother\'s Day', boost: 0.18 },
    { month: 5, day: 15, name: 'Summer Sale', boost: 0.25 },
    { month: 9, day: 31, name: 'Halloween', boost: 0.12 },
    { month: 10, day: 25, name: 'Black Friday', boost: 0.40 },
    { month: 10, day: 28, name: 'Cyber Monday', boost: 0.35 },
    { month: 11, day: 25, name: 'Christmas', boost: 0.30 },
  ];

  function getHolidayProximity(date) {
    let minDist = 365;
    let closestBoost = 0;
    let closestName = null;
    HOLIDAYS.forEach(h => {
      const hDate = new Date(date.getFullYear(), h.month, h.day);
      const diff = Math.abs((date - hDate) / (1000 * 60 * 60 * 24));
      if (diff < minDist) {
        minDist = diff;
        closestBoost = h.boost;
        closestName = h.name;
      }
    });
    // Proximity factor decays with distance, peaks within 3 days
    const factor = minDist <= 3 ? closestBoost : closestBoost * Math.max(0, 1 - minDist / 14);
    return { distance: minDist, boost: factor, name: closestName };
  }

  // ─── Generate Historical Data ────────────────────────────────────
  function generateHistory(product, days = 90) {
    const history = [];
    const today = new Date();
    const baseDemand = 30 + Math.abs(product.elasticity) * 8; // higher elasticity → more base volume

    for (let d = days; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);

      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const monthProgress = date.getDate() / 30;
      const holiday = getHolidayProximity(date);

      // Price varies ±20% around base over time (simulating past adjustments)
      const priceFactor = 1 + 0.15 * Math.sin(2 * Math.PI * d / 30) + gaussianRandom(0, 0.03);
      const price = Math.max(product.cost * 1.1, product.basePrice * priceFactor);

      // Demand model: log-linear with noise
      const priceRatio = price / product.basePrice;
      let demand = baseDemand * Math.pow(priceRatio, product.elasticity);

      // Weekend boost
      if (isWeekend) demand *= 1.15;

      // Holiday boost
      demand *= (1 + holiday.boost);

      // Seasonal pattern (summer bump for certain categories)
      const month = date.getMonth();
      if (product.category === 1 && (month >= 4 && month <= 7)) demand *= 1.12;
      if (product.category === 3 && (month >= 10 || month <= 1)) demand *= 1.18;

      // Random noise
      demand *= (1 + gaussianRandom(0, 0.08));
      demand = Math.max(1, Math.round(demand));

      // Competitor price
      const competitorPrice = product.basePrice * (1 + randBetween(-0.15, 0.15));

      // Stock level
      const stock = Math.max(5, Math.round(200 - demand * 2 + randBetween(-20, 20)));

      history.push({
        date: date.toISOString().split('T')[0],
        dateObj: date,
        price: Math.round(price * 100) / 100,
        demand,
        revenue: Math.round(price * demand * 100) / 100,
        profit: Math.round((price - product.cost) * demand * 100) / 100,
        competitorPrice: Math.round(competitorPrice * 100) / 100,
        stock,
        isWeekend,
        holidayBoost: holiday.boost,
        holidayName: holiday.name,
        dayOfWeek,
        month,
      });
    }
    return history;
  }

  // ─── Feature Engineering ──────────────────────────────────────────
  function engineerFeatures(history, idx) {
    const record = history[idx];
    const product = PRODUCTS.find(p => p.id === record.productId) || {};

    // Price features
    const priceLag7 = idx >= 7
      ? history.slice(idx - 7, idx).reduce((s, r) => s + r.price, 0) / 7
      : record.price;
    const priceToBase = record.price / (product.basePrice || record.price);
    const priceToCompetitor = record.price / (record.competitorPrice || record.price);

    // Demand lags
    const demandLag1 = idx >= 1 ? history[idx - 1].demand : record.demand;
    const demandLag7 = idx >= 7
      ? history.slice(idx - 7, idx).reduce((s, r) => s + r.demand, 0) / 7
      : record.demand;
    const demandLag30 = idx >= 30
      ? history.slice(idx - 30, idx).reduce((s, r) => s + r.demand, 0) / 30
      : record.demand;

    return {
      ...record,
      priceLag7: Math.round(priceLag7 * 100) / 100,
      priceToBase: Math.round(priceToBase * 1000) / 1000,
      priceToCompetitor: Math.round(priceToCompetitor * 1000) / 1000,
      demandLag1,
      demandLag7: Math.round(demandLag7 * 10) / 10,
      demandLag30: Math.round(demandLag30 * 10) / 10,
      stockLevel: record.stock < 20 ? 'low' : record.stock < 80 ? 'medium' : 'high',
    };
  }

  // ─── Public API ──────────────────────────────────────────────────
  function getProducts() {
    return PRODUCTS.map(p => ({
      ...p,
      category: CATEGORIES[p.category],
      categoryIndex: p.category,
      currentPrice: p.basePrice,
      currentStock: randInt(20, 200),
    }));
  }

  function getProductHistory(productId, days = 90) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return [];
    _seed = product.id.charCodeAt(1) * 1000 + product.id.charCodeAt(3) * 100 + 42;
    const history = generateHistory(product, days);
    history.forEach(h => h.productId = productId);
    return history;
  }

  function getProductFeatures(productId) {
    const history = getProductHistory(productId);
    if (history.length === 0) return [];
    return history.map((_, idx) => engineerFeatures(history, idx));
  }

  function getAllProductsWithHistory() {
    const products = getProducts();
    return products.map(p => ({
      ...p,
      history: getProductHistory(p.id),
    }));
  }

  function getCategories() {
    return [...CATEGORIES];
  }

  function getHolidays() {
    return [...HOLIDAYS];
  }

  function getElasticityLabel(e) {
    const abs = Math.abs(e);
    if (abs < 1) return { label: 'Inelastic', class: 'inelastic', color: '#22c55e' };
    if (abs === 1) return { label: 'Unit Elastic', class: 'unit-elastic', color: '#f59e0b' };
    if (abs < 2.5) return { label: 'Elastic', class: 'elastic', color: '#ef4444' };
    return { label: 'Highly Elastic', class: 'highly-elastic', color: '#dc2626' };
  }

  return {
    getProducts,
    getProductHistory,
    getProductFeatures,
    getAllProductsWithHistory,
    getCategories,
    getHolidays,
    getHolidayProximity,
    getElasticityLabel,
    PRODUCTS,
    CATEGORIES,
  };
})();
