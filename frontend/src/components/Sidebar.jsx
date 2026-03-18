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

      if (onRefresh) onRefresh(data);

    } catch (e) {

      console.error(e);
      alert("Delete failed");

    } finally {

      setDeleting(null);

    }

  }

  return (

    <aside className="col-span-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl min-h-[600px]">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h3 className="text-2xl font-semibold text-blue-400">
          Invested Stocks
        </h3>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm text-blue-400 hover:text-blue-300 transition"
        >
          {showForm ? "Close" : "Add"}
        </button>

      </div>

      {/* Add stock form */}
      {showForm && (

        <div className="mb-6 bg-slate-700/40 p-4 rounded-xl border border-slate-600">

          <AddStockForm
            onAdded={(data) => {

              if (onRefresh) onRefresh(data);

              setShowForm(false);

            }}
          />

        </div>

      )}

      {/* Holdings */}
      <div className="space-y-4">

        {holdings.length === 0 ? (

          <div className="text-slate-400 py-8 text-center">
            No holdings
          </div>

        ) : (

          holdings.map((h) => {

            const currentPrice = h.current || h.avg_buy_price;

            const value = currentPrice * h.shares;

            const profit =
              (currentPrice - h.avg_buy_price) * h.shares;

            const percent =
              ((currentPrice - h.avg_buy_price) /
                h.avg_buy_price) *
              100;

            return (

              <div
                key={h._id || h.symbol}
                className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 hover:bg-slate-700/60 transition"
              >

                <div className="flex justify-between items-start">

                  <div>

                    <div className="font-semibold text-lg text-white">
                      {h.symbol}
                    </div>

                    <div className="text-sm text-slate-400">
                      {h.shares} shares • Avg ₹{h.avg_buy_price}
                    </div>

                  </div>

                  <div className="text-right">

                    <div className="text-lg font-semibold text-white">
                      ₹{value.toFixed(2)}
                    </div>

                    <div
                      className={`text-sm ${
                        percent < 0
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >

                      {percent >= 0 ? "+" : ""}
                      {percent.toFixed(2)}%

                    </div>

                    <button
                      onClick={() => handleDelete(h._id)}
                      className="text-xs text-rose-400 hover:text-rose-300 mt-2 transition"
                      disabled={deleting === h._id}
                    >

                      {deleting === h._id
                        ? "Deleting..."
                        : "Delete"}

                    </button>

                  </div>

                </div>

              </div>

            );

          })

        )}

      </div>

      {/* Prediction Card */}
      <div className="mt-8 bg-slate-700/30 border border-slate-600 rounded-xl p-5">

        <h4 className="font-semibold text-blue-400 mb-3">
          Prediction
        </h4>

        <div className="text-sm text-slate-400 mb-3">
          TSLA Q1 • Growth estimate
        </div>

        <div className="h-20 bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-center text-slate-500">
          small sparkline
        </div>

        <div className="mt-4 text-sm text-slate-300">
          Year return estimate:{" "}
          <strong className="text-emerald-400">
            12%
          </strong>
        </div>

      </div>

    </aside>

  );

}