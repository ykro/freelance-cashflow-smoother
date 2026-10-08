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
    bufferDisplay: convert(point.projectedBufferBalance),
  }));

  const symbol = currency === "GTQ" ? "Q" : "$";

  return (
    <div className="w-full h-[330px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 14, right: 18, left: 6, bottom: 4 }}
        >
          <defs>
            <linearGradient id="smoothedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="shortName"
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
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
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 text-xs min-w-[230px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {row.monthName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        isHarvest
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isLow
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isHarvest
                        ? "☀️ Cosecha (Alta)"
                        : isLow
                        ? "🌧️ Vacas Flacas"
                        : "⛅ Mes Normal"}
                    </span>
                  </div>

                  <div className="space-y-1.5 tabular-nums">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        Ingreso Real (Volátil):
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(row.income, currency, exchangeRate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                        Sueldo Estabilizado:
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(
                          row.smoothedIncome,
                          currency,
                          exchangeRate
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-blue-600 inline-block" />
                        Piso Mensual Fijo:
                      </span>
                      <span className="font-medium text-blue-700">
                        {formatCurrency(monthlyFloor, currency, exchangeRate)}
                      </span>
                    </div>

                    {showStressOverlay && stressDropPct > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-rose-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                          Simulación Crisis (-{stressDropPct}%):
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

                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {row.bufferContribution >= 0
                          ? "Aporte al Colchón:"
                          : "Retiro del Colchón:"}
                      </span>
                      <span
                        className={`font-semibold ${
                          row.bufferContribution >= 0
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {row.bufferContribution >= 0 ? "+" : "-"}
                        {formatCurrency(
                          Math.abs(row.bufferContribution),
                          currency,
                          exchangeRate
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />

          <ReferenceLine
            y={convert(monthlyFloor)}
            stroke="#2563eb"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Piso Vital (${formatCurrency(
                monthlyFloor,
                currency,
                exchangeRate
              )})`,
              position: "insideBottomRight",
              fill: "#1d4ed8",
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          <Area
            type="monotone"
            dataKey="smoothedDisplay"
            name="Tu Sueldo Estabilizado (Waterfall)"
            stroke="#059669"
            strokeWidth={3}
            fill="url(#smoothedGradient)"
            activeDot={{ r: 6, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
          />

          <Line
            type="monotone"
            dataKey="rawDisplay"
            name="Ingreso Real (La Montaña Rusa)"
            stroke="#d97706"
            strokeWidth={2.25}
            strokeDasharray="5 5"
            dot={{ r: 3.5, fill: "#d97706", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#b45309" }}
          />

          {showStressOverlay && stressDropPct > 0 && (
            <Line
              type="monotone"
              dataKey="stressedDisplay"
              name={`Ingreso en Crisis (-${stressDropPct}%)`}
              stroke="#e11d48"
              strokeWidth={1.75}
              strokeDasharray="2 3"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
