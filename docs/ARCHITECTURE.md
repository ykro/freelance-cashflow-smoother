# Arquitectura del Sistema: Estabilizador (`freelance-cashflow-smoother`)

Este documento describe la arquitectura funcional, el flujo entre pantallas y el motor matematico bimonetario de **Estabilizador (`freelance-cashflow-smoother`)**.

---

## 1. Flujo de Dos Pantallas y Componentes Principales

El sistema separa la configuracion de datos (`screen === "input"`) del panel de decision semanal (`screen === "output"`) para ofrecer una experiencia enfocada y libre de ruido visual.

![Flujo de dos pantallas de Estabilizador](./diagrams/cashflow-pipeline.svg)

### Componentes de Codigo
- [`src/types/cashflow.ts`](../src/types/cashflow.ts): Contratos de tipos para montos bimonetarios (`DualCurrencyAmount`), periodos (`IncomePeriodInput`, `EvaluatedPeriodPoint`), aprendizaje estacional (`SeasonLearningSummary`) y simulacion bidireccional (`SimulationSummary`).
- [`src/lib/cashflow-engine.ts`](../src/lib/cashflow-engine.ts): Motor determinista `computeDualCurrencyCashflow` que consolida flujos en `GTQ` y `USD`, clasifica temporadas (`ALTA`, `NORMAL`, `BAJA`), calcula cuanto apartar cada semana y ejecuta la simulacion de `-50%` a `+50%`.
- [`src/components/CashflowDashboard.tsx`](../src/components/CashflowDashboard.tsx): Interfaz de dos pantallas con conmutador `Modo Mes` / `Modo Semana`, captura simultanea en `Q` y `$`, tarjetas de resultados y controles de simulacion.
- [`src/components/CashflowChart.tsx`](../src/components/CashflowChart.tsx): Visualizacion interactiva en Recharts que compara el ingreso real, el sueldo estabilizado, el piso de gastos esenciales y la curva simulada.

---

## 2. Motor Bimonetario y Regla Waterfall Estacional

El algoritmo consolida los ingresos y gastos nativos en Quetzales (`Q`) y Dolares (`$`), aprende la diferencia entre los periodos buenos y los periodos bajos del trabajador y aplica la regla de estabilizacion semanal.

![Algoritmo bimonetario y estabilizacion estacional](./diagrams/dual-currency-smoothing.svg)

### Reglas Clave del Motor
1. **Normalizacion Bimonetaria (`Q` + `$`):** Cada periodo y cada gasto esencial conserva sus montos nativos en `GTQ` y `USD` y calcula su equivalente consolidado usando la tasa de referencia `Q7.75 = $1.00 USD`.
2. **Deteccion Automatica de Temporadas:**
   - **Temporada Baja (`BAJA`):** Periodos cuyo ingreso total es inferior a `1.04` veces el piso de gastos esenciales del periodo.
   - **Temporada Alta (`ALTA`):** Periodos cuyo ingreso supera el maximo entre `1.12` veces el promedio y `1.25` veces el piso esencial.
   - **Periodo Normal (`NORMAL`):** Periodos intermedios que cubren los gastos esenciales y aportan de forma regular al fondo.
3. **Regla Semanal de Ahorro vs. Retiro:**
   - En semanas o meses normales y buenos, se aparta entre el `30%` y el `68%` del excedente semanal hacia la reserva de temporada baja.
   - En semanas o meses de temporada baja (deficit frente al piso semanal), se aparta `Q0` y se retira de la reserva exactamente el monto necesario para completar los gastos esenciales sin endeudarse.
