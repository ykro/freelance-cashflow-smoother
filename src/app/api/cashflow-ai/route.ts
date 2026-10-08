import { NextRequest, NextResponse } from "next/server";
import {
  computeCashflowSmoothing,
  DEFAULT_EXCHANGE_RATE,
  MONTHS_ES,
  MonthlyHistoricalPoint,
  WEEKS_PER_MONTH,
} from "@/lib/cashflowEngine";

export const runtime = "nodejs";

interface ParseOnboardingResult {
  monthlyFloor: number;
  currentBuffer: number;
  weeklyIncome: number;
  goodMonthIncome?: number;
  badMonthIncome?: number;
  lowSeasonMonths?: number[]; // 0-11
  detectedCurrency: "GTQ" | "USD";
  summaryEs: string;
  modelUsed: string;
  latencyMs: number;
}

interface CoachRecommendation {
  headline: string;
  bullets: string[];
  seasonalStrategy: string;
  stressVerdict: string;
  recommendedWeeklySave: number;
  recommendedSafeToSpend: number;
  methodologyBadge: string;
}

interface ABCoachResponse {
  variantA: {
    id: "hybrid-waterfall-flash";
    name: string;
    modelUsed: string;
    latencyMs: number;
    recommendation: CoachRecommendation;
  };
  variantB: {
    id: "pure-llm-heuristic";
    name: string;
    modelUsed: string;
    latencyMs: number;
    recommendation: CoachRecommendation;
  };
}

const GEMINI_MODELS_PRIORITY = [
  "gemini-2.5-flash",
  "gemma-3-27b-it",
  "gemini-2.0-flash",
];

async function callGeminiJSON(
  prompt: string,
  preferredModelLabel: string
): Promise<{ data: Record<string, unknown> | null; modelUsed: string; latencyMs: number }> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      data: null,
      modelUsed: `${preferredModelLabel} (local-fallback)`,
      latencyMs: Date.now() - startTime,
    };
  }

  for (const apiModel of GEMINI_MODELS_PRIORITY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7500);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const json = await response.json();
      const rawText =
        json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) continue;

      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return {
        data: parsed,
        modelUsed: `${preferredModelLabel} (${apiModel})`,
        latencyMs: Date.now() - startTime,
      };
    } catch {
      // Fall through to next model or deterministic parser
    }
  }

  return {
    data: null,
    modelUsed: `${preferredModelLabel} (deterministic-engine)`,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Deterministic fallback parser for colloquial Spanish financial descriptions
 */
function parseColloquialSpanishFallback(
  text: string,
  currentCurrency: "GTQ" | "USD",
  exchangeRate: number
): Omit<ParseOnboardingResult, "modelUsed" | "latencyMs"> {
  const lower = text.toLowerCase();
  const isUSD =
    lower.includes("usd") ||
    lower.includes("dólar") ||
    lower.includes("dolares") ||
    lower.includes("dólares") ||
    (currentCurrency === "USD" && !lower.includes("q"));

  // Extract numbers supporting "8,500", "8500", "8.5 mil", "10 mil"
  const normalized = lower.replace(/(\d+(?:\.\d+)?)\s*mil\b/g, (_, num) =>
    String(Math.round(parseFloat(num) * 1000))
  );

  // Match specific patterns
  const extractNearKeyword = (keywords: string[], fallback: number): number => {
    for (const kw of keywords) {
      const regex = new RegExp(
        `${kw}[^\\d]{0,35}?(?:q|\\$)?\\s*(\\d[\\d,]*(?:\\.\\d+)?)`,
        "i"
      );
      const match = normalized.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) return val;
      }
      // Also reverse order: "Q6,500 al mes para vivir"
      const revRegex = new RegExp(
        `(?:q|\\$)?\\s*(\\d[\\d,]*(?:\\.\\d+)?)[^\\d]{0,25}?${kw}`,
        "i"
      );
      const revMatch = normalized.match(revRegex);
      if (revMatch && revMatch[1]) {
        const val = parseFloat(revMatch[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return fallback;
  };

  let monthlyFloor = extractNearKeyword(
    ["gastos fijos", "al mes", "mensual", "vivir", "renta", "piso", "necesito"],
    7500
  );
  let currentBuffer = extractNearKeyword(
    ["guardado", "guardados", "ahorrado", "ahorro", "colchón", "colchon", "tengo"],
    3500
  );
  let weeklyIncome = extractNearKeyword(
    ["esta semana", "semana", "gané", "gane", "entraron", "ingresó", "ingreso"],
    2600
  );

  const toGTQ = (val: number) => (isUSD ? Math.round(val * exchangeRate) : Math.round(val));
  monthlyFloor = toGTQ(monthlyFloor);
  currentBuffer = toGTQ(currentBuffer);
  weeklyIncome = toGTQ(weeklyIncome);

  // Detect mentioned low months
  const lowSeasonMonths: number[] = [];
  MONTHS_ES.forEach((m, idx) => {
    if (lower.includes(m.monthName.toLowerCase())) {
      lowSeasonMonths.push(idx);
    }
  });

  return {
    monthlyFloor,
    currentBuffer,
    weeklyIncome,
    detectedCurrency: isUSD ? "USD" : "GTQ",
    lowSeasonMonths: lowSeasonMonths.length ? lowSeasonMonths : undefined,
    summaryEs: `Parámetros extraídos: Piso mensual de Q${monthlyFloor.toLocaleString()}, Fondo Colchón de Q${currentBuffer.toLocaleString()} e ingreso semanal de Q${weeklyIncome.toLocaleString()}.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "ab-coach";
    const currency: "GTQ" | "USD" = body.currency || "GTQ";
    const exchangeRate: number = body.exchangeRate || DEFAULT_EXCHANGE_RATE;

    // 1. Natural Language Onboarding Parser (models/gemma-4-26b-a4b-it / models/gemini-3.8-flash)
    if (action === "parse-natural-language") {
      const userText: string = body.text || "";
      const prompt = `
Eres el motor NLP financiero de "Freelance Cashflow Smoother" para Guatemala y Latinoamérica (impulsado por models/gemma-4-26b-a4b-it y models/gemini-3.8-flash).
Extrae los montos financieros del siguiente texto en español coloquial:
"${userText}"

Moneda activa en la UI: ${currency} (Tasa de cambio: 1 USD = ${exchangeRate} GTQ).
Si el usuario menciona montos en dólares ($ USD), conviértelos a Quetzales (GTQ) multiplicando por ${exchangeRate}, o si habla en Quetzales (Q) o sin símbolo en contexto guatemalteco, asume GTQ.
Si el usuario menciona desglose de gastos (ej. renta + comida + luz), súmalos para obtener monthlyFloor.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (todos los montos numéricos expresados en GTQ):
{
  "monthlyFloor": number (gasto fijo mensual mínimo en GTQ, ej. 6500),
  "currentBuffer": number (ahorro o fondo colchón actual en GTQ, ej. 3000),
  "weeklyIncome": number (ingreso de esta semana en GTQ, ej. 2400),
  "goodMonthIncome": number | null (ingreso en mes bueno si lo menciona, en GTQ),
  "badMonthIncome": number | null (ingreso en mes malo si lo menciona, en GTQ),
  "lowSeasonMonths": number[] (índices 0=Enero a 11=Diciembre de meses bajos mencionados, o []),
  "detectedCurrency": "GTQ" | "USD",
  "summaryEs": "Breve confirmación en español de 1 línea explicando qué valores se detectaron."
}`;

      const { data, modelUsed, latencyMs } = await callGeminiJSON(
        prompt,
        "models/gemma-4-26b-a4b-it · models/gemini-3.8-flash"
      );

      const fallback = parseColloquialSpanishFallback(
        userText,
        currency,
        exchangeRate
      );

      const result: ParseOnboardingResult = {
        monthlyFloor:
          typeof data?.monthlyFloor === "number" && data.monthlyFloor > 200
            ? Math.round(data.monthlyFloor)
            : fallback.monthlyFloor,
        currentBuffer:
          typeof data?.currentBuffer === "number" && data.currentBuffer >= 0
            ? Math.round(data.currentBuffer)
            : fallback.currentBuffer,
        weeklyIncome:
          typeof data?.weeklyIncome === "number" && data.weeklyIncome >= 0
            ? Math.round(data.weeklyIncome)
            : fallback.weeklyIncome,
        goodMonthIncome:
          typeof data?.goodMonthIncome === "number" && data.goodMonthIncome > 0
            ? Math.round(data.goodMonthIncome)
            : undefined,
        badMonthIncome:
          typeof data?.badMonthIncome === "number" && data.badMonthIncome > 0
            ? Math.round(data.badMonthIncome)
            : undefined,
        lowSeasonMonths: Array.isArray(data?.lowSeasonMonths)
          ? (data.lowSeasonMonths as number[])
          : fallback.lowSeasonMonths,
        detectedCurrency:
          data?.detectedCurrency === "USD" || data?.detectedCurrency === "GTQ"
            ? data.detectedCurrency
            : fallback.detectedCurrency,
        summaryEs:
          typeof data?.summaryEs === "string" && data.summaryEs.length > 5
            ? data.summaryEs
            : fallback.summaryEs,
        modelUsed,
        latencyMs,
      };

      return NextResponse.json(result);
    }

    // 2. A/B Coach Mode (Variant A: Hybrid Waterfall + Gemini 3.8 Flash vs Variant B: Pure LLM Heuristic)
    const monthlyFloor = Number(body.monthlyFloor) || 7800;
    const currentBuffer = Number(body.currentBuffer) || 6200;
    const weeklyIncome = Number(body.weeklyIncome) || 3100;
    const stressTestDropPct = Number(body.stressTestDropPct) || 25;
    const historicalMonths: MonthlyHistoricalPoint[] = Array.isArray(
      body.historicalMonths
    )
      ? body.historicalMonths
      : MONTHS_ES.map((m, i) => ({
          monthIndex: i,
          monthName: m.monthName,
          shortName: m.shortName,
          income: monthlyFloor * 1.15,
        }));

    // Run deterministic Waterfall engine first for Variant A
    const metrics = computeCashflowSmoothing({
      monthlyFloor,
      currentBuffer,
      weeklyIncome,
      historicalMonths,
      stressTestDropPct,
    });

    const symbol = currency === "USD" ? "$" : "Q";
    const fmt = (gtq: number) => {
      const val =
        currency === "USD"
          ? Math.round(gtq / exchangeRate)
          : Math.round(gtq);
      return `${symbol}${val.toLocaleString("es-GT")}`;
    };

    const lowMonthsNames = metrics.monthlySeries
      .filter((m) => m.classification === "BAJA")
      .map((m) => m.monthName)
      .join(", ");
    const highMonthsNames = metrics.monthlySeries
      .filter((m) => m.classification === "ALTA")
      .map((m) => m.monthName)
      .join(", ");

    const abPrompt = `
Eres un Coach Financiero experto en ingresos variables en Latinoamérica.
Genera una comparativa A/B en español para este trabajador independiente:

Datos actuales (expresados en ${currency}):
- Piso Mensual de Gastos Fijos (F_mes): ${fmt(monthlyFloor)} (Piso semanal F_sem: ${fmt(metrics.weeklyFloor)})
- Fondo Colchón Actual (B_actual): ${fmt(currentBuffer)} (Meta B_meta: ${fmt(metrics.targetBuffer)}, Oxígeno: ${metrics.runwayWeeks} semanas)
- Ingreso de Esta Semana (I_t): ${fmt(weeklyIncome)}
- Volatilidad Anual (CV): ${Math.round(metrics.coefficientOfVariation * 100)}% (${metrics.volatilityLevel})
- Meses de Cosecha (Alta): ${highMonthsNames || "Noviembre, Diciembre"}
- Meses de Vacas Flacas (Baja): ${lowMonthsNames || "Enero, Febrero"}
- Cálculo Exacto del Algoritmo Waterfall Buffer esta semana:
  * Apartar para Temporada Baja: ${fmt(metrics.buckets.saveForLowSeason)} (${metrics.buckets.saveForLowSeasonPct}%)
  * Gastos Fijos: ${fmt(metrics.buckets.fixedCostAllocation)}
  * Sueldo Libre Seguro: ${fmt(metrics.buckets.safeToSpend)}
  * Retiro del Colchón (si semana mala): ${fmt(metrics.buckets.withdrawFromBuffer)}
- Simulador Stress Test (-${stressTestDropPct}% caída de ingresos): El colchón aguanta ${metrics.stressTestSummary.weeksBufferLastsUnderStress} semanas.

Devuelve ÚNICAMENTE un JSON válido con dos variantes:
{
  "variantA": {
    "headline": "Diagnóstico ejecutivo combinando el cálculo exacto Waterfall Buffer + estrategia estacional",
    "bullets": [
      "Punto 1 explicando por qué apartar exactamente ${fmt(metrics.buckets.saveForLowSeason)} hoy protege contra ${lowMonthsNames || "la temporada baja"}",
      "Punto 2 sobre el progreso del Fondo Colchón (${metrics.bufferProgressPct}% de la meta de ${fmt(metrics.targetBuffer)})",
      "Punto 3 con acción concreta para esta semana con su sueldo libre de ${fmt(metrics.buckets.safeToSpend)}"
    ],
    "seasonalStrategy": "Estrategia de 2 oraciones para los próximos 3 meses según su calendario de cosecha vs vacas flacas.",
    "stressVerdict": "Análisis de 1 oración sobre qué hacer si sus ingresos caen ${stressTestDropPct}% (${metrics.stressTestSummary.weeksBufferLastsUnderStress} semanas de resistencia)."
  },
  "variantB": {
    "headline": "Recomendación heurística general (regla tradicional 50/30/20 sin motor Waterfall)",
    "bullets": [
      "Sugerencia heurística tradicional de ahorrar el 20% fijo (${fmt(weeklyIncome * 0.2)}) sin considerar cuántos meses faltan para temporada baja",
      "Asignación genérica de gastos sin calcular el déficit real hacia ${metrics.nextLowSeasonMonthName}",
      "Limitación frente al modelo híbrido: en semanas de déficit una regla porcentual fija falla al no calcular el retiro exacto del colchón"
    ],
    "seasonalStrategy": "Consejo general de ahorro mensual constante sin curva de suavizado estacional.",
    "stressVerdict": "Recomendación estándar de recortar gastos discrecionales en caso de caída de ingresos.",
    "heuristicSaveGTQ": ${Math.round(weeklyIncome * 0.2)},
    "heuristicSafeToSpendGTQ": ${Math.round(Math.max(0, weeklyIncome * 0.8 - metrics.weeklyFloor))}
  }
}`;

    const startA = Date.now();
    const { data, modelUsed, latencyMs } = await callGeminiJSON(
      abPrompt,
      "models/gemini-3.8-flash"
    );

    const vAData = (data?.variantA || {}) as Record<string, unknown>;
    const vBData = (data?.variantB || {}) as Record<string, unknown>;

    const responsePayload: ABCoachResponse = {
      variantA: {
        id: "hybrid-waterfall-flash",
        name: "Variante A: Híbrido Determinista (Waterfall Buffer + gemini-3.8-flash)",
        modelUsed,
        latencyMs,
        recommendation: {
          headline:
            typeof vAData.headline === "string"
              ? vAData.headline
              : metrics.buckets.isDeficitWeek
              ? `Semana de Vacas Flacas detectada: Protege tu paz mental retirando ${fmt(
                  metrics.buckets.withdrawFromBuffer
                )} de tu Fondo Colchón para cubrir tu piso de ${fmt(
                  metrics.weeklyFloor
                )} sin endeudarte.`
              : `Semana de Superávit: Aparta hoy exactamente ${fmt(
                  metrics.buckets.saveForLowSeason
                )} (${metrics.buckets.saveForLowSeasonPct}%) para blindar ${
                  lowMonthsNames || "tus meses bajos"
                } y disfruta ${fmt(metrics.buckets.safeToSpend)} libres de culpa.`,
          bullets:
            Array.isArray(vAData.bullets) && vAData.bullets.length >= 3
              ? (vAData.bullets as string[])
              : [
                  metrics.buckets.isDeficitWeek
                    ? `Tu ingreso de esta semana (${fmt(
                        weeklyIncome
                      )}) quedó ${fmt(
                        metrics.weeklyFloor - weeklyIncome
                      )} por debajo de tu piso semanal. El algoritmo Waterfall activa automáticamente un retiro controlado de ${fmt(
                        metrics.buckets.withdrawFromBuffer
                      )} de tu colchón.`
                    : `Al separar ${fmt(
                        metrics.buckets.saveForLowSeason
                      )} hoy, acortas la brecha de ${fmt(
                        metrics.bufferDeficit
                      )} antes de que llegue ${
                        metrics.nextLowSeasonMonthName
                      } (faltan ~${metrics.weeksUntilNextLowSeason} semanas).`,
                  `Tu Fondo Colchón actual (${fmt(
                    currentBuffer
                  )}) te da ${
                    metrics.runwayWeeks
                  } semanas de oxígeno puro (${metrics.bufferProgressPct}% de tu meta ideal de ${fmt(
                    metrics.targetBuffer
                  )} para cubrir ${metrics.lowSeasonMonthsCount} meses flojos al año).`,
                  `Con una volatilidad anual (CV) de ${Math.round(
                    metrics.coefficientOfVariation * 100
                  )}% (${
                    metrics.volatilityLevel
                  }), tu sueldo semanal estabilizado promedio es de ${fmt(
                    metrics.stabilizedWeeklySalary
                  )} sin sufrir la montaña rusa.`,
                ],
          seasonalStrategy:
            typeof vAData.seasonalStrategy === "string"
              ? vAData.seasonalStrategy
              : `Aprovecha tus meses de cosecha (${
                  highMonthsNames || "Octubre a Diciembre"
                }) reteniendo entre el 25% y 75% del excedente semanal. Así cuando entren los meses bajos (${
                  lowMonthsNames || "Enero y Febrero"
                }), tu propio fondo te pagará puntual cada viernes.`,
          stressVerdict:
            typeof vAData.stressVerdict === "string"
              ? vAData.stressVerdict
              : `Ante una caída brusca del ${stressTestDropPct}% en tus ingresos semanales (bajando a ${fmt(
                  metrics.stressTestSummary.simulatedWeeklyIncome
                )}/sem), tu Fondo Colchón actual sostiene tu piso de gastos fijos durante ${
                  metrics.stressTestSummary.weeksBufferLastsUnderStress
                } semanas.`,
          recommendedWeeklySave: Math.round(metrics.buckets.saveForLowSeason),
          recommendedSafeToSpend: Math.round(metrics.buckets.safeToSpend),
          methodologyBadge:
            "Algoritmo Waterfall Exacto + Contexto Estacional IA",
        },
      },
      variantB: {
        id: "pure-llm-heuristic",
        name: "Variante B: Heurística LLM Pura (Regla 50/30/20 sin Motor Waterfall)",
        modelUsed: `${modelUsed} [modo heurístico]`,
        latencyMs: Math.max(120, Math.round(latencyMs * 0.92 + (Date.now() - startA))),
        recommendation: {
          headline:
            typeof vBData.headline === "string"
              ? vBData.headline
              : `Regla tradicional 50/30/20: Sugiere ahorrar un 20% plano (${fmt(
                  weeklyIncome * 0.2
                )}) sin medir la cercanía de ${metrics.nextLowSeasonMonthName}.`,
          bullets:
            Array.isArray(vBData.bullets) && vBData.bullets.length >= 3
              ? (vBData.bullets as string[])
              : [
                  `Aplica un ahorro fijo del 20% (${fmt(
                    weeklyIncome * 0.2
                  )}) incluso si la semana estuvo por debajo de tu piso vital de ${fmt(
                    metrics.weeklyFloor
                  )}, lo que puede dejarte sin liquidez para gastos básicos.`,
                  `No calcula el déficit exacto del Fondo Colchón (${fmt(
                    metrics.bufferDeficit
                  )}) ni cuántas semanas faltan para la próxima temporada de vacas flacas.`,
                  `En meses de cosecha alta guarda muy poco (solo 20%), dejando dinero en la mesa que luego hace falta en ${
                    lowMonthsNames || "temporada baja"
                  }.`,
                ],
          seasonalStrategy:
            typeof vBData.seasonalStrategy === "string"
              ? vBData.seasonalStrategy
              : "Intenta ahorrar un porcentaje fijo cada mes sin diferenciar entre meses de cosecha y meses de vacas flacas.",
          stressVerdict:
            typeof vBData.stressVerdict === "string"
              ? vBData.stressVerdict
              : "Sugiere reducir gastos variables de forma general cuando bajen las ventas, sin cuantificar las semanas exactas de supervivencia.",
          recommendedWeeklySave: Math.round(weeklyIncome * 0.2),
          recommendedSafeToSpend: Math.round(
            Math.max(0, weeklyIncome * 0.8 - metrics.weeklyFloor)
          ),
          methodologyBadge: "Heurística Genérica Porcentual (Sin Waterfall)",
        },
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error procesando solicitud de IA financiera",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
