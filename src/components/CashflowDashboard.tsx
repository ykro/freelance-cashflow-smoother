"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  CheckCircle2,
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
  combineToGTQ,
  computeDualCurrencyCashflow,
  DEFAULT_EXCHANGE_RATE,
  formatDual,
  formatGTQ,
  formatUSD,
  PRESET_PROFILES,
} from "@/lib/cashflow-engine";
import CashflowChart from "./CashflowChart";

const DEFAULT_MONTH_PERIODS: IncomePeriodInput[] = [
  { id: "m-1", label: "Mes 1 (Junio)", shortLabel: "Jun", gtq: 1500, usd: 620 },
  { id: "m-2", label: "Mes 2 (Julio)", shortLabel: "Jul", gtq: 2400, usd: 1150 },
  { id: "m-3", label: "Mes 3 (Agosto)", shortLabel: "Ago", gtq: 3100, usd: 1550 },
  { id: "m-4", label: "Mes 4 (Septiembre)", shortLabel: "Sep", gtq: 1200, usd: 580 },
  { id: "m-5", label: "Mes 5 (Octubre)", shortLabel: "Oct", gtq: 3500, usd: 1680 },
];

const DEFAULT_WEEK_PERIODS: IncomePeriodInput[] = [
  { id: "w-1", label: "Semana 1 (Quincena alta)", shortLabel: "Sem 1", gtq: 2850, usd: 0 },
  { id: "w-2", label: "Semana 2 (Semana normal)", shortLabel: "Sem 2", gtq: 1950, usd: 0 },
  { id: "w-3", label: "Semana 3 (Baja venta)", shortLabel: "Sem 3", gtq: 1180, usd: 0 },
  { id: "w-4", label: "Semana 4 (Fin de mes)", shortLabel: "Sem 4", gtq: 3200, usd: 0 },
];

export default function CashflowDashboard() {
  const [screen, setScreen] = useState<"input" | "output">("input");
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

  // Bidirectional simulation (-50% Temporada Baja to +50% Temporada Alta)
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
  const periodNounPlural = periodMode === "month" ? "meses" : "semanas";
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
  const essentialWeeklyDual = formatDual(
    result.essentialWeeklyGTQ,
    primaryCurrency,
    result.exchangeRate
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                Estabilizador
              </span>
              <span className="hidden text-xs text-slate-400 sm:inline">
                {" "}
                · Presupuesto para ingresos variables (Q + $)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {screen === "output" && (
              <button
                type="button"
                onClick={() => setScreen("input")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Volver a editar mis ingresos y gastos</span>
              </button>
            )}

            {/* Primary Currency Display Switch */}
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
                GTQ (Q)
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
                USD ($)
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* Core Value Proposition Banner */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/70">
                <span>Presupuesto para ingresos variables</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Aprende tus {periodNounPlural} buenas y malas y calcula cuánto
                apartar cada semana para no quedarte sin dinero en temporada
                baja
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Para trabajadores informales o freelancers que reciben ingresos
                variables en Quetzales (Q), en Dólares ($) o en ambos al mismo
                tiempo.
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setScreen("input")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  screen === "input"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                1. Ingresos y gastos
              </button>
              <button
                type="button"
                onClick={() => setScreen("output")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  screen === "output"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                2. Plan semanal
              </button>
            </div>
          </div>
        </section>

        {screen === "input" ? (
          /* =========================================================
             SCREEN 1: INPUT CONFIGURATION VIEW
             ========================================================= */
          <div className="space-y-6">
            {/* Quick 1-Click Presets & Mode Toggle */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Ejemplos rápidos en 1 clic
                  </h2>
                  <p className="text-xs text-slate-500">
                    Carga un caso realista o ingresa tus propios datos abajo
                  </p>
                </div>

                {/* Toggle Modo Mes vs Modo Semana */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 self-start">
                  <button
                    type="button"
                    onClick={() => handleTogglePeriodMode("month")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      periodMode === "month"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Modo Mes (2 a 6 meses)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePeriodMode("week")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      periodMode === "week"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Modo Semana (3 a 8 semanas)</span>
                  </button>
                </div>
              </div>

              {/* Preset Pills */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {PRESET_PROFILES.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`text-left rounded-xl border p-3.5 transition cursor-pointer ${
                        isActive
                          ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                          : "border-slate-200/80 bg-[#F8FAFC] hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {preset.title}
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/80">
                          {preset.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                        {preset.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 1: Essential Expenses & Available Reserve in Q and $ Simultaneously */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  1. Tus gastos esenciales y tu reserva actual (en Q y $ al
                  mismo tiempo)
                </h2>
                <p className="text-xs text-slate-500">
                  Puedes ingresar montos solo en Quetzales (Q), solo en Dólares
                  ($), o combinados si pagas parte en Q y parte en $. Tasa de
                  referencia: Q{DEFAULT_EXCHANGE_RATE.toFixed(2)} = $1.00 USD.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Essential Expenses */}
                <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">
                      Gastos esenciales por {periodNounSingular} (vivienda,
                      comida, servicios, trabajo)
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500 mb-1">
                        En Quetzales (GTQ)
                      </span>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
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
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500 mb-1">
                        En Dólares (USD)
                      </span>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
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
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/70 pt-2 text-[11px] text-slate-500 tabular-nums">
                    <span>Total combinado por semana:</span>
                    <span className="font-semibold text-slate-800">
                      {formatGTQ(result.essentialWeeklyGTQ)} ·{" "}
                      {formatUSD(result.essentialWeeklyUSD)}
                    </span>
                  </div>
                </div>

                {/* Current Reserve */}
                <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">
                      Reserva o fondo colchón disponible hoy
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500 mb-1">
                        Ahorrado en Quetzales (Q)
                      </span>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
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
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500 mb-1">
                        Ahorrado en Dólares ($)
                      </span>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
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
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/70 pt-2 text-[11px] text-slate-500 tabular-nums">
                    <span>
                      Reserva total ({result.seasonLearning.coverageWeeks}{" "}
                      semanas cubiertas):
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatGTQ(result.currentReserveGTQ)} ·{" "}
                      {formatUSD(result.currentReserveUSD)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Historical Periods Input (Last 2-6 Months or 3-8 Weeks) */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    2. Tus últimos {periods.length} {periodNounPlural} de
                    ingresos (buenos y malos)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ingresa cuánto ganaste en cada {periodNounSingular} en Q y/o
                    $. El sistema detecta automáticamente cuáles fueron{" "}
                    <span className="font-medium text-emerald-700">
                      Temporada Alta
                    </span>
                    ,{" "}
                    <span className="font-medium text-slate-700">Normal</span> o{" "}
                    <span className="font-medium text-amber-700">
                      Temporada Baja
                    </span>
                    .
                  </p>
                </div>

                {periods.length < maxAllowedPeriods && (
                  <button
                    type="button"
                    onClick={handleAddPeriod}
                    className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Agregar {periodNounSingular}</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {periods.map((period, idx) => {
                  const evaluated = result.evaluatedPeriods[idx];
                  const classification = evaluated?.classification || "NORMAL";
                  const totalPeriodGTQ = combineToGTQ(
                    { gtq: period.gtq, usd: period.usd },
                    DEFAULT_EXCHANGE_RATE
                  );
                  const totalPeriodUSD = totalPeriodGTQ / DEFAULT_EXCHANGE_RATE;

                  const badgeStyle =
                    classification === "ALTA"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : classification === "BAJA"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200";

                  const badgeText =
                    classification === "ALTA"
                      ? "Temporada Alta"
                      : classification === "BAJA"
                      ? "Temporada Baja"
                      : "Normal";

                  return (
                    <div
                      key={period.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-3.5 sm:grid-cols-12 sm:items-center"
                    >
                      {/* Period Name */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                          Periodo {idx + 1}
                        </label>
                        <input
                          type="text"
                          value={period.label}
                          onChange={(e) =>
                            handleUpdatePeriod(
                              period.id,
                              "label",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      {/* Income in GTQ */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">
                          Ingreso en Quetzales (Q)
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-semibold text-slate-400">
                            Q
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={period.gtq}
                            onChange={(e) =>
                              handleUpdatePeriod(
                                period.id,
                                "gtq",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Income in USD */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">
                          Ingreso en Dólares ($)
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-semibold text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={period.usd}
                            onChange={(e) =>
                              handleUpdatePeriod(
                                period.id,
                                "usd",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-semibold tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Auto-detected Season Tag & Total + Delete */}
                      <div className="flex items-center justify-between sm:col-span-2 sm:justify-end gap-2 pt-1 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle}`}
                          >
                            {badgeText}
                          </span>
                          <div className="mt-1 text-[11px] font-semibold tabular-nums text-slate-700">
                            {formatGTQ(totalPeriodGTQ)} ·{" "}
                            {formatUSD(totalPeriodUSD)}
                          </div>
                        </div>

                        {periods.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePeriod(period.id)}
                            title="Eliminar periodo"
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

              {/* Primary CTA to transition to Screen 2 */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">
                  Detectados:{" "}
                  <span className="font-semibold text-emerald-700">
                    {result.seasonLearning.highPeriodsCount} {periodNounPlural}{" "}
                    buenos
                  </span>
                  ,{" "}
                  <span className="font-semibold text-slate-700">
                    {result.seasonLearning.normalPeriodsCount} normales
                  </span>{" "}
                  y{" "}
                  <span className="font-semibold text-amber-700">
                    {result.seasonLearning.lowPeriodsCount} {periodNounPlural}{" "}
                    bajos
                  </span>
                  .
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("output")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <span>Calcular cuánto apartar cada semana</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        ) : (
          /* =========================================================
             SCREEN 2: DEDICATED RESULTS DASHBOARD
             ========================================================= */
          <div className="space-y-6">
            {/* 1. HERO CARD: Cuánto apartar cada semana + Tu ingreso seguro */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Focal Hero Card: Cuánto apartar cada semana */}
              <div className="lg:col-span-7 rounded-2xl border-2 border-emerald-600 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Meta semanal para tu fondo de temporada baja</span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                      {result.weeklyAllocation.recommendedSetAsidePct}% de tu
                      ingreso
                    </span>
                  </div>

                  <h2 className="text-sm font-medium text-slate-500 pt-1">
                    Cuánto apartar cada semana (en semanas o meses normales y
                    buenos)
                  </h2>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-slate-900">
                      {setAsideDual.primary}
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-slate-500">
                      ({setAsideDual.secondary} / semana)
                    </span>
                  </div>
                </div>

                {/* Clear Seasonal Rule: Good Week vs Low Week */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100">
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                      <span>En semana / mes bueno:</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-800 tabular-nums">
                      Aparta{" "}
                      <span className="font-bold">
                        {formatGTQ(
                          result.seasonLearning.goodWeekSetAsideRuleGTQ
                        )}{" "}
                        ({formatUSD(
                          result.seasonLearning.goodWeekSetAsideRuleUSD
                        )}
                        )
                      </span>{" "}
                      cada semana en tu reserva.
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <TrendingDown className="h-3.5 w-3.5 text-amber-700" />
                      <span>En temporada baja:</span>
                    </div>
                    <p className="mt-1 text-xs text-amber-800 tabular-nums">
                      Apartas <span className="font-bold">Q0</span> y retiras{" "}
                      <span className="font-bold">
                        {formatGTQ(
                          result.seasonLearning.lowWeekWithdrawRuleGTQ
                        )}{" "}
                        ({formatUSD(
                          result.seasonLearning.lowWeekWithdrawRuleUSD
                        )}
                        )
                      </span>{" "}
                      / sem de tu reserva sin endeudarte.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Hero Card: Tu Sueldo Estabilizado Seguro */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tu sueldo propio estabilizado
                    </span>
                    <Wallet className="h-4 w-4 text-slate-500" />
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">
                      Ingreso seguro por semana (ya descontando tu ahorro):
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums text-slate-900">
                        {safeWeeklyDual.primary}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-slate-500">
                        ({safeWeeklyDual.secondary})
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      Equivalente a un sueldo mensual estable de:
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-xl font-bold tabular-nums text-emerald-700">
                        {safeMonthlyDual.primary} / mes
                      </span>
                      <span className="text-xs font-medium tabular-nums text-slate-500">
                        ({safeMonthlyDual.secondary})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/70 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between tabular-nums">
                    <span className="text-slate-500">
                      Gastos esenciales por semana:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {essentialWeeklyDual.primary} (
                      {essentialWeeklyDual.secondary})
                    </span>
                  </div>
                  <div className="flex items-center justify-between tabular-nums">
                    <span className="text-slate-500">
                      Cobertura actual de tu reserva:
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {result.seasonLearning.coverageWeeks} semanas (
                      {result.seasonLearning.coverageMonths} meses)
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. APRENDIZAJE DE TEMPORADAS (Meses/Semanas Buenas vs. Malas) */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Aprendizaje de tus {periodNounPlural} buenas y malas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Diagnóstico calculado a partir de tus últimos{" "}
                    {result.seasonLearning.totalPeriodsCount} {periodNounPlural}{" "}
                    registrados
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 self-start">
                  <span>
                    Variabilidad: {result.seasonLearning.volatilityLabel} (CV{" "}
                    {Math.round(
                      result.seasonLearning.coefficientOfVariation * 100
                    )}
                    %)
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Good Season Learned Average */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>
                      Promedio en {periodNounPlural} buenas (
                      {result.seasonLearning.highPeriodsCount})
                    </span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    {formatGTQ(result.seasonLearning.goodSeasonAvgGTQ)}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      ({formatUSD(result.seasonLearning.goodSeasonAvgUSD)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Equivale a{" "}
                    {formatGTQ(result.seasonLearning.goodSeasonWeeklyAvgGTQ)} (
                    {formatUSD(result.seasonLearning.goodSeasonWeeklyAvgUSD)})
                    por semana. Aquí llenas tu reserva.
                  </p>
                </div>

                {/* Low Season Learned Average */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span>
                      Promedio en {periodNounPlural} bajas (
                      {result.seasonLearning.lowPeriodsCount})
                    </span>
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    {formatGTQ(result.seasonLearning.lowSeasonAvgGTQ)}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      ({formatUSD(result.seasonLearning.lowSeasonAvgUSD)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Equivale a{" "}
                    {formatGTQ(result.seasonLearning.lowSeasonWeeklyAvgGTQ)} (
                    {formatUSD(result.seasonLearning.lowSeasonWeeklyAvgUSD)})
                    por semana. Tu fondo cubre la diferencia.
                  </p>
                </div>

                {/* Target Reserve Progress */}
                <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Meta de reserva para temporada baja</span>
                    <span className="text-emerald-700 tabular-nums">
                      {result.seasonLearning.reserveProgressPct}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    {formatGTQ(result.seasonLearning.targetReserveGTQ)}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      ({formatUSD(result.seasonLearning.targetReserveUSD)})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{
                        width: `${result.seasonLearning.reserveProgressPct}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    Tienes {formatGTQ(result.currentReserveGTQ)} (
                    {formatUSD(result.currentReserveUSD)}) ahorrados hoy.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. SIMULTANEOUS DUAL-CURRENCY BREAKDOWN (Q + $) */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-base font-semibold text-slate-900">
                    Desglose bimonetario simultáneo (Quetzales Q + Dólares $)
                  </h2>
                </div>
                <span className="text-xs text-slate-400 tabular-nums">
                  Tasa de cambio: Q{result.exchangeRate.toFixed(2)} = $1.00 USD
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Native Quetzales Flow */}
                <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">
                    Flujo semanal en Quetzales (GTQ)
                  </div>
                  <div className="space-y-1 text-xs tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ingreso en Q:</span>
                      <span className="font-semibold text-slate-900">
                        {formatGTQ(result.dualCurrency.nativeWeeklyIncomeGTQ)} /
                        sem
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Gastos esenciales en Q:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatGTQ(result.dualCurrency.nativeWeeklyExpenseGTQ)}{" "}
                        / sem
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/70 pt-1">
                      <span className="text-slate-500">Balance neto en Q:</span>
                      <span
                        className={`font-semibold ${
                          result.dualCurrency.weeklyNetNativeGTQ >= 0
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {result.dualCurrency.weeklyNetNativeGTQ >= 0 ? "+" : ""}
                        {formatGTQ(result.dualCurrency.weeklyNetNativeGTQ)} /
                        sem
                      </span>
                    </div>
                  </div>
                </div>

                {/* Native USD Flow */}
                <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">
                    Flujo semanal en Dólares (USD)
                  </div>
                  <div className="space-y-1 text-xs tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ingreso en $:</span>
                      <span className="font-semibold text-slate-900">
                        {formatUSD(result.dualCurrency.nativeWeeklyIncomeUSD)} /
                        sem
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Gastos esenciales en $:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatUSD(result.dualCurrency.nativeWeeklyExpenseUSD)}{" "}
                        / sem
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/70 pt-1">
                      <span className="text-slate-500">Balance neto en $:</span>
                      <span
                        className={`font-semibold ${
                          result.dualCurrency.weeklyNetNativeUSD >= 0
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {result.dualCurrency.weeklyNetNativeUSD >= 0 ? "+" : ""}
                        {formatUSD(result.dualCurrency.weeklyNetNativeUSD)} /
                        sem
                      </span>
                    </div>
                  </div>
                </div>

                {/* Practical Currency Action */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Recomendación práctica de monedas</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {result.dualCurrency.actionSummaryEs}
                  </p>
                </div>
              </div>
            </section>

            {/* 4. INTERACTIVE CHART + BIDIRECTIONAL SIMULATOR (-50% Baja to +50% Alta) */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Ingreso real vs. sueldo estabilizado
                  </h2>
                  <p className="text-xs text-slate-500">
                    Compara tus {periodNounPlural} reales contra tu ingreso
                    estabilizado y simula tanto caídas como subidas de ingresos
                  </p>
                </div>

                {/* Bi-directional Simulator Controls (-50% to +50%) */}
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Simular escenario:</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-medium text-rose-600">
                      -50% Baja
                    </span>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={10}
                      value={simulationDeltaPct}
                      onChange={(e) =>
                        setSimulationDeltaPct(Number(e.target.value))
                      }
                      className="w-32 sm:w-40 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-sky-700">
                      +50% Alta
                    </span>
                    <span
                      className={`min-w-[52px] rounded-md px-2 py-0.5 text-center text-xs font-bold tabular-nums ${
                        simulationDeltaPct < 0
                          ? "bg-rose-100 text-rose-700"
                          : simulationDeltaPct > 0
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {simulationDeltaPct > 0
                        ? `+${simulationDeltaPct}%`
                        : `${simulationDeltaPct}%`}
                    </span>
                  </div>
                  {simulationDeltaPct !== 0 && (
                    <button
                      type="button"
                      onClick={() => setSimulationDeltaPct(0)}
                      className="text-[11px] font-medium text-slate-500 underline hover:text-slate-800 cursor-pointer"
                    >
                      Restablecer (0%)
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Simulation Callout Banner */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  result.simulation.mode === "BAJA"
                    ? "border-amber-200 bg-amber-50/70 text-amber-900"
                    : result.simulation.mode === "ALTA"
                    ? "border-sky-200 bg-sky-50/70 text-sky-900"
                    : "border-slate-200/80 bg-[#F8FAFC] text-slate-700"
                }`}
              >
                <div className="font-semibold">
                  {result.simulation.headlineEs}
                </div>
                <p className="mt-1 opacity-90">{result.simulation.detailEs}</p>
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

              {/* Period Cards Strip */}
              <div className="pt-3 border-t border-slate-100">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    Clasificación automática de tus {periodNounPlural}{" "}
                    registrados
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                      Temporada Alta
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />{" "}
                      Normal
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />{" "}
                      Temporada Baja
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
                  {result.evaluatedPeriods.map((p) => {
                    const cardStyle =
                      p.classification === "ALTA"
                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
                        : p.classification === "BAJA"
                        ? "border-amber-200 bg-amber-50/60 text-amber-900"
                        : "border-slate-200/80 bg-[#F8FAFC] text-slate-700";

                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl border p-3 text-left ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold truncate">
                            {p.shortLabel}
                          </span>
                          <span className="text-[10px] font-medium opacity-75">
                            {p.classification === "ALTA"
                              ? "Alta"
                              : p.classification === "BAJA"
                              ? "Baja"
                              : "Normal"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-bold tabular-nums">
                          {formatGTQ(p.totalGTQ)}
                        </div>
                        <div className="text-[10px] tabular-nums opacity-75">
                          {formatUSD(p.totalUSD)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
