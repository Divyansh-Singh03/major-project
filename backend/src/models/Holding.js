const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  symbol: { type: String, required: true },
  shares: { type: Number, required: true },
  avg_buy_price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Holding', HoldingSchema);
