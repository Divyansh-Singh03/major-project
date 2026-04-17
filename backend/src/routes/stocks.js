
const express = require("express");
const router  = express.Router();
const axios   = require("axios");

const FINNHUB_KEY = "d6kn0s1r01qg51f4j700d6kn0s1r01qg51f4j70g";


const priceCache   = {};
const historyCache = {};
const PRICE_TTL    = 2  * 60 * 1000;
const HISTORY_TTL  = 10 * 60 * 1000;

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json",
};

// ✅ SMART SYMBOL HANDLING (India First)
function getYahooVariants(symbol) {
  const s = symbol.toUpperCase().trim();

  if (s.endsWith(".NS") || s.endsWith(".BO")) return [s];

  return [
    `${s}.NS`,   // 🇮🇳 NSE first (fixes your issue)
    `${s}.BO`,   // BSE fallback
    s            // 🇺🇸 US last
  ];
}

// Junk filter
function isJunkSymbol(symbol) {
  if (!symbol) return true;
  if (/^0P/.test(symbol)) return true;
  if (/^\d/.test(symbol)) return true;
  if (symbol.length > 20) return true;
  if (/[^A-Z0-9.\-]/.test(symbol)) return true;
  return false;
}

// ─────────────────────────────────────────────
// 🔎 SEARCH
// ─────────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const q      = req.query.q;
    const market = (req.query.market || "US").toUpperCase();

    if (!q || q.length < 2) return res.json([]);

    // 🇮🇳 INDIA SEARCH (Yahoo)
    if (market === "IN") {
      const r = await axios.get(
        "https://query2.finance.yahoo.com/v1/finance/search",
        {
          params: {
            q,
            lang: "en-US",
            region: "IN",
            quotesCount: 10,
          },
          headers: YAHOO_HEADERS,
        }
      );

      const stocks = (r.data?.quotes || [])
        .filter(s => {
          const sym = (s.symbol || "").toUpperCase();
          return (
            (sym.endsWith(".NS") || sym.endsWith(".BO")) &&
            !isJunkSymbol(sym)
          );
        })
        .map(s => ({
          symbol: s.symbol,
          displaySymbol: s.symbol.replace(".NS", "").replace(".BO", ""),
          description: s.shortname || s.longname,
          market: "IN",
          currency: "INR",
        }));

      return res.json(stocks);
    }

    // 🇺🇸 US SEARCH (Finnhub)
    const r = await axios.get("https://finnhub.io/api/v1/search", {
      params: { q, token: FINNHUB_KEY },
    });

    const stocks = (r.data.result || [])
      .filter(s => !s.symbol.includes("."))
      .map(s => ({
        symbol: s.symbol,
        displaySymbol: s.symbol,
        description: s.description,
        market: "US",
        currency: "USD",
      }));

    res.json(stocks);

  } catch (err) {
    console.error("Search error:", err.message);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// 💰 PRICE
// ─────────────────────────────────────────────
router.get("/price/:symbol", async (req, res) => {
  const rawSymbol = req.params.symbol.toUpperCase();
  const variants  = getYahooVariants(rawSymbol);

  // ✅ Cache check
  for (const sym of variants) {
    const cached = priceCache[sym];
    if (cached && Date.now() - cached.time < PRICE_TTL) {
      return res.json(cached);
    }
  }

  // ✅ Try Yahoo (clean logging)
  for (const sym of variants) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}`;

      const r = await axios.get(url, {
        params: { interval: "1m", range: "1d" },
        headers: YAHOO_HEADERS,
      });

      const meta  = r.data?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice || meta?.previousClose;

      if (price) {
        const currency =
          meta?.currency ||
          (sym.endsWith(".NS") || sym.endsWith(".BO") ? "INR" : "USD");

        const data = {
          price,
          currency,
          source: "yahoo",
          symbol: sym,
        };

        priceCache[sym] = { ...data, time: Date.now() };

        console.log(`✅ Price fetched: ${rawSymbol} → ${sym}`);

        return res.json(data);
      }

    } catch (err) {
      // Only log if ALL variants fail
      if (sym === variants[variants.length - 1]) {
        console.warn(`❌ Yahoo failed for ALL variants of ${rawSymbol}`);
      }
    }
  }

  // ✅ Finnhub fallback (US only)
  try {
    const r = await axios.get("https://finnhub.io/api/v1/quote", {
      params: { symbol: rawSymbol, token: FINNHUB_KEY },
    });

    const price = r.data?.c;

    if (price) {
      const data = {
        price,
        currency: "USD",
        source: "finnhub",
        symbol: rawSymbol,
      };

      priceCache[rawSymbol] = { ...data, time: Date.now() };

      console.log(`✅ Finnhub fallback used for ${rawSymbol}`);

      return res.json(data);
    }

  } catch (err) {
    console.error("Finnhub failed:", err.message);
  }

  res.status(404).json({ error: "Stock not found" });
});

// ─────────────────────────────────────────────
// 📈 HISTORY
// ─────────────────────────────────────────────
router.get("/history/:symbol", async (req, res) => {
  const rawSymbol = req.params.symbol.toUpperCase();
  const tf = req.query.timeframe || "1M";

  const variants = getYahooVariants(rawSymbol);

  const tfMap = {
    "1D": { interval: "5m",  range: "1d"  },
    "5D": { interval: "30m", range: "5d"  },
    "1M": { interval: "1d",  range: "1mo" },
    "3M": { interval: "1d",  range: "3mo" },
    "6M": { interval: "1wk", range: "6mo" },
  };

  const { interval, range } = tfMap[tf] || tfMap["1M"];

  // Cache check
  for (const sym of variants) {
    const cached = historyCache[`${sym}_${tf}`];
    if (cached && Date.now() - cached.time < HISTORY_TTL) {
      return res.json(cached.data);
    }
  }

  // Try variants
  for (const sym of variants) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}`;

      const r = await axios.get(url, {
        params: { interval, range },
        headers: YAHOO_HEADERS,
      });

      const result = r.data?.chart?.result?.[0];
      if (!result) continue;

      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];

      const candles = timestamps.map((ts, i) => ({
        timestamp: ts,
        price: closes[i],
      })).filter(c => c.price != null);

      if (!candles.length) continue;

      const data = {
        symbol: sym,
        timeframe: tf,
        candles,
      };

      historyCache[`${sym}_${tf}`] = {
        data,
        time: Date.now(),
      };

      console.log(`📈 History fetched: ${rawSymbol} → ${sym}`);

      return res.json(data);

    } catch (err) {
      if (sym === variants[variants.length - 1]) {
        console.warn(`❌ History failed for ${rawSymbol}`);
      }
    }
  }

  res.status(404).json({ error: "No history found" });
});

module.exports = router;

