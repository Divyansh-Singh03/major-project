const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Holding = require('../models/Holding');
const Portfolio = require('../models/Portfolio');
const priceProvider = require('../services/priceProvider');

// AUTH middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'no token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'test');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
};

// 👉 Helper to recompute portfolio after add/delete
async function computePortfolio(userId) {
  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) {
    portfolio = await Portfolio.create({ user: userId, name: 'Main' });
  }

  const holdings = await Holding.find({ portfolio: portfolio._id }).lean();

  const pricePromises = holdings.map(h => priceProvider.getCurrent(h.symbol));
  const priceResults = await Promise.all(pricePromises);

  const totals = holdings.map((h, i) => {
    const current = Number(priceResults[i].current);
    const value = current * Number(h.shares);
    const cost = Number(h.avg_buy_price) * Number(h.shares);
    const gain = value - cost;
    const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

    return { ...h, current, value, cost, gain, gainPct };
  });

  const portfolioValue = totals.reduce((s, h) => s + h.value, 0);

  return { holdings: totals, portfolioValue };
}

// 👉 GET holdings (working one)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await computePortfolio(req.user.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch portfolio' });
  }
});

// 👉 POST: Add a holding (NOW returns updated portfolio)
router.post('/holdings', authMiddleware, async (req, res) => {
  try {
    const { symbol, shares, avg_buy_price } = req.body;

    let portfolio = await Portfolio.findOne({ user: req.user.userId });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user.userId, name: 'Main' });
    }

    await Holding.create({
      portfolio: portfolio._id,
      symbol: symbol.toUpperCase(),
      shares: Number(shares),
      avg_buy_price: Number(avg_buy_price)
    });

    const result = await computePortfolio(req.user.userId);
    res.json(result); // return full portfolio
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to add holding' });
  }
});

// 👉 DELETE: remove a holding
router.delete('/holdings/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    await Holding.deleteOne({ _id: id });

    const result = await computePortfolio(req.user.userId);
    res.json(result); // return updated portfolio
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to delete holding' });
  }
});

module.exports = router;
