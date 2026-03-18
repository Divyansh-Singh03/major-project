import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChartPanel from "../components/ChartPanel";
import StatsBar from "../components/StatsBar";
import { getPortfolio, setAuthToken } from "../api";

export default function Dashboard() {

  const [holdings, setHoldings] = useState([]);
  const [mainSeries, setMainSeries] = useState([]);

  // ⭐ LIVE PRICE FETCH
  const updatePrices = async (list) => {

    try {

      const updated = await Promise.all(

        list.map(async (stock) => {

          try {

            const res = await axios.get(`/api/stocks/price/${stock.symbol}`);

            const price = res.data.price || 0;

            return {
              ...stock,
              current: price,
              value: price * stock.shares
            };

          } catch {

            return stock;

          }

        })

      );

      setHoldings(updated);

    } catch (err) {

      console.error("price update error");

    }

  };

  // ⭐ LOAD PORTFOLIO
  const loadPortfolio = async () => {

    try {

      const { data } = await getPortfolio();

      const list = data.holdings || [];

      setHoldings(list);

      updatePrices(list);

    } catch (err) {

      console.error(err);

    }

  };

  // ⭐ CALCULATE STATS
  const calculateStats = () => {

    if (!holdings.length) {

      return {
        totalInvested: 0,
        currentValue: 0,
        profit: 0,
        percent: 0,
        bestStock: { name: "-", return: 0 }
      };

    }

    let totalInvested = 0;
    let currentValue = 0;

    let bestStock = {
      name: "",
      return: -Infinity
    };

    holdings.forEach((stock) => {

      const shares = stock.shares || 0;
      const avg = stock.avg_buy_price || 0;
      const current = stock.current || avg;

      const invested = shares * avg;
      const value = shares * current;

      totalInvested += invested;
      currentValue += value;

      const percent = avg > 0
        ? ((current - avg) / avg) * 100
        : 0;

      if (percent > bestStock.return) {

        bestStock = {
          name: stock.symbol,
          return: percent.toFixed(2)
        };

      }

    });

    const profit = currentValue - totalInvested;

    const percent = totalInvested > 0
      ? ((profit / totalInvested) * 100).toFixed(2)
      : 0;

    return {
      totalInvested: totalInvested.toFixed(2),
      currentValue: currentValue.toFixed(2),
      profit: profit.toFixed(2),
      percent,
      bestStock
    };

  };

  const stats = calculateStats();

  // ⭐ INITIAL LOAD
  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    setAuthToken(token);

    loadPortfolio();

    // chart demo data
    setMainSeries(

      Array.from({ length: 12 }).map((_, i) => ({
        date: `2025-${String(i + 1).padStart(2, "0")}`,
        price: 120 + Math.round(Math.sin(i / 2) * 20 + i * 3)
      }))

    );

  }, []);

  // ⭐ LIVE PRICE UPDATE (every 5 seconds)
  useEffect(() => {

    const interval = setInterval(() => {

      if (holdings.length) {
        updatePrices(holdings);
      }

    }, 5000);

    return () => clearInterval(interval);

  }, []);

  function handleLogout() {

    localStorage.removeItem("token");
    window.location.href = "/login";

  }

  // ⭐ PORTFOLIO VALUE
  const portfolioValue = holdings.reduce((sum, h) => {

    const price = h.current || h.avg_buy_price;

    return sum + price * h.shares;

  }, 0);

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 font-sans">

      {/* Logout Button */}
      <div className="flex justify-end mb-6">

        <button
          onClick={handleLogout}
          className="bg-rose-500 hover:bg-rose-600 px-5 py-2 rounded-xl shadow-lg transition"
        >
          Logout
        </button>

      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      <div className="grid grid-cols-12 gap-8 mt-6">

        {/* Sidebar */}
        <Sidebar
          holdings={holdings}
          onRefresh={loadPortfolio}
        />

        {/* Charts */}
        <ChartPanel
          mainSeries={mainSeries}
          pieData={holdings.map((h) => {

            const price = h.current || h.avg_buy_price;

            return {
              name: h.symbol,
              value: Math.round(price * h.shares)
            };

          })}
          portfolioValue={portfolioValue}
        />

      </div>

    </div>

  );

}