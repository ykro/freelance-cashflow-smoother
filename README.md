# 🌊 Freelance Cashflow Smoother (`freelance-cashflow-smoother`)

Dashboard interactivo de estabilización de flujo de caja para trabajadores independientes, comerciantes por comisión y conductores de apps en Guatemala y Latinoamérica. Transforma ingresos semanales volátiles ("la montaña rusa") en una cuota exacta de ahorro estacional y un **sueldo propio estabilizado** en menos de 5 segundos.

> 🚀 **Demo en Vivo (Producción en Vercel):** [**https://freelance-cashflow-smoother.vercel.app**](https://freelance-cashflow-smoother.vercel.app)
>
> 📌 **Especificación del Proyecto:** [`SPEC.md`](./SPEC.md) · 📘 **Guía de Onboarding:** [`docs/ONBOARDING.md`](./docs/ONBOARDING.md) · 🧮 **Motor Matemático:** [`docs/ALGORITHM.md`](./docs/ALGORITHM.md)
>
> 🔗 **Índice General de Prototipos:** [`ykro/hackathon-prototipos-index`](https://github.com/ykro/hackathon-prototipos-index) · 🧪 **Benchmark Gemini 4 Argon & A/B Tests:** [`ykro/gemini-argon-agy-benchmark`](https://github.com/ykro/gemini-argon-agy-benchmark)

---

## 🎯 El Problema vs. La Solución

Los trabajadores independientes y freelancers no fracasan financieramente por ganar poco en el año, sino por la **asimetría estacional**: en los meses de cosecha alta gastan como si el pico fuera permanente, y cuando llega la temporada baja (enero, época de lluvias o pausas de clientes) recurren a endeudamiento caro para cubrir su piso básico de vida.

**Freelance Cashflow Smoother** resuelve esto combinando el algoritmo determinista **Waterfall Buffer** con **IA Híbrida (`gemini-3.8-flash` + `gemma-4-e2b`)** en una interfaz *Light Mode First* bimoneda (`GTQ Q` / `USD $`).

---

## 📥 Tabla Ultra-Clara: INPUTS vs. OUTPUTS y Las 3 Cubetas Semanales

| Bloque | Parámetro / Componente | Descripción y Regla de Negocio |
| :--- | :--- | :--- |
| **📥 INPUT 1: Configuración Base** | `monthlyFloor` ($F_{mes}$) y `currentBuffer` ($B_{actual}$) | **Piso Mensual de Vida** (Vivienda + Comida + Servicios + Transporte) y **Fondo Colchón Actual**. Se configura en 30 segundos con sliders o con los **3 perfiles demo 1-click**. |
| **📥 INPUT 2: Estacionalidad 12M** | `historicalMonths[12]` o Texto en Lenguaje Natural | Serie de 12 meses (Enero–Diciembre) o dictado coloquial procesado por **`gemma-4-e2b`** (*"En noviembre saco Q18,000 pero en enero bajo a Q5,200"*). |
| **📥 INPUT 3: Check-in Semanal** | `weeklyIncome` ($I_t$) | **Único dato recurrente cada viernes:** *"¿Cuánto dinero te entró esta semana?"*. |
| **📊 OUTPUT: Cubeta 1** | 🛡️ **Aparta Hoy (`saveForLowSeason`)** | Cuota exacta en `Q`/`$` y `%` que se transfiere al Fondo de Temporada Baja ($\min(0.75 E_t, \max(0.25 E_t, C_{\text{ideal}}))$). |
| **📊 OUTPUT: Cubeta 2** | 🏠 **Para Tus Gastos Fijos (`fixedCostAllocation`)** | Reserva semanal intocable equivalente a $F_{sem} = F_{mes} / 4.33$ para blindar renta, comida y servicios. |
| **📊 OUTPUT: Cubeta 3** | ✨ **Tu Sueldo Libre Seguro (`safeToSpend`)** | Excedente libre de culpa para gastar esta semana. Si $I_t < F_{sem}$ (*Semana en Déficit*), indica **$0 a apartar** y **cuánto retirar del Fondo Colchón** (`withdrawFromBuffer`). |
| **📊 OUTPUT: Salud y Clima** | **Runway + Gráfica Montaña Rusa + Mapa 12M** | **Semanas de Oxígeno** ($B_{actual} / F_{sem}$), Coeficiente de Variación ($CV$), comparativa **Ingresos Reales vs. Sueldo Estabilizado**, Simulador de Crisis y Coach IA A/B. |

---

## 🏗️ Diagramas de Arquitectura y Flujo del Sistema

### Diagrama 1: Arquitectura del Sistema (UI Light Mode + Motor Matemático Waterfall + IA Híbrida `gemma-4` / `gemini-3.8-flash`)

```mermaid
flowchart TB
    subgraph UI["🖥️ Frontend Next.js 16 (Light Mode First + GTQ/USD)"]
        P1["Selector 1-Click: 3 Perfiles LATAM (Sofía, Carlos, Jorge)"]
        P2["Check-in Semanal + Sliders de Piso Mensual y Colchón"]
        P3[" Visualización: Las 3 Cubetas + Montaña Rusa Recharts + Mapa 12M"]
        P4["Simulador de Crisis (Stress Test 0% a 80%)"]
    end

    subgraph ENGINE["🧮 Motor Determinista Waterfall (src/lib/cashflowEngine.ts)"]
        E1["Cálculo de Piso Semanal (F_sem = F_mes / 4.33)"]
        E2["Estadística de Volatilidad (Media, Desv. Estándar y CV)"]
        E3["Clasificador Estacional 12M (ALTA ☀️ / NORMAL ⛅ / BAJA 🌧️)"]
        E4["Reparto Waterfall Buffer (Déficit vs. Superávit Acotado 25%-75%)"]
    end

    subgraph AI["🤖 Capa de IA Híbrida (/api/cashflow-ai)"]
        A1["gemma-4-e2b: Parser Ligero de Lenguaje Natural a JSON + Coach Rápido"]
        A2["gemini-3.8-flash: Coach Estratégico Estacional 3M + Análisis Profundo"]
        A3["Fallback Heurístico Determinista (Resiliencia 100% Offline/Demo)"]
    end

    P1 --> E1
    P2 --> E1
    E1 --> E2 --> E3 --> E4
    E4 --> P3
    P4 --> E4
    P2 <-->|"Texto Coloquial / Switch A-B"| AI
    A1 --> E1
    A2 --> P3
    A3 --> P3
```

---

### Diagrama 2: Árbol de Decisión del Algoritmo Waterfall Buffer (Semana Buena vs. Semana Normal vs. Semana Mala)

```mermaid
flowchart TD
    START["💵 Ingreso de Esta Semana (I_t) vs. Piso Semanal (F_sem = F_mes / 4.33)"]
    CHECK{"¿Cómo se compara I_t con F_sem?"}

    START --> CHECK

    CHECK -->|"I_t < F_sem (Semana Mala / Déficit)"| BAD["🚨 MODO RESCATE ACTIVADO"]
    BAD --> BAD_1["🛡️ Cubeta 1 (Apartado): Q0 (0%)"]
    BAD_1 --> BAD_2["🏦 Retiro del Fondo Colchón: min(B_actual, F_sem - I_t)"]
    BAD_2 --> BAD_3["🏠 Cubeta 2 (Gastos Fijos): I_t + Retiro del Colchón"]
    BAD_3 --> BAD_4["✨ Cubeta 3 (Sueldo Libre): Q0 (Prioridad Supervivencia Sin Deuda)"]

    CHECK -->|"I_t >= F_sem y Excedente Moderado (Semana Normal)"| NORM["⚖️ MODO ESTABILIZACIÓN"]
    NORM --> NORM_1["🏠 Cubeta 2 (Gastos Fijos): Cubierta al 100% (F_sem)"]
    NORM_1 --> NORM_2["🛡️ Cubeta 1 (Apartado): Cuota Ideal C_ideal = Déficit / W_prox (mín. 25% de E_t)"]
    NORM_2 --> NORM_3["✨ Cubeta 3 (Sueldo Libre): Excedente E_t - Apartado"]

    CHECK -->|"I_t >> F_sem (Semana Buena / Cosecha Alta)"| GOOD["☀️ MODO COSECHA ACELERADA"]
    GOOD --> GOOD_1["🏠 Cubeta 2 (Gastos Fijos): Cubierta al 100% (F_sem)"]
    GOOD_1 --> GOOD_2["🛡️ Cubeta 1 (Apartado): Acotado a máx. 75% de E_t (o 20% si B_actual >= B_meta)"]
    GOOD_2 --> GOOD_3["✨ Cubeta 3 (Sueldo Libre): Disfruta >= 25% del excedente sin fatiga financiera"]
```

---

### Diagrama 3: Flujo de Onboarding en Lenguaje Natural y Prueba A/B de Coaching Estacional

```mermaid
sequenceDiagram
    participant U as "👤 Usuario (Freelancer / Comerciante)"
    participant UI as "🖥️ Dashboard Next.js"
    participant API as "⚡ /api/cashflow-ai"
    participant G4 as "🟢 gemma-4-e2b (Edge / Rápido)"
    participant G38 as "🔵 gemini-3.8-flash (Pro Coaching)"
    participant ENG as "🧮 cashflowEngine.ts"

    U->>UI: Escribe en lenguaje coloquial ("Gasto Q6,500 al mes, en lluvias bajo a Q4,900...")
    UI->>API: POST { action: "parse_natural_language", text, currency }
    API->>G4: Extracción estructurada de piso, colchón y meses bajos
    G4-->>API: JSON { monthlyFloor, currentBuffer, weeklyIncome, lowSeasonMonths }
    API-->>UI: Parámetros normalizados + Telemetría (latencyMs)
    UI->>ENG: computeCashflowSmoothing(inputState)
    ENG-->>UI: Nuevas 3 Cubetas + Runway + Serie Suavizada 12M

    U->>UI: Alterna Switch A/B del Coach IA (Variante A vs. Variante B)
    UI->>API: POST { action: "generate_coach_advice", variant: "A" | "B", metrics }
    alt Variante A seleccionada (gemini-3.8-flash)
        API->>G38: Solicita estrategia estacional de 3 puntos + plan preventivo
        G38-->>API: Consejo táctico detallado + acción concreta de la semana
    else Variante B seleccionada (gemma-4-e2b)
        API->>G4: Solicita micro-consejo directo de baja latencia
        G4-->>API: Resumen ejecutivo ultracorto + métrica de velocidad
    end
    API-->>UI: Renderiza tarjetas de Coach IA + comparativa de latencia A/B
```

---

## 🛠️ Inicio Rápido y Documentación Detallada

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

- 📘 **Cómo configurar el proyecto, usar el modo bimoneda `GTQ`/`USD` y probar los 3 perfiles:** Lee [`docs/ONBOARDING.md`](./docs/ONBOARDING.md).
- 🧮 **Fórmulas exactas de $F_{sem}$, $CV$, $B_{meta}$, $W_{\text{prox}}$ y el Stress Test:** Lee [`docs/ALGORITHM.md`](./docs/ALGORITHM.md).
- 📋 **Alcance original del hackathon y plan de entregables:** Lee [`SPEC.md`](./SPEC.md).
