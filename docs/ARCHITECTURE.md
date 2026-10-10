# Arquitectura del Sistema: Estabilizador (`freelance-cashflow-smoother`)

Este documento describe la arquitectura funcional, el flujo en 3 pantallas y el motor matemático bimonetario de **Estabilizador (`freelance-cashflow-smoother`)**.

---

## 1. Flujo en 3 Pantallas y Componentes Principales

El sistema organiza la experiencia en tres vistas (`1. Ingresos`, `2. Gastos` y `3. Tu Plan`) para separar la captura de datos de la vista ejecutiva donde conviven el plan semanal y el gráfico interactivo.

![Flujo de Estabilizador](./diagrams/cashflow-pipeline.svg)

| Página | Componentes | Función |
| :--- | :--- | :--- |
| **1. Ingresos** | Selector `Por Mes` / `Por Semana`, 3 perfiles de ejemplo y lista de períodos (`Q` y `$`) | Registra ingresos históricos y detecta automáticamente si cada período fue `Alta`, `Normal` o `Baja`. |
| **2. Gastos** | Tarjetas de `Gastos esenciales fijos` y `Reserva disponible hoy` (`Q` y `$`) | Define el piso de gastos fijos y el colchón disponible. |
| **3. Tu Plan** | Métricas de ahorro semanal, sueldo seguro, barras de temporadas, gráfica `CashflowChart` y simulador (`-50%` a `+50%`) | Muestra en la misma pantalla cuánto apartar cada semana, el sueldo estable y la gráfica interactiva de ingreso real frente a estabilizado. |

### Componentes de Código
- [`src/types/cashflow.ts`](../src/types/cashflow.ts): Contratos de tipos para montos bimonetarios (`DualCurrencyAmount`), períodos (`IncomePeriodInput`, `EvaluatedPeriodPoint`), aprendizaje estacional (`SeasonLearningSummary`) y simulación bidireccional (`SimulationSummary`).
- [`src/lib/cashflow-engine.ts`](../src/lib/cashflow-engine.ts): Motor determinista `computeDualCurrencyCashflow` / `calculateSmoothing` que consolida flujos en `GTQ` y `USD`, clasifica temporadas (`ALTA`, `NORMAL`, `BAJA`), calcula cuánto apartar cada semana y ejecuta la simulación de `-50%` a `+50%`.
- [`src/components/CashflowDashboard.tsx`](../src/components/CashflowDashboard.tsx): Interfaz en 3 pantallas con conmutador `Por Mes` / `Por Semana`, captura simultánea en `Q` y `$`, y vista unificada `Tu Plan`.
- [`src/components/CashflowChart.tsx`](../src/components/CashflowChart.tsx): Visualización interactiva en Recharts que compara el ingreso real, el sueldo estabilizado y la curva simulada.

---

## 2. Motor Bimonetario y Regla Estacional

![Algoritmo bimonetario y estabilización estacional](./diagrams/dual-currency-smoothing.svg)

### Reglas Clave del Motor
1. **Normalización Bimonetaria (`Q` + `$`):** Cada período y cada gasto esencial conserva sus montos nativos en `GTQ` y `USD` y calcula su equivalente consolidado usando la tasa de referencia `Q7.75 = $1.00 USD`.
2. **Detección Automática de Temporadas:** Clasifica cada período como `Alta` (`>= 1.15x` del promedio), `Baja` (`<= 0.85x` del promedio) o `Normal`.
3. **Regla Semanal de Ahorro vs. Retiro:** Calcula la cuota óptima de retención (`5%` a `45%`) en semanas altas/normales y el retiro necesario de la reserva en temporada baja para sostener el sueldo seguro sin endeudamiento.
