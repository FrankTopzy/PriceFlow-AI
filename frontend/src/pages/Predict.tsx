import { useState } from 'react';
import { Calculator, UploadCloud, File, AlertCircle, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { speak, stopSpeaking } from '../utils/speech';

export default function Predict() {
  const [file, setFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [profitStatus, setProfitStatus] = useState<number | null>(null);
  const [profitOnSold, setProfitOnSold] = useState<number | null>(null);
  const [projectedProfit, setProjectedProfit] = useState<number | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice, currency } = useCurrency();
  
  // Form state
  const [formData, setFormData] = useState({
    current_price: 150.00,
    unit_cost: 120.00,
    competitor_price: 145.00,
    demand_last_week: 320,
    stock_level: 1500,
    marketing_spend: 2000,
    season: 'monsoon',
    day_of_week: 'monday',
    customer_rating: 4.2,
    initial_stock: 2500,
    units_already_sold: 500
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
      [name]: name === 'season' || name === 'day_of_week' ? value : Number(value)
    }));
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    setPrediction(null);
    setProfitStatus(null);
    setProfitOnSold(null);
    setProjectedProfit(null);
    setAdvice(null);
    setError(null);
    try {
      if (file) {
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
          throw new Error('Invalid file type. Please upload a valid CSV dataset.');
        }
        
        const text = await file.text();
        const headers = text.split('\n')[0]?.toLowerCase() || '';
        
        // Simple heuristic to check if it's a pricing dataset
        if (!headers.includes('price') && !headers.includes('demand') && !headers.includes('stock')) {
          throw new Error('Invalid dataset format. Missing required columns (e.g., price, demand).');
        }
      }

      // Simulate API call to prediction endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Deterministic simulation based on inputs
      const basePrice = Number(formData.current_price) || 0;
      const compPrice = Number(formData.competitor_price) || basePrice;
      const rating = Number(formData.customer_rating) || 4.0;
      const stock = Number(formData.stock_level) || 100;
      const demand = Number(formData.demand_last_week) || 100;
      const marketing = Number(formData.marketing_spend) || 0;
      
      const initialStock = Number(formData.initial_stock) || 0;
      const unitsSold = Number(formData.units_already_sold) || 0;
      const unitCost = Number(formData.unit_cost) || 0;

      // Calculate overall profit/loss
      const totalRevenue = unitsSold * basePrice;
      const totalCost = (initialStock * unitCost) + marketing;
      const profit = totalRevenue - totalCost;
      setProfitStatus(profit);

      // Calculate profit specifically on units sold
      const profitFromSold = (unitsSold * basePrice) - (unitsSold * unitCost);
      setProfitOnSold(profitFromSold);

      let adjustment = 0;

      // 1. Competitor Pricing Gravity
      const compRatio = compPrice / (basePrice || 1);
      adjustment += Math.max(-0.08, Math.min(0.08, (compRatio - 1) * 0.6));

      // 2. Stock vs Demand Pressure
      const stockToDemand = stock / (demand || 1);
      if (stockToDemand < 1.0) adjustment += 0.04;
      if (stockToDemand < 0.5) adjustment += 0.06;
      if (stockToDemand > 3.0) adjustment -= 0.05;

      // 3. Customer Rating Premium
      adjustment += (rating - 4.0) * 0.025;

      // 4. Marketing Boost
      if (marketing > 1000) adjustment += 0.02;

      // 5. Seasonality
      if (formData.season === 'festival') adjustment += 0.08;
      else if (formData.season === 'winter') adjustment += 0.02;

      const optimal = basePrice * (1 + adjustment);
      setPrediction(optimal);
      
      // Calculate projected profit on remaining stock at optimal price
      const remainingStock = Math.max(0, initialStock - unitsSold);
      const projectedProfitFromRemaining = remainingStock * (optimal - unitCost);
      setProjectedProfit(projectedProfitFromRemaining);

      // Generate strategic advice
      let generatedAdvice = '';
      if (optimal < unitCost) {
        generatedAdvice = 'Warning: The predicted optimal price is below your unit cost. You will incur a loss on every unit sold. Consider reducing your costs or repositioning your product.';
      } else if (stockToDemand > 2.0 && optimal < basePrice) {
        generatedAdvice = 'Your stock levels are high compared to recent demand. The model suggests a price cut to accelerate sales velocity and clear inventory.';
      } else if (stockToDemand < 0.5 && optimal > basePrice) {
        generatedAdvice = 'Demand is significantly outpacing your inventory. The model suggests raising prices to maximize margins on your limited remaining stock.';
      } else if (optimal > compPrice * 1.1) {
        generatedAdvice = 'The optimal price is noticeably higher than your competitor. Ensure your product offers premium value or superior customer ratings to justify the premium.';
      } else {
        generatedAdvice = 'Your pricing is well-balanced. Implement the predicted price to optimize your balance between sales volume and profit margin.';
      }
      setAdvice(generatedAdvice);

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
                Training Dataset
              </h2>
              <p className="text-sm text-text-secondary mt-1">Upload dynamic_pricing_dataset_realistic.csv to calibrate the model.</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          <div className="relative border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer group">
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
                  setError(null); // Clear error on new file selection
                }
              }}
            />
            {/* Absolute overlay to trigger file input */}
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
            <Calculator size={24} className="text-secondary" />
            Manual Variable Entry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Current Price ({currency.symbol})</label>
              <input 
                type="number" 
                name="current_price" 
                value={formData.current_price ? Number((formData.current_price * currency.rate).toFixed(2)) : ''} 
                onChange={handlePriceChange} 
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Per Unit Cost (Buying Price) ({currency.symbol})</label>
              <input 
                type="number" 
                name="unit_cost" 
                value={formData.unit_cost ? Number((formData.unit_cost * currency.rate).toFixed(2)) : ''} 
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
              <label className="text-sm text-text-secondary block mb-1">Demand Last Week (Units)</label>
              <input type="number" name="demand_last_week" value={formData.demand_last_week} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Stock Level (Units)</label>
              <input type="number" name="stock_level" value={formData.stock_level} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
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
              <label className="text-sm text-text-secondary block mb-1">Customer Rating (1-5)</label>
              <input type="number" name="customer_rating" step="0.1" value={formData.customer_rating} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Initial Products Bought</label>
              <input type="number" name="initial_stock" value={formData.initial_stock} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Units Already Sold</label>
              <input type="number" name="units_already_sold" value={formData.units_already_sold} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl p-6 flex flex-col items-center justify-center shrink-0 min-h-[300px]">
        <h3 className="font-bold text-lg mb-8 w-full text-center border-b border-border pb-4">Optimal Price Prediction</h3>
        
        {prediction ? (
          <div className="flex flex-col items-center animate-fade-in mb-6">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5 relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
              <TrendingUp size={48} className="text-primary" />
            </div>
            <div className="text-sm text-text-secondary mb-1">Predicted Optimal Price</div>
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
              {formatPrice(prediction)}
            </div>
            <div className="text-xs font-medium text-accent-success bg-accent-success/10 px-3 py-1 rounded-full mt-4 mb-4">
              Model Confidence: 94.2%
            </div>
            {profitStatus !== null && profitOnSold !== null && projectedProfit !== null && (
              <div className="w-full flex flex-col gap-2 mt-2">
                <div className={`w-full bg-surface border rounded-lg p-3 text-sm text-center ${profitStatus >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}>
                  <span className="block text-text-secondary mb-1">Overall Financial Status</span>
                  <span className={`font-bold text-lg ${profitStatus >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                    {profitStatus >= 0 ? 'In Profit' : 'In Loss'} ({profitStatus >= 0 ? '+' : '-'}{formatPrice(Math.abs(profitStatus))})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                  <div className={`w-full bg-surface border rounded-lg p-3 text-sm text-center ${profitOnSold >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}>
                    <span className="block text-text-secondary mb-1">Margin (Units Sold)</span>
                    <span className={`font-bold text-lg ${profitOnSold >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {profitOnSold >= 0 ? '+' : '-'}{formatPrice(Math.abs(profitOnSold))}
                    </span>
                  </div>
                  <div className={`w-full bg-surface border rounded-lg p-3 text-sm text-center ${projectedProfit >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}>
                    <span className="block text-text-secondary mb-1">Projected (Remaining)</span>
                    <span className={`font-bold text-lg ${projectedProfit >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                      {projectedProfit >= 0 ? '+' : '-'}{formatPrice(Math.abs(projectedProfit))}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {advice && (
              <div className="w-full bg-surface border border-primary/20 rounded-lg p-4 text-sm text-text-primary text-center mt-4 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative group">
                <button 
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                      setIsSpeaking(false);
                    } else {
                      speak(advice);
                      setIsSpeaking(true);
                      // Reset state when speech ends
                      const checkSpeech = setInterval(() => {
                        if (!window.speechSynthesis.speaking) {
                          setIsSpeaking(false);
                          clearInterval(checkSpeech);
                        }
                      }, 500);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title={isSpeaking ? "Stop Voiceover" : "Play Voiceover"}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <span className="font-semibold text-primary flex items-center justify-center gap-2 mb-1">
                  <TrendingUp size={16} /> Strategic Advice
                </span>
                {advice}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <Calculator size={64} className="text-text-secondary opacity-20 mb-6" />
            <p className="text-text-secondary mb-8">Enter the variables on the left to compute the optimal price prediction.</p>
          </div>
        )}

        <button 
          onClick={handlePredict}
          disabled={!file || isPredicting}
          className="mt-auto w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isPredicting ? (
            <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white;"></span> Computing...</>
          ) : (
            "Predict Optimal Price"
          )}
        </button>
      </div>

    </div>
  );
}
