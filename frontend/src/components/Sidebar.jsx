import React, { useState } from "react";
import AddStockForm from "./AddStockForm";
import { deleteHolding } from "../api";

// Returns ₹ for INR, $ for USD
function sym(currency) {
  return currency === "INR" ? "₹" : "$";
}

export default function Sidebar({ holdings = [], onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Delete this holding?")) return;
    setDeleting(id);
    try {
      const { data } = await deleteHolding(id);
      if (onRefresh) onRefresh(data);
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{
      background: "#0d1623", border: "1px solid #1a2540", borderRadius: 16,
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a2540" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Stock Holdings</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowForm(s => !s)}
            style={{
              background: showForm ? "#22c55e" : "#131f35",
              border: `1px solid ${showForm ? "#22c55e" : "#1e2d4a"}`,
              borderRadius: 8, padding: "5px 12px", color: showForm ? "white" : "#94a3b8",
              fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {showForm ? "Close" : "Add Stock"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #1a2540", background: "#0b1120" }}>
          <AddStockForm onAdded={(data) => { if (onRefresh) onRefresh(data); setShowForm(false); }} />
        </div>
      )}

      {/* Table Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1.3fr 0.6fr 0.9fr 0.9fr 0.9fr 0.85fr",
        padding: "10px 22px", background: "#0b1120", borderBottom: "1px solid #1a2540",
      }}>
        {["Stock", "Qty", "Avg Price", "Cur. Price", "Value", "Gain/Loss"].map(h => (
          <span key={h} style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {holdings.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#475569", fontSize: 13 }}>
            No holdings yet. Add your first stock!
          </div>
        ) : (
          holdings.map((h, idx) => {
            const curPrice = h.current || h.avg_buy_price;
            const value    = curPrice * h.shares;
            const pct      = ((curPrice - h.avg_buy_price) / h.avg_buy_price) * 100;
            const isUp     = pct >= 0;
            const s        = sym(h.currency);
            const isIN     = h.market === "IN" || h.currency === "INR";

            return (
              <div
                key={h._id || h.symbol}
                style={{
                  display: "grid", gridTemplateColumns: "1.3fr 0.6fr 0.9fr 0.9fr 0.9fr 0.85fr",
                  padding: "13px 22px", borderBottom: "1px solid #0f1a2e",
                  alignItems: "center", transition: "background 0.15s",
                  background: idx % 2 === 0 ? "transparent" : "#0b1120",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#131f3566"}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "#0b1120"}
              >
                {/* Symbol + market badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{h.symbol}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10,
                    background: isIN ? "#f59e0b22" : "#3b82f622",
                    color: isIN ? "#f59e0b" : "#60a5fa",
                  }}>
                    {isIN ? "NSE" : "US"}
                  </span>
                </div>

                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{h.shares}</span>
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{s}{parseFloat(h.avg_buy_price).toFixed(2)}</span>
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{s}{curPrice.toFixed(2)}</span>
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{s}{value.toFixed(2)}</span>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isUp ? "#22c55e" : "#f87171" }}>
                    {isUp ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                  <button
                    onClick={() => handleDelete(h._id)}
                    disabled={deleting === h._id}
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "#374151", fontSize: 11, padding: "2px 4px",
                      borderRadius: 4, transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "#374151"}
                  >
                    {deleting === h._id ? "..." : "✕"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
