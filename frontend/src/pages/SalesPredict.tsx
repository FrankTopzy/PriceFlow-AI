import { useState } from 'react';
import { UploadCloud, File, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function SalesPredict() {
  const [file, setFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useCurrency();
  
  // Form state
  const [formData, setFormData] = useState({
    price: 150.00,
    competitor_price: 145.00,
    last_week_price: 155.00,
    last_week_sales: 300,
    available_stock: 500,
    products_sold: 1200,
    revenue_generated: 180000.00,
    marketing_spend: 60000,
    store_traffic: 1500,
    season: 'monsoon',
    day_of_week: 'monday',
    promotion_active: 'no'
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    const numValue = Number(value);
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? '' : numValue / currency.rate
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === 'season' || name === 'day_of_week' || name === 'promotion_active' ? value : Number(value)
    }));
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    setPrediction(null);
    setAdvice(null);
    setError(null);
    try {
      if (file) {
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
          throw new Error('Invalid file type. Please upload a valid CSV dataset.');
        }
      } else {
        throw new Error('Please upload a dataset to calibrate the sales model.');
      }

      // Simulate API call to training/prediction endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deterministic simulation based on inputs (to mock the sales prediction)
      const price = Number(formData.price) || 0;
      const compPrice = Number(formData.competitor_price) || price;
      const lastWeekPrice = Number(formData.last_week_price) || price;
      const lastWeekSales = Number(formData.last_week_sales) || 0;
      const availableStock = Number(formData.available_stock) || 0;
      const productsSold = Number(formData.products_sold) || 0;
      const revenueGenerated = Number(formData.revenue_generated) || 0;
      const marketing = Number(formData.marketing_spend) || 0;
      const traffic = Number(formData.store_traffic) || 0;

      // Base sales tied to traffic and historical sales
      let estimatedSales = (traffic * 0.15 * 0.5) + (lastWeekSales * 0.5); // Blended baseline

      // Price Elasticity against Last Week
      if (price > lastWeekPrice) {
        estimatedSales *= 0.90; // Drop if price increased
      } else if (price < lastWeekPrice) {
        estimatedSales *= 1.15; // Boost if price decreased
      }

      // 1. Price vs Competitor
      if (price > compPrice) {
        estimatedSales *= 0.85; // 15% drop if more expensive
      } else if (price < compPrice) {
        estimatedSales *= 1.20; // 20% boost if cheaper
      }

      // 2. Marketing Boost
      if (marketing > 1000) {
        estimatedSales *= (1 + (marketing / 10000));
      }

      // 3. Promotion
      if (formData.promotion_active === 'yes') {
        estimatedSales *= 1.35; // 35% boost during promo
      }

      // 4. Seasonality
      if (formData.season === 'festival') estimatedSales *= 1.5;
      else if (formData.season === 'winter') estimatedSales *= 1.1;

      // 5. Day of week
      if (['saturday', 'sunday'].includes(formData.day_of_week)) {
        estimatedSales *= 1.4;
      }

      // Momentum from past success
      if (productsSold > 1000 && revenueGenerated > 100000) {
        estimatedSales *= 1.05; // 5% boost for established products
      }

      // Cap estimated sales to available stock
      if (estimatedSales > availableStock) {
        estimatedSales = availableStock;
      }

      let generatedAdvice = '';
      if (estimatedSales >= availableStock && availableStock > 0) {
        generatedAdvice = 'Warning: Your predicted sales meet or exceed your available stock. Consider restocking immediately or raising prices to maximize profit on remaining units.';
      } else if (price > compPrice) {
        generatedAdvice = 'Consider lowering your price. You are currently priced higher than your competitor, which restricts your sales volume.';
      } else if (marketing < 2000) {
        generatedAdvice = 'Your marketing spend is relatively low. Increasing it could help you capture more market share.';
      } else if (formData.promotion_active === 'no') {
        generatedAdvice = 'Running a promotion could provide a temporary volume boost to edge out competitors.';
      } else {
        generatedAdvice = 'Your pricing and marketing strategies are highly competitive. Maintain these levels to maximize margins.';
      }
      setAdvice(generatedAdvice);
      setPrediction(Math.round(estimatedSales));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during prediction.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
      
      {/* Upload and Form Panel */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-y-auto pr-2">
        
        {/* Upload Card */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UploadCloud size={24} className="text-primary" />
                Sales History Dataset
              </h2>
              <p className="text-sm text-text-secondary mt-1">Upload your historical sales data to train the demand forecasting model.</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer group">
            {file ? (
              <div className="flex flex-col items-center text-accent-success">
                <File size={40} className="mb-2" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-text-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <>
                <UploadCloud size={40} className="text-text-secondary mb-3 group-hover:text-primary transition-colors" />
                <p className="font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-text-secondary">CSV files only (max. 50MB)</p>
              </>
            )}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              id="file-upload"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setError(null);
                }
              }}
            />
            <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
          </div>
        </div>

        {/* Manual Variables Form */}
        <div className="glass-card rounded-xl p-6 relative">
          {!file && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center">
              <div className="bg-surface border border-border p-4 rounded-lg shadow-xl flex items-center gap-3">
                <AlertCircle size={20} className="text-accent-warning" />
                <span className="font-medium">Please upload the dataset first to enable predictions.</span>
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={24} className="text-secondary" />
            Forecast Variables
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Your Price ({currency.symbol})</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price ? Number((formData.price * currency.rate).toFixed(2)) : ''} 
                onChange={handlePriceChange} 
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Competitor Price ({currency.symbol})</label>
              <input 
                type="number" 
                name="competitor_price" 
                value={formData.competitor_price ? Number((formData.competitor_price * currency.rate).toFixed(2)) : ''} 
                onChange={handlePriceChange} 
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Last Week Price ({currency.symbol})</label>
              <input 
                type="number" 
                name="last_week_price" 
                value={formData.last_week_price ? Number((formData.last_week_price * currency.rate).toFixed(2)) : ''} 
                onChange={handlePriceChange} 
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Last Week Sales (Units)</label>
              <input type="number" name="last_week_sales" value={formData.last_week_sales} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Available Products (Stock)</label>
              <input type="number" name="available_stock" value={formData.available_stock} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Total Products Sold</label>
              <input type="number" name="products_sold" value={formData.products_sold} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Total Revenue Generated ({currency.symbol})</label>
              <input 
                type="number" 
                name="revenue_generated" 
                value={formData.revenue_generated ? Number((formData.revenue_generated * currency.rate).toFixed(2)) : ''} 
                onChange={handlePriceChange} 
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Store / Site Traffic (Users/Day)</label>
              <input type="number" name="store_traffic" value={formData.store_traffic} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Marketing Spend ({currency.symbol})</label>
              <input 
                type="number" 
                name="marketing_spend" 
                value={formData.marketing_spend ? Number((formData.marketing_spend * currency.rate).toFixed(2)) : ''} 
                onChange={handlePriceChange} 
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Season</label>
              <select name="season" value={formData.season} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none">
                <option value="monsoon">Monsoon</option>
                <option value="winter">Winter</option>
                <option value="summer">Summer</option>
                <option value="festival">Festival</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Day of Week</label>
              <select name="day_of_week" value={formData.day_of_week} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none">
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Promotion Active</label>
              <select name="promotion_active" value={formData.promotion_active} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl p-6 flex flex-col items-center justify-center shrink-0 min-h-[300px]">
        <h3 className="font-bold text-lg mb-8 w-full text-center border-b border-border pb-4">Sales Forecast</h3>
        
        {prediction !== null ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5 relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
              <TrendingUp size={48} className="text-primary" />
            </div>
            <div className="text-sm text-text-secondary mb-1">Estimated Daily Sales Volume</div>
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2 flex items-baseline gap-2">
              {prediction.toLocaleString()} <span className="text-xl text-text-secondary font-normal">units</span>
            </div>
            <div className="text-xs font-medium text-accent-success bg-accent-success/10 px-3 py-1 rounded-full mt-4 mb-4">
              Model Confidence: 89.4%
            </div>
            {advice && (
              <div className="w-full bg-surface border border-primary/20 rounded-lg p-4 text-sm text-text-primary text-center mt-2 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <span className="font-semibold text-primary flex items-center justify-center gap-2 mb-1">
                  <TrendingUp size={16} /> Strategic Advice
                </span>
                {advice}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <BarChart3 size={64} className="text-text-secondary opacity-20 mb-6" />
            <p className="text-text-secondary mb-8">Upload dataset and enter variables to generate a sales volume forecast.</p>
          </div>
        )}

        <button 
          onClick={handlePredict}
          disabled={!file || isPredicting}
          className="mt-auto w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isPredicting ? (
            <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Training & Forecasting...</>
          ) : (
            "Predict Sales Volume"
          )}
        </button>
      </div>

    </div>
  );
}
