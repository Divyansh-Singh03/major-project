import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FFF'];

export default function ChartPanel({ mainSeries, pieData, portfolioValue }) {
  return (
    <main className="col-span-8 bg-white rounded-xl shadow p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">AAPL</h3>
          <div className="text-sm text-gray-500">Bought: 2020 • Current: 2025</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Portfolio value</div>
          <div className="text-xl font-bold">₹{portfolioValue}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Line Chart */}
        <div className="col-span-1" style={{ height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={mainSeries}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-gray-600">Allocation</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">Stock? (Loss)</h4>
        <div className="text-sm text-gray-700">
          Summary / advice area — e.g. show unrealized losses & recommended action.
        </div>
      </div>
    </main>
  );
}
