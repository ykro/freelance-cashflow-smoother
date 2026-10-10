"use client";

import React, { useState, useMemo } from "react";
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import {
  CurrencyCode,
  DualCurrencyAmount,
  IncomePeriodInput,
  PeriodMode,
  PresetProfile,
} from "@/types/cashflow";
import {
   computeDualCurrencyCashflow,
  DEFAULT_EXCHANGE_RATE,
  formatDual,
  formatGTQ,
  formatUSD,
  PRESET_PROFILES,
} from "@/lib/cashflow-engine";
import CashflowChart from "./CashflowChart";

const DEFAULT_MONTH_PERIODS: IncomePeriodInput[] = [
  { id: "m-1", label: "Junio", shortLabel: "Jun", gtq: 1500, usd: 620 },
  { id: "m-2", label: "Julio", shortLabel: "Jul", gtq: 2400, usd: 1150 },
  { id: "m-3", label: "Agosto", shortLabel: "Ago", gtq: 3100, usd: 1550 },
  { id: "m-4", label: "Septiembre", shortLabel: "Sep", gtq: 1200, usd: 580 },
  { id: "m-5", label: "Octubre", shortLabel: "Oct", gtq: 3500, usd: 1680 },
];

const DEFAULT_WEEK_PERIODS: IncomePeriodInput[] = [
  { id: "w-1", label: "Semana 1", shortLabel: "Sem 1", gtq: 2850, usd: 0 },
  { id: "w-2", label: "Semana 2", shortLabel: "Sem 2", gtq: 1950, usd: 0 },
  { id: "w-3", label: "Semana 3", shortLabel: "Sem 3", gtq: 1180, usd: 0 },
  { id: "w-4", label: "Semana 4", shortLabel: "Sem 4", gtq: 3200, usd: 0 },
];

const PRESET_SHORT_LABELS: Record<string, string> = {
  "freelancer-dual": "Freelancer $ y Q",
  "comerciante-semanal": "Comerciante Q",
  "consultor-mixto": "Consultor Mixto",
};

const STEPS: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: "1. Ingresos" },
  { id: 2, label: "2. Gastos" },
  { id: 3, label: "3. Tu Plan" },
];

export default function CashflowDashboard() {
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>("GTQ");
  const [activePresetId, setActivePresetId] = useState<string>(
    PRESET_PROFILES[0].id
  );

  const [periodMode, setPeriodMode] = useState<PeriodMode>(
    PRESET_PROFILES[0].periodMode
  );
  const [essentialExpenses, setEssentialExpenses] =
    useState<DualCurrencyAmount>(PRESET_PROFILES[0].essentialExpenses);
  const [currentReserve, setCurrentReserve] = useState<DualCurrencyAmount>(
    PRESET_PROFILES[0].currentReserve
  );
  const [periods, setPeriods] = useState<IncomePeriodInput[]>(
    PRESET_PROFILES[0].periods
  );

  const [simulationDeltaPct, setSimulationDeltaPct] = useState<number>(0);

  const applyPreset = (preset: PresetProfile) => {
    setActivePresetId(preset.id);
    setPeriodMode(preset.periodMode);
    setEssentialExpenses({ ...preset.essentialExpenses });
    setCurrentReserve({ ...preset.currentReserve });
    setPeriods(preset.periods.map((p) => ({ ...p })));
    setSimulationDeltaPct(0);
  };

  const handleTogglePeriodMode = (nextMode: PeriodMode) => {
    if (nextMode === periodMode) return;
    setPeriodMode(nextMode);
    setActivePresetId("custom");
    if (nextMode === "week") {
      setEssentialExpenses({ gtq: 1650, usd: 0 });
      setPeriods(DEFAULT_WEEK_PERIODS.map((p) => ({ ...p })));
    } else {
      setEssentialExpenses({ gtq: 7200, usd: 180 });
      setPeriods(DEFAULT_MONTH_PERIODS.map((p) => ({ ...p })));
    }
  };

  const handleUpdatePeriod = (
    id: string,
    field: "label" | "gtq" | "usd",
    value: string | number
  ) => {
    setActivePresetId("custom");
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === "label") {
          const strVal = String(value);
          return {
            ...p,
            label: strVal,
            shortLabel: strVal.slice(0, 6).trim() || p.shortLabel,
          };
        }
        return {
          ...p,
          [field]: Math.max(0, Number(value) || 0),
        };
      })
    );
  };

  const handleAddPeriod = () => {
    const maxPeriods = periodMode === "month" ? 6 : 8;
    if (periods.length >= maxPeriods) return;
    setActivePresetId("custom");
    const nextIdx = periods.length + 1;
    const isMonth = periodMode === "month";
    const newPeriod: IncomePeriodInput = {
      id: `${periodMode}-${Date.now()}`,
      label: isMonth ? `Mes ${nextIdx}` : `Semana ${nextIdx}`,
      shortLabel: isMonth ? `Mes ${nextIdx}` : `Sem ${nextIdx}`,
      gtq: isMonth ? 2500 : 1900,
      usd: isMonth ? 600 : 0,
    };
    setPeriods((prev) => [...prev, newPeriod]);
  };

  const handleRemovePeriod = (id: string) => {
    if (periods.length <= 2) return;
    setActivePresetId("custom");
    setPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const result = useMemo(
    () =>
      computeDualCurrencyCashflow({
        periodMode,
        essentialExpenses,
        currentReserve,
        periods,
        simulationDeltaPct,
        exchangeRate: DEFAULT_EXCHANGE_RATE,
      }),
    [periodMode, essentialExpenses, currentReserve, periods, simulationDeltaPct]
  );

  const periodNounSingular = periodMode === "month" ? "mes" : "semana";
  const maxAllowedPeriods = periodMode === "month" ? 6 : 8;

  const setAsideDual = formatDual(
    result.weeklyAllocation.recommendedSetAsideGTQ,
    primaryCurrency,
    result.exchangeRate
  );
  const safeWeeklyDual = formatDual(
    result.weeklyAllocation.safeWeeklyIncomeGTQ,
    primaryCurrency,
    result.exchangeRate
  );
  const safeMonthlyDual = formatDual(
    result.weeklyAllocation.safeMonthlySalaryGTQ,
    primaryCurrency,
    result.exchangeRate
  );

  // Horizontal bar scale for Page 3 (Season Learning)
  const maxBarWeeklyGTQ = Math.max(
    1,
    result.seasonLearning.goodSeasonWeeklyAvgGTQ,
    result.seasonLearning.lowSeasonWeeklyAvgGTQ,
    result.essentialWeeklyGTQ
  );
  const goodBarPct = Math.min(
    100,
    Math.max(12, Math.round((result.seasonLearning.goodSeasonWeeklyAvgGTQ / maxBarWeeklyGTQ) * 100))
  );
  const lowBarPct = Math.min(
    100,
    Math.max(12, Math.round((result.seasonLearning.lowSeasonWeeklyAvgGTQ / maxBarWeeklyGTQ) * 100))
  );
  const essentialBarPct = Math.min(
    100,
    Math.max(12, Math.round((result.essentialWeeklyGTQ / maxBarWeeklyGTQ) * 100))
  );

  // Compact FX text for Page 3 strip
  const fxPillLabel =
    result.dualCurrency.direction === "USD_TO_GTQ"
      ? `Cambiar ${formatUSD(result.dualCurrency.weeklyUSDToExchangeToGTQ)} → ${formatGTQ(
          result.dualCurrency.weeklyGTQReceivedFromExchange
        )} / sem`
      : result.dualCurrency.direction === "GTQ_TO_USD"
      ? `Cambiar ${formatGTQ(result.dualCurrency.weeklyGTQToExchangeToUSD)} → ${formatUSD(
          result.dualCurrency.weeklyUSDReceivedFromExchange
        )} / sem`
      : "Sin cambio necesario (mantener Q y $)";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Top Navigation & Step Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Estabilizador
            </span>
          </div>

          {/* 4-Step Tab Bar */}
          <nav
            aria-label="Pasos"
            className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1"
          >
            {STEPS.map((step) => {
              const isActive = page === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setPage(step.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-white text-emerald-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </nav>

          {/* Currency Display Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setPrimaryCurrency("GTQ")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                primaryCurrency === "GTQ"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Q
            </button>
            <button
              type="button"
              onClick={() => setPrimaryCurrency("USD")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                primaryCurrency === "USD"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              $
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* =========================================================
            PÁGINA 1: 1. INGRESOS
           ========================================================= */}
        {page === 1 && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                Ingresa tus últimos meses o semanas en Quetzales (Q) y/o Dólares ($).
              </h1>

              {/* Mode toggle + 3 small preset pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleTogglePeriodMode("month")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      periodMode === "month"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Por Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePeriodMode("week")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      periodMode === "week"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Por Semana
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Small Preset Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 mr-1">
                Ejemplos:
              </span>
              {PRESET_PROFILES.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {PRESET_SHORT_LABELS[preset.id] || preset.title}
                  </button>
                );
              })}
            </div>

            {/* Spacious List of Periods */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
              <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="sm:col-span-4">Periodo</div>
                <div className="sm:col-span-3">Ingresos Q</div>
                <div className="sm:col-span-3">Ingresos $</div>
                <div className="sm:col-span-2 text-right">Temporada</div>
              </div>

              <div className="space-y-3">
                {periods.map((period, idx) => {
                  const evaluated = result.evaluatedPeriods[idx];
                  const classification = evaluated?.classification || "NORMAL";

                  const badgeStyle =
                    classification === "ALTA"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : classification === "BAJA"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200";

                  const badgeText =
                    classification === "ALTA"
                      ? "Alta"
                      : classification === "BAJA"
                      ? "Baja"
                      : "Normal";

                  return (
                    <div
                      key={period.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/70 bg-[#F8FAFC] p-3.5 sm:grid-cols-12 sm:items-center sm:gap-4"
                    >
                      {/* Period Name */}
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={period.label}
                          onChange={(e) =>
                            handleUpdatePeriod(period.id, "label", e.target.value)
                          }
                          aria-label={`Nombre del periodo ${idx + 1}`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      {/* Ingresos Q */}
                      <div className="sm:col-span-3">
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
                            Q
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={period.gtq}
                            onChange={(e) =>
                              handleUpdatePeriod(period.id, "gtq", e.target.value)
                            }
                            aria-label={`Ingresos en Quetzales para ${period.label}`}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Ingresos $ */}
                      <div className="sm:col-span-3">
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={period.usd}
                            onChange={(e) =>
                              handleUpdatePeriod(period.id, "usd", e.target.value)
                            }
                            aria-label={`Ingresos en Dólares para ${period.label}`}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Auto-badge + Remove */}
                      <div className="flex items-center justify-between sm:col-span-2 sm:justify-end gap-2">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
                        >
                          {badgeText}
                        </span>

                        {periods.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePeriod(period.id)}
                            title="Eliminar"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                {periods.length < maxAllowedPeriods ? (
                  <button
                    type="button"
                    onClick={handleAddPeriod}
                    className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-emerald-600" />
                    <span>+ Agregar {periodNounSingular}</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => setPage(2)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <span>Siguiente: Gastos fijos</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            PÁGINA 2: 2. GASTOS
           ========================================================= */}
        {page === 2 && (
          <div className="space-y-8">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
              ¿Cuánto necesitas para cubrir tus gastos esenciales y cuánto tienes hoy en reserva?
            </h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Card 1: Gastos esenciales fijos */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Gastos esenciales fijos (por {periodNounSingular})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Vivienda, alimentación, servicios y herramientas de trabajo.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      En Quetzales Q
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                        Q
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={essentialExpenses.gtq}
                        onChange={(e) => {
                          setActivePresetId("custom");
                          setEssentialExpenses((prev) => ({
                            ...prev,
                            gtq: Math.max(0, Number(e.target.value) || 0),
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-8 pr-3 text-base font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      En Dólares $
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={essentialExpenses.usd}
                        onChange={(e) => {
                          setActivePresetId("custom");
                          setEssentialExpenses((prev) => ({
                            ...prev,
                            usd: Math.max(0, Number(e.target.value) || 0),
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-8 pr-3 text-base font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 tabular-nums">
                  <span>Equivalente semanal:</span>
                  <span className="font-semibold text-slate-800">
                    {formatGTQ(result.essentialWeeklyGTQ)} · {formatUSD(result.essentialWeeklyUSD)}
                  </span>
                </div>
              </div>

              {/* Card 2: Reserva disponible hoy */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Reserva disponible hoy
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Ahorro o fondo colchón que ya tienes apartado actualmente.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      En Quetzales Q
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                        Q
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={currentReserve.gtq}
                        onChange={(e) => {
                          setActivePresetId("custom");
                          setCurrentReserve((prev) => ({
                            ...prev,
                            gtq: Math.max(0, Number(e.target.value) || 0),
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-8 pr-3 text-base font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      En Dólares $
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={currentReserve.usd}
                        onChange={(e) => {
                          setActivePresetId("custom");
                          setCurrentReserve((prev) => ({
                            ...prev,
                            usd: Math.max(0, Number(e.target.value) || 0),
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2.5 pl-8 pr-3 text-base font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 tabular-nums">
                  <span>Total en reserva hoy:</span>
                  <span className="font-semibold text-slate-800">
                    {formatGTQ(result.currentReserveGTQ)} · {formatUSD(result.currentReserveUSD)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
                <span>Volver a ingresos</span>
              </button>

              <button
                type="button"
                onClick={() => setPage(3)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <span>Calcular cuánto apartar cada semana</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            PÁGINA 3: 3. TU PLAN Y GRÁFICA
           ========================================================= */}
        {page === 3 && (
          <div className="space-y-6">
            {/* Row 1: 3 Compact Key Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Card 1 (Focal): Cuánto apartar cada semana */}
              <div className="rounded-2xl border-2 border-emerald-600 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    Apartar cada semana
                  </span>
                  <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {setAsideDual.primary}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      · {setAsideDual.secondary}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums">
                  <div className="flex items-center justify-between">
                    <span>Semana buena:</span>
                    <span className="font-semibold text-emerald-700">
                      +{formatGTQ(result.seasonLearning.goodWeekSetAsideRuleGTQ)} (
                      {formatUSD(result.seasonLearning.goodWeekSetAsideRuleUSD)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Temporada baja:</span>
                    <span className="font-semibold text-amber-700">
                      -{formatGTQ(result.seasonLearning.lowWeekWithdrawRuleGTQ)} (
                      {formatUSD(result.seasonLearning.lowWeekWithdrawRuleUSD)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tu sueldo seguro */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Sueldo seguro disponible
                  </span>
                  <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {safeWeeklyDual.primary}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      / sem ({safeWeeklyDual.secondary})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Equivalente mensual:</span>
                    <span className="font-semibold text-emerald-700">
                      {safeMonthlyDual.primary} ({safeMonthlyDual.secondary})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Balance Q / $:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[165px]">
                      {fxPillLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Tus temporadas (Barras visuales) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Temporadas (Semanal)
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 tabular-nums">
                    {result.seasonLearning.coverageWeeks} sem. reserva
                  </span>
                </div>

                <div className="space-y-2.5 tabular-nums">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Buena</span>
                      <span className="font-semibold text-slate-900">
                        {formatGTQ(result.seasonLearning.goodSeasonWeeklyAvgGTQ)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${goodBarPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Gastos fijos</span>
                      <span className="font-semibold text-slate-900">
                        {formatGTQ(result.essentialWeeklyGTQ)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-500"
                        style={{ width: `${essentialBarPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Baja</span>
                      <span className="font-semibold text-slate-900">
                        {formatGTQ(result.seasonLearning.lowSeasonWeeklyAvgGTQ)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${lowBarPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Interactive Chart + Simulator on the Same Screen */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-900">
                    Ingreso Real vs. Sueldo Estabilizado
                  </h2>
                  {simulationDeltaPct !== 0 && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                        simulationDeltaPct < 0
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-sky-50 text-sky-800 border border-sky-200"
                      }`}
                    >
                      Simulando {simulationDeltaPct > 0 ? `+${simulationDeltaPct}%` : `${simulationDeltaPct}%`} ·{" "}
                      {result.simulation.simulatedCoverageWeeks} sem. cobertura
                    </span>
                  )}
                </div>

                {/* Compact Simulator Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulationDeltaPct(-30)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      simulationDeltaPct === -30
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    -30% Baja
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationDeltaPct(0)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      simulationDeltaPct === 0
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Actual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationDeltaPct(30)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      simulationDeltaPct === 30
                        ? "border-sky-300 bg-sky-50 text-sky-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    +30% Alta
                  </button>

                  <div className="flex items-center gap-2 pl-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={5}
                      value={simulationDeltaPct}
                      onChange={(e) => setSimulationDeltaPct(Number(e.target.value))}
                      aria-label="Simular temporada baja o alta"
                      className="w-28 sm:w-36 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <CashflowChart
                data={result.evaluatedPeriods}
                periodFloorGTQ={
                  periodMode === "week"
                    ? result.essentialWeeklyGTQ
                    : result.essentialMonthlyGTQ
                }
                currency={primaryCurrency}
                exchangeRate={result.exchangeRate}
                simulationDeltaPct={simulationDeltaPct}
              />
            </section>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
                <span>Editar ingresos y gastos</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
