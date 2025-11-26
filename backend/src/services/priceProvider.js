const axios = require('axios');
const NodeCache = require('node-cache');
const cacheTtl = Number(process.env.PRICE_CACHE_TTL || 60);
const cache = new NodeCache({ stdTTL: cacheTtl });

const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY || '';

async function fetchAlphaCurrent(symbol) {
  const cacheKey = `alpha-${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if(!ALPHA_KEY) {
    const mock = { current: (Math.random() * 400 + 50).toFixed(2) };
    cache.set(cacheKey, mock);
    return mock;
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_KEY}&outputsize=compact`;
  const r = await axios.get(url);
  const data = r.data;
  const timeseries = data['Time Series (Daily)'];
  if(!timeseries) throw new Error('alpha data missing');
  const latest = Object.keys(timeseries)[0];
  const current = timeseries[latest]['4. close'];
  const res = { current };
  cache.set(cacheKey, res);
  return res;
}

module.exports = {
  getCurrent: async (symbol) => {
    symbol = symbol.toUpperCase();
    try {
      return await fetchAlphaCurrent(symbol);
    } catch(err) {
      console.error('price error', err.message);
      return { current: (Math.random() * 400 + 50).toFixed(2) };
    }
  }
};
