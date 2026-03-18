import React, { useState } from "react";
import axios from "axios";
import { addHolding } from "../api";

export default function AddStockForm({ onAdded }) {

  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [avgBuy, setAvgBuy] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [results, setResults] = useState([]);

  // 🔎 Search Stocks
  const searchStocks = async (value) => {

    setSymbol(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    try {

      const res = await axios.get(`/api/stocks/search?q=${value}`);

      setResults(res.data || []);

    } catch (error) {

      console.error("Search error:", error);
      setResults([]);

    }

  };

  // 💰 Fetch price when stock selected
  const selectStock = async (stock) => {

    setSymbol(stock.symbol);
    setResults([]);

    try {

      const res = await axios.get(`/api/stocks/price/${stock.symbol}`);

      if (res.data?.price) {
        setAvgBuy(res.data.price.toFixed(2));
      }

    } catch (error) {

      console.error("Price fetch failed");

    }

  };

  // ➕ Add Stock
  const handleSubmit = async (e) => {

    e.preventDefault();
    setErr(null);

    if (!symbol || !shares) {
      setErr("Symbol and shares are required");
      return;
    }

    setLoading(true);

    try {

      const { data } = await addHolding({
        symbol: symbol.trim().toUpperCase(),
        shares: Number(shares),
        avg_buy_price: Number(avgBuy || 0),
      });

      setSymbol("");
      setShares("");
      setAvgBuy("");
      setResults([]);

      if (onAdded) onAdded(data);

    } catch (error) {

      console.error(error);
      setErr(error?.response?.data?.error || "Failed to add");

    } finally {

      setLoading(false);

    }

  };

  return (

    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 border border-slate-600 p-5 rounded-xl space-y-4"
    >

      <h4 className="font-semibold text-blue-400">
        Add Stock
      </h4>

      {/* SYMBOL SEARCH */}
      <div className="relative">

        <label className="block text-sm text-slate-400 mb-1">
          Symbol
        </label>

        <input
          value={symbol}
          onChange={(e) => searchStocks(e.target.value)}
          placeholder="Search stock (TSLA)"
          className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400"
        />

        {/* DROPDOWN */}
        {results.length > 0 && (

          <div className="absolute z-10 w-full bg-slate-900 border border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto">

            {results.map((stock) => (

              <div
                key={stock.symbol}
                onClick={() => selectStock(stock)}
                className="p-2 hover:bg-slate-700 cursor-pointer text-sm"
              >

                {stock.symbol} — {stock.description}

              </div>

            ))}

          </div>

        )}

      </div>

      {/* SHARES */}
      <div>

        <label className="block text-sm text-slate-400 mb-1">
          Shares
        </label>

        <input
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          type="number"
          placeholder="10"
          className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400"
        />

      </div>

      {/* AVG BUY PRICE */}
      <div>

        <label className="block text-sm text-slate-400 mb-1">
          Avg buy price
        </label>

        <input
          value={avgBuy}
          onChange={(e) => setAvgBuy(e.target.value)}
          type="number"
          placeholder="Auto filled"
          className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400"
        />

      </div>

      {err && (

        <div className="text-rose-400 text-sm">
          {err}
        </div>

      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-lg text-white transition"
      >

        {loading ? "Adding..." : "Add Stock"}

      </button>

    </form>

  );

}