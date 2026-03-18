const express = require("express");
const router = express.Router();
const axios = require("axios");

const API_KEY = "d6kn0s1r01qg51f4j700d6kn0s1r01qg51f4j70g";


// 🔎 SEARCH STOCKS
router.get("/search", async (req, res) => {

  try {

    const q = req.query.q;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const response = await axios.get(
      "https://finnhub.io/api/v1/search",
      {
        params: {
          q: q,
          token: API_KEY
        }
      }
    );

    const result = response.data.result || [];

    const stocks = result.map(s => ({
      symbol: s.symbol,
      description: s.description
    }));

    res.json(stocks);

  } catch (error) {

    console.error("Stock search error:", error.message);

    res.json([]);

  }

});


// 💰 GET CURRENT STOCK PRICE
router.get("/price/:symbol", async (req, res) => {

  try {

    const symbol = req.params.symbol;

    const response = await axios.get(
      "https://finnhub.io/api/v1/quote",
      {
        params: {
          symbol: symbol,
          token: API_KEY
        }
      }
    );

    const price = response.data.c || 0;

    res.json({ price });

  } catch (error) {

    console.error("Price fetch error:", error.message);

    res.status(500).json({
      error: "Failed to fetch price"
    });

  }

});


module.exports = router;