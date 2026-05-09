# PriceFlow-AI
A machine learning model for price optimization and sales forecasting.

## Financial Calculations

The PriceFlow-AI dashboard calculates several real-time financial metrics to help you understand your profitability and the impact of price optimization. Here is how these metrics are calculated:

### 1. Overall Financial Status
This metric evaluates your global net profit or loss by comparing your total revenue against all incurred costs, including the cost of unsold inventory and marketing expenses.
* **Total Revenue** = `Units Already Sold` × `Current Price`
* **Total Costs** = (`Initial Products Bought` × `Unit Cost`) + `Marketing Spend`
* **Overall Status** = `Total Revenue` - `Total Costs`

### 2. Margin (Units Sold)
This metric isolates the pure profit or loss made strictly on the units that have already been sold, ignoring sunk costs like marketing or unsold inventory.
* **Margin** = (`Units Already Sold` × `Current Price`) - (`Units Already Sold` × `Unit Cost`)

### 3. Projected Profit (Remaining Stock)
When the model predicts an optimal price, this metric projects how much future profit you stand to make if you sell the rest of your inventory at that new predicted price.
* **Remaining Stock** = `Initial Products Bought` - `Units Already Sold`
* **Projected Profit** = `Remaining Stock` × (`Predicted Optimal Price` - `Unit Cost`)
