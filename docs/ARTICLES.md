# Temas para Artículos Técnicos y de Producto: Estabilizador (`freelance-cashflow-smoother`)

Selección de 6 temas (3 de producto/finanzas personales y 3 de ingeniería de software) derivados del desarrollo de **Estabilizador**.

---

## Producto y Finanzas Personales

### 1. Algoritmos de suavizado estacional de ingresos para trabajadores independientes y economía informal
Cómo modelar la asimetría entre semanas o meses de cosecha alta y temporada baja para calcular automáticamente cuánto apartar en los períodos buenos y cuál es el sueldo seguro disponible sin caer en endeudamiento.

### 2. Presupuestos bimonetarios nativos (`GTQ Q` y `USD $`) en mercados latinoamericanos
Por qué las herramientas de presupuesto de una sola moneda fallan cuando conviven ingresos en dólares (contratos remotos, exportaciones o remesas) con gastos esenciales en moneda local, y cómo diseñar un motor financiero que opere ambas monedas en paralelo.

### 3. Diseño de interfaces financieras de baja fricción — De hojas de cálculo complejas a un flujo de 3 pantallas con simulación en vivo
Cómo separar la captura de ingresos y gastos de la vista de decisión (`Tu Plan`), integrando en una sola pantalla las métricas esenciales y la gráfica interactiva de ingreso real frente a sueldo estabilizado con simulación de caídas y subidas (`-50%` a `+50%`).

---

## Ingeniería de Software

### 4. Formulación matemática del motor `calculateSmoothing` y cálculo dinámico de retención (`computeDynamicTargetPct`) en TypeScript
Implementación de detección automática de regímenes estacionales (`>= 1.15x` temporada alta, `<= 0.85x` temporada baja), coeficiente de variación de ingresos y acotamiento de la cuota de ahorro semanal entre `5%` y `45%`.

### 5. Normalización temporal reversible (`Por Mes` <-> `Por Semana` con factor `4.333`) y aritmética bimonetaria sin deriva por redondeo
Cómo transformar series históricas de ingresos al cambiar la unidad de tiempo en vivo preservando la exactitud de los flujos independientes en Quetzales y Dólares.

### 6. Optimización de simulaciones financieras interactivas en React con `useMemo` y Recharts
Cómo recalcular instantáneamente en el cliente la curva estabilizada, el superávit de cosecha alta, el retiro de reserva en temporada baja y las semanas de liquidez (*runway*) ante cambios del deslizador de estrés (`-50%` a `+50%`).
