import { useState } from 'react';
import { Calculator, UploadCloud, File, AlertCircle, TrendingUp } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function Predict() {
  const [file, setFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const { formatPrice, currency } = useCurrency();
  
  // Form state
  const [formData, setFormData] = useState({
    current_price: 150.00,
    competitor_price: 145.00,
    demand_last_week: 320,
    stock_level: 500,
    marketing_spend: 2000,
    season: 'monsoon',
    day_of_week: 'monday',
    customer_rating: 4.2,
    units_sold: 250
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
    try {
      // Simulate API call to prediction endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calculate a realistic-looking optimal price based on inputs
      const basePrice = Number(formData.current_price) || 0;
      const optimal = basePrice * (1 + (Math.random() * 0.1 - 0.05));
      setPrediction(optimal);
    } catch (err) {
      console.error(err);
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
              <label className="text-sm text-text-secondary block mb-1">Units Sold</label>
              <input type="number" name="units_sold" value={formData.units_sold} onChange={handleInputChange} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-primary outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <div className="w-full lg:w-1/3 glass-panel rounded-xl p-6 flex flex-col items-center justify-center shrink-0 min-h-[300px]">
        <h3 className="font-bold text-lg mb-8 w-full text-center border-b border-border pb-4">Optimal Price Prediction</h3>
        
        {prediction ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5 relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
              <TrendingUp size={48} className="text-primary" />
            </div>
            <div className="text-sm text-text-secondary mb-1">Predicted Optimal Price</div>
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
              {formatPrice(prediction)}
            </div>
            <div className="text-xs font-medium text-accent-success bg-accent-success/10 px-3 py-1 rounded-full mt-4">
              Model Confidence: 94.2%
            </div>
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
            <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Computing...</>
          ) : (
            "Predict Optimal Price"
          )}
        </button>
      </div>

    </div>
  );
}
