"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  CurrencyCode,
  formatCurrency,
  MonthlyEvaluatedPoint,
} from "@/lib/cashflowEngine";

interface CashflowChartProps {
  data: MonthlyEvaluatedPoint[];
  monthlyFloor: number;
  currency: CurrencyCode;
  exchangeRate: number;
  showStressOverlay: boolean;
  stressDropPct: number;
}

export default function CashflowChart({
  data,
  monthlyFloor,
  currency,
  exchangeRate,
  showStressOverlay,
  stressDropPct,
}: CashflowChartProps) {
  const convert = (val: number) =>
    currency === "USD" ? Math.round(val / exchangeRate) : Math.round(val);

  const chartData = data.map((point) => ({
    ...point,
    rawDisplay: convert(point.income),
    smoothedDisplay: convert(point.smoothedIncome),
    floorDisplay: convert(monthlyFloor),
    stressedDisplay: convert(point.stressedIncome),
  }));

  const symbol = currency === "GTQ" ? "Q" : "$";

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="smoothedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="shortName"
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(val: number) =>
              `${symbol}${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
            }
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const row = payload[0].payload as MonthlyEvaluatedPoint;
              const isHarvest = row.classification === "ALTA";
              const isLow = row.classification === "BAJA";

              return (
                <div className="bg-white border border-slate-200 rounded-xl shadow-md p-3 text-xs min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="font-semibold text-slate-900">
                      {row.monthName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                        isHarvest
                          ? "bg-emerald-50 text-emerald-700"
                          : isLow
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isHarvest
                        ? "Temporada alta"
                        : isLow
                        ? "Temporada baja"
                        : "Mes normal"}
                    </span>
                  </div>

                  <div className="space-y-1.5 tabular-nums">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Ingreso real:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(row.income, currency, exchangeRate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-medium">
                        Sueldo estabilizado:
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(
                          row.smoothedIncome,
                          currency,
                          exchangeRate
                        )}
                      </span>
                    </div>

                    {showStressOverlay && stressDropPct > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-rose-600">
                          Con baja (-{stressDropPct}%):
                        </span>
                        <span className="font-semibold text-rose-600">
                          {formatCurrency(
                            row.stressedIncome,
                            currency,
                            exchangeRate
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />

          <ReferenceLine
            y={convert(monthlyFloor)}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.25}
          />

          <Area
            type="monotone"
            dataKey="smoothedDisplay"
            name="Sueldo estabilizado"
            stroke="#059669"
            strokeWidth={2.5}
            fill="url(#smoothedGradient)"
            activeDot={{ r: 5, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
          />

          <Line
            type="monotone"
            dataKey="rawDisplay"
            name="Ingreso real"
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "#b45309" }}
          />

          {showStressOverlay && stressDropPct > 0 && (
            <Line
              type="monotone"
              dataKey="stressedDisplay"
              name={`Simulación (-${stressDropPct}%)`}
              stroke="#e11d48"
              strokeWidth={1.5}
              strokeDasharray="2 3"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
