import React from "react";

export default function StatsBar({ stats }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.title}>💰 Total Invested</p>
        <h2>₹{stats.totalInvested}</h2>
      </div>

      <div style={styles.card}>
        <p style={styles.title}>📈 Current Value</p>
        <h2>₹{stats.currentValue}</h2>
      </div>

      <div style={styles.card}>
        <p style={styles.title}>🔥 Profit / Loss</p>
        <h2 style={{ color: stats.profit >= 0 ? "#16c784" : "#ea3943" }}>
          ₹{stats.profit} ({stats.percent}%)
        </h2>
      </div>

      <div style={styles.card}>
        <p style={styles.title}>🏆 Top Performer</p>
        <h2>
          {stats.bestStock.name} ({stats.bestStock.return}%)
        </h2>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "30px",
  },

  card: {
    background: "#1f2937",
    padding: "20px",
    borderRadius: "12px",
    color: "white",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  },

  title: {
    fontSize: "14px",
    opacity: 0.7,
  },
};