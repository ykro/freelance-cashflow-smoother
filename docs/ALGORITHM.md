# 🧮 Formulación Matemática: Motor Waterfall Cashflow Smoothing

Este documento detalla el modelo matemático determinista implementado en [`src/lib/cashflowEngine.ts`](../src/lib/cashflowEngine.ts) para el proyecto **Freelance Cashflow Smoother**. Su objetivo es transformar una serie de ingresos altamente volátiles en un **sueldo semanal estabilizado** mediante un fondo de amortiguación estacional (*Waterfall Buffer*).

---

## 1. Variables de Entrada y Constantes Base

Sea el factor de conversión de semanas promedio por mes calendario:

$$W_{mes} = 4.33 \text{ semanas/mes}$$

El sistema recibe como vector de estado de entrada (`CashflowInputState`):
- $F_{mes}$ (`monthlyFloor`): Piso mensual de gastos fijos indispensables (vivienda, alimentación básica, servicios e insumos de trabajo), expresado en moneda base (`GTQ`, convertible dinámicamente a `USD` a razón de $1\text{ USD} = 7.75\text{ GTQ}$).
- $B_{actual}$ (`currentBuffer`): Saldo líquido disponible hoy en el Fondo Colchón.
- $I_t$ (`weeklyIncome`): Ingreso neto recibido por el trabajador en la semana actual $t$.
- $M = \{m_0, m_1, \dots, m_{11}\}$ (`historicalMonths`): Serie de ingresos mensuales históricos o estimados de 12 meses (Enero a Diciembre).
- $\alpha_{stress} \in [0, 0.80]$ (`stressTestDropPct`): Porcentaje de caída simulada de ingresos en el Stress Test.

A partir del piso mensual $F_{mes}$, se define el **Piso Semanal de Supervivencia** ($F_{sem}$):

$$F_{sem} = \frac{F_{mes}}{4.33}$$

---

## 2. Estadística de Volatilidad y Coeficiente de Variación ($CV$)

Para cuantificar la inestabilidad de ingresos del trabajador independiente a lo largo de los 12 meses:

1. **Ingreso Mensual Promedio ($\mu_M$):**
   $$\mu_M = \frac{1}{12} \sum_{i=0}^{11} m_i$$

2. **Desviación Estándar Poblacional ($\sigma_M$):**
   $$\sigma_M = \sqrt{\frac{1}{12} \sum_{i=0}^{11} (m_i - \mu_M)^2}$$

3. **Coeficiente de Variación ($CV$):**
   $$CV = \frac{\sigma_M}{\mu_M}$$

### Clasificación del Índice de Volatilidad Personal
- **Volatilidad BAJA:** $CV < 0.20$ ($< 20\%$)
- **Volatilidad MEDIA:** $0.20 \le CV < 0.35$ ($20\% \text{ a } 35\%$)
- **Volatilidad ALTA:** $CV \ge 0.35$ ($\ge 35\%$)

---

## 3. Clasificación Estacional de 12 Meses y Meta del Fondo ($B_{meta}$)

Cada mes $m_i \in M$ se clasifica mediante la función `classifyMonthSeason(m_i, F_mes, \mu_M)` en una de tres categorías climáticas:

$$\text{Clima}(m_i) = \begin{cases} 
\text{BAJA (🌧️ Temporada de Vacas Flacas)} & \text{si } m_i < 1.03 \cdot F_{mes} \\
\text{ALTA (☀️ Temporada de Cosecha)} & \text{si } m_i \ge \max(1.12 \cdot \mu_M,\; 1.30 \cdot F_{mes}) \\
\text{NORMAL (⛅ Mes Estable)} & \text{en cualquier otro caso}
\end{cases}$$

### Inferencia de Semanas Bajas ($N_{\text{semanas\_bajas}}$) y Meta del Fondo ($B_{meta}$)
Sea $K_{\text{baja}}$ el número de meses del año clasificados como `BAJA`. El número de semanas de déficit que el fondo debe blindar se calcula como:

$$N_{\text{semanas\_bajas}} = \max\left(4,\; \text{round}(2.25 \cdot K_{\text{baja}})\right)$$

De modo que incluso si un freelancer tiene solo 1 mes malo al año, el sistema exige un blindaje mínimo de **4 semanas completas** de gastos fijos.

La **Meta del Fondo Colchón** ($B_{meta}$ / `targetBuffer`) y su **Déficit del Fondo** ($D$ / `bufferDeficit`) son:

$$B_{meta} = \text{round}\left(F_{sem} \times N_{\text{semanas\_bajas}}\right)$$

$$D = \max\left(0,\; B_{meta} - B_{actual}\right)$$

### Distancia hasta la Próxima Temporada Baja ($W_{\text{prox}}$)
Partiendo del mes calendario actual $c \in \{0,\dots,11\}$, el motor busca el menor desplazamiento $\Delta m \in \{1,\dots,12\}$ tal que $\text{Clima}(m_{(c + \Delta m) \bmod 12}) = \text{BAJA}$. El número de semanas restantes para capitalizar el fondo antes de dicha temporada es:

$$W_{\text{prox}} = \max\left(1,\; \text{round}(\Delta m \times 4.33)\right)$$

La **Cuota Semanal Ideal de Ahorro** ($C_{\text{ideal}}$) para alcanzar el 100% de $B_{meta}$ justo antes del próximo mes bajo es:

$$C_{\text{ideal}} = \frac{D}{W_{\text{prox}}}$$

---

## 4. Reglas de Decisión del Algoritmo Waterfall Buffer (Las 3 Cubetas)

Cada vez que el usuario registra su ingreso semanal $I_t$, el algoritmo evalúa si la semana está en **Déficit** o en **Superávit** respecto a $F_{sem}$:

### Caso 1: Semana en Déficit ($I_t < F_{sem}$) — *Modo Protección / Rescate*
Cuando el ingreso semanal no alcanza siquiera para cubrir el piso semanal de gastos fijos:
1. **Cubeta 1 — Apartado para Temporada Baja (`saveForLowSeason`):**
   $$\text{Apartado}_t = 0$$
2. **Retiro Automático del Fondo Colchón (`withdrawFromBuffer`):**
   $$\text{Retiro}_t = \min\left(B_{actual},\; F_{sem} - I_t\right)$$
3. **Cubeta 2 — Asignación para Gastos Fijos (`fixedCostAllocation`):**
   $$\text{Fijos}_t = I_t + \text{Retiro}_t$$
4. **Déficit No Cubierto (`uncoveredDeficit`, si $B_{actual}$ se agota):**
   $$\text{DéficitSinCubrir}_t = \max\left(0,\; (F_{sem} - I_t) - \text{Retiro}_t\right)$$
5. **Cubeta 3 — Sueldo Libre Seguro (`safeToSpend`):**
   $$\text{Libre}_t = 0$$

---

### Caso 2: Semana con Superávit ($I_t \ge F_{sem}$) — *Modo Cosecha y Estabilización*
Cuando el ingreso semanal cubre el piso fijo y genera un **Excedente Semanal** $E_t = I_t - F_{sem}$:
1. **Cubeta 2 — Asignación para Gastos Fijos (`fixedCostAllocation`):**
   $$\text{Fijos}_t = F_{sem}$$
2. **Cubeta 1 — Apartado para Temporada Baja (`saveForLowSeason`):**
   - Si el Fondo Colchón aún tiene déficit ($D > 0$), se aplica la **regla de acotación Waterfall** entre el $25\%$ y el $75\%$ del excedente:
     $$\text{Apartado}_t = \min\left(0.75 \cdot E_t,\; \max\left(0.25 \cdot E_t,\; C_{\text{ideal}}\right)\right)$$
     *Interpretación financiera:* Nunca se le confisca al trabajador más del $75\%$ de su excedente semanal (evitando fatiga presupuestaria), pero siempre se aparta al menos el $25\%$ del excedente o la cuota ideal $C_{\text{ideal}}$ necesaria para llegar a la meta antes del próximo mes malo.
   - Si el Fondo Colchón ya alcanzó su meta ($D = 0$), se retiene una cuota de mantenimiento/crecimiento patrimonial del $20\%$ sobre el excedente:
     $$\text{Apartado}_t = 0.20 \cdot E_t$$
3. **Cubeta 3 — Sueldo Libre Seguro (`safeToSpend`):**
   $$\text{Libre}_t = E_t - \text{Apartado}_t$$

---

## 5. Semanas de Oxígeno (Runway) y Simulador de Crisis (Stress Test)

### Semanas de Oxígeno Actuales (`runwayWeeks`)
Mide cuántas semanas completas de gastos básicos ($F_{sem}$) puede sostener el Fondo Colchón actual si los ingresos cayeran abruptamente a cero:

$$\text{Runway}_{\text{base}} = \frac{B_{actual}}{F_{sem}}$$

### Simulador de Crisis (`stressTestSummary`)
Cuando el usuario simula una caída porcentual $\alpha_{stress}$ (ej. $-40\%$ en sus ingresos semanales):
1. **Ingreso Semanal Estresado ($I_{\text{stress}}$):**
   $$I_{\text{stress}} = I_t \cdot (1 - \alpha_{stress})$$
2. **Quemado Semanal del Colchón (`weeklyBurnFromBuffer`):**
   $$\text{Burn}_{\text{sem}} = \max\left(0,\; F_{sem} - I_{\text{stress}}\right)$$
3. **Autonomía del Colchón bajo Crisis (`weeksBufferLastsUnderStress`):**
   $$\text{Runway}_{\text{stress}} = \begin{cases} 
   \frac{B_{actual}}{\text{Burn}_{\text{sem}}} & \text{si } \text{Burn}_{\text{sem}} > 0 \\
   52 \text{ semanas (Indefinido)} & \text{si } I_{\text{stress}} \ge F_{sem}
   \end{cases}$$

Si $\text{Runway}_{\text{stress}} \ge 8\text{ semanas}$, el trabajador aprueba el estándar de resiliencia trimestral (`canSurvive8Weeks = true`).
