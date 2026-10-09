"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Home,
  Wallet,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  computeCashflowSmoothing,
  convertFromGTQ,
  convertToGTQ,
  CurrencyCode,
  DEFAULT_EXCHANGE_RATE,
  DEMO_PROFILES,
  formatCurrency,
  FreelanceProfilePreset,
  MonthlyHistoricalPoint,
} from "@/lib/cashflowEngine";
import CashflowChart from "./CashflowChart";

export default function CashflowDashboard() {
  const [currency, setCurrency] = useState<CurrencyCode>("GTQ");
  const [activeProfileId, setActiveProfileId] = useState<string>(
    DEMO_PROFILES[0].id
  );

  // Core 3 Financial Inputs (Stored in base GTQ)
  const [monthlyFloorGTQ, setMonthlyFloorGTQ] = useState<number>(
    DEMO_PROFILES[0].monthlyFloor
  );
  const [currentBufferGTQ, setCurrentBufferGTQ] = useState<number>(
    DEMO_PROFILES[0].currentBuffer
  );
  const [weeklyIncomeGTQ, setWeeklyIncomeGTQ] = useState<number>(
    DEMO_PROFILES[0].weeklyIncome
  );
  const [historicalMonths, setHistoricalMonths] = useState<
    MonthlyHistoricalPoint[]
  >(DEMO_PROFILES[0].historicalMonths);

  // Stress-Test Simulator
  const [stressTestDropPct, setStressTestDropPct] = useState<number>(0);

  // Quick Natural Language Input
  const [nlInputText, setNlInputText] = useState<string>("");
  const [isParsingNL, setIsParsingNL] = useState<boolean>(false);

  const applyProfilePreset = (profile: FreelanceProfilePreset) => {
    setActiveProfileId(profile.id);
    setMonthlyFloorGTQ(profile.monthlyFloor);
    setCurrentBufferGTQ(profile.currentBuffer);
    setWeeklyIncomeGTQ(profile.weeklyIncome);
    setHistoricalMonths(profile.historicalMonths);
  };

  const smoothing = useMemo(
    () =>
      computeCashflowSmoothing({
        monthlyFloor: monthlyFloorGTQ,
        currentBuffer: currentBufferGTQ,
        weeklyIncome: weeklyIncomeGTQ,
        historicalMonths,
        stressTestDropPct,
      }),
    [
      monthlyFloorGTQ,
      currentBufferGTQ,
      weeklyIncomeGTQ,
      historicalMonths,
      stressTestDropPct,
    ]
  );

  const handleParseNaturalLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInputText.trim()) return;
    setIsParsingNL(true);
    try {
      const res = await fetch("/api/cashflow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "parse-natural-language",
          text: nlInputText,
          currency,
          exchangeRate: DEFAULT_EXCHANGE_RATE,
        }),
      });
      const data = await res.json();
      if (data.parsed) {
        if (typeof data.parsed.monthlyFloorGTQ === "number") {
          setMonthlyFloorGTQ(data.parsed.monthlyFloorGTQ);
        }
        if (typeof data.parsed.currentBufferGTQ === "number") {
          setCurrentBufferGTQ(data.parsed.currentBufferGTQ);
        }
        if (typeof data.parsed.weeklyIncomeGTQ === "number") {
          setWeeklyIncomeGTQ(data.parsed.weeklyIncomeGTQ);
        }
        setNlInputText("");
      }
    } catch {
      // Silent fallback
    } finally {
      setIsParsingNL(false);
    }
  };

  const fmt = (amountGTQ: number) =>
    formatCurrency(amountGTQ, currency, DEFAULT_EXCHANGE_RATE);

  const displayWeeklyIncome = Math.round(
    convertFromGTQ(weeklyIncomeGTQ, currency, DEFAULT_EXCHANGE_RATE)
  );
  const displayMonthlyFloor = Math.round(
    convertFromGTQ(monthlyFloorGTQ, currency, DEFAULT_EXCHANGE_RATE)
  );
  const displayCurrentBuffer = Math.round(
    convertFromGTQ(currentBufferGTQ, currency, DEFAULT_EXCHANGE_RATE)
  );

  const isLowWeek = smoothing.buckets.isDeficitWeek;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Minimal Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Estabilizador
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Subtle Example Presets */}
            <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
              <span>Casos de ejemplo:</span>
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyProfilePreset(p)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    activeProfileId === p.id
                      ? "bg-slate-200/80 text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {p.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Currency Switch */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
              <button
                type="button"
                onClick={() => setCurrency("GTQ")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  currency === "GTQ"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                GTQ (Q)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  currency === "USD"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {/* SECTION 1: 3 Simple Inputs */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Input 1: Weekly Income */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500">
                1. ¿Cuánto ganaste esta semana?
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                  {currency === "GTQ" ? "Q" : "$"}
                </span>
                <input
                  type="number"
                  value={displayWeeklyIncome}
                  onChange={(e) =>
                    setWeeklyIncomeGTQ(
                      convertToGTQ(
                        Math.max(0, Number(e.target.value)),
                        currency,
                        DEFAULT_EXCHANGE_RATE
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-9 pr-3 text-lg font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
              <input
                type="range"
                min={0}
                max={currency === "GTQ" ? 15000 : 2000}
                step={currency === "GTQ" ? 100 : 20}
                value={displayWeeklyIncome}
                onChange={(e) =>
                  setWeeklyIncomeGTQ(
                    convertToGTQ(
                      Number(e.target.value),
                      currency,
                      DEFAULT_EXCHANGE_RATE
                    )
                  )
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Input 2: Monthly Fixed Expenses */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500">
                2. Tus gastos fijos al mes
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                  {currency === "GTQ" ? "Q" : "$"}
                </span>
                <input
                  type="number"
                  value={displayMonthlyFloor}
                  onChange={(e) =>
                    setMonthlyFloorGTQ(
                      convertToGTQ(
                        Math.max(500, Number(e.target.value)),
                        currency,
                        DEFAULT_EXCHANGE_RATE
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-9 pr-3 text-lg font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 tabular-nums">
                Equivale a {fmt(smoothing.weeklyFloor)} por semana
              </p>
            </div>

            {/* Input 3: Current Buffer */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500">
                3. Tu fondo colchón actual
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                  {currency === "GTQ" ? "Q" : "$"}
                </span>
                <input
                  type="number"
                  value={displayCurrentBuffer}
                  onChange={(e) =>
                    setCurrentBufferGTQ(
                      convertToGTQ(
                        Math.max(0, Number(e.target.value)),
                        currency,
                        DEFAULT_EXCHANGE_RATE
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-9 pr-3 text-lg font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 tabular-nums">
                Cubre {smoothing.runwayWeeks.toFixed(1)} semanas de gastos fijos
              </p>
            </div>
          </div>

          {/* Subtle 1-Line Natural Language Input */}
          <form
            onSubmit={handleParseNaturalLanguage}
            className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={nlInputText}
              onChange={(e) => setNlInputText(e.target.value)}
              placeholder="O escribe rápido: 'Gano 3,500 esta semana, mis gastos fijos son 7,000 al mes y tengo 4,000 ahorrados'"
              className="flex-1 rounded-xl border border-slate-200/80 bg-[#F8FAFC] px-3.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!nlInputText.trim() || isParsingNL}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              {isParsingNL ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
              ) : (
                <>
                  <span>Actualizar</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </>
              )}
            </button>
          </form>
        </section>

        {/* SECTION 2: Hero Output — Las 3 Cubetas de tu Semana */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Tu reparto de esta semana
            </h2>
            <span className="text-xs text-slate-500">
              Meta de reserva: {fmt(smoothing.targetBuffer)}
            </span>
          </div>

          {isLowWeek && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">
                  Semana de ingreso bajo:
                </span>{" "}
                Esta semana no apartes dinero. Retira{" "}
                <span className="font-semibold tabular-nums">
                  {fmt(smoothing.buckets.withdrawFromBuffer)}
                </span>{" "}
                de tu fondo colchón para cubrir tus gastos fijos sin endeudarte.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Bucket 1: Aparta Hoy */}
            <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-700">
                <span>Aparta hoy</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">
                {fmt(smoothing.buckets.saveForLowSeason)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {smoothing.buckets.saveForLowSeasonPct.toFixed(0)}% para meses
                de temporada baja
              </p>
            </div>

            {/* Bucket 2: Para tus Gastos Fijos */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-sky-700">
                <span>Para tus gastos fijos</span>
                <Home className="h-4 w-4 text-sky-600" />
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">
                {fmt(smoothing.buckets.fixedCostAllocation)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Cuota semanal para cubrir tu mes base
              </p>
            </div>

            {/* Bucket 3: Libre para Gastar */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Libre para gastar</span>
                <Wallet className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">
                {fmt(smoothing.buckets.safeToSpend)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Disponible esta semana con tranquilidad
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: Clean Chart + 12-Month Strip */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Ingreso real vs. sueldo estabilizado
              </h2>
              <p className="text-xs text-slate-500">
                Cómo tu fondo absorbe los meses altos y bajos durante el año
              </p>
            </div>

            {/* Compact Simulator Slider */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-[#F8FAFC] px-3.5 py-2">
              <span className="text-xs font-medium text-slate-600">
                Simular baja:
              </span>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={stressTestDropPct}
                onChange={(e) => setStressTestDropPct(Number(e.target.value))}
                className="w-24 accent-slate-700 cursor-pointer"
              />
              <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-800">
                -{stressTestDropPct}%
              </span>
            </div>
          </div>

          <CashflowChart
            data={smoothing.monthlySeries}
            monthlyFloor={monthlyFloorGTQ}
            currency={currency}
            exchangeRate={DEFAULT_EXCHANGE_RATE}
            showStressOverlay={stressTestDropPct > 0}
            stressDropPct={stressTestDropPct}
          />

          {/* Compact 12-Month Seasonality Strip */}
          <div className="pt-2 border-t border-slate-100">
            <div className="mb-2.5 flex items-center justify-between text-xs text-slate-400">
              <span>Mapa de meses buenos y bajos</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mes
                  alto
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Normal
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Mes
                  bajo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {smoothing.monthlySeries.map((m) => {
                const badgeStyle =
                  m.classification === "ALTA"
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                    : m.classification === "BAJA"
                    ? "border-amber-200 bg-amber-50/70 text-amber-800"
                    : "border-slate-200/70 bg-[#F8FAFC] text-slate-600";
                return (
                  <div
                    key={m.monthIndex}
                    className={`rounded-xl border p-2 text-center ${badgeStyle}`}
                  >
                    <div className="text-[11px] font-semibold">
                      {m.shortName}
                    </div>
                    <div className="mt-0.5 text-[10px] tabular-nums opacity-80">
                      {fmt(m.income)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
