import {
  CashflowSmoothingInput,
  CashflowSmoothingResult,
  CurrencyCode,
  DualCurrencyAmount,
  DualCurrencyBreakdown,
  EvaluatedPeriodPoint,
  IncomePeriodInput,
  PeriodMode,
  PresetProfile,
  SeasonClassification,
  SeasonLearningSummary,
  SimulationSummary,
  WeeklyAllocation,
} from "@/types/cashflow";

export const DEFAULT_EXCHANGE_RATE = 7.75; // Q7.75 = $1.00 USD
export const WEEKS_PER_MONTH = 4.33;

/**
 * 3 Quick 1-Click Presets demonstrating simultaneous Q + $ and Modo Mes / Modo Semana
 */
export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: "freelancer-dual",
    title: "Freelancer Diseño / Dev",
    subtitle: "Ingresos en $ y Q · Gastos esenciales en Q y suscripciones en $",
    tag: "Modo Mes · Bimonetario ($ + Q)",
    periodMode: "month",
    essentialExpenses: { gtq: 7200, usd: 180 }, // Q7,200 local + $180 tools/cloud = Q8,595/mes
    currentReserve: { gtq: 4500, usd: 400 }, // Q4,500 + $400 = Q7,600
    periods: [
      { id: "m-1", label: "Junio (Pausa de clientes)", shortLabel: "Jun", gtq: 1500, usd: 620 },
      { id: "m-2", label: "Julio (Proyecto mediano)", shortLabel: "Jul", gtq: 2400, usd: 1150 },
      { id: "m-3", label: "Agosto (Entrega web + retainer)", shortLabel: "Ago", gtq: 3100, usd: 1550 },
      { id: "m-4", label: "Septiembre (Temporada baja)", shortLabel: "Sep", gtq: 1200, usd: 580 },
      { id: "m-5", label: "Octubre (Cierre de proyectos)", shortLabel: "Oct", gtq: 3500, usd: 1680 },
    ],
  },
  {
    id: "comerciante-semanal",
    title: "Comerciante / Independiente",
    subtitle: "Ventas semanales en Quetzales con semanas buenas y semanas flojas",
    tag: "Modo Semana · En Quetzales (Q)",
    periodMode: "week",
    essentialExpenses: { gtq: 1650, usd: 0 }, // Q1,650 por semana
    currentReserve: { gtq: 4200, usd: 0 },
    periods: [
      { id: "w-1", label: "Semana 1 (Quincena alta)", shortLabel: "Sem 1", gtq: 2850, usd: 0 },
      { id: "w-2", label: "Semana 2 (Semana normal)", shortLabel: "Sem 2", gtq: 1950, usd: 0 },
      { id: "w-3", label: "Semana 3 (Lluvias / baja venta)", shortLabel: "Sem 3", gtq: 1180, usd: 0 },
      { id: "w-4", label: "Semana 4 (Fin de mes alto)", shortLabel: "Sem 4", gtq: 3200, usd: 0 },
      { id: "w-5", label: "Semana 5 (Inicio de mes)", shortLabel: "Sem 5", gtq: 2150, usd: 0 },
      { id: "w-6", label: "Semana 6 (Semana baja)", shortLabel: "Sem 6", gtq: 1320, usd: 0 },
    ],
  },
  {
    id: "consultor-mixto",
    title: "Consultor Mixto (Temporada alta y baja)",
    subtitle: "Honorarios locales en Q y consultoría regional en $ con picos marcados",
    tag: "Modo Mes · Estacionalidad Alta",
    periodMode: "month",
    essentialExpenses: { gtq: 6800, usd: 120 }, // Q7,730/mes total
    currentReserve: { gtq: 5800, usd: 250 }, // Q7,738 total
    periods: [
      { id: "c-1", label: "Mayo (Temporada baja)", shortLabel: "May", gtq: 3800, usd: 200 },
      { id: "c-2", label: "Junio (Mes normal)", shortLabel: "Jun", gtq: 5900, usd: 380 },
      { id: "c-3", label: "Julio (Bono 14 / Pico alto)", shortLabel: "Jul", gtq: 9400, usd: 750 },
      { id: "c-4", label: "Agosto (Mes normal)", shortLabel: "Ago", gtq: 6200, usd: 350 },
      { id: "c-5", label: "Septiembre (Temporada baja)", shortLabel: "Sep", gtq: 4100, usd: 150 },
      { id: "c-6", label: "Octubre (Temporada alta)", shortLabel: "Oct", gtq: 8900, usd: 680 },
    ],
  },
];

export function combineToGTQ(
  amount: DualCurrencyAmount,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  const gtq = Math.max(0, Number(amount.gtq) || 0);
  const usd = Math.max(0, Number(amount.usd) || 0);
  return gtq + usd * exchangeRate;
}

export function combineToUSD(
  amount: DualCurrencyAmount,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  return combineToGTQ(amount, exchangeRate) / exchangeRate;
}

export function formatGTQ(amountGTQ: number, showDecimals: boolean = false): string {
  const formatted = new Intl.NumberFormat("es-GT", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(Math.round(amountGTQ));
  return `Q${formatted}`;
}

export function formatUSD(amountUSD: number, showDecimals: boolean = false): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(showDecimals ? Number(amountUSD.toFixed(2)) : Math.round(amountUSD));
  return `$${formatted}`;
}

export function formatCurrency(
  amountInGTQ: number,
  currency: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
  showDecimals: boolean = false
): string {
  if (currency === "USD") {
    return formatUSD(amountInGTQ / exchangeRate, showDecimals);
  }
  return formatGTQ(amountInGTQ, showDecimals);
}

export function formatDual(
  amountInGTQ: number,
  primaryCurrency: CurrencyCode = "GTQ",
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): { primary: string; secondary: string } {
  const gtqStr = formatGTQ(amountInGTQ);
  const usdStr = formatUSD(amountInGTQ / exchangeRate);
  return primaryCurrency === "GTQ"
    ? { primary: gtqStr, secondary: `${usdStr} USD` }
    : { primary: usdStr, secondary: `${gtqStr} GTQ` };
}

export function calculateStats(values: number[]): {
  mean: number;
  stdDev: number;
  cv: number;
} {
  if (!values.length) return { mean: 0, stdDev: 0, cv: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean <= 0) return { mean: 0, stdDev: 0, cv: 0 };
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev, cv: stdDev / mean };
}

/**
 * Classifies a single period (month or week) into ALTA, NORMAL, or BAJA
 * relative to the period's essential expenses floor and average income.
 */
export function classifyPeriodSeason(
  periodIncomeGTQ: number,
  periodFloorGTQ: number,
  meanPeriodIncomeGTQ: number
): SeasonClassification {
  if (periodIncomeGTQ < periodFloorGTQ * 1.04) {
    return "BAJA";
  }
  if (periodIncomeGTQ >= Math.max(meanPeriodIncomeGTQ * 1.12, periodFloorGTQ * 1.25)) {
    return "ALTA";
  }
  return "NORMAL";
}

/**
 * Main Dual-Currency Seasonal Cashflow Smoothing Engine
 */
export function computeDualCurrencyCashflow(
  input: CashflowSmoothingInput
): CashflowSmoothingResult {
  const exchangeRate = input.exchangeRate || DEFAULT_EXCHANGE_RATE;
  const periodMode: PeriodMode = input.periodMode;
  const simulationDeltaPct = Math.max(
    -50,
    Math.min(50, Number(input.simulationDeltaPct) || 0)
  );

  // 1. Normalize essential expenses to both Period, Weekly, and Monthly scales
  const rawPeriodExpenseGTQ = Math.max(
    100,
    combineToGTQ(input.essentialExpenses, exchangeRate)
  );
  const essentialWeeklyGTQ =
    periodMode === "week"
      ? rawPeriodExpenseGTQ
      : rawPeriodExpenseGTQ / WEEKS_PER_MONTH;
  const essentialMonthlyGTQ =
    periodMode === "month"
      ? rawPeriodExpenseGTQ
      : rawPeriodExpenseGTQ * WEEKS_PER_MONTH;

  const essentialWeeklyUSD = essentialWeeklyGTQ / exchangeRate;
  const essentialMonthlyUSD = essentialMonthlyGTQ / exchangeRate;
  const periodFloorGTQ =
    periodMode === "week" ? essentialWeeklyGTQ : essentialMonthlyGTQ;

  // 2. Current Reserve in GTQ and USD
  const currentReserveGTQ = Math.max(
    0,
    combineToGTQ(input.currentReserve, exchangeRate)
  );
  const currentReserveUSD = currentReserveGTQ / exchangeRate;

  // 3. Evaluate input periods (ensure at least 2 periods)
  const validPeriods: IncomePeriodInput[] =
    input.periods && input.periods.length >= 2
      ? input.periods
      : PRESET_PROFILES[0].periods;

  const periodTotalsGTQ = validPeriods.map((p) =>
    combineToGTQ({ gtq: p.gtq, usd: p.usd }, exchangeRate)
  );

  const { mean: meanPeriodGTQ, cv } = calculateStats(periodTotalsGTQ);

  const classifications = periodTotalsGTQ.map((total) =>
    classifyPeriodSeason(total, periodFloorGTQ, meanPeriodGTQ)
  );

  const highPeriods = periodTotalsGTQ.filter(
    (_, idx) => classifications[idx] === "ALTA"
  );
  const normalPeriods = periodTotalsGTQ.filter(
    (_, idx) => classifications[idx] === "NORMAL"
  );
  const lowPeriods = periodTotalsGTQ.filter(
    (_, idx) => classifications[idx] === "BAJA"
  );

  // Learned averages for Good Season vs Low Season
  const goodPool =
    highPeriods.length > 0
      ? highPeriods
      : normalPeriods.length > 0
      ? normalPeriods
      : [meanPeriodGTQ];
  const goodSeasonAvgGTQ =
    goodPool.reduce((s, v) => s + v, 0) / goodPool.length;

  const lowPool =
    lowPeriods.length > 0
      ? lowPeriods
      : [Math.min(...periodTotalsGTQ, periodFloorGTQ * 0.85)];
  const lowSeasonAvgGTQ = lowPool.reduce((s, v) => s + v, 0) / lowPool.length;

  const goodSeasonWeeklyAvgGTQ =
    periodMode === "week"
      ? goodSeasonAvgGTQ
      : goodSeasonAvgGTQ / WEEKS_PER_MONTH;
  const lowSeasonWeeklyAvgGTQ =
    periodMode === "week"
      ? lowSeasonAvgGTQ
      : lowSeasonAvgGTQ / WEEKS_PER_MONTH;
  const overallAvgWeeklyGTQ =
    periodMode === "week" ? meanPeriodGTQ : meanPeriodGTQ / WEEKS_PER_MONTH;

  // 4. Target Reserve (Meta de Reserva para Temporada Baja)
  // How many low weeks do we need to protect against?
  const lowRatio = lowPeriods.length / Math.max(1, validPeriods.length);
  const targetCoverageWeeks = Math.max(
    4,
    Math.min(12, Math.round(4 + lowRatio * 8 + cv * 6))
  );
  const targetReserveGTQ = Math.round(essentialWeeklyGTQ * targetCoverageWeeks);
  const targetReserveUSD = targetReserveGTQ / exchangeRate;
  const reserveGapGTQ = Math.max(0, targetReserveGTQ - currentReserveGTQ);
  const reserveProgressPct =
    targetReserveGTQ > 0
      ? Math.min(100, Math.round((currentReserveGTQ / targetReserveGTQ) * 100))
      : 100;

  const coverageWeeks =
    essentialWeeklyGTQ > 0
      ? Number((currentReserveGTQ / essentialWeeklyGTQ).toFixed(1))
      : 0;
  const coverageMonths = Number((coverageWeeks / WEEKS_PER_MONTH).toFixed(1));

  // 5. Calculate Weekly Set-Aside Rule ("Cuánto apartar cada semana")
  // Based on the user's learned good/normal weekly surplus and low-season shortfall:
  const avgWeeklySurplusInGoodPeriods = Math.max(
    0,
    goodSeasonWeeklyAvgGTQ - essentialWeeklyGTQ
  );
  const avgWeeklyShortfallInLowPeriods = Math.max(
    essentialWeeklyGTQ * 0.18,
    essentialWeeklyGTQ - lowSeasonWeeklyAvgGTQ
  );

  // Ideal weekly contribution to build/maintain the reserve over ~8 good weeks
  const idealWeeklyReserveBuild =
    reserveGapGTQ > 0
      ? reserveGapGTQ / 8
      : avgWeeklySurplusInGoodPeriods * 0.25;

  // Rule for a good/normal week:
  const goodWeekSetAsideRuleGTQ =
    avgWeeklySurplusInGoodPeriods > 0
      ? Math.round(
          Math.min(
            avgWeeklySurplusInGoodPeriods * 0.65,
            Math.max(
              avgWeeklySurplusInGoodPeriods * 0.3,
              idealWeeklyReserveBuild
            )
          )
        )
      : Math.round(essentialWeeklyGTQ * 0.15);

  const lowWeekWithdrawRuleGTQ = Math.round(avgWeeklyShortfallInLowPeriods);

  // Evaluate the most recent period (or average good/current state) for "Esta semana"
  const latestPeriodGTQ =
    periodTotalsGTQ[periodTotalsGTQ.length - 1] ?? meanPeriodGTQ;
  const currentWeeklyIncomeGTQ =
    periodMode === "week"
      ? latestPeriodGTQ
      : overallAvgWeeklyGTQ;

  const isLowPeriod = currentWeeklyIncomeGTQ < essentialWeeklyGTQ;

  let recommendedSetAsideGTQ = 0;
  let withdrawFromReserveWeeklyGTQ = 0;
  let freeDiscretionaryWeeklyGTQ = 0;

  if (isLowPeriod) {
    recommendedSetAsideGTQ = 0;
    const weeklyDeficit = essentialWeeklyGTQ - currentWeeklyIncomeGTQ;
    withdrawFromReserveWeeklyGTQ = Math.min(currentReserveGTQ, weeklyDeficit);
    freeDiscretionaryWeeklyGTQ = 0;
  } else {
    const currentWeeklySurplus = currentWeeklyIncomeGTQ - essentialWeeklyGTQ;
    if (reserveGapGTQ > 0) {
      recommendedSetAsideGTQ = Math.min(
        currentWeeklySurplus * 0.7,
        Math.max(currentWeeklySurplus * 0.3, idealWeeklyReserveBuild)
      );
    } else {
      recommendedSetAsideGTQ = currentWeeklySurplus * 0.25;
    }
    freeDiscretionaryWeeklyGTQ = Math.max(
      0,
      currentWeeklySurplus - recommendedSetAsideGTQ
    );
  }

  // If the latest week happens to be a low week, we still want the user to clearly know their standard weekly set-aside target:
  const primarySetAsideDisplayGTQ =
    recommendedSetAsideGTQ > 0
      ? Math.round(recommendedSetAsideGTQ)
      : goodWeekSetAsideRuleGTQ;

  const safeWeeklyIncomeGTQ = Math.round(
    essentialWeeklyGTQ + freeDiscretionaryWeeklyGTQ
  );
  const safeMonthlySalaryGTQ = Math.round(safeWeeklyIncomeGTQ * WEEKS_PER_MONTH);

  const recommendedSetAsidePct =
    currentWeeklyIncomeGTQ > 0
      ? Math.round((primarySetAsideDisplayGTQ / Math.max(currentWeeklyIncomeGTQ, goodSeasonWeeklyAvgGTQ)) * 100)
      : 0;

  const weeklyAllocation: WeeklyAllocation = {
    weeklyIncomeGTQ: Math.round(currentWeeklyIncomeGTQ),
    weeklyIncomeUSD: currentWeeklyIncomeGTQ / exchangeRate,
    weeklyEssentialGTQ: Math.round(essentialWeeklyGTQ),
    weeklyEssentialUSD: essentialWeeklyUSD,
    recommendedSetAsideGTQ: primarySetAsideDisplayGTQ,
    recommendedSetAsideUSD: primarySetAsideDisplayGTQ / exchangeRate,
    recommendedSetAsidePct,
    safeWeeklyIncomeGTQ,
    safeWeeklyIncomeUSD: safeWeeklyIncomeGTQ / exchangeRate,
    safeMonthlySalaryGTQ,
    safeMonthlySalaryUSD: safeMonthlySalaryGTQ / exchangeRate,
    freeDiscretionaryWeeklyGTQ: Math.round(freeDiscretionaryWeeklyGTQ),
    freeDiscretionaryWeeklyUSD: freeDiscretionaryWeeklyGTQ / exchangeRate,
    withdrawFromReserveWeeklyGTQ: Math.round(withdrawFromReserveWeeklyGTQ),
    withdrawFromReserveWeeklyUSD: withdrawFromReserveWeeklyGTQ / exchangeRate,
    isLowPeriod,
  };

  // 6. Evaluate each period for the Chart & Bidirectional Simulation (-50% to +50%)
  const simMultiplier = 1 + simulationDeltaPct / 100;
  let runningBufferGTQ = currentReserveGTQ;
  let runningSimBufferGTQ = currentReserveGTQ;

  const periodIdealSaveGTQ =
    periodMode === "week"
      ? idealWeeklyReserveBuild
      : idealWeeklyReserveBuild * WEEKS_PER_MONTH;

  const evaluatedPeriods: EvaluatedPeriodPoint[] = validPeriods.map(
    (p, index) => {
      const totalGTQ = periodTotalsGTQ[index];
      const totalUSD = totalGTQ / exchangeRate;
      const classification = classifications[index];

      let smoothedGTQ = totalGTQ;
      let bufferContributionGTQ = 0;

      if (totalGTQ < periodFloorGTQ) {
        const deficit = periodFloorGTQ - totalGTQ;
        const withdraw = Math.min(runningBufferGTQ, deficit);
        runningBufferGTQ -= withdraw;
        bufferContributionGTQ = -withdraw;
        smoothedGTQ = totalGTQ + withdraw;
      } else {
        const surplus = totalGTQ - periodFloorGTQ;
        const save = Math.min(
          surplus * 0.68,
          Math.max(surplus * 0.32, periodIdealSaveGTQ)
        );
        runningBufferGTQ += save;
        bufferContributionGTQ = save;
        smoothedGTQ = periodFloorGTQ + (surplus - save);
      }

      // Simulated period (handles both -50% drop and +50% surge)
      const simulatedIncomeGTQ = Math.round(totalGTQ * simMultiplier);
      let simulatedSmoothedGTQ = simulatedIncomeGTQ;
      let simulatedBufferContributionGTQ = 0;

      if (simulatedIncomeGTQ < periodFloorGTQ) {
        const simDeficit = periodFloorGTQ - simulatedIncomeGTQ;
        const simWithdraw = Math.min(runningSimBufferGTQ, simDeficit);
        runningSimBufferGTQ -= simWithdraw;
        simulatedBufferContributionGTQ = -simWithdraw;
        simulatedSmoothedGTQ = simulatedIncomeGTQ + simWithdraw;
      } else {
        const simSurplus = simulatedIncomeGTQ - periodFloorGTQ;
        const simSave = Math.min(
          simSurplus * 0.68,
          Math.max(simSurplus * 0.32, periodIdealSaveGTQ)
        );
        runningSimBufferGTQ += simSave;
        simulatedBufferContributionGTQ = simSave;
        simulatedSmoothedGTQ = periodFloorGTQ + (simSurplus - simSave);
      }

      return {
        ...p,
        index,
        totalGTQ: Math.round(totalGTQ),
        totalUSD: Number(totalUSD.toFixed(2)),
        classification,
        smoothedGTQ: Math.round(smoothedGTQ),
        smoothedUSD: Number((smoothedGTQ / exchangeRate).toFixed(2)),
        essentialFloorGTQ: Math.round(periodFloorGTQ),
        bufferContributionGTQ: Math.round(bufferContributionGTQ),
        projectedBufferGTQ: Math.round(runningBufferGTQ),
        simulatedIncomeGTQ,
        simulatedSmoothedGTQ: Math.round(simulatedSmoothedGTQ),
        simulatedBufferContributionGTQ: Math.round(
          simulatedBufferContributionGTQ
        ),
      };
    }
  );

  // 7. Bidirectional Simulation Summary (-50% Baja to +50% Alta)
  const simulatedWeeklyIncomeGTQ = Math.round(
    overallAvgWeeklyGTQ * simMultiplier
  );
  const simulatedWeeklyIncomeUSD = simulatedWeeklyIncomeGTQ / exchangeRate;

  let simulatedWeeklySetAsideGTQ = 0;
  let weeklyReserveDrawdownGTQ = 0;

  if (simulatedWeeklyIncomeGTQ < essentialWeeklyGTQ) {
    simulatedWeeklySetAsideGTQ = 0;
    weeklyReserveDrawdownGTQ = Math.round(
      essentialWeeklyGTQ - simulatedWeeklyIncomeGTQ
    );
  } else {
    const simWeeklySurplus = simulatedWeeklyIncomeGTQ - essentialWeeklyGTQ;
    simulatedWeeklySetAsideGTQ = Math.round(
      Math.min(
        simWeeklySurplus * 0.68,
        Math.max(simWeeklySurplus * 0.32, idealWeeklyReserveBuild)
      )
    );
  }

  const extraWeeklySavedVsBaseGTQ = Math.round(
    simulatedWeeklySetAsideGTQ - primarySetAsideDisplayGTQ
  );

  const simulatedCoverageWeeks =
    weeklyReserveDrawdownGTQ > 0
      ? Number((currentReserveGTQ / weeklyReserveDrawdownGTQ).toFixed(1))
      : Number(
          (
            (currentReserveGTQ + simulatedWeeklySetAsideGTQ * 4) /
            essentialWeeklyGTQ
          ).toFixed(1)
        );

  const simMode: "BAJA" | "ACTUAL" | "ALTA" =
    simulationDeltaPct < 0
      ? "BAJA"
      : simulationDeltaPct > 0
      ? "ALTA"
      : "ACTUAL";

  let simHeadlineEs = "Escenario base con tus ingresos actuales";
  let simDetailEs = `Con tu ritmo actual apartas ${formatGTQ(
    primarySetAsideDisplayGTQ
  )} (${formatUSD(
    primarySetAsideDisplayGTQ / exchangeRate
  )}) por semana y mantienes un ingreso seguro semanal de ${formatGTQ(
    safeWeeklyIncomeGTQ
  )}.`;

  if (simMode === "BAJA") {
    if (weeklyReserveDrawdownGTQ > 0) {
      simHeadlineEs = `Simulación de Temporada Baja (${simulationDeltaPct}%): Tu reserva cubre el déficit`;
      simDetailEs = `Si tus ingresos bajan ${Math.abs(
        simulationDeltaPct
      )}% (a ${formatGTQ(simulatedWeeklyIncomeGTQ)}/sem), dejas de apartar y retiras ${formatGTQ(
        weeklyReserveDrawdownGTQ
      )} (${formatUSD(
        weeklyReserveDrawdownGTQ / exchangeRate
      )}) por semana de tu reserva. Tu fondo actual resiste ${simulatedCoverageWeeks} semanas sin endeudarte.`;
    } else {
      simHeadlineEs = `Simulación de Temporada Baja (${simulationDeltaPct}%): Aún cubres tus gastos esenciales`;
      simDetailEs = `Incluso con una baja del ${Math.abs(
        simulationDeltaPct
      )}% (a ${formatGTQ(
        simulatedWeeklyIncomeGTQ
      )}/sem), cubres tus gastos esenciales de ${formatGTQ(
        essentialWeeklyGTQ
      )}/sem sin tocar tu reserva y aún puedes apartar ${formatGTQ(
        simulatedWeeklySetAsideGTQ
      )}/sem.`;
    }
  } else if (simMode === "ALTA") {
    simHeadlineEs = `Simulación de Temporada Alta (+${simulationDeltaPct}%): Aceleración de tu reserva`;
    simDetailEs = `Si tus ingresos suben +${simulationDeltaPct}% (a ${formatGTQ(
      simulatedWeeklyIncomeGTQ
    )}/sem), puedes apartar ${formatGTQ(simulatedWeeklySetAsideGTQ)} (${formatUSD(
      simulatedWeeklySetAsideGTQ / exchangeRate
    )}) por semana (${
      extraWeeklySavedVsBaseGTQ >= 0
        ? `+${formatGTQ(extraWeeklySavedVsBaseGTQ)} extra por semana`
        : formatGTQ(simulatedWeeklySetAsideGTQ)
    }), elevando tu cobertura a ${simulatedCoverageWeeks} semanas.`;
  }

  const simulation: SimulationSummary = {
    deltaPct: simulationDeltaPct,
    mode: simMode,
    simulatedWeeklyIncomeGTQ,
    simulatedWeeklyIncomeUSD,
    simulatedWeeklySetAsideGTQ,
    simulatedWeeklySetAsideUSD: simulatedWeeklySetAsideGTQ / exchangeRate,
    extraWeeklySavedVsBaseGTQ,
    extraWeeklySavedVsBaseUSD: extraWeeklySavedVsBaseGTQ / exchangeRate,
    weeklyReserveDrawdownGTQ,
    weeklyReserveDrawdownUSD: weeklyReserveDrawdownGTQ / exchangeRate,
    simulatedCoverageWeeks,
    headlineEs: simHeadlineEs,
    detailEs: simDetailEs,
  };

  // 8. True Simultaneous Dual-Currency Breakdown (Q + $)
  const avgNativePeriodGTQ =
    validPeriods.reduce((s, p) => s + (Number(p.gtq) || 0), 0) /
    validPeriods.length;
  const avgNativePeriodUSD =
    validPeriods.reduce((s, p) => s + (Number(p.usd) || 0), 0) /
    validPeriods.length;

  const nativeWeeklyIncomeGTQ =
    periodMode === "week"
      ? avgNativePeriodGTQ
      : avgNativePeriodGTQ / WEEKS_PER_MONTH;
  const nativeWeeklyIncomeUSD =
    periodMode === "week"
      ? avgNativePeriodUSD
      : avgNativePeriodUSD / WEEKS_PER_MONTH;

  const nativeMonthlyIncomeGTQ =
    periodMode === "month"
      ? avgNativePeriodGTQ
      : avgNativePeriodGTQ * WEEKS_PER_MONTH;
  const nativeMonthlyIncomeUSD =
    periodMode === "month"
      ? avgNativePeriodUSD
      : avgNativePeriodUSD * WEEKS_PER_MONTH;

  const rawExpenseGTQ = Math.max(0, Number(input.essentialExpenses.gtq) || 0);
  const rawExpenseUSD = Math.max(0, Number(input.essentialExpenses.usd) || 0);

  const nativeWeeklyExpenseGTQ =
    periodMode === "week" ? rawExpenseGTQ : rawExpenseGTQ / WEEKS_PER_MONTH;
  const nativeWeeklyExpenseUSD =
    periodMode === "week" ? rawExpenseUSD : rawExpenseUSD / WEEKS_PER_MONTH;

  const nativeMonthlyExpenseGTQ =
    periodMode === "month" ? rawExpenseGTQ : rawExpenseGTQ * WEEKS_PER_MONTH;
  const nativeMonthlyExpenseUSD =
    periodMode === "month" ? rawExpenseUSD : rawExpenseUSD * WEEKS_PER_MONTH;

  const weeklyNetNativeGTQ = nativeWeeklyIncomeGTQ - nativeWeeklyExpenseGTQ;
  const weeklyNetNativeUSD = nativeWeeklyIncomeUSD - nativeWeeklyExpenseUSD;

  let direction: "USD_TO_GTQ" | "GTQ_TO_USD" | "BALANCED" = "BALANCED";
  let weeklyUSDToExchangeToGTQ = 0;
  let weeklyGTQReceivedFromExchange = 0;
  let weeklyGTQToExchangeToUSD = 0;
  let weeklyUSDReceivedFromExchange = 0;

  if (weeklyNetNativeGTQ < -1 && weeklyNetNativeUSD > 0) {
    // Needs GTQ to pay local expenses, has USD surplus
    direction = "USD_TO_GTQ";
    const neededGTQ = Math.abs(weeklyNetNativeGTQ);
    weeklyUSDToExchangeToGTQ = Math.min(
      weeklyNetNativeUSD,
      neededGTQ / exchangeRate
    );
    weeklyGTQReceivedFromExchange = weeklyUSDToExchangeToGTQ * exchangeRate;
  } else if (weeklyNetNativeUSD < -0.5 && weeklyNetNativeGTQ > 0) {
    // Needs USD to pay dollar expenses, has GTQ surplus
    direction = "GTQ_TO_USD";
    const neededUSD = Math.abs(weeklyNetNativeUSD);
    weeklyGTQToExchangeToUSD = Math.min(
      weeklyNetNativeGTQ,
      neededUSD * exchangeRate
    );
    weeklyUSDReceivedFromExchange = weeklyGTQToExchangeToUSD / exchangeRate;
  }

  // How to hold the weekly set-aside (prefer keeping surplus currency without unnecessary FX spread)
  const remainingWeeklyUSD = Math.max(
    0,
    weeklyNetNativeUSD - weeklyUSDToExchangeToGTQ
  );
  const weeklySetAsideInUSD = Math.min(
    remainingWeeklyUSD,
    primarySetAsideDisplayGTQ / exchangeRate
  );
  const weeklySetAsideInGTQ = Math.max(
    0,
    primarySetAsideDisplayGTQ - weeklySetAsideInUSD * exchangeRate
  );

  let actionSummaryEs = "";
  if (direction === "USD_TO_GTQ") {
    actionSummaryEs = `Recibes en promedio ${formatUSD(
      nativeMonthlyIncomeUSD
    )} USD + ${formatGTQ(nativeMonthlyIncomeGTQ)} GTQ al mes y gastas ${formatGTQ(
      nativeMonthlyExpenseGTQ
    )} GTQ + ${formatUSD(
      nativeMonthlyExpenseUSD
    )} USD: cambia ${formatUSD(
      weeklyUSDToExchangeToGTQ
    )} USD a Quetzales cada semana (${formatGTQ(
      weeklyGTQReceivedFromExchange
    )}) para cubrir tus gastos en Q y aparta ${
      weeklySetAsideInUSD >= 5
        ? `${formatUSD(weeklySetAsideInUSD)} USD${
            weeklySetAsideInGTQ >= 20
              ? ` + ${formatGTQ(weeklySetAsideInGTQ)} GTQ`
              : ""
          }`
        : `${formatGTQ(primarySetAsideDisplayGTQ)} GTQ`
    } por semana en tu fondo de temporada baja.`;
  } else if (direction === "GTQ_TO_USD") {
    actionSummaryEs = `Recibes en promedio ${formatGTQ(
      nativeMonthlyIncomeGTQ
    )} GTQ + ${formatUSD(nativeMonthlyIncomeUSD)} USD al mes y tienes gastos en dólares de ${formatUSD(
      nativeMonthlyExpenseUSD
    )} USD/mes: cambia ${formatGTQ(
      weeklyGTQToExchangeToUSD
    )} GTQ (${formatUSD(
      weeklyUSDReceivedFromExchange
    )} USD) por semana para cubrir tus pagos en $ y aparta ${formatGTQ(
      primarySetAsideDisplayGTQ
    )} (${formatUSD(
      primarySetAsideDisplayGTQ / exchangeRate
    )}) cada semana en tu reserva.`;
  } else {
    actionSummaryEs = `Cada moneda cubre sus propios gastos esenciales (${formatGTQ(
      nativeWeeklyExpenseGTQ
    )}/sem en Q y ${formatUSD(
      nativeWeeklyExpenseUSD
    )}/sem en $). Aparta directamente ${
      weeklySetAsideInGTQ > 0 ? formatGTQ(weeklySetAsideInGTQ) : ""
    }${
      weeklySetAsideInGTQ > 0 && weeklySetAsideInUSD > 1 ? " + " : ""
    }${
      weeklySetAsideInUSD > 1 ? `${formatUSD(weeklySetAsideInUSD)} USD` : ""
    } cada semana sin perder en diferencial cambiario.`;
  }

  const dualCurrency: DualCurrencyBreakdown = {
    exchangeRate,
    nativeMonthlyIncomeGTQ: Math.round(nativeMonthlyIncomeGTQ),
    nativeMonthlyIncomeUSD: Math.round(nativeMonthlyIncomeUSD),
    nativeMonthlyExpenseGTQ: Math.round(nativeMonthlyExpenseGTQ),
    nativeMonthlyExpenseUSD: Math.round(nativeMonthlyExpenseUSD),
    nativeWeeklyIncomeGTQ: Math.round(nativeWeeklyIncomeGTQ),
    nativeWeeklyIncomeUSD: Math.round(nativeWeeklyIncomeUSD),
    nativeWeeklyExpenseGTQ: Math.round(nativeWeeklyExpenseGTQ),
    nativeWeeklyExpenseUSD: Math.round(nativeWeeklyExpenseUSD),
    nativeReserveGTQ: Math.round(Number(input.currentReserve.gtq) || 0),
    nativeReserveUSD: Math.round(Number(input.currentReserve.usd) || 0),
    weeklyNetNativeGTQ: Math.round(weeklyNetNativeGTQ),
    weeklyNetNativeUSD: Math.round(weeklyNetNativeUSD),
    direction,
    weeklyUSDToExchangeToGTQ: Math.round(weeklyUSDToExchangeToGTQ),
    weeklyGTQReceivedFromExchange: Math.round(weeklyGTQReceivedFromExchange),
    weeklyGTQToExchangeToUSD: Math.round(weeklyGTQToExchangeToUSD),
    weeklyUSDReceivedFromExchange: Math.round(weeklyUSDReceivedFromExchange),
    weeklySetAsideInGTQ: Math.round(weeklySetAsideInGTQ),
    weeklySetAsideInUSD: Math.round(weeklySetAsideInUSD),
    actionSummaryEs,
  };

  const volatilityLabel: "Estable" | "Moderada" | "Variable" =
    cv < 0.18 ? "Estable" : cv < 0.35 ? "Moderada" : "Variable";

  const seasonLearning: SeasonLearningSummary = {
    goodSeasonAvgGTQ: Math.round(goodSeasonAvgGTQ),
    goodSeasonAvgUSD: Math.round(goodSeasonAvgGTQ / exchangeRate),
    goodSeasonWeeklyAvgGTQ: Math.round(goodSeasonWeeklyAvgGTQ),
    goodSeasonWeeklyAvgUSD: Math.round(goodSeasonWeeklyAvgGTQ / exchangeRate),
    lowSeasonAvgGTQ: Math.round(lowSeasonAvgGTQ),
    lowSeasonAvgUSD: Math.round(lowSeasonAvgGTQ / exchangeRate),
    lowSeasonWeeklyAvgGTQ: Math.round(lowSeasonWeeklyAvgGTQ),
    lowSeasonWeeklyAvgUSD: Math.round(lowSeasonWeeklyAvgGTQ / exchangeRate),
    overallAvgPeriodGTQ: Math.round(meanPeriodGTQ),
    overallAvgPeriodUSD: Math.round(meanPeriodGTQ / exchangeRate),
    overallAvgWeeklyGTQ: Math.round(overallAvgWeeklyGTQ),
    overallAvgWeeklyUSD: Math.round(overallAvgWeeklyGTQ / exchangeRate),
    highPeriodsCount: highPeriods.length,
    normalPeriodsCount: normalPeriods.length,
    lowPeriodsCount: lowPeriods.length,
    totalPeriodsCount: validPeriods.length,
    coefficientOfVariation: cv,
    volatilityLabel,
    targetReserveGTQ,
    targetReserveUSD: Math.round(targetReserveUSD),
    currentReserveGTQ: Math.round(currentReserveGTQ),
    currentReserveUSD: Math.round(currentReserveUSD),
    reserveGapGTQ: Math.round(reserveGapGTQ),
    reserveProgressPct,
    coverageWeeks,
    coverageMonths,
    goodWeekSetAsideRuleGTQ,
    goodWeekSetAsideRuleUSD: Math.round(goodWeekSetAsideRuleGTQ / exchangeRate),
    lowWeekWithdrawRuleGTQ,
    lowWeekWithdrawRuleUSD: Math.round(lowWeekWithdrawRuleGTQ / exchangeRate),
  };

  return {
    periodMode,
    exchangeRate,
    essentialMonthlyGTQ: Math.round(essentialMonthlyGTQ),
    essentialMonthlyUSD: Math.round(essentialMonthlyUSD),
    essentialWeeklyGTQ: Math.round(essentialWeeklyGTQ),
    essentialWeeklyUSD: Math.round(essentialWeeklyUSD),
    currentReserveGTQ: Math.round(currentReserveGTQ),
    currentReserveUSD: Math.round(currentReserveUSD),
    weeklyAllocation,
    seasonLearning,
    dualCurrency,
    simulation,
    evaluatedPeriods,
  };
}
