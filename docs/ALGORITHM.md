# Formulacion Matematica: Motor Bimonetario y Aprendizaje Estacional

Este documento detalla el modelo matematico determinista implementado en [`src/lib/cashflow-engine.ts`](../src/lib/cashflow-engine.ts) para **Estabilizador (`freelance-cashflow-smoother`)**. Su objetivo es aprender los meses o semanas buenas y malas de un trabajador independiente y calcular **cuanto apartar cada semana para no quedarse sin dinero en temporada baja**.

---

## 1. Variables de Entrada y Normalizacion Bimonetaria (`Q` + `$`)

Sea el factor de conversion de semanas promedio por mes calendario:

$$W_{mes} = 4.33 \text{ semanas/mes}$$

Y la tasa de cambio de referencia:

$$TC = 7.75 \text{ GTQ/USD}$$

Todo monto bimonetario $A = (A_{gtq}, A_{usd})$ ingresado simultaneamente en Quetzales y Dolares se consolida en moneda base (`GTQ`) y su equivalente en `USD` mediante:

$$\text{GTQ}(A) = \max(0, A_{gtq}) + \max(0, A_{usd}) \times TC$$

$$\text{USD}(A) = \frac{\text{GTQ}(A)}{TC}$$

Dependiendo del modo seleccionado por el usuario (`periodMode` $\in \{\text{month}, \text{week}\}$), el gasto esencial del periodo $F_{per} = \text{GTQ}(\text{essentialExpenses})$ se normaliza a escala semanal ($F_{sem}$) y mensual ($F_{mes}$):

$$F_{sem} = \begin{cases} F_{per} & \text{si } \text{periodMode} = \text{week} \\ \frac{F_{per}}{4.33} & \text{si } \text{periodMode} = \text{month} \end{cases}$$

$$F_{mes} = F_{sem} \times 4.33$$

---

## 2. Aprendizaje de Temporadas (Meses o Semanas Buenas vs. Malas)

Sea $P = \{p_1, p_2, \dots, p_n\}$ la serie de $n \ge 2$ periodos recientes ingresados por el usuario, donde cada periodo tiene un ingreso total consolidado $Y_i = \text{GTQ}(p_i)$.

1. **Promedio por Periodo ($\mu_P$) y Coeficiente de Variacion ($CV$):**
   $$\mu_P = \frac{1}{n} \sum_{i=1}^{n} Y_i, \quad \sigma_P = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (Y_i - \mu_P)^2}, \quad CV = \frac{\sigma_P}{\mu_P}$$

2. **Clasificacion Automatica de Cada Periodo:**
   $$\text{Temporada}(Y_i) = \begin{cases}
   \text{BAJA} & \text{si } Y_i < 1.04 \cdot F_{per} \\
   \text{ALTA} & \text{si } Y_i \ge \max(1.12 \cdot \mu_P,\; 1.25 \cdot F_{per}) \\
   \text{NORMAL} & \text{en cualquier otro caso}
   \end{cases}$$

3. **Promedios Aprendidos de Temporada Buena y Temporada Baja:**
   - Sea $P_{\text{alta}}$ el subconjunto de periodos clasificados como `ALTA` y $P_{\text{baja}}$ el subconjunto clasificado como `BAJA`.
   - El motor calcula el ingreso semanal promedio en temporada buena ($\bar{I}_{\text{sem, buena}}$) y en temporada baja ($\bar{I}_{\text{sem, baja}}$).

---

## 3. Meta de Reserva ($B_{\text{meta}}$) y Cuanto Apartar Cada Semana

El numero de semanas de cobertura objetivo ($N_{\text{cob}}$) se adapta tanto a la proporcion de periodos bajos como a la volatilidad $CV$:

$$N_{\text{cob}} = \min\left(12,\; \max\left(4,\; \text{round}\left(4 + 8 \cdot \frac{|P_{\text{baja}}|}{n} + 6 \cdot CV\right)\right)\right)$$

$$B_{\text{meta}} = \text{round}(F_{sem} \times N_{\text{cob}}), \quad D = \max(0,\; B_{\text{meta}} - B_{\text{actual}})$$

### Regla Semanal en Periodos Buenos o Normales ($I_{sem} \ge F_{sem}$)
Con excedente semanal $E_{sem} = I_{sem} - F_{sem}$ y cuota ideal de construccion de reserva $C_{\text{ideal}} = D / 8$:

$$\text{Apartado}_{\text{sem}} = \min\left(0.70 \cdot E_{sem},\; \max\left(0.30 \cdot E_{sem},\; C_{\text{ideal}}\right)\right)$$

$$\text{SueldoSeguro}_{\text{sem}} = F_{sem} + (E_{sem} - \text{Apartado}_{\text{sem}})$$

### Regla Semanal en Temporada Baja ($I_{sem} < F_{sem}$)
Cuando el ingreso semanal cae por debajo del gasto esencial semanal:

$$\text{Apartado}_{\text{sem}} = 0$$

$$\text{RetiroReserva}_{\text{sem}} = \min\left(B_{\text{actual}},\; F_{sem} - I_{sem}\right)$$

---

## 4. Simulador Bidireccional (`-50%` Temporada Baja a `+50%` Temporada Alta)

Sea $\delta \in [-0.50, +0.50]$ el porcentaje seleccionado en el simulador:

$$Y_{i, \text{sim}} = Y_i \cdot (1 + \delta)$$

- **Escenario de Temporada Baja ($\delta < 0$):** Evalua el deficit semanal frente a $F_{sem}$ y calcula cuantas semanas resiste la reserva actual sin endeudarse.
- **Escenario Base ($\delta = 0$):** Muestra la trayectoria estabilizada con los ingresos actuales.
- **Escenario de Temporada Alta ($\delta > 0$):** Calcula el ahorro extra semanal (`extraWeeklySavedVsBaseGTQ`) y la nueva cobertura ampliada en semanas.
