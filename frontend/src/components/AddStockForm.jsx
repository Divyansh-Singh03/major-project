// frontend/src/components/AddStockForm.jsx
import React, { useState } from 'react';
import { addHolding } from '../api';

export default function AddStockForm({ onAdded }) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [avgBuy, setAvgBuy] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    if (!symbol || !shares) return setErr('Symbol and shares are required');
    setLoading(true);
    try {
      const { data } = await addHolding({
        symbol: symbol.trim().toUpperCase(),
        shares: Number(shares),
        avg_buy_price: Number(avgBuy || 0)
      });
      setSymbol(''); setShares(''); setAvgBuy('');
      if (onAdded) onAdded(data);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || 'Failed to add');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 mt-2 rounded shadow-sm">
      <h4 className="font-semibold mb-2">Add stock</h4>
      <div className="mb-2">
        <label className="block text-sm">Symbol</label>
        <input value={symbol} onChange={e=>setSymbol(e.target.value)} className="w-full border p-2 rounded" placeholder="AAPL" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Shares</label>
        <input value={shares} onChange={e=>setShares(e.target.value)} type="number" className="w-full border p-2 rounded" placeholder="10" />
      </div>
      <div className="mb-4">
        <label className="block text-sm">Avg buy price (optional)</label>
        <input value={avgBuy} onChange={e=>setAvgBuy(e.target.value)} type="number" className="w-full border p-2 rounded" placeholder="120" />
      </div>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
