const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  portfolio:     { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  symbol:        { type: String, required: true },   // display symbol: RELIANCE, AAPL
  yahooSymbol:   { type: String },                   // yahoo format: RELIANCE.NS, AAPL
  currency:      { type: String, default: 'USD' },   // USD or INR
  market:        { type: String, default: 'US' },    // US or IN
  shares:        { type: Number, required: true },
  avg_buy_price: { type: Number, required: true },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Holding', HoldingSchema);
