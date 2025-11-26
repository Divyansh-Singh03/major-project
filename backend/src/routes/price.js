const express = require('express');
const router = express.Router();
const priceProvider = require('../services/priceProvider');

router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const prices = await priceProvider.getCurrent(symbol);
    res.json({ symbol: symbol.toUpperCase(), ...prices });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch price' });
  }
});

module.exports = router;
