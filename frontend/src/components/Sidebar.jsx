import React, { useState } from "react";
import AddStockForm from "./AddStockForm";
import { deleteHolding } from "../api";

export default function Sidebar({ holdings = [], onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Delete this holding?")) return;
    setDeleting(id);
    try {
      const { data } = await deleteHolding(id);
      // if API returns refreshed portfolio use it; else call parent refresh
      if (onRefresh) onRefresh(data);
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <aside className="col-span-4 bg-white p-6 rounded-lg shadow-sm min-h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">Invested stocks</h3>
        <button
          onClick={() => setShowForm(s => !s)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showForm ? "Close" : "Add"}
        </button>
      </div>

      {/* Add stock form */}
      {showForm && (
        <div className="mb-4">
          <AddStockForm
            onAdded={(data) => {
              if (onRefresh) onRefresh(data);
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* Holdings list */}
      <div className="mt-2">
        {holdings.length === 0 ? (
          <div className="text-gray-400 py-8">No holdings</div>
        ) : (
          holdings.map(h => (
            <div key={h._id || h.symbol} className="py-4 border-b last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{h.symbol}</div>
                  <div className="text-sm text-gray-500">{h.shares} shares • Avg ₹{h.avg_buy_price}</div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold">₹{Math.round(h.value || (h.current*h.shares || 0))}</div>
                  <div className={`text-sm ${ (h.gainPct && h.gainPct < 0) ? 'text-red-500' : 'text-green-600'}`}>
                    {h.gainPct ? `${Math.round(h.gainPct)}%` : ''}
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => handleDelete(h._id)}
                      className="text-xs text-red-600"
                      disabled={deleting === h._id}
                    >
                      {deleting === h._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Prediction card — always visible below holdings */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h4 className="font-semibold mb-2">Prediction</h4>
        <div className="text-sm text-gray-600 mb-3">TSLA Q1 • Growth estimate</div>

        <div className="h-20 bg-white border rounded flex items-center justify-center text-gray-400">
          small sparkline
        </div>

        <div className="mt-4 text-sm">
          Year return estimate: <strong>12%</strong>
        </div>
      </div>
    </aside>
  );
}
