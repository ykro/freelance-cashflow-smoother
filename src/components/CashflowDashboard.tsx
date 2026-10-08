"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Home,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  Bot,
  Sliders,
  DollarSign,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Sun,
  CloudSun,
  CloudRain,
  Flame,
  Info,
  Zap,
  Scale,
  Clock,
  Calculator,
  ChevronDown,
  ChevronUp,
  UserCheck,
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

interface CoachVariantData {
  id: string;
  name: string;
  modelUsed: string;
  latencyMs: number;
  recommendation: {
    headline: string;
    bullets: string[];
    seasonalStrategy: string;
    stressVerdict: string;
    recommendedWeeklySave: number;
    recommendedSafeToSpend: number;
    methodologyBadge: string;
  };
}

interface ABCoachPayload {
  variantA: CoachVariantData;
  variantB: CoachVariantData;
}

const SAMPLE_NL_PROMPTS = [
  "Necesito Q6,500 al mes para vivir, tengo Q3,000 guardados y esta semana gané Q2,400",
  "De gastos fijos necesito Q8,500 al mes, ahorita tengo Q4,000 guardados y esta semana me entraron Q3,800",
  "Mis gastos básicos son Q5,200 mensuales, tengo Q2,500 en mi colchón y esta semana estuvo baja con Q950",
];

export default function CashflowDashboard() {
  // Global Currency State (Default: GTQ - Quetzales)
  const [currency, setCurrency] = useState<CurrencyCode>("GTQ");
  const [exchangeRate, setExchangeRate] = useState<number>(
    DEFAULT_EXCHANGE_RATE
  );

  // Active Demo Profile State
  const [activeProfileId, setActiveProfileId] = useState<string>(
    DEMO_PROFILES[0].id
  );

  // Core Financial Inputs (Always stored in base GTQ for mathematical consistency)
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

  // Floor Calculator Breakdown Toggle
  const [showFloorCalculator, setShowFloorCalculator] =
    useState<boolean>(false);
  const [floorBreakdownGTQ, setFloorBreakdownGTQ] = useState(
    DEMO_PROFILES[0].fixedBreakdown
  );

  // Stress-Test Simulator State
  const [stressTestDropPct, setStressTestDropPct] = useState<number>(25);
  const [showStressOnChart, setShowStressOnChart] = useState<boolean>(true);

  // Natural Language Smart Onboarding State
  const [nlInputText, setNlInputText] = useState<string>(
    "Necesito Q6,500 al mes para vivir, tengo Q3,000 guardados y esta semana gané Q2,400"
  );
  const [isParsingNL, setIsParsingNL] = useState<boolean>(false);
  const [nlFeedback, setNlFeedback] = useState<{
    summaryEs: string;
    modelUsed: string;
    latencyMs: number;
  } | null>(null);

  // A/B Coach Mode State
  const [activeCoachTab, setActiveCoachTab] = useState<"A" | "B" | "COMPARE">(
    "COMPARE"
  );
  const [abCoachData, setAbCoachData] = useState<ABCoachPayload | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);

  // Selected month in calendar to inspect or edit
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(null);

  // Compute deterministic Waterfall Cashflow metrics in real-time
  const metrics = useMemo(() => {
    return computeCashflowSmoothing({
      monthlyFloor: monthlyFloorGTQ,
      currentBuffer: currentBufferGTQ,
      weeklyIncome: weeklyIncomeGTQ,
      historicalMonths,
      stressTestDropPct,
      currentMonthIndex: 9, // Octubre
    });
  }, [
    monthlyFloorGTQ,
    currentBufferGTQ,
    weeklyIncomeGTQ,
    historicalMonths,
    stressTestDropPct,
  ]);

  // Load a 1-Click Realistic Profile
  const handleSelectProfile = (profile: FreelanceProfilePreset) => {
    setActiveProfileId(profile.id);
    setMonthlyFloorGTQ(profile.monthlyFloor);
    setCurrentBufferGTQ(profile.currentBuffer);
    setWeeklyIncomeGTQ(profile.weeklyIncome);
    setHistoricalMonths(profile.historicalMonths.map((m) => ({ ...m })));
    setFloorBreakdownGTQ({ ...profile.fixedBreakdown });
    setNlFeedback(null);
  };

  // Update breakdown item and sync monthlyFloorGTQ
  const handleBreakdownChange = (
    key: keyof typeof floorBreakdownGTQ,
    displayVal: number
  ) => {
    const valGTQ = convertToGTQ(displayVal, currency, exchangeRate);
    const updated = { ...floorBreakdownGTQ, [key]: Math.max(0, valGTQ) };
    setFloorBreakdownGTQ(updated);
    const total =
      updated.housing +
      updated.food +
      updated.utilitiesAndInternet +
      updated.transportAndTools;
    setMonthlyFloorGTQ(Math.max(500, total));
    setActiveProfileId("custom");
  };

  // Trigger AI Coach A/B Analysis
  const fetchABCoachInsights = useCallback(async () => {
    setIsLoadingCoach(true);
    try {
      const res = await fetch("/api/cashflow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ab-coach",
          currency,
          exchangeRate,
          monthlyFloor: monthlyFloorGTQ,
          currentBuffer: currentBufferGTQ,
          weeklyIncome: weeklyIncomeGTQ,
          stressTestDropPct,
          historicalMonths,
        }),
      });
      if (res.ok) {
        const data: ABCoachPayload = await res.json();
        setAbCoachData(data);
      }
    } catch {
      // Fallback handled smoothly in UI if offline
    } finally {
      setIsLoadingCoach(false);
    }
  }, [
    currency,
    exchangeRate,
    monthlyFloorGTQ,
    currentBufferGTQ,
    weeklyIncomeGTQ,
    stressTestDropPct,
    historicalMonths,
  ]);

  // Fetch initial coach insights when profile changes
  useEffect(() => {
    fetchABCoachInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId, currency]);

  // Parse Natural Language Onboarding via Gemma 4 / Gemini 3.8 Flash
  const handleParseNaturalLanguage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
          exchangeRate,
        }),
      });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed.monthlyFloor) setMonthlyFloorGTQ(parsed.monthlyFloor);
        if (typeof parsed.currentBuffer === "number")
          setCurrentBufferGTQ(parsed.currentBuffer);
        if (typeof parsed.weeklyIncome === "number")
          setWeeklyIncomeGTQ(parsed.weeklyIncome);

        // If user also mentioned good/bad month ranges, adjust historical series proportionally
        if (parsed.goodMonthIncome || parsed.badMonthIncome) {
          setHistoricalMonths((prev) =>
            prev.map((m) => {
              if (
                Array.isArray(parsed.lowSeasonMonths) &&
                parsed.lowSeasonMonths.includes(m.monthIndex) &&
                parsed.badMonthIncome
              ) {
                return { ...m, income: parsed.badMonthIncome };
              }
              return m;
            })
          );
        }

        setActiveProfileId("nl-custom");
        setNlFeedback({
          summaryEs: parsed.summaryEs,
          modelUsed: parsed.modelUsed,
          latencyMs: parsed.latencyMs,
        });
      }
    } finally {
      setIsParsingNL(false);
    }
  };

  // Display values in active currency (GTQ or USD)
  const displayWeeklyIncome = convertFromGTQ(
    weeklyIncomeGTQ,
    currency,
    exchangeRate
  );
  const displayMonthlyFloor = convertFromGTQ(
    monthlyFloorGTQ,
    currency,
    exchangeRate
  );
  const displayCurrentBuffer = convertFromGTQ(
    currentBufferGTQ,
    currency,
    exchangeRate
  );

  const symbol = currency === "GTQ" ? "Q" : "$";
  const maxWeeklySlider = currency === "GTQ" ? 8000 : 1100;
  const maxFloorSlider = currency === "GTQ" ? 20000 : 2600;
  const maxBufferSlider = currency === "GTQ" ? 30000 : 4000;
  const stepAmount = currency === "GTQ" ? 50 : 10;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation & Global Currency Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Freelance Cashflow Smoother
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Waterfall Buffer Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Convierte ingresos variables en una cuota semanal exacta de
                ahorro y un sueldo propio estabilizado
              </p>
            </div>
          </div>

          {/* Global Currency Switcher (GTQ Default vs USD) */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 tabular-nums">
              <span>Tasa:</span>
              <span className="font-semibold text-slate-700">
                1 USD = Q{exchangeRate.toFixed(2)}
              </span>
            </div>

            <div
              className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200"
              role="group"
              aria-label="Selector de moneda"
            >
              <button
                type="button"
                onClick={() => setCurrency("GTQ")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currency === "GTQ"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🇬🇹</span>
                <span>GTQ (Q)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currency === "USD"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🇺🇸</span>
                <span>USD ($)</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* SECTION 1: ULTRA-CLEAR INPUT PANEL (1-Click Profiles + NL Smart Bar + Core Sliders) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                1. Panel de Entrada Rápida y Check-in de Viernes (INPUTS)
              </h2>
            </div>

            {/* 1-Click Realistic Profiles */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 mr-1">
                Perfiles 1-Click (GT / LATAM):
              </span>
              {DEMO_PROFILES.map((prof) => {
                const isActive = activeProfileId === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => handleSelectProfile(prof)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{prof.roleBadge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Natural Language Smart Input Bar (Gemma 4 / Gemini 3.8 Flash) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="nl-onboarding-input"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>
                    Onboarding en Lenguaje Natural (Gemma 4 E2B / Gemini 3.8
                    Flash)
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_NL_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNlInputText(sample)}
                      className="text-[11px] bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                    >
                      Ejemplo {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleParseNaturalLanguage}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <input
                  id="nl-onboarding-input"
                  type="text"
                  value={nlInputText}
                  onChange={(e) => setNlInputText(e.target.value)}
                  placeholder='Ej. "Necesito Q6,500 al mes para vivir, tengo Q3,000 guardados y esta semana gané Q2,400"'
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isParsingNL}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isParsingNL ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Extraer Parámetros</span>
                    </>
                  )}
                </button>
              </form>

              {nlFeedback && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 bg-blue-50/90 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium">{nlFeedback.summaryEs}</span>
                  </div>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 tabular-nums">
                    {nlFeedback.modelUsed} · {nlFeedback.latencyMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* 3 Core Financial Sliders & Direct Numeric Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Control 1: Ingreso de Esta Semana (I_t) */}
              <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                      Check-in de Viernes ($I_t$)
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ingreso Semanal
                    </span>
                  </div>
                  <label
                    htmlFor="weekly-income-input"
                    className="block text-sm font-bold text-slate-900 mb-2"
                  >
                    ¿Cuánto te entró esta semana?
                  </label>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-extrabold text-emerald-700">
                      {symbol}
                    </span>
                    <input
                      id="weekly-income-input"
                      type="number"
                      min={0}
                      step={stepAmount}
                      value={displayWeeklyIncome}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setWeeklyIncomeGTQ(
                          convertToGTQ(val, currency, exchangeRate)
                        );
                      }}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="range"
                    min={0}
                    max={maxWeeklySlider}
                    step={stepAmount}
                    value={Math.min(maxWeeklySlider, displayWeeklyIncome)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWeeklyIncomeGTQ(
                        convertToGTQ(val, currency, exchangeRate)
                      );
                    }}
                    className="w-full accent-emerald-600 bg-emerald-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                    <span>{symbol}0 (Semana en cero)</span>
                    <span>
                      Piso Semanal:{" "}
                      <strong className="text-slate-700">
                        {formatCurrency(
                          metrics.weeklyFloor,
                          currency,
                          exchangeRate
                        )}
                      </strong>
                    </span>
                    <span>
                      {symbol}
                      {maxWeeklySlider.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Control 2: Piso Mensual de Gastos Fijos (F_mes) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                      Piso Mensual ($F_{"{mes}"}$)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setShowFloorCalculator(!showFloorCalculator)
                      }
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Desglosar 4 rubros</span>
                      {showFloorCalculator ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <label
                    htmlFor="monthly-floor-input"
                    className="block text-sm font-bold text-slate-900 mb-2"
                  >
                    Gastos Básicos al Mes (Tu Piso)
                  </label>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-extrabold text-blue-700">
                      {symbol}
                    </span>
                    <input
                      id="monthly-floor-input"
                      type="number"
                      min={100}
                      step={stepAmount}
                      value={displayMonthlyFloor}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 500;
                        setMonthlyFloorGTQ(
                          convertToGTQ(val, currency, exchangeRate)
                        );
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="range"
                    min={currency === "GTQ" ? 1500 : 200}
                    max={maxFloorSlider}
                    step={stepAmount}
                    value={Math.min(maxFloorSlider, displayMonthlyFloor)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMonthlyFloorGTQ(
                        convertToGTQ(val, currency, exchangeRate)
                      );
                    }}
                    className="w-full accent-blue-600 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                    <span>
                      Equivale a{" "}
                      <strong className="text-blue-700">
                        {formatCurrency(
                          metrics.weeklyFloor,
                          currency,
                          exchangeRate
                        )}
                        /semana
                      </strong>{" "}
                      ($F_{"{mes}"} / 4.33$)
                    </span>
                  </div>
                </div>
              </div>

              {/* Control 3: Fondo Colchón Actual (B_actual) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Reserva Actual ($B_{"{actual}"}$)
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
                      Meta:{" "}
                      {formatCurrency(
                        metrics.targetBuffer,
                        currency,
                        exchangeRate
                      )}
                    </span>
                  </div>
                  <label
                    htmlFor="current-buffer-input"
                    className="block text-sm font-bold text-slate-900 mb-2"
                  >
                    Fondo Colchón Guardado Hoy
                  </label>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-extrabold text-amber-600">
                      {symbol}
                    </span>
                    <input
                      id="current-buffer-input"
                      type="number"
                      min={0}
                      step={stepAmount}
                      value={displayCurrentBuffer}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCurrentBufferGTQ(
                          convertToGTQ(val, currency, exchangeRate)
                        );
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="range"
                    min={0}
                    max={maxBufferSlider}
                    step={stepAmount}
                    value={Math.min(maxBufferSlider, displayCurrentBuffer)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentBufferGTQ(
                        convertToGTQ(val, currency, exchangeRate)
                      );
                    }}
                    className="w-full accent-amber-600 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                    <span>{symbol}0</span>
                    <span>
                      Oxígeno:{" "}
                      <strong className="text-emerald-700">
                        {metrics.runwayWeeks} semanas
                      </strong>
                    </span>
                    <span>
                      {symbol}
                      {maxBufferSlider.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible 4-Category Monthly Floor Calculator */}
            {showFloorCalculator && (
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span>
                      Calculadora Visual de Piso Mensual (4 Rubros Vitales)
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-blue-800 tabular-nums">
                    Total Piso:{" "}
                    {formatCurrency(monthlyFloorGTQ, currency, exchangeRate)}
                    /mes
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      key: "housing" as const,
                      label: "🏠 Vivienda / Renta",
                    },
                    {
                      key: "food" as const,
                      label: "🛒 Comida y Supermercado",
                    },
                    {
                      key: "utilitiesAndTools" as const,
                      realKey: "utilitiesAndInternet" as const,
                      label: "💡 Luz, Agua e Internet",
                    },
                    {
                      key: "transport" as const,
                      realKey: "transportAndTools" as const,
                      label: "🚌 Transporte / Gasolina",
                    },
                  ].map((item) => {
                    const rk = item.realKey || item.key;
                    const dispVal = convertFromGTQ(
                      floorBreakdownGTQ[rk],
                      currency,
                      exchangeRate
                    );
                    return (
                      <div
                        key={rk}
                        className="bg-white p-3 rounded-lg border border-blue-100"
                      >
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          {item.label}
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-slate-500">
                            {symbol}
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={stepAmount}
                            value={dispVal}
                            onChange={(e) =>
                              handleBreakdownChange(
                                rk,
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 tabular-nums"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: HERO OUTPUT - LAS 3 CUBETAS DE ESTA SEMANA */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>2. Tu Reparto de Esta Semana (Las 3 Cubetas)</span>
                {metrics.buckets.isDeficitWeek ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Semana Baja · Activando Fondo Colchón
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Semana con Superávit · Llenando Colchón
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Calculado en tiempo real sobre tu ingreso semanal de{" "}
                <strong className="text-slate-800 tabular-nums">
                  {formatCurrency(weeklyIncomeGTQ, currency, exchangeRate)}
                </strong>{" "}
                frente a tu piso fijo semanal de{" "}
                <strong className="text-slate-800 tabular-nums">
                  {formatCurrency(metrics.weeklyFloor, currency, exchangeRate)}
                </strong>
              </p>
            </div>

            {/* Quick scenario test buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Probar semana:
              </span>
              <button
                type="button"
                onClick={() =>
                  setWeeklyIncomeGTQ(Math.round(metrics.weeklyFloor * 1.95))
                }
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                ☀️ Semana Cosecha
              </button>
              <button
                type="button"
                onClick={() =>
                  setWeeklyIncomeGTQ(Math.round(metrics.weeklyFloor * 0.62))
                }
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                🌧️ Semana Vacas Flacas
              </button>
            </div>
          </div>

          {/* Low Week Warning Banner when I_t < F_sem */}
          {metrics.buckets.isDeficitWeek && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-amber-950">
                    Esta semana apartas {symbol}0. Retira{" "}
                    <span className="underline decoration-amber-500 decoration-2 tabular-nums">
                      {formatCurrency(
                        metrics.buckets.withdrawFromBuffer,
                        currency,
                        exchangeRate
                      )}
                    </span>{" "}
                    de tu Fondo Colchón para completar tus gastos fijos sin
                    endeudarte.
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    Tu ingreso de esta semana (
                    <strong className="tabular-nums">
                      {formatCurrency(weeklyIncomeGTQ, currency, exchangeRate)}
                    </strong>
                    ) quedó por debajo de tu piso vital semanal (
                    <strong className="tabular-nums">
                      {formatCurrency(
                        metrics.weeklyFloor,
                        currency,
                        exchangeRate
                      )}
                    </strong>
                    ). Para eso mismo construiste tu Fondo Colchón: úsalo con
                    tranquilidad.
                  </p>
                </div>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 shrink-0 text-right tabular-nums">
                <span className="block text-[11px] font-semibold uppercase text-slate-500">
                  Colchón tras retiro
                </span>
                <span className="text-lg font-extrabold text-amber-700">
                  {formatCurrency(
                    Math.max(
                      0,
                      currentBufferGTQ - metrics.buckets.withdrawFromBuffer
                    ),
                    currency,
                    exchangeRate
                  )}
                </span>
              </div>
            </div>
          )}

          {/* THE 3 BUCKET CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* BUCKET 1: 🛡️ APARTA HOY PARA TEMPORADA BAJA */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/80 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-bl-xl tabular-nums">
                {metrics.buckets.saveForLowSeasonPct}% del ingreso
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Cubeta 1 · Prioridad Cosecha
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      🛡️ Aparta Hoy para Temporada Baja
                    </h3>
                  </div>
                </div>

                <div className="my-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                    {formatCurrency(
                      metrics.buckets.saveForLowSeason,
                      currency,
                      exchangeRate
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {metrics.buckets.isDeficitWeek
                      ? "En semanas bajas tu cuota de ahorro se pausa automáticamente en 0."
                      : `Muévelo hoy mismo a tu cuenta o apartado antes de tocar el resto.`}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>Próxima temporada baja:</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {metrics.nextLowSeasonMonthName} (~
                  {metrics.weeksUntilNextLowSeason} sem)
                </span>
              </div>
            </div>

            {/* BUCKET 2: 🏠 PARA TUS GASTOS FIJOS */}
            <div className="bg-white rounded-2xl border-2 border-blue-500/80 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-bl-xl tabular-nums">
                {metrics.buckets.fixedCostAllocationPct}% · Piso Semanal
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                      Cubeta 2 · Tu Piso de Vida
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      🏠 Para tus Gastos Fijos
                    </h3>
                  </div>
                </div>

                <div className="my-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight tabular-nums">
                    {formatCurrency(
                      metrics.buckets.fixedCostAllocation,
                      currency,
                      exchangeRate
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {metrics.buckets.isDeficitWeek
                      ? `Incluye ${formatCurrency(
                          weeklyIncomeGTQ,
                          currency,
                          exchangeRate
                        )} ganados hoy + ${formatCurrency(
                          metrics.buckets.withdrawFromBuffer,
                          currency,
                          exchangeRate
                        )} de tu Fondo Colchón.`
                      : "Intocable para renta, comida básica, luz, internet y transporte de esta semana."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>Fórmula ($F_{"{mes}"} / 4.33$):</span>
                <span className="font-semibold text-blue-800">
                  {formatCurrency(monthlyFloorGTQ, currency, exchangeRate)} /
                  mes
                </span>
              </div>
            </div>

            {/* BUCKET 3: ✨ TU SUELDO LIBRE SEGURO (O RETIRO DEL COLCHÓN) */}
            <div
              className={`bg-white rounded-2xl border-2 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden ${
                metrics.buckets.isDeficitWeek
                  ? "border-amber-500"
                  : "border-slate-300"
              }`}
            >
              <div
                className={`absolute top-0 right-0 text-white text-xs font-extrabold px-3 py-1 rounded-bl-xl tabular-nums ${
                  metrics.buckets.isDeficitWeek
                    ? "bg-amber-600"
                    : "bg-slate-800"
                }`}
              >
                {metrics.buckets.isDeficitWeek
                  ? "Inyección del Colchón"
                  : `${metrics.buckets.safeToSpendPct}% Libre`}
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      metrics.buckets.isDeficitWeek
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-amber-50/70 border-amber-200 text-amber-600"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                      {metrics.buckets.isDeficitWeek
                        ? "Cubeta 3 · Rescate Activo"
                        : "Cubeta 3 · Cero Culpa"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {metrics.buckets.isDeficitWeek
                        ? "🛟 Retiro del Fondo Colchón"
                        : "✨ Tu Sueldo Libre Seguro"}
                    </h3>
                  </div>
                </div>

                <div className="my-4">
                  <div
                    className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
                      metrics.buckets.isDeficitWeek
                        ? "text-amber-700"
                        : "text-slate-900"
                    }`}
                  >
                    {metrics.buckets.isDeficitWeek
                      ? formatCurrency(
                          metrics.buckets.withdrawFromBuffer,
                          currency,
                          exchangeRate
                        )
                      : formatCurrency(
                          metrics.buckets.safeToSpend,
                          currency,
                          exchangeRate
                        )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {metrics.buckets.isDeficitWeek
                      ? "Transfiérelo de tu Fondo Colchón a tu cuenta de gasto diario para cubrir tu semana al 100%."
                      : "Gástalo con total paz mental: tus gastos fijos y tu temporada baja ya quedaron blindados."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>Sueldo Semanal Total (Fijos + Libre):</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    metrics.buckets.fixedCostAllocation +
                      metrics.buckets.safeToSpend,
                    currency,
                    exchangeRate
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: KPI ROW (Salud del Colchón) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Semanas de Oxígeno (Runway) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Semanas de Oxígeno</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {metrics.runwayWeeks}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                semanas blindadas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              Si tus ingresos cayeran a {symbol}0 hoy, cubres{" "}
              <strong>{metrics.runwayWeeks} sem</strong> de gastos básicos.
            </p>
          </div>

          {/* KPI 2: Progreso hacia Meta de Temporada Baja */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Meta Fondo Colchón ($B_{"{meta}"}$)</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between my-1 tabular-nums">
              <span className="text-lg font-extrabold text-slate-900">
                {formatCurrency(currentBufferGTQ, currency, exchangeRate)}{" "}
                <span className="text-xs font-normal text-slate-400">
                  /{" "}
                  {formatCurrency(
                    metrics.targetBuffer,
                    currency,
                    exchangeRate
                  )}
                </span>
              </span>
              <span className="text-xs font-bold text-blue-700">
                {metrics.bufferProgressPct}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 my-1.5">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${metrics.bufferProgressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 tabular-nums">
              Para cubrir {metrics.lowSeasonWeeksCount} semanas bajas (
              {metrics.lowSeasonMonthsCount} meses flojos/año).
            </p>
          </div>

          {/* KPI 3: Coeficiente de Volatilidad (CV) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Índice de Volatilidad ($CV$)</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {Math.round(metrics.coefficientOfVariation * 100)}%
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  metrics.volatilityLevel === "ALTA"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : metrics.volatilityLevel === "MEDIA"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                Volatilidad {metrics.volatilityLevel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              Promedio mensual real:{" "}
              <strong>
                {formatCurrency(
                  metrics.averageMonthlyIncome,
                  currency,
                  exchangeRate
                )}
              </strong>
            </p>
          </div>

          {/* KPI 4: Sueldo Semanal Promedio Estabilizado */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Sueldo Semanal Estabilizado</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
                {formatCurrency(
                  metrics.stabilizedWeeklySalary,
                  currency,
                  exchangeRate
                )}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ sem</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Paz financiera constante todo el año gracias al suavizado
              Waterfall.
            </p>
          </div>
        </section>

        {/* SECTION 4: MAIN CHART (La Montaña Rusa vs. Tu Sueldo Estabilizado) + 12-MONTH WEATHER CALENDAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Recharts Main Curve */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    3. La Montaña Rusa (Ingreso Real) vs. Tu Sueldo Estabilizado
                  </h2>
                  <p className="text-xs text-slate-500">
                    Observa cómo el algoritmo recorta los picos de cosecha para
                    rellenar los valles de vacas flacas
                  </p>
                </div>

                {/* Legend pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-600 inline-block" />
                    Ingreso Real Volátil
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <span className="w-3 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                    Sueldo Estabilizado
                  </span>
                </div>
              </div>

              <CashflowChart
                data={metrics.monthlySeries}
                monthlyFloor={monthlyFloorGTQ}
                currency={currency}
                exchangeRate={exchangeRate}
                showStressOverlay={showStressOnChart}
                stressDropPct={stressTestDropPct}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                💡 Pasa el cursor sobre cualquier mes para ver cuánto aporta o
                retira del Fondo Colchón.
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showStressOnChart}
                  onChange={(e) => setShowStressOnChart(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>
                  Mostrar curva de Crisis (-{stressTestDropPct}%) en gráfica
                </span>
              </label>
            </div>
          </div>

          {/* Right 5 Cols: 12-Month Financial Weather Calendar */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>4. Clima Financiero Anual (12 Meses)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Haz clic en cualquier mes para ajustar tu ingreso histórico
                  </p>
                </div>
              </div>

              {/* Weather Summary Badges */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  ☀️ Cosecha:{" "}
                  {
                    metrics.monthlySeries.filter(
                      (m) => m.classification === "ALTA"
                    ).length
                  }{" "}
                  meses
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  ⛅ Normal:{" "}
                  {
                    metrics.monthlySeries.filter(
                      (m) => m.classification === "NORMAL"
                    ).length
                  }{" "}
                  meses
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                  🌧️ Vacas Flacas: {metrics.lowSeasonMonthsCount} meses
                </span>
              </div>

              {/* 12 Month Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {metrics.monthlySeries.map((m, idx) => {
                  const isAlta = m.classification === "ALTA";
                  const isBaja = m.classification === "BAJA";
                  const isSelected = selectedMonthIdx === idx;

                  return (
                    <button
                      key={m.monthIndex}
                      type="button"
                      onClick={() =>
                        setSelectedMonthIdx(isSelected ? null : idx)
                      }
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/40"
                          : isAlta
                          ? "bg-emerald-50/60 border-emerald-200 hover:border-emerald-400"
                          : isBaja
                          ? "bg-amber-50/70 border-amber-200 hover:border-amber-400"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">
                          {m.shortName}
                        </span>
                        {isAlta ? (
                          <Sun className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isBaja ? (
                          <CloudRain className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <CloudSun className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(m.income, currency, exchangeRate)}
                      </div>
                      <div
                        className={`text-[10px] font-semibold mt-0.5 tabular-nums ${
                          isAlta
                            ? "text-emerald-700"
                            : isBaja
                            ? "text-amber-800"
                            : "text-blue-700"
                        }`}
                      >
                        {isAlta
                          ? "☀️ Guardar"
                          : isBaja
                          ? "🌧️ Usar colchón"
                          : "⛅ Estable"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Inline editor if a month is clicked */}
              {selectedMonthIdx !== null && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      Editar ingreso de{" "}
                      {historicalMonths[selectedMonthIdx].monthName}:
                    </span>
                    <span className="text-slate-500">
                      Recalcula instantáneamente la volatilidad y curva anual
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-700">
                      {symbol}
                    </span>
                    <input
                      type="number"
                      step={stepAmount}
                      value={convertFromGTQ(
                        historicalMonths[selectedMonthIdx].income,
                        currency,
                        exchangeRate
                      )}
                      onChange={(e) => {
                        const newDisp = Number(e.target.value) || 0;
                        const newGTQ = convertToGTQ(
                          newDisp,
                          currency,
                          exchangeRate
                        );
                        setHistoricalMonths((prev) =>
                          prev.map((item, i) =>
                            i === selectedMonthIdx
                              ? { ...item, income: newGTQ }
                              : item
                          )
                        );
                      }}
                      className="w-28 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-900 tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>
                Próximo mes crítico:{" "}
                <strong className="text-amber-800">
                  {metrics.nextLowSeasonMonthName}
                </strong>
              </span>
              <span className="tabular-nums font-semibold text-slate-800">
                Cuota ideal:{" "}
                {formatCurrency(
                  metrics.buckets.idealBufferContribution,
                  currency,
                  exchangeRate
                )}
                /sem
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: INTERACTIVE STRESS-TEST SIMULATOR + AI COACH (A/B MODE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Interactive Stress-Test Simulator */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      5. Simulador de Crisis (&ldquo;Stress Test&rdquo;)
                    </h2>
                    <p className="text-xs text-slate-500">
                      ¿Qué pasa si tus ingresos caen durante las próximas
                      semanas?
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="stress-slider"
                    className="text-xs font-bold text-slate-700"
                  >
                    Caída simulada de ingresos semanales:
                  </label>
                  <span className="text-base font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 tabular-nums">
                    -{stressTestDropPct}%
                  </span>
                </div>

                <input
                  id="stress-slider"
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={stressTestDropPct}
                  onChange={(e) => setStressTestDropPct(Number(e.target.value))}
                  className="w-full accent-rose-600 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                  <span>0% (Normal)</span>
                  <span>-25% (Baja moderada)</span>
                  <span>-50% (Crisis fuerte)</span>
                  <span>-80% (Parón)</span>
                </div>
              </div>

              {/* Stress Test Metrics Breakdown */}
              <div className="space-y-2.5 text-xs tabular-nums">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-600">
                    Ingreso semanal simulado (-{stressTestDropPct}%):
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(
                      metrics.stressTestSummary.simulatedWeeklyIncome,
                      currency,
                      exchangeRate
                    )}{" "}
                    / sem
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-600">
                    Retiro semanal necesario del Colchón:
                  </span>
                  <span className="font-bold text-amber-700">
                    {metrics.stressTestSummary.weeklyBurnFromBuffer > 0
                      ? `${formatCurrency(
                          metrics.stressTestSummary.weeklyBurnFromBuffer,
                          currency,
                          exchangeRate
                        )} / sem`
                      : `${symbol}0 (Aún cubres tu piso)`}
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    metrics.stressTestSummary.canSurvive8Weeks
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div>
                    <span className="font-bold block">
                      Resistencia de tu Fondo Colchón:
                    </span>
                    <span className="text-[11px] opacity-80">
                      Manteniendo el 100% de tus gastos fijos
                    </span>
                  </div>
                  <span className="text-xl font-extrabold">
                    {metrics.stressTestSummary.weeklyBurnFromBuffer === 0
                      ? "∞ Indefinido"
                      : `${metrics.stressTestSummary.weeksBufferLastsUnderStress} semanas`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Meta recomendada: resistir al menos 8 semanas al -40%.
              </span>
            </div>
          </div>

          {/* Right 7 Cols: AI Coach with A/B Benchmark Mode */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Coach Financiero IA + Benchmark A/B
                      </h2>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        gemini-3.8-flash
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Compara el motor determinista híbrido (Variante A) contra
                      heurística LLM pura (Variante B)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveCoachTab("COMPARE")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        activeCoachTab === "COMPARE"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      A vs B
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCoachTab("A")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        activeCoachTab === "A"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      Variante A
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCoachTab("B")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        activeCoachTab === "B"
                          ? "bg-white text-amber-800 shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      Variante B
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={fetchABCoachInsights}
                    disabled={isLoadingCoach}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isLoadingCoach ? "animate-spin" : ""
                      }`}
                    />
                    <span>Actualizar IA</span>
                  </button>
                </div>
              </div>

              {/* Coach Content */}
              {abCoachData ? (
                <div
                  className={`grid gap-4 ${
                    activeCoachTab === "COMPARE"
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {/* Variant A Card: Hybrid Waterfall + Gemini 3.8 Flash */}
                  {(activeCoachTab === "COMPARE" || activeCoachTab === "A") && (
                    <div className="rounded-xl border-2 border-emerald-500/80 bg-emerald-50/20 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            🏆 Variante A (Ganadora)
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {abCoachData.variantA.latencyMs}ms
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-emerald-950 mb-1">
                          {abCoachData.variantA.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-200 mb-2.5">
                          {abCoachData.variantA.recommendation.headline}
                        </p>

                        <ul className="space-y-1.5 text-xs text-slate-700 mb-3">
                          {abCoachData.variantA.recommendation.bullets.map(
                            (b, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="pt-2.5 border-t border-emerald-200/70 space-y-1.5 text-[11px]">
                        <div className="text-slate-600">
                          <strong className="text-slate-800">
                            Estrategia 3 Meses:
                          </strong>{" "}
                          {abCoachData.variantA.recommendation.seasonalStrategy}
                        </div>
                        <div className="text-rose-800 bg-rose-50/80 px-2.5 py-1.5 rounded border border-rose-200">
                          <strong>Veredicto Stress Test:</strong>{" "}
                          {abCoachData.variantA.recommendation.stressVerdict}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Variant B Card: Pure LLM Heuristic */}
                  {(activeCoachTab === "COMPARE" || activeCoachTab === "B") && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Variante B (Baseline 50/30/20)
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {abCoachData.variantB.latencyMs}ms
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 mb-1">
                          {abCoachData.variantB.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mb-2.5">
                          {abCoachData.variantB.recommendation.headline}
                        </p>

                        <ul className="space-y-1.5 text-xs text-slate-600 mb-3">
                          {abCoachData.variantB.recommendation.bullets.map(
                            (b, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-slate-400 font-bold">
                                  •
                                </span>
                                <span>{b}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-slate-600 tabular-nums">
                          <span>Ahorro sugerido (20% plano):</span>
                          <strong className="text-slate-800">
                            {formatCurrency(
                              abCoachData.variantB.recommendation
                                .recommendedWeeklySave,
                              currency,
                              exchangeRate
                            )}
                          </strong>
                        </div>
                        <div className="text-slate-500">
                          <strong>Limitación:</strong>{" "}
                          {abCoachData.variantB.recommendation.seasonalStrategy}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-sm text-slate-500">
                  Cargando análisis comparativo A/B...
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                Arquitectura Híbrida: Cálculo exacto determinista + explicación
                contextual en lenguaje llano.
              </span>
              {abCoachData && (
                <span className="font-mono text-slate-600">
                  {abCoachData.variantA.modelUsed}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
