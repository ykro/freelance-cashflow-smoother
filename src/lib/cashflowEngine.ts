export type CurrencyCode = "GTQ" | "USD";

export const DEFAULT_EXCHANGE_RATE = 7.75; // 1 USD = 7.75 GTQ

export type SeasonClassification = "ALTA" | "NORMAL" | "BAJA";

export interface MonthlyHistoricalPoint {
  monthIndex: number; // 0 = Enero ... 11 = Diciembre
  monthName: string;
  shortName: string;
  income: number; // Stored in base currency GTQ
}

export interface MonthlyEvaluatedPoint extends MonthlyHistoricalPoint {
  classification: SeasonClassification;
  smoothedIncome: number; // Stabilized monthly payout after Waterfall Buffer
  bufferContribution: number; // Positive = saved into buffer, Negative = withdrawn from buffer
  projectedBufferBalance: number;
  stressedIncome: number; // Simulated income under stress test drop %
  stressedSmoothedIncome: number;
}

export interface WeeklyBuckets {
  weeklyIncome: number;
  weeklyFloor: number;
  saveForLowSeason: number;
  saveForLowSeasonPct: number;
  fixedCostAllocation: number;
  fixedCostAllocationPct: number;
  safeToSpend: number;
  safeToSpendPct: number;
  withdrawFromBuffer: number;
  isDeficitWeek: boolean;
  uncoveredDeficit: number; // If even buffer cannot cover full weeklyFloor
  idealBufferContribution: number;
}

export interface CashflowMetrics {
  monthlyFloor: number;
  weeklyFloor: number;
  currentBuffer: number;
  targetBuffer: number;
  bufferDeficit: number;
  bufferProgressPct: number;
  runwayWeeks: number;
  stressedRunwayWeeks: number;
  lowSeasonMonthsCount: number;
  lowSeasonWeeksCount: number;
  weeksUntilNextLowSeason: number;
  nextLowSeasonMonthName: string;
  coefficientOfVariation: number; // CV as decimal (e.g. 0.34 = 34%)
  volatilityLevel: "BAJA" | "MEDIA" | "ALTA";
  averageMonthlyIncome: number;
  stabilizedWeeklySalary: number;
  buckets: WeeklyBuckets;
  monthlySeries: MonthlyEvaluatedPoint[];
  stressTestSummary: {
    dropPct: number;
    simulatedWeeklyIncome: number;
    weeklyBurnFromBuffer: number;
    weeksBufferLastsUnderStress: number;
    canSurvive8Weeks: boolean;
  };
}

export interface CashflowInputState {
  monthlyFloor: number; // F_mes in GTQ
  currentBuffer: number; // B_actual in GTQ
  weeklyIncome: number; // I_t in GTQ
  historicalMonths: MonthlyHistoricalPoint[]; // 12 months in GTQ
  stressTestDropPct: number; // 0 to 80 (%)
  currentMonthIndex?: number; // Default to current calendar month (e.g., 9 = Octubre)
}

export interface FreelanceProfilePreset {
  id: string;
  name: string;
  roleBadge: string;
  location: string;
  description: string;
  storyQuote: string;
  monthlyFloor: number; // GTQ
  currentBuffer: number; // GTQ
  weeklyIncome: number; // GTQ
  historicalMonths: MonthlyHistoricalPoint[];
  fixedBreakdown: {
    housing: number;
    food: number;
    utilitiesAndInternet: number;
    transportAndTools: number;
  };
}

export const MONTHS_ES: { monthName: string; shortName: string }[] = [
  { monthName: "Enero", shortName: "Ene" },
  { monthName: "Febrero", shortName: "Feb" },
  { monthName: "Marzo", shortName: "Mar" },
  { monthName: "Abril", shortName: "Abr" },
  { monthName: "Mayo", shortName: "May" },
  { monthName: "Junio", shortName: "Jun" },
  { monthName: "Julio", shortName: "Jul" },
  { monthName: "Agosto", shortName: "Ago" },
  { monthName: "Septiembre", shortName: "Sep" },
  { monthName: "Octubre", shortName: "Oct" },
  { monthName: "Noviembre", shortName: "Nov" },
  { monthName: "Diciembre", shortName: "Dic" },
];

export const WEEKS_PER_MONTH = 4.33;

/**
 * 3 Realistic Guatemalan / LATAM Profiles (stored in GTQ as base currency)
 */
export const DEMO_PROFILES: FreelanceProfilePreset[] = [
  {
    id: "creative-freelancer",
    name: "Sofía Méndez",
    roleBadge: "Diseñadora UX & Dev Freelance",
    location: "Antigua Guatemala / Remoto LATAM",
    description:
      "Cobra por proyectos web y retainers internacionales. Noviembre y Diciembre son meses de cosecha fuerte, pero Enero, Febrero y Junio sufren pausas de presupuesto de clientes.",
    storyQuote:
      "En noviembre facturo Q18,000, pero en enero los clientes congelan presupuestos y apenas entran Q5,200.",
    monthlyFloor: 7800,
    currentBuffer: 6200,
    weeklyIncome: 3100,
    fixedBreakdown: {
      housing: 3500,
      food: 2200,
      utilitiesAndInternet: 1100,
      transportAndTools: 1000,
    },
    historicalMonths: [
      { monthIndex: 0, monthName: "Enero", shortName: "Ene", income: 5200 },
      { monthIndex: 1, monthName: "Febrero", shortName: "Feb", income: 6100 },
      { monthIndex: 2, monthName: "Marzo", shortName: "Mar", income: 11400 },
      { monthIndex: 3, monthName: "Abril", shortName: "Abr", income: 10800 },
      { monthIndex: 4, monthName: "Mayo", shortName: "May", income: 13500 },
      { monthIndex: 5, monthName: "Junio", shortName: "Jun", income: 6400 },
      { monthIndex: 6, monthName: "Julio", shortName: "Jul", income: 9800 },
      { monthIndex: 7, monthName: "Agosto", shortName: "Ago", income: 12900 },
      { monthIndex: 8, monthName: "Septiembre", shortName: "Sep", income: 6900 },
      { monthIndex: 9, monthName: "Octubre", shortName: "Oct", income: 14200 },
      { monthIndex: 10, monthName: "Noviembre", shortName: "Nov", income: 17800 },
      { monthIndex: 11, monthName: "Diciembre", shortName: "Dic", income: 16500 },
    ],
  },
  {
    id: "commission-merchant",
    name: "Carlos Alvarado",
    roleBadge: "Comerciante & Ventas por Comisión",
    location: "Ciudad de Guatemala / Mixco",
    description:
      "Distribuye equipo comercial y calzado por temporada. Picos fuertes en regreso a clases (Enero-Febrero), Bono 14 (Julio) y fin de año, con caídas marcadas en Mayo, Septiembre y Octubre.",
    storyQuote:
      "Con el Bono 14 y Navidad vendo el doble, pero en septiembre con las lluvias las ventas caen casi a la mitad.",
    monthlyFloor: 6500,
    currentBuffer: 4100,
    weeklyIncome: 2400,
    fixedBreakdown: {
      housing: 2600,
      food: 2100,
      utilitiesAndInternet: 800,
      transportAndTools: 1000,
    },
    historicalMonths: [
      { monthIndex: 0, monthName: "Enero", shortName: "Ene", income: 12200 },
      { monthIndex: 1, monthName: "Febrero", shortName: "Feb", income: 10500 },
      { monthIndex: 2, monthName: "Marzo", shortName: "Mar", income: 7900 },
      { monthIndex: 3, monthName: "Abril", shortName: "Abr", income: 8400 },
      { monthIndex: 4, monthName: "Mayo", shortName: "May", income: 5100 },
      { monthIndex: 5, monthName: "Junio", shortName: "Jun", income: 5800 },
      { monthIndex: 6, monthName: "Julio", shortName: "Jul", income: 13800 },
      { monthIndex: 7, monthName: "Agosto", shortName: "Ago", income: 7600 },
      { monthIndex: 8, monthName: "Septiembre", shortName: "Sep", income: 4900 },
      { monthIndex: 9, monthName: "Octubre", shortName: "Oct", income: 5600 },
      { monthIndex: 10, monthName: "Noviembre", shortName: "Nov", income: 11900 },
      { monthIndex: 11, monthName: "Diciembre", shortName: "Dic", income: 15400 },
    ],
  },
  {
    id: "app-driver",
    name: "Jorge Ixchop",
    roleBadge: "Conductor de App & Repartidor",
    location: "Quetzaltenango / Zona Metropolitana",
    description:
      "Ingresos semanales en efectivo y tarjeta con gasto constante de combustible y mantenimiento. Enero, Abril (Semana Santa local) y meses de lluvia fuerte reducen viajes netos.",
    storyQuote:
      "Esta semana fue floja y solo me quedaron Q980 libres después de gasolina; necesito saber cuánto sacar de mi guardadito.",
    monthlyFloor: 5200,
    currentBuffer: 2800,
    weeklyIncome: 980, // Intentionally set to a low/deficit week to demonstrate buffer withdrawal!
    fixedBreakdown: {
      housing: 1900,
      food: 1750,
      utilitiesAndInternet: 550,
      transportAndTools: 1000,
    },
    historicalMonths: [
      { monthIndex: 0, monthName: "Enero", shortName: "Ene", income: 4300 },
      { monthIndex: 1, monthName: "Febrero", shortName: "Feb", income: 5900 },
      { monthIndex: 2, monthName: "Marzo", shortName: "Mar", income: 6800 },
      { monthIndex: 3, monthName: "Abril", shortName: "Abr", income: 4600 },
      { monthIndex: 4, monthName: "Mayo", shortName: "May", income: 6400 },
      { monthIndex: 5, monthName: "Junio", shortName: "Jun", income: 4800 },
      { monthIndex: 6, monthName: "Julio", shortName: "Jul", income: 8200 },
      { monthIndex: 7, monthName: "Agosto", shortName: "Ago", income: 6700 },
      { monthIndex: 8, monthName: "Septiembre", shortName: "Sep", income: 4700 },
      { monthIndex: 9, monthName: "Octubre", shortName: "Oct", income: 6500 },
      { monthIndex: 10, monthName: "Noviembre", shortName: "Nov", income: 7900 },
      { monthIndex: 11, monthName: "Diciembre", shortName: "Dic", income: 9400 },
    ],
  },
];

/**
 * Compute statistical mean and standard deviation for Coefficient of Variation (CV).
 */
export function calculateCoefficientOfVariation(values: number[]): {
  mean: number;
  stdDev: number;
  cv: number;
} {
  if (!values.length) {
    return { mean: 0, stdDev: 0, cv: 0 };
  }
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  if (mean <= 0) {
    return { mean: 0, stdDev: 0, cv: 0 };
  }
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return { mean, stdDev, cv };
}

/**
 * Classifies each month into ALTA (Harvest), NORMAL, or BAJA (Lean season).
 * - BAJA: income < monthlyFloor * 1.03 (below or dangerously close to survival floor)
 * - ALTA: income >= max(mean * 1.12, monthlyFloor * 1.30)
 * - NORMAL: everything in between
 */
export function classifyMonthSeason(
  income: number,
  monthlyFloor: number,
  meanIncome: number
): SeasonClassification {
  if (income < monthlyFloor * 1.03) {
    return "BAJA";
  }
  if (income >= Math.max(meanIncome * 1.12, monthlyFloor * 1.3)) {
    return "ALTA";
  }
  return "NORMAL";
}

/**
 * Core Waterfall Cashflow Smoothing Engine
 */
export function computeCashflowSmoothing(
  input: CashflowInputState
): CashflowMetrics {
  const monthlyFloor = Math.max(500, input.monthlyFloor);
  const currentBuffer = Math.max(0, input.currentBuffer);
  const weeklyIncome = Math.max(0, input.weeklyIncome);
  const stressTestDropPct = Math.min(90, Math.max(0, input.stressTestDropPct));
  const currentMonthIndex = input.currentMonthIndex ?? 9; // Default Octubre

  const weeklyFloor = monthlyFloor / WEEKS_PER_MONTH;

  const incomes = input.historicalMonths.map((m) => m.income);
  const { mean: averageMonthlyIncome, cv: coefficientOfVariation } =
    calculateCoefficientOfVariation(incomes);

  const volatilityLevel: "BAJA" | "MEDIA" | "ALTA" =
    coefficientOfVariation < 0.2
      ? "BAJA"
      : coefficientOfVariation < 0.35
      ? "MEDIA"
      : "ALTA";

  // Classify months & count low season months
  const rawClassifications = input.historicalMonths.map((m) =>
    classifyMonthSeason(m.income, monthlyFloor, averageMonthlyIncome)
  );

  const lowSeasonMonthsCount = rawClassifications.filter(
    (c) => c === "BAJA"
  ).length;

  // Per SPEC.md: N_semanas_bajas is inferred from how many historical months were below F_mes (minimum 4 weeks)
  // Each low month represents ~2.5 weeks of net deficit + safety margin, or at least 4 weeks minimum
  const inferredLowWeeks = Math.max(
    4,
    Math.round(lowSeasonMonthsCount * 2.25)
  );
  const targetBuffer = Math.round(weeklyFloor * inferredLowWeeks);
  const bufferDeficit = Math.max(0, targetBuffer - currentBuffer);
  const bufferProgressPct =
    targetBuffer > 0
      ? Math.min(100, Math.round((currentBuffer / targetBuffer) * 100))
      : 100;

  // Find next BAJA month starting from currentMonthIndex + 1
  let monthsUntilNextLow = 3;
  let nextLowSeasonMonthName = "Enero";
  for (let offset = 1; offset <= 12; offset++) {
    const idx = (currentMonthIndex + offset) % 12;
    if (rawClassifications[idx] === "BAJA") {
      monthsUntilNextLow = offset;
      nextLowSeasonMonthName = MONTHS_ES[idx].monthName;
      break;
    }
  }
  const weeksUntilNextLowSeason = Math.max(
    1,
    Math.round(monthsUntilNextLow * WEEKS_PER_MONTH)
  );

  // Ideal weekly contribution to reach targetBuffer before next low season
  const idealBufferContribution =
    bufferDeficit > 0 ? bufferDeficit / weeksUntilNextLowSeason : 0;

  // Calculate Weekly Buckets using exact Waterfall Buffer equations from SPEC.md
  let saveForLowSeason = 0;
  let fixedCostAllocation = 0;
  let safeToSpend = 0;
  let withdrawFromBuffer = 0;
  let uncoveredDeficit = 0;
  const isDeficitWeek = weeklyIncome < weeklyFloor;

  if (isDeficitWeek) {
    // Case 1: Deficit Week (I_t < F_sem)
    saveForLowSeason = 0;
    const neededFromBuffer = weeklyFloor - weeklyIncome;
    withdrawFromBuffer = Math.min(currentBuffer, neededFromBuffer);
    fixedCostAllocation = weeklyIncome + withdrawFromBuffer;
    uncoveredDeficit = Math.max(0, neededFromBuffer - withdrawFromBuffer);
    safeToSpend = 0;
  } else {
    // Case 2: Surplus Week (I_t >= F_sem)
    fixedCostAllocation = weeklyFloor;
    const surplus = weeklyIncome - weeklyFloor;

    if (surplus > 0) {
      if (bufferDeficit > 0) {
        // Apartado = min(E_t * 0.75, max(E_t * 0.25, C_ideal))
        saveForLowSeason = Math.min(
          surplus * 0.75,
          Math.max(surplus * 0.25, idealBufferContribution)
        );
      } else {
        // Buffer already at target: still save 20% of surplus for maintenance/growth
        saveForLowSeason = surplus * 0.2;
      }
      safeToSpend = Math.max(0, surplus - saveForLowSeason);
    }
  }

  const totalWeeklyReference = Math.max(1, weeklyIncome);
  const saveForLowSeasonPct = Math.round(
    (saveForLowSeason / totalWeeklyReference) * 100
  );
  const fixedCostAllocationPct = isDeficitWeek
    ? 100
    : Math.round((fixedCostAllocation / totalWeeklyReference) * 100);
  const safeToSpendPct = isDeficitWeek
    ? 0
    : Math.max(0, 100 - saveForLowSeasonPct - fixedCostAllocationPct);

  const buckets: WeeklyBuckets = {
    weeklyIncome,
    weeklyFloor,
    saveForLowSeason,
    saveForLowSeasonPct,
    fixedCostAllocation,
    fixedCostAllocationPct,
    safeToSpend,
    safeToSpendPct,
    withdrawFromBuffer,
    isDeficitWeek,
    uncoveredDeficit,
    idealBufferContribution,
  };

  // Runway Weeks (Semanas de Oxígeno)
  const runwayWeeks =
    weeklyFloor > 0 ? Number((currentBuffer / weeklyFloor).toFixed(1)) : 0;

  // Build 12-Month Time Series comparing Raw Income (Montaña Rusa) vs Smoothed Income (Sueldo Estabilizado)
  let runningBuffer = currentBuffer;
  const stressFactor = 1 - stressTestDropPct / 100;
  let runningStressedBuffer = currentBuffer;

  const monthlySeries: MonthlyEvaluatedPoint[] = input.historicalMonths.map(
    (point, idx) => {
      const classification = rawClassifications[idx];
      let smoothedIncome = point.income;
      let bufferContribution = 0;

      if (point.income < monthlyFloor) {
        // Low season month: pull from buffer to guarantee at least monthlyFloor (or whatever buffer has + small safe buffer)
        const deficit = monthlyFloor - point.income;
        const withdrawal = Math.min(runningBuffer, deficit);
        runningBuffer -= withdrawal;
        bufferContribution = -withdrawal;
        // Also add a modest safe-to-spend cushion if buffer is healthy
        const extraCushion =
          runningBuffer > monthlyFloor * 0.5
            ? Math.min(runningBuffer * 0.1, monthlyFloor * 0.12)
            : 0;
        runningBuffer -= extraCushion;
        bufferContribution -= extraCushion;
        smoothedIncome = point.income + withdrawal + extraCushion;
      } else {
        // Surplus month: skim surplus into buffer according to Waterfall rule
        const monthlySurplus = point.income - monthlyFloor;
        const monthlyIdealSave = idealBufferContribution * WEEKS_PER_MONTH;
        const saved = Math.min(
          monthlySurplus * 0.7,
          Math.max(monthlySurplus * 0.35, monthlyIdealSave)
        );
        runningBuffer += saved;
        bufferContribution = saved;
        smoothedIncome = monthlyFloor + (monthlySurplus - saved);
      }

      // Stress-tested series calculation
      const stressedIncome = Math.round(point.income * stressFactor);
      let stressedSmoothedIncome = stressedIncome;
      if (stressedIncome < monthlyFloor) {
        const stDeficit = monthlyFloor - stressedIncome;
        const stWithdraw = Math.min(runningStressedBuffer, stDeficit);
        runningStressedBuffer -= stWithdraw;
        stressedSmoothedIncome = stressedIncome + stWithdraw;
      } else {
        const stSurplus = stressedIncome - monthlyFloor;
        const stSave = stSurplus * 0.5;
        runningStressedBuffer += stSave;
        stressedSmoothedIncome = monthlyFloor + (stSurplus - stSave);
      }

      return {
        ...point,
        classification,
        smoothedIncome: Math.round(smoothedIncome),
        bufferContribution: Math.round(bufferContribution),
        projectedBufferBalance: Math.round(runningBuffer),
        stressedIncome,
        stressedSmoothedIncome: Math.round(stressedSmoothedIncome),
      };
    }
  );

  // Average stabilized weekly salary across the 12 months
  const avgSmoothedMonthly =
    monthlySeries.reduce((acc, m) => acc + m.smoothedIncome, 0) /
    Math.max(1, monthlySeries.length);
  const stabilizedWeeklySalary = avgSmoothedMonthly / WEEKS_PER_MONTH;

  // Stress Test calculations
  const simulatedWeeklyIncome = weeklyIncome * stressFactor;
  const weeklyBurnFromBuffer = Math.max(0, weeklyFloor - simulatedWeeklyIncome);
  const weeksBufferLastsUnderStress =
    weeklyBurnFromBuffer > 0
      ? Number((currentBuffer / weeklyBurnFromBuffer).toFixed(1))
      : 52; // If still above weeklyFloor even after drop, buffer lasts indefinitely (capped at 52w display)

  return {
    monthlyFloor,
    weeklyFloor,
    currentBuffer,
    targetBuffer,
    bufferDeficit,
    bufferProgressPct,
    runwayWeeks,
    stressedRunwayWeeks: weeksBufferLastsUnderStress,
    lowSeasonMonthsCount,
    lowSeasonWeeksCount: inferredLowWeeks,
    weeksUntilNextLowSeason,
    nextLowSeasonMonthName,
    coefficientOfVariation,
    volatilityLevel,
    averageMonthlyIncome,
    stabilizedWeeklySalary,
    buckets,
    monthlySeries,
    stressTestSummary: {
      dropPct: stressTestDropPct,
      simulatedWeeklyIncome,
      weeklyBurnFromBuffer,
      weeksBufferLastsUnderStress,
      canSurvive8Weeks: weeksBufferLastsUnderStress >= 8,
    },
  };
}

/**
 * Currency formatting helper (converts from base GTQ to target currencyGTQ or USD)
 */
export function formatCurrency(
  amountInGTQ: number,
  currency: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
  showDecimals: boolean = false
): string {
  const converted =
    currency === "USD" ? amountInGTQ / exchangeRate : amountInGTQ;
  const symbol = currency === "GTQ" ? "Q" : "$";
  const formattedNumber = new Intl.NumberFormat("es-GT", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(Math.round(converted));
  return `${symbol}${formattedNumber}`;
}

export function convertFromGTQ(
  amountInGTQ: number,
  currency: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (currency === "USD") {
    return Math.round(amountInGTQ / exchangeRate);
  }
  return Math.round(amountInGTQ);
}

export function convertToGTQ(
  amountInDisplayCurrency: number,
  currency: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (currency === "USD") {
    return Math.round(amountInDisplayCurrency * exchangeRate);
  }
  return Math.round(amountInDisplayCurrency);
}
