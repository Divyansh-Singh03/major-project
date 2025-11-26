const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  holding: { type: mongoose.Schema.Types.ObjectId, ref: 'Holding' },
  type: { type: String, enum: ['BUY','SELL'], required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  executed_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
