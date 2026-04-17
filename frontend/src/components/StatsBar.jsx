import React from "react";

export default function StatsBar({ stats }) {
  const profit = parseFloat(stats.profit);
  const isUp   = profit >= 0;

  // Detect if portfolio has mixed currencies
  const hasMixed = stats.hasMixedCurrencies;

  const MiniChart = ({ color, up }) => (
    <svg width="80" height="36" viewBox="0 0 80 36">
      <defs>
        <linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {up ? (
        <>
          <path d="M0 28 C10 26 20 20 30 16 C40 12 50 18 60 10 C65 7 72 4 80 2" stroke={color} strokeWidth="2" fill="none"/>
          <path d="M0 28 C10 26 20 20 30 16 C40 12 50 18 60 10 C65 7 72 4 80 2 L80 36 L0 36Z" fill={`url(#g-${color.replace("#","")})`}/>
        </>
      ) : (
        <>
          <path d="M0 6 C10 8 20 12 30 18 C40 24 50 18 60 24 C68 28 74 30 80 33" stroke={color} strokeWidth="2" fill="none"/>
          <path d="M0 6 C10 8 20 12 30 18 C40 24 50 18 60 24 C68 28 74 30 80 33 L80 36 L0 36Z" fill={`url(#g-${color.replace("#","")})`}/>
        </>
      )}
    </svg>
  );

  // Currency symbol: ₹ for INR, $ for USD, ~ for mixed (no double symbol)
  const mainSym = stats.primaryCurrency === "INR" ? "₹" : stats.primaryCurrency === "USD" ? "$" : "~";
  const prefix = ""; // never add extra prefix, mainSym handles mixed case

  const cardBase = {
    borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 0 }}>

      {/* Card 1 — Total Portfolio Value */}
      <div style={{ ...cardBase, background: "linear-gradient(135deg, #0f2618, #0d1f14)", border: "1px solid #1a3a25" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#6b9e7a", fontWeight: 500, marginBottom: 8 }}>
            Total Portfolio Value {hasMixed && <span style={{ color: "#f59e0b", fontSize: 10 }}>※ mixed currencies</span>}
          </p>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
            {prefix}{mainSym}{parseFloat(stats.currentValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
            {isUp ? "+" : ""}{stats.percent}%
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ background: "#22c55e22", borderRadius: 10, padding: "7px 8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <MiniChart color="#22c55e" up={true} />
        </div>
      </div>

      {/* Card 2 — P&L */}
      <div style={{ ...cardBase, background: "linear-gradient(135deg, #0f2618, #0d1f14)", border: "1px solid #1a3a25" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "#6b9e7a", fontWeight: 500, marginBottom: 8 }}>Profit / Loss</p>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: isUp ? "#22c55e" : "#f87171", letterSpacing: -0.5 }}>
            {isUp ? "+" : ""}{prefix}{mainSym}{Math.abs(profit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: isUp ? "#22c55e" : "#f87171", fontWeight: 500 }}>
            ({isUp ? "+" : ""}{stats.percent}%)
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ background: isUp ? "#22c55e22" : "#f8717122", borderRadius: 10, padding: "7px 8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isUp ? "#22c55e" : "#f87171"} strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <MiniChart color={isUp ? "#22c55e" : "#f87171"} up={isUp} />
        </div>
      </div>

      {/* Card 3 — Invested vs Current + Best */}
      <div style={{ ...cardBase, background: "linear-gradient(135deg, #1a0e0e, #150b0b)", border: "1px solid #3a1a1a" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#9e6b6b", fontWeight: 500 }}>Total Invested</p>
            <p style={{ margin: 0, fontSize: 12, color: "#9e6b6b", fontWeight: 500 }}>Current Value</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
              {prefix}{mainSym}{parseFloat(stats.totalInvested).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span style={{ color: "#475569", fontSize: 13 }}>vs</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#22c55e" }}>
              {prefix}{mainSym}{parseFloat(stats.currentValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#6b7280" }}>
            🏆 Best: <strong style={{ color: "#fbbf24" }}>{stats.bestStock.name}</strong>
            &nbsp;•&nbsp; {stats.bestStock.return}% return
          </p>
        </div>
      </div>
    </div>
  );
}
