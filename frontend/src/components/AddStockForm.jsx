import React, { useState, useRef } from "react";
import axios from "axios";
import { addHolding } from "../api";

export default function AddStockForm({ onAdded }) {
  const [market, setMarket]         = useState("US");
  const [symbol, setSymbol]         = useState("");
  const [yahooSymbol, setYahooSymbol] = useState("");
  const [currency, setCurrency]     = useState("USD");
  const [shares, setShares]         = useState("");
  const [avgBuy, setAvgBuy]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(false);
  const [err, setErr]               = useState(null);
  const [results, setResults]       = useState([]);
  const searchTimer                 = useRef(null);

  const currSym = currency === "INR" ? "₹" : "$";

  const switchMarket = (m) => {
    setMarket(m);
    setCurrency(m === "IN" ? "INR" : "USD");
    setSymbol(""); setYahooSymbol(""); setResults([]); setAvgBuy(""); setErr(null);
  };

  const searchStocks = (value) => {
    setSymbol(value);
    setYahooSymbol("");
    if (value.length < 2) { setResults([]); return; }
    // Debounce 400ms so we don't spam on every keystroke
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/stocks/search?q=${encodeURIComponent(value)}&market=${market}`);
        setResults(res.data || []);
      } catch {
        setResults([]);
      }
    }, 400);
  };

  const selectStock = async (stock) => {
    // Set currency FIRST from the stock's data
    const stockCurrency = stock.currency || (market === "IN" ? "INR" : "USD");
    setCurrency(stockCurrency);
    setSymbol(stock.displaySymbol || stock.symbol);
    setYahooSymbol(stock.symbol);   // full yahoo symbol e.g. RELIANCE.NS
    setResults([]);
    setAvgBuy("");
    setFetching(true);
    try {
      const res = await axios.get(`/api/stocks/price/${encodeURIComponent(stock.symbol)}`);
      if (res.data?.price) {
        setAvgBuy(res.data.price.toFixed(2));
        // Also update currency from API response (most accurate)
        if (res.data.currency) setCurrency(res.data.currency);
      }
    } catch { /* ignore, user can type manually */ }
    setFetching(false);
  };

  const handleSubmit = async () => {
    setErr(null);
    if (!symbol || !shares) { setErr("Symbol and shares are required"); return; }
    setLoading(true);
    try {
      const { data } = await addHolding({
        symbol:        symbol.trim().toUpperCase(),
        yahooSymbol:   yahooSymbol || symbol.trim().toUpperCase(),
        shares:        Number(shares),
        avg_buy_price: Number(avgBuy || 0),
        currency,
        market,
      });
      setSymbol(""); setYahooSymbol(""); setShares(""); setAvgBuy(""); setResults([]);
      if (onAdded) onAdded(data);
    } catch (error) {
      setErr(error?.response?.data?.error || "Failed to add holding");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", background: "#0b1120", border: "1px solid #1e2d4a",
    borderRadius: 8, padding: "10px 12px", color: "#f1f5f9", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  const lbl = {
    display: "block", fontSize: 10, color: "#64748b", marginBottom: 5,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6,
  };

  return (
    <div>
      <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Add Stock</h4>

      {/* ── Market toggle ── */}
      <div style={{ marginBottom: 14 }}>
        <span style={lbl}>Market</span>
        <div style={{ display: "flex", background: "#0b1120", borderRadius: 8, padding: 3, gap: 3, border: "1px solid #1e2d4a" }}>
          {[
            { id: "US", label: "🇺🇸  US (NYSE / NASDAQ)", color: "#3b82f6" },
            { id: "IN", label: "🇮🇳  India (NSE / BSE)",  color: "#f59e0b" },
          ].map(m => (
            <button key={m.id} type="button" onClick={() => switchMarket(m.id)}
              style={{
                flex: 1, padding: "8px 6px", borderRadius: 6, border: "none",
                cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                transition: "all 0.15s",
                background: market === m.id ? m.color : "transparent",
                color: market === m.id ? "white" : "#64748b",
              }}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 12, position: "relative" }}>
        <span style={lbl}>
          {market === "IN" ? "Search Indian Stock (Reliance, TCS, Infosys...)" : "Search US Stock (AAPL, TSLA, MSFT...)"}
        </span>
        <input
          value={symbol}
          onChange={e => searchStocks(e.target.value)}
          placeholder={market === "IN" ? "Type company name or NSE symbol..." : "Type ticker or company name..."}
          style={inp}
          onFocus={e => e.target.style.borderColor = "#22c55e"}
          onBlur={e => e.target.style.borderColor = "#1e2d4a"}
          autoComplete="off"
        />

        {/* Dropdown */}
        {results.length > 0 && (
          <div style={{
            position: "absolute", zIndex: 30, width: "100%", background: "#0d1f35",
            border: "1px solid #1e2d4a", borderRadius: 8, marginTop: 4,
            maxHeight: 200, overflowY: "auto", boxShadow: "0 10px 30px #00000099",
          }}>
            {results.map(stock => (
              <div
                key={stock.symbol}
                onMouseDown={() => selectStock(stock)}  // mousedown fires before blur
                style={{
                  padding: "9px 12px", cursor: "pointer", fontSize: 12,
                  borderBottom: "1px solid #1a2540", display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#131f35"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <span style={{ fontWeight: 700, color: "#f1f5f9", marginRight: 8 }}>
                    {stock.displaySymbol || stock.symbol}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>{stock.description}</span>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: stock.currency === "INR" ? "#f59e0b22" : "#3b82f622",
                  color:      stock.currency === "INR" ? "#f59e0b"   : "#60a5fa",
                  whiteSpace: "nowrap", marginLeft: 8,
                }}>
                  {stock.currency === "INR" ? "₹ NSE" : "$ NYSE"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Shares ── */}
      <div style={{ marginBottom: 12 }}>
        <span style={lbl}>Quantity / Shares</span>
        <input type="number" value={shares} onChange={e => setShares(e.target.value)}
          placeholder="10" style={inp}
          onFocus={e => e.target.style.borderColor = "#22c55e"}
          onBlur={e => e.target.style.borderColor = "#1e2d4a"} />
      </div>

      {/* ── Avg Buy Price ── */}
      <div style={{ marginBottom: 16 }}>
        <span style={lbl}>Avg Buy Price ({currSym})</span>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#64748b", fontSize: 13, fontWeight: 600,
          }}>
            {fetching ? "⟳" : currSym}
          </span>
          <input type="number" value={avgBuy} onChange={e => setAvgBuy(e.target.value)}
            placeholder={fetching ? "Fetching live price..." : "Auto-filled on stock select"}
            style={{ ...inp, paddingLeft: 28 }}
            onFocus={e => e.target.style.borderColor = "#22c55e"}
            onBlur={e => e.target.style.borderColor = "#1e2d4a"} />
        </div>
        {/* Currency indicator */}
        {yahooSymbol && (
          <div style={{ marginTop: 5, fontSize: 11, color: currency === "INR" ? "#f59e0b" : "#60a5fa" }}>
            {currency === "INR" ? "🇮🇳 Indian Rupee (₹)" : "🇺🇸 US Dollar ($)"}
            {" "}— {yahooSymbol}
          </div>
        )}
      </div>

      {err && (
        <div style={{
          background: "#f8717118", border: "1px solid #f8717133", borderRadius: 8,
          padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
        }}>{err}</div>
      )}

      <button onClick={handleSubmit} disabled={loading} style={{
        width: "100%",
        background: loading ? "#14532d" : "linear-gradient(135deg,#22c55e,#16a34a)",
        border: "none", borderRadius: 8, padding: "12px", color: "white",
        fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit", boxShadow: loading ? "none" : "0 2px 10px #22c55e33",
        transition: "all 0.2s",
      }}>
        {loading ? "Adding..." : `+ Add ${market === "IN" ? "🇮🇳 Indian" : "🇺🇸 US"} Stock`}
      </button>
    </div>
  );
}
