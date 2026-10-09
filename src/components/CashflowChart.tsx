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
import { CurrencyCode, EvaluatedPeriodPoint } from "@/types/cashflow";
import { formatGTQ, formatUSD } from "@/lib/cashflow-engine";

interface CashflowChartProps {
  data: EvaluatedPeriodPoint[];
  periodFloorGTQ: number;
  currency: CurrencyCode;
  exchangeRate: number;
  simulationDeltaPct: number;
}

export default function CashflowChart({
  data,
  periodFloorGTQ,
  currency,
  exchangeRate,
  simulationDeltaPct,
}: CashflowChartProps) {
  const convert = (valGTQ: number) =>
    currency === "USD" ? Math.round(valGTQ / exchangeRate) : Math.round(valGTQ);

  const chartData = data.map((point) => ({
    ...point,
    rawDisplay: convert(point.totalGTQ),
    smoothedDisplay: convert(point.smoothedGTQ),
    floorDisplay: convert(periodFloorGTQ),
    simulatedDisplay: convert(point.simulatedIncomeGTQ),
    simulatedSmoothedDisplay: convert(point.simulatedSmoothedGTQ),
  }));

  const symbol = currency === "GTQ" ? "Q" : "$";
  const hasSimulation = simulationDeltaPct !== 0;
  const isPositiveSim = simulationDeltaPct > 0;

  return (
    <div className="w-full h-[310px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
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
            dataKey="shortLabel"
            axisLine={{ stroke: "#e2e8f0" }}
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
              const row = payload[0].payload as EvaluatedPeriodPoint;
              const isHigh = row.classification === "ALTA";
              const isLow = row.classification === "BAJA";

              return (
                <div className="bg-white border border-slate-200 rounded-xl shadow-md p-3.5 text-xs min-w-[240px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 gap-3">
                    <span className="font-semibold text-slate-900">
                      {row.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium text-[11px] shrink-0 ${
                        isHigh
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isLow
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {isHigh
                        ? "Temporada Alta"
                        : isLow
                        ? "Temporada Baja"
                        : "Normal"}
                    </span>
                  </div>

                  <div className="space-y-1.5 tabular-nums">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Ingreso real:</span>
                      <span className="font-semibold text-slate-900">
                        {formatGTQ(row.totalGTQ)} · {formatUSD(row.totalUSD)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-emerald-700 font-medium">
                        Sueldo estabilizado:
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {formatGTQ(row.smoothedGTQ)} ·{" "}
                        {formatUSD(row.smoothedUSD)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">
                        {row.bufferContributionGTQ >= 0
                          ? "Apartado al fondo:"
                          : "Retiro del fondo:"}
                      </span>
                      <span
                        className={`font-semibold ${
                          row.bufferContributionGTQ >= 0
                            ? "text-emerald-600"
                            : "text-amber-700"
                        }`}
                      >
                        {row.bufferContributionGTQ >= 0 ? "+" : "-"}
                        {formatGTQ(Math.abs(row.bufferContributionGTQ))}
                      </span>
                    </div>

                    {hasSimulation && (
                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span
                            className={
                              isPositiveSim ? "text-sky-700" : "text-rose-600"
                            }
                          >
                            Ingreso simulado (
                            {isPositiveSim
                              ? `+${simulationDeltaPct}%`
                              : `${simulationDeltaPct}%`}
                            ):
                          </span>
                          <span
                            className={`font-semibold ${
                              isPositiveSim ? "text-sky-700" : "text-rose-600"
                            }`}
                          >
                            {formatGTQ(row.simulatedIncomeGTQ)} ·{" "}
                            {formatUSD(row.simulatedIncomeGTQ / exchangeRate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">
                            Estabilizado simulado:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatGTQ(row.simulatedSmoothedGTQ)} ·{" "}
                            {formatUSD(row.simulatedSmoothedGTQ / exchangeRate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />

          <ReferenceLine
            y={convert(periodFloorGTQ)}
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
            activeDot={{
              r: 5,
              fill: "#059669",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
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

          {hasSimulation && (
            <Line
              type="monotone"
              dataKey="simulatedDisplay"
              name={`Simulacion (${
                isPositiveSim
                  ? `+${simulationDeltaPct}%`
                  : `${simulationDeltaPct}%`
              })`}
              stroke={isPositiveSim ? "#0284c7" : "#e11d48"}
              strokeWidth={2}
              strokeDasharray="2 3"
              dot={{
                r: 2.5,
                fill: isPositiveSim ? "#0284c7" : "#e11d48",
                strokeWidth: 0,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
