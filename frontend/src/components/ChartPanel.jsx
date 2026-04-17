import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const COLORS = ["#22c55e", "#6366f1", "#f59e0b", "#f87171", "#38bdf8", "#a78bfa", "#34d399"];

// Fallback: smooth path from avgPrice to currentPrice if Yahoo fails
function generateFallback(avgPrice, currentPrice, timeframe) {
  const n = { "1D": 24, "5D": 30, "1M": 30, "3M": 45, "6M": 36 }[timeframe] || 30;
  const labels = {
    "1D": (i) => `${i}:00`,
    "5D": (i) => `Day ${i + 1}`,
    "1M": (i) => `${i + 1}`,
    "3M": (i) => `W${i + 1}`,
    "6M": (i) => `M${Math.ceil((i + 1) / 6)}`,
  };
  const labelFn = labels[timeframe] || ((i) => `${i + 1}`);
  let price = avgPrice;
  const vol = Math.abs(currentPrice - avgPrice) / n * 0.5 + avgPrice * 0.006;
  const data = [];
  for (let i = 0; i < n; i++) {
    const pull = (currentPrice - price) / (n - i);
    price += pull + (Math.random() - 0.48) * vol;
    price = Math.max(price, avgPrice * 0.4);
    data.push({ label: labelFn(i), price: parseFloat(price.toFixed(2)) });
  }
  if (data.length) data[data.length - 1].price = parseFloat(currentPrice.toFixed(2));
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 10,
        padding: "10px 14px", fontSize: 12, color: "#f1f5f9",
        boxShadow: "0 8px 24px #00000099",
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#22c55e" }}>
          ₹{Number(payload[0].value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
        <div style={{ color: "#64748b", marginTop: 3 }}>{label}</div>
      </div>
    );
  }
  return null;
};

export default function ChartPanel({ pieData = [], holdings = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [timeframe, setTimeframe] = useState("1M");
  const [chartData, setChartData] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState(""); // "yahoo" or "simulated"

  const timeframes = ["1D", "5D", "1M", "3M", "6M"];
  const selectedStock = pieData[selectedIdx];

  const holding = useMemo(() =>
    holdings.find(h => h.symbol === selectedStock?.name),
    [selectedStock, holdings]
  );
  const avgPrice = holding?.avg_buy_price || 100;
  const currentLive = holding?.current || livePrice || avgPrice;

  // Fetch real Yahoo Finance history + live price together
  useEffect(() => {
    if (!selectedStock?.name) return;
    setLoading(true);
    setChartData([]);
    setDataSource("");

    // Use yahooSymbol (e.g. TCS.NS) if available, else fall back to display symbol
    const symbol = holding?.yahooSymbol || selectedStock.name;
    const priceSymbol = holding?.yahooSymbol || selectedStock.name;

    // Run both requests in parallel
    Promise.all([
      // 1. Real historical data from Yahoo
      axios.get(`/api/stocks/history/${encodeURIComponent(symbol)}?timeframe=${timeframe}`)
        .then(r => r.data?.candles || [])
        .catch(() => []),

      // 2. Live price from holdings cache
      Promise.resolve(holding?.current || 0),
    ]).then(([candles, live]) => {
      if (candles.length > 0) {
        setChartData(candles);
        setDataSource("yahoo");
        if (live > 0) setLivePrice(live);
        else if (candles.length > 0) setLivePrice(candles[candles.length - 1].price);
      } else {
        // Fallback to simulation if Yahoo fails
        const price = live > 0 ? live : avgPrice;
        setChartData(generateFallback(avgPrice, price, timeframe));
        setDataSource("simulated");
        setLivePrice(price);
      }
    }).finally(() => setLoading(false));

  }, [selectedStock?.name, timeframe]);

  const firstVal = chartData[0]?.price || 0;
  const lastVal = chartData[chartData.length - 1]?.price || 0;
  const isUp = lastVal >= firstVal;
  const chartColor = isUp ? "#22c55e" : "#f87171";
  const changePct = firstVal > 0 ? (((lastVal - firstVal) / firstVal) * 100).toFixed(2) : "0.00";
  const changeAbs = (lastVal - firstVal).toFixed(2);

  return (
    <div style={{
      background: "#0d1623", border: "1px solid #1a2540", borderRadius: 16,
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>

      {/* Header */}
      <div style={{
        padding: "16px 20px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid #1a2540",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Stock pill */}
          <div style={{
            background: "#131f35", border: "1px solid #1e2d4a", borderRadius: 10,
            padding: "6px 14px", display: "flex", alignItems: "center", gap: 8,
          }}>
            {selectedStock && (
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[selectedIdx % COLORS.length], display: "inline-block" }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
              {selectedStock?.name || "—"}
            </span>
          </div>

          {/* Price + change */}
          {!loading && chartData.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                ₹{lastVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 11, color: isUp ? "#22c55e" : "#f87171", fontWeight: 600 }}>
                {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{changeAbs} ({isUp ? "+" : ""}{changePct}%)
                {dataSource === "yahoo" && (
                  <span style={{ marginLeft: 6, color: "#22c55e88", fontSize: 10 }}>● live</span>
                )}
                {dataSource === "simulated" && (
                  <span style={{ marginLeft: 6, color: "#f59e0b88", fontSize: 10 }}>~ est.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timeframe tabs */}
        <div style={{ display: "flex", background: "#131f35", borderRadius: 8, padding: 3, gap: 2 }}>
          {timeframes.map((tf) => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: "5px 11px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit",
              background: timeframe === tf ? "#22c55e" : "transparent",
              color: timeframe === tf ? "white" : "#64748b",
            }}>
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: "16px 8px 4px", flex: 1, minHeight: 240 }}>
        {loading ? (
          <div style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
            <div style={{
              width: 26, height: 26, border: "3px solid #1a2540",
              borderTop: "3px solid #22c55e", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: "#475569", fontSize: 13 }}>Loading chart...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>
            {pieData.length === 0 ? "Add stocks to see chart" : "No data available"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                  <stop offset="85%" stopColor={chartColor} stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a2540" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#1e2d4a"
                tick={{ fill: "#475569", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 7))}
              />
              <YAxis
                stroke="#1e2d4a"
                tick={{ fill: "#475569", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={58}
                tickFormatter={(v) => `₹${v}`}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 5, fill: chartColor, stroke: "#0d1623", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stock pills */}
      {pieData.length > 0 && (
        <div style={{ padding: "10px 20px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pieData.map((d, i) => (
            <button key={d.name} onClick={() => setSelectedIdx(i)} style={{
              background: selectedIdx === i ? COLORS[i % COLORS.length] + "22" : "#131f35",
              border: `1px solid ${selectedIdx === i ? COLORS[i % COLORS.length] : "#1e2d4a"}`,
              borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600,
              color: selectedIdx === i ? COLORS[i % COLORS.length] : "#64748b",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
