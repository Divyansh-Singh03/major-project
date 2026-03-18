
const axios = require("axios");

const API_KEY = "d6kn0s1r01qg51f4j700d6kn0s1r01qg51f4j70g";

exports.searchStocks = async (query) => {

  if (!query || query.length < 2) {
    return [];
  }

  try {

    const response = await axios.get(
      "https://finnhub.io/api/v1/search",
      {
        params: {
          q: query,
          token: API_KEY
        }
      }
    );

    if (!response.data || !response.data.result) {
      return [];
    }

    return response.data.result.map(stock => ({
      symbol: stock.symbol,
      description: stock.description
    }));

  } catch (error) {

    console.log("Finnhub error:", error.message);

    return [];

  }

};


exports.getPrice = async (symbol) => {

  try {

    const response = await axios.get(
      "https://finnhub.io/api/v1/quote",
      {
        params: {
          symbol: symbol,
          token: API_KEY
        }
      }
    );

    return response.data.c || 0;

  } catch (error) {

    console.log("Price error:", error.message);

    return 0;

  }

};