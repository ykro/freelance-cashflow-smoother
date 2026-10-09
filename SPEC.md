# Especificacion del Proyecto: Estabilizador (`freelance-cashflow-smoother`)

**Propuesta de valor central:** **Presupuesto para ingresos variables**: para trabajadores informales o freelancers, **aprende tus meses o semanas buenas y malas y calcula cuanto apartar cada semana para no quedarte sin dinero en temporada baja**.

---

## 1. Definicion de Pantallas: Captura (`input`) vs. Resultados (`output`)

### Pantalla 1: Configuracion de Ingresos y Gastos (`screen === "input"`)

| Bloque de Entrada | Campos Exactos | Experiencia de Usuario |
| :--- | :--- | :--- |
| **1. Modo de Periodo y Perfiles Rapidos** | `periodMode: "month" \| "week"` | Conmutador entre **Modo Mes** (ultimos 2 a 6 meses) y **Modo Semana** (ultimas 3 a 8 semanas), acompanado de 3 perfiles de ejemplo en 1 clic. |
| **2. Gastos Esenciales y Reserva Actual (`Q` + `$`)** | `essentialExpenses: { gtq, usd }`<br>`currentReserve: { gtq, usd }` | Captura simultanea en Quetzales (`Q`) y Dolares (`$`) para reflejar trabajadores que cobran o pagan en una o ambas monedas (tasa base `Q7.75 = $1.00 USD`). |
| **3. Historial de Meses o Semanas** | `periods: Array<{ id, label, shortLabel, gtq, usd }>` | Lista editable con boton **Agregar mes / semana** y clasificacion automatica en tiempo real (`Temporada Alta`, `Normal`, `Temporada Baja`). |
| **4. Accion Principal** | Boton `Calcular cuanto apartar cada semana` | Transiciona limpiamente a la Pantalla 2 de resultados. |

---

### Pantalla 2: Plan Semanal y Sueldo Estabilizado (`screen === "output"`)

1. **Tarjeta Principal Focal: "Cuanto apartar cada semana"**
   - Muestra el monto semanal recomendado en `Q` y `$` simultaneamente y el porcentaje respecto al ingreso.
   - Desglosa explicitamente dos reglas operativas:
     - **En semana / mes bueno:** Cuanto apartar cada semana para capitalizar la reserva.
     - **En temporada baja:** Apartar `Q0` y cuanto retirar por semana de la reserva para cubrir los gastos esenciales sin adquirir deuda.

2. **Tarjeta Secundaria: "Tu sueldo propio estabilizado"**
   - Muestra el **ingreso seguro por semana** (en `Q` y `$`) y su equivalente en **sueldo mensual estable**, junto con la cobertura actual de la reserva en semanas y meses.

3. **Aprendizaje de Temporadas (Meses o Semanas Buenas vs. Malas)**
   - Compara el promedio ganado en periodos altos frente al promedio en periodos bajos, calcula el Coeficiente de Variacion (`CV`) y muestra la barra de progreso hacia la **Meta de reserva para temporada baja**.

4. **Desglose Bimonetario Simultaneo (`Q` Quetzales + `$` Dolares)**
   - Presenta el flujo semanal nativo en `GTQ`, el flujo semanal nativo en `USD` y una recomendacion practica de conversion cambiaria (`USD -> GTQ`, `GTQ -> USD` o flujo equilibrado sin conversion innecesaria).

5. **Grafica Interactiva y Simulador Bidireccional (`-50%` a `+50%`)**
   - Grafica `Ingreso real vs. sueldo estabilizado` con linea de piso esencial.
   - Control deslizante desde **`-50%` (Simular Temporada Baja)** pasando por **`0%` (Escenario Base)** hasta **`+50%` (Simular Temporada Alta)**, recalculando en vivo el impacto sobre la reserva y la cobertura en semanas.
