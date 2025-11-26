import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import ChartPanel from './components/ChartPanel';
import { getPortfolio, setAuthToken } from './api';

export default function App() {
  const [holdings, setHoldings] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [mainSeries, setMainSeries] = useState([]);

  // This will run only once when app loads
  useEffect(() => {
    async function load() {
      try {
        // Attach token once at startup
        const t = localStorage.getItem("token");
        if (t) setAuthToken(t);

        const { data } = await getPortfolio();
        setHoldings(data.holdings || []);
        setPortfolioValue(Math.round(data.portfolioValue || 0));
      } catch (err) {
        console.error('Failed fetching portfolio from backend:', err);
        setHoldings([]);
        setPortfolioValue(0);
      }

      // dummy timeseries
      setMainSeries(
        Array.from({ length: 20 }).map((_, i) => ({
          date: `2025-${String((i % 12) + 1).padStart(2, '0')}`,
          price: 120 + Math.round(Math.sin(i / 2) * 20 + i * 3)
        }))
      );
    }

    load();
  }, []);

  // 👉 This function will be called by Sidebar after ADD or DELETE
  const handleRefresh = (data) => {
    if (!data) return;
    
    setHoldings(data.holdings || []);
    setPortfolioValue(Math.round(data.portfolioValue || 0));
  };

  const pieData = holdings.map(h => ({
    name: h.symbol,
    value: Math.round(h.value || (h.current * h.shares || 0))
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">
        
        {/* ⭐ Pass onRefresh to Sidebar */}
        <Sidebar holdings={holdings} onRefresh={handleRefresh} />
        
        <ChartPanel 
          mainSeries={mainSeries} 
          pieData={pieData} 
          portfolioValue={portfolioValue} 
        />
      </div>
    </div>
  );
}
