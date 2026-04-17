const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const axios   = require('axios');
const Holding   = require('../models/Holding');
const Portfolio = require('../models/Portfolio');

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

// AUTH middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'no token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'test');
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
};

// Fetch price via Yahoo — auto-tries .NS for Indian stocks
async function fetchYahooPrice(symbol) {
  const symbolsToTry = [symbol];
  // If no suffix, also try NSE variant
  if (!symbol.endsWith(".NS") && !symbol.endsWith(".BO")) {
    symbolsToTry.push(symbol + ".NS");
  }
  for (const sym of symbolsToTry) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}`;
      const r   = await axios.get(url, {
        params: { interval: "1m", range: "1d" },
        headers: YAHOO_HEADERS,
        timeout: 6000,
      });
      const meta  = r.data?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice || meta?.previousClose || 0;
      if (price > 0) return price;
    } catch { /* try next */ }
  }
  return 0;
}

// Recompute full portfolio
async function computePortfolio(userId) {
  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) {
    portfolio = await Portfolio.create({ user: userId, name: 'Main' });
  }

  const holdings = await Holding.find({ portfolio: portfolio._id }).lean();

  // Fetch prices one by one with small delay to avoid rate limits
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const totals = [];

  for (let i = 0; i < holdings.length; i++) {
    const h           = holdings[i];
    const yahooSym    = h.yahooSymbol || h.symbol;
    const currentPrice = await fetchYahooPrice(yahooSym);
    const current     = currentPrice > 0 ? currentPrice : h.avg_buy_price;
    const value       = current * Number(h.shares);
    const cost        = Number(h.avg_buy_price) * Number(h.shares);
    const gain        = value - cost;
    const gainPct     = cost > 0 ? (gain / cost) * 100 : 0;

    totals.push({
      ...h,
      current,
      value,
      cost,
      gain,
      gainPct,
      currency: h.currency || 'USD',
      market:   h.market   || 'US',
    });

    if (i < holdings.length - 1) await delay(300); // small gap between requests
  }

  const portfolioValue = totals.reduce((s, h) => s + h.value, 0);
  return { holdings: totals, portfolioValue };
}

// GET portfolio
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json(await computePortfolio(req.user.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch portfolio' });
  }
});

// POST add holding
// Body: { symbol, yahooSymbol, shares, avg_buy_price, currency, market }
router.post('/holdings', authMiddleware, async (req, res) => {
  try {
    const { symbol, yahooSymbol, shares, avg_buy_price, currency, market } = req.body;

    let portfolio = await Portfolio.findOne({ user: req.user.userId });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user.userId, name: 'Main' });
    }

    await Holding.create({
      portfolio:     portfolio._id,
      symbol:        symbol.toUpperCase(),
      yahooSymbol:   (yahooSymbol || symbol).toUpperCase(),
      currency:      currency || 'USD',
      market:        market   || 'US',
      shares:        Number(shares),
      avg_buy_price: Number(avg_buy_price),
    });

    res.json(await computePortfolio(req.user.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to add holding' });
  }
});

// DELETE holding
router.delete('/holdings/:id', authMiddleware, async (req, res) => {
  try {
    await Holding.deleteOne({ _id: req.params.id });
    res.json(await computePortfolio(req.user.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to delete holding' });
  }
});

module.exports = router;
