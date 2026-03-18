import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts";

export default function ChartPanel({
  pieData,
  portfolioValue
}) {

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="col-span-8 bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">

      {/* TOP HOLDINGS */}
      <h2 className="text-xl font-semibold text-blue-400 mb-4">
        Top Holdings
      </h2>

      <div className="mb-8">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={pieData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[6,6,0,0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-8 items-center">

        {/* PORTFOLIO ALLOCATION */}
        <div>

          <h3 className="text-lg font-semibold text-slate-300 mb-4">
            Portfolio Allocation
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* PORTFOLIO VALUE */}
        <div>

          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            Total Portfolio Value
          </h3>

          <p className="text-3xl font-bold text-emerald-400">
            ₹ {portfolioValue.toFixed(2)}
          </p>

        </div>

      </div>

    </div>
  );
}