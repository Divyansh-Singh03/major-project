import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChartPanel from "../components/ChartPanel";
import StatsBar from "../components/StatsBar";
import { getPortfolio, setAuthToken } from "../api";

export default function Dashboard() {
  const [holdings, setHoldings] = useState([]);
  const [activeNav, setActiveNav] = useState("Dashboard");

  // Fetch prices one by one with 1.5s gap to avoid Finnhub 429 rate limit
  const updatePrices = async (list) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const updated = [...list];
    for (let i = 0; i < list.length; i++) {
      try {
        const res = await axios.get(`/api/stocks/price/${list[i].symbol}`);
        const price = res.data.price || 0;
        if (price > 0) {
          updated[i] = { ...list[i], current: price, value: price * list[i].shares };
        }
      } catch {
        // keep existing price on error
      }
      if (i < list.length - 1) await delay(1500); // 1.5s between each request
    }
    setHoldings([...updated]);
  };

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

  const calculateStats = () => {
    if (!holdings.length) {
      return { totalInvested: 0, currentValue: 0, profit: 0, percent: 0,
        bestStock: { name: "-", return: 0 }, primaryCurrency: "USD", hasMixedCurrencies: false };
    }
    let totalInvested = 0;
    let currentValue  = 0;
    let bestStock = { name: "", return: -Infinity };

    const currencies = new Set();

    holdings.forEach((stock) => {
      const shares  = stock.shares || 0;
      const avg     = stock.avg_buy_price || 0;
      const current = stock.current || avg;
      totalInvested += shares * avg;
      currentValue  += shares * current;
      currencies.add(stock.currency || "USD");
      const pct = avg > 0 ? ((current - avg) / avg) * 100 : 0;
      if (pct > bestStock.return) bestStock = { name: stock.symbol, return: pct.toFixed(2) };
    });

    const profit   = currentValue - totalInvested;
    const percent  = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(2) : 0;
    const hasMixed = currencies.size > 1;
    // Pick most common currency
    const inrCount = holdings.filter(h => h.currency === "INR").length;
    const primaryCurrency = hasMixed ? "MIXED" : (inrCount === holdings.length ? "INR" : "USD");

    return {
      totalInvested: totalInvested.toFixed(2),
      currentValue:  currentValue.toFixed(2),
      profit:        profit.toFixed(2),
      percent,
      bestStock,
      primaryCurrency,
      hasMixedCurrencies: hasMixed,
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setAuthToken(token);
    loadPortfolio();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (holdings.length) updatePrices(holdings);
    }, 60000); // 60s - avoid Finnhub rate limit
    return () => clearInterval(interval);
  }, [holdings]);

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  const portfolioValue = holdings.reduce((sum, h) => {
    const price = h.current || h.avg_buy_price;
    return sum + price * h.shares;
  }, 0);

  // Pie data for ChartPanel stock switcher
  const pieData = holdings.map((h) => ({
    name: h.symbol,
    value: Math.round((h.current || h.avg_buy_price) * h.shares),
  }));

  const navItems = [
    {
      label: "Dashboard", icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
      )
    },
    {
      label: "Portfolio", icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
      )
    },
    {
      label: "Analytics", icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      )
    },
    {
      label: "Predictions", icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
      )
    },
    {
      label: "Settings", icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      )
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0e1623", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>

      {/* ── LEFT NAV ── */}
      <nav style={{
        width: 76, background: "#0b1120", borderRight: "1px solid #1a2540",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "20px 0", gap: 4, flexShrink: 0,
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 24, padding: "9px 11px", background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: 12, boxShadow: "0 4px 14px #22c55e44", cursor: "pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>

        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              title={item.label}
              style={{
                width: 52, height: 52, borderRadius: 14, border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                background: isActive ? "#22c55e18" : "transparent",
                color: isActive ? "#22c55e" : "#475569",
                transition: "all 0.2s", position: "relative",
              }}
            >
              {isActive && (
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 28, background: "#22c55e", borderRadius: "0 4px 4px 0" }} />
              )}
              {item.icon}
              <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: 0.3 }}>{item.label}</span>
            </button>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            marginTop: "auto", width: 52, height: 52, borderRadius: 14, border: "none",
            cursor: "pointer", background: "transparent", color: "#475569",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
          onMouseLeave={e => e.currentTarget.style.color = "#475569"}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: 76, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOP BAR — only title, no search/notification/avatar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 28px", borderBottom: "1px solid #1a2540",
          background: "#0b1120", position: "sticky", top: 0, zIndex: 40,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9", letterSpacing: -0.3 }}>
            Dashboard
          </h1>

          {/* Summary button only */}
          <button style={{
            background: "#131f35", border: "1px solid #1e2d4a", borderRadius: 8,
            padding: "7px 16px", color: "#94a3b8", fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
          }}>
            Summary
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </header>

        {/* PAGE BODY */}
        <main style={{ padding: "22px 28px", flex: 1 }}>

          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#cbd5e1" }}>
            Portfolio Overview
          </h2>

          {/* Stats */}
          <StatsBar stats={stats} />

          {/* Main grid: Holdings table | Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
            <Sidebar holdings={holdings} onRefresh={loadPortfolio} />
            <ChartPanel
              pieData={pieData}
              holdings={holdings}
              portfolioValue={portfolioValue}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
