export type CurrencyCode = "GTQ" | "USD";

export type PeriodMode = "month" | "week";

export type SeasonClassification = "ALTA" | "NORMAL" | "BAJA";

export interface DualCurrencyAmount {
  gtq: number; // Native amount in Quetzales (Q)
  usd: number; // Native amount in US Dollars ($)
}

export interface IncomePeriodInput {
  id: string;
  label: string;
  shortLabel: string;
  gtq: number; // Native income in Q for this month or week
  usd: number; // Native income in $ for this month or week
}

export interface EvaluatedPeriodPoint extends IncomePeriodInput {
  index: number;
  totalGTQ: number; // gtq + usd * exchangeRate
  totalUSD: number; // totalGTQ / exchangeRate
  classification: SeasonClassification;
  smoothedGTQ: number; // Stabilized payout for this period in GTQ
  smoothedUSD: number; // Stabilized payout for this period in USD
  essentialFloorGTQ: number; // Period essential expenses in GTQ
  bufferContributionGTQ: number; // Positive = saved to reserve, Negative = withdrawn from reserve
  projectedBufferGTQ: number; // Reserve balance after this period
  simulatedIncomeGTQ: number; // Simulated income with deltaPct (-50% to +50%)
  simulatedSmoothedGTQ: number; // Simulated stabilized income with deltaPct
  simulatedBufferContributionGTQ: number; // Reserve contribution/withdrawal under simulation
}

export interface WeeklyAllocation {
  weeklyIncomeGTQ: number;
  weeklyIncomeUSD: number;
  weeklyEssentialGTQ: number;
  weeklyEssentialUSD: number;
  recommendedSetAsideGTQ: number;
  recommendedSetAsideUSD: number;
  recommendedSetAsidePct: number;
  safeWeeklyIncomeGTQ: number; // Total stabilized weekly income (essential + discretionary safe spend)
  safeWeeklyIncomeUSD: number;
  safeMonthlySalaryGTQ: number; // Total stabilized monthly salary
  safeMonthlySalaryUSD: number;
  freeDiscretionaryWeeklyGTQ: number; // Free to spend after essentials and reserve set-aside
  freeDiscretionaryWeeklyUSD: number;
  withdrawFromReserveWeeklyGTQ: number; // If current period is below essentials
  withdrawFromReserveWeeklyUSD: number;
  isLowPeriod: boolean;
}

export interface SeasonLearningSummary {
  goodSeasonAvgGTQ: number; // Per period (month or week depending on mode)
  goodSeasonAvgUSD: number;
  goodSeasonWeeklyAvgGTQ: number;
  goodSeasonWeeklyAvgUSD: number;
  lowSeasonAvgGTQ: number; // Per period
  lowSeasonAvgUSD: number;
  lowSeasonWeeklyAvgGTQ: number;
  lowSeasonWeeklyAvgUSD: number;
  overallAvgPeriodGTQ: number;
  overallAvgPeriodUSD: number;
  overallAvgWeeklyGTQ: number;
  overallAvgWeeklyUSD: number;
  highPeriodsCount: number;
  normalPeriodsCount: number;
  lowPeriodsCount: number;
  totalPeriodsCount: number;
  coefficientOfVariation: number; // e.g. 0.32 = 32%
  volatilityLabel: "Estable" | "Moderada" | "Variable";
  targetReserveGTQ: number;
  targetReserveUSD: number;
  currentReserveGTQ: number;
  currentReserveUSD: number;
  reserveGapGTQ: number;
  reserveProgressPct: number;
  coverageWeeks: number; // Weeks of essential expenses covered by current reserve
  coverageMonths: number; // Months of essential expenses covered by current reserve
  goodWeekSetAsideRuleGTQ: number; // What to set aside per week during a good period
  goodWeekSetAsideRuleUSD: number;
  lowWeekWithdrawRuleGTQ: number; // What to withdraw per week during a low period
  lowWeekWithdrawRuleUSD: number;
}

export interface DualCurrencyBreakdown {
  exchangeRate: number;
  // Monthly normalized native flows
  nativeMonthlyIncomeGTQ: number;
  nativeMonthlyIncomeUSD: number;
  nativeMonthlyExpenseGTQ: number;
  nativeMonthlyExpenseUSD: number;
  // Weekly normalized native flows
  nativeWeeklyIncomeGTQ: number;
  nativeWeeklyIncomeUSD: number;
  nativeWeeklyExpenseGTQ: number;
  nativeWeeklyExpenseUSD: number;
  // Native Reserve
  nativeReserveGTQ: number;
  nativeReserveUSD: number;
  // Net surplus/deficit per currency per week
  weeklyNetNativeGTQ: number; // nativeWeeklyIncomeGTQ - nativeWeeklyExpenseGTQ
  weeklyNetNativeUSD: number; // nativeWeeklyIncomeUSD - nativeWeeklyExpenseUSD
  // Currency exchange recommendation per week
  direction: "USD_TO_GTQ" | "GTQ_TO_USD" | "BALANCED";
  weeklyUSDToExchangeToGTQ: number; // How many $ to convert to Q each week to cover Q expenses
  weeklyGTQReceivedFromExchange: number;
  weeklyGTQToExchangeToUSD: number; // How many Q to convert to $ each week to cover $ expenses
  weeklyUSDReceivedFromExchange: number;
  // How the weekly set-aside is best held
  weeklySetAsideInGTQ: number;
  weeklySetAsideInUSD: number;
  actionSummaryEs: string;
}

export interface SimulationSummary {
  deltaPct: number; // -50 to +50
  mode: "BAJA" | "ACTUAL" | "ALTA";
  simulatedWeeklyIncomeGTQ: number;
  simulatedWeeklyIncomeUSD: number;
  simulatedWeeklySetAsideGTQ: number;
  simulatedWeeklySetAsideUSD: number;
  extraWeeklySavedVsBaseGTQ: number;
  extraWeeklySavedVsBaseUSD: number;
  weeklyReserveDrawdownGTQ: number;
  weeklyReserveDrawdownUSD: number;
  simulatedCoverageWeeks: number;
  headlineEs: string;
  detailEs: string;
}

export interface CashflowSmoothingInput {
  periodMode: PeriodMode;
  essentialExpenses: DualCurrencyAmount; // Per month if periodMode === "month", per week if periodMode === "week"
  currentReserve: DualCurrencyAmount; // Total current savings in Q and $
  periods: IncomePeriodInput[]; // 2 to 12 months or weeks
  simulationDeltaPct?: number; // -50 to +50 (default 0)
  exchangeRate?: number; // Default 7.75
}

export interface CashflowSmoothingResult {
  periodMode: PeriodMode;
  exchangeRate: number;
  essentialMonthlyGTQ: number;
  essentialMonthlyUSD: number;
  essentialWeeklyGTQ: number;
  essentialWeeklyUSD: number;
  currentReserveGTQ: number;
  currentReserveUSD: number;
  weeklyAllocation: WeeklyAllocation;
  seasonLearning: SeasonLearningSummary;
  dualCurrency: DualCurrencyBreakdown;
  simulation: SimulationSummary;
  evaluatedPeriods: EvaluatedPeriodPoint[];
}

export interface PresetProfile {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  periodMode: PeriodMode;
  essentialExpenses: DualCurrencyAmount;
  currentReserve: DualCurrencyAmount;
  periods: IncomePeriodInput[];
}
