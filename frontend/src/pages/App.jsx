import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChartPanel from "./components/ChartPanel";
import { getPortfolio, setAuthToken } from "./api";
import Login from "./pages/Login";

export default function App() {
  const [holdings, setHoldings] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [mainSeries, setMainSeries] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  //👇 CALL THIS WHEN USER LOGS OUT
  function handleLogout() {
    localStorage.removeItem("token");
    setAuthToken(null);
    setIsLoggedIn(false);
  }

  //👇 ONLY LOAD PORTFOLIO IF LOGGED IN
  useEffect(() => {
    if (!isLoggedIn) return;

    async function load() {
      try {
        const t = localStorage.getItem("token");
        if (t) setAuthToken(t);

        const { data } = await getPortfolio();
        setHoldings(data.holdings || []);
        setPortfolioValue(Math.round(data.portfolioValue || 0));
      } catch {
        console.error("Error fetching portfolio");
      }

      setMainSeries(
        Array.from({ length: 20 }).map((_, i) => ({
          date: `2025-${String((i % 12) + 1).padStart(2, "0")}`,
          price:
            120 + Math.round(Math.sin(i / 2) * 20 + i * 3)
        }))
      );
    }

    load();
  }, [isLoggedIn]);

  const handleRefresh = (data) => {
    if (!data) return;
    setHoldings(data.holdings);
    setPortfolioValue(Math.round(data.portfolioValue));
  };

  
  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">
        <Sidebar holdings={holdings} onRefresh={handleRefresh} />
        <ChartPanel
          mainSeries={mainSeries}
          pieData={holdings.map((h) => ({
            name: h.symbol,
            value: Math.round(h.value || (h.current * h.shares || 0)),
          }))}
          portfolioValue={portfolioValue}
        />
      </div>
    </div>
  );
}
