# 📋 Especificación del Proyecto: Freelance Cashflow Smoother

**Objetivo:** Construir en **1 semana (formato Hackathon)** un dashboard sumamente visual y fácil de consumir para trabajadores informales y freelancers que transforme ingresos impredecibles en una cuota semanal clara de ahorro y un "sueldo propio estabilizado".

---

## 1. Definición Exacta de INPUTS y OUTPUTS

### 📥 INPUTS (Qué entra al sistema)

| Tipo de Input | Campos Exactos | Cómo lo ingresa el usuario (UX sin fricción) |
| :--- | :--- | :--- |
| **1. Configuración Base (1 sola vez)** | • `monthly_floor` (Piso de gastos básicos al mes)<br>• `current_buffer` (Ahorro/colchón actual) | 3 sliders rápidos o calculadora visual de 4 rubros (Vivienda, Comida, Servicios, Transporte/Trabajo). |
| **2. Historial de Estacionalidad** | • Serie de los últimos 6 a 12 meses de ingresos `[{ month, income }]` **O**<br>• Rango rápido (`good_month_avg`, `bad_month_avg`, `low_season_months[]`) | • **Botón 1-Click Demo** (3 perfiles reales pre-cargados)<br>• **Subida de CSV / Estado de cuenta**<br>• **Dictado o texto natural** procesado por `gemma-4-e2b` / `gemini-3.8-flash` (*"En diciembre gano como 35 mil, pero en enero y febrero bajo a 10 mil"*). |
| **3. Check-in Semanal (El corazón del uso)** | • `weekly_income` (Ingreso bruto de esta semana) | Un input numérico grande o slider en la parte superior del dashboard: *"¿Cuánto ingresó esta semana?"* |

---

### 📊 OUTPUTS (Qué muestra el Dashboard para consumirse en 5 segundos)

1. **Tarjeta Principal: "Tu Reparto de Esta Semana" (Acción Inmediata)**
   - **🛡️ Monto Exacto a Apartar (`save_for_low_season`):** Ej. **`$1,450 MXN (29%)`** → *"Guárdalo hoy en tu apartado de temporada baja"*.
   - **🏠 Reserva para Gastos Fijos (`fixed_cost_allocation`):** Ej. **`$2,500 MXN (50%)`** → *"Para renta, despensa y servicios de esta semana"*.
   - **✨ Tu Sueldo Libre Seguro (`safe_to_spend`):** Ej. **`$1,050 MXN (21%)`** → *"Gástalo con total tranquilidad"*.
   - *(Si la semana fue mala y ganó menos de `$2,500`, el output cambia automáticamente a color ámbar/azul: **"Esta semana apartas $0. Retira $600 de tu Fondo Colchón para completar tus gastos fijos sin endeudarte"**).*

2. **KPI Cards Superiores (Salud del Colchón)**
   - **Semanas de Oxígeno (Runway):** `Fondo Actual / Piso Semanal` (ej. **5.2 semanas** blindadas).
   - **Estado del Fondo vs. Meta para Próxima Temporada Baja:** Barra de progreso (ej. `$13,000 / $15,000` antes de que llegue Enero).
   - **Índice de Volatilidad Personal:** Bajo / Medio / Alto (basado en su Coeficiente de Variación $CV$).

3. **Gráfica Interactiva Principal: "La Montaña Rusa vs. Tu Sueldo Estabilizado"**
   - Línea punteada naranja: Ingresos reales semana a semana (picos altos y caídas bruscas).
   - Área sólida verde: El ingreso disponible estabilizado gracias al algoritmo *Waterfall Buffer*.

4. **Mapa Estacional de 12 Meses + Coach IA (`gemini-3.8-flash`)**
   - Tira visual de Enero a Diciembre marcando con ☀️ los meses históricamente fuertes (momento de llenar el colchón) y con 🌧️ los meses flojos (momento donde el colchón te paga tu sueldo).
   - Resumen ejecutivo de 3 puntos generado por `gemini-3.8-flash` explicando por qué se sugiere apartar ese monto esta semana.

---

## 2. Algoritmo Matemático ("Waterfall Buffer") + Rol de IA

### Cálculo Determinista
Sea:
- $F_{sem} = \text{Piso Mensual} / 4.33$
- $B_{meta} = F_{sem} \times N_{\text{semanas\_bajas}}$ (donde $N_{\text{semanas\_bajas}}$ se infiere de cuántos meses históricos estuvieron por debajo de $F_{mes}$, mínimo 4 semanas).
- Déficit del fondo: $D = \max(0, B_{meta} - B_{actual})$.
- Semanas restantes hasta el próximo mes malo: $W_{\text{prox}}$.

Cuando entra el ingreso semanal $I_t$:
- **Caso 1: Semana con Déficit ($I_t < F_{sem}$)**
  - $\text{Apartado} = 0$
  - $\text{Retiro del Colchón} = \min(B_{actual}, F_{sem} - I_t)$
  - $\text{Sueldo Disponible} = I_t + \text{Retiro del Colchón}$
- **Caso 2: Semana con Superávit ($I_t \ge F_{sem}$)**
  - Excedente $E_t = I_t - F_{sem}$
  - Cuota ideal para llegar a la meta antes de la temporada baja: $C_{\text{ideal}} = D / \max(1, W_{\text{prox}})$
  - $\text{Apartado} = \min(E_t \times 0.75, \max(E_t \times 0.25, C_{\text{ideal}}))$
  - $\text{Sueldo Libre Seguro} = E_t - \text{Apartado}$

### Rol de `gemini-3.8-flash` y `gemma-4-e2b`
- **`gemini-3.8-flash`:** Analiza la serie histórica del trabajador, detecta patrones estacionales sutiles, redacta la estrategia personalizada para los próximos 3 meses y responde al simulador *"¿Qué pasa si...?"*.
- **`gemma-4-e2b`:** Permite que un trabajador informal escriba o dicte en lenguaje coloquial sus ingresos/gastos (ej. *"de renta son 4 mil, de luz y gas 800, y en meses buenos saco 5 mil a la semana pero en lluvias baja a 2 mil"*) y los convierta instantáneamente en los parámetros estructurados del dashboard.

---

## 3. Plan de Trabajo de 1 Semana (Día a Día)

| Día | Meta Principal | Entregable |
| :--- | :--- | :--- |
| **Día 1** | Motor Matemático *Waterfall Buffer* + Perfiles Demo | Módulo TypeScript probado con tests unitarios + 3 perfiles realistas (Freelancer, Comerciante, Conductor). |
| **Día 2** | Dashboard Principal (3 Cubetas + KPIs de Oxígeno) | Interfaz limpia donde al mover el slider de "Ingreso de esta semana" se recalculan en vivo las 3 cubetas. |
| **Día 3** | Gráfica "Montaña Rusa vs. Sueldo Estabilizado" | Visualización en Recharts + Mapa Estacional de 12 meses (Meses Buenos vs. Meses Malos). |
| **Día 4** | Integración `gemini-3.8-flash` y `gemma-4-e2b` | Onboarding en lenguaje natural (texto a parámetros) + Coach IA explicando la estrategia de temporada baja. |
| **Día 5** | Simulador de Crisis ("Stress Test") | Controles interactivos para simular caída de ingresos y ver cuántas semanas aguanta el fondo colchón. |
| **Día 6** | Pulido Visual y Deploy en Vercel / Cloud Run | Optimización Mobile-First y despliegue público con URL lista. |
| **Día 7** | Pruebas A/B y Documentación en Repo de Argon | Registro de métricas, capturas y comparativas en `gemini-argon-agy-benchmark`. |
