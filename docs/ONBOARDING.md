# 🚀 Guía de Onboarding: Freelance Cashflow Smoother

Bienvenido a la guía oficial de **Freelance Cashflow Smoother** (`freelance-cashflow-smoother`), el dashboard interactivo de estabilización de flujo de caja para trabajadores independientes, comerciantes por comisión y repartidores/conductores de plataforma en Guatemala y Latinoamérica.

- 🌐 **Producción en Vivo (Vercel):** [https://freelance-cashflow-smoother.vercel.app](https://freelance-cashflow-smoother.vercel.app)
- 📋 **Especificación Funcional:** [`SPEC.md`](../SPEC.md)
- 🧮 **Documentación Matemática:** [`docs/ALGORITHM.md`](./ALGORITHM.md)

---

## 1. Configuración de Desarrollo Local (Local Setup)

### Requisitos Previos
- **Node.js** `>= 20.x`
- **npm** `>= 10.x`
- Clave de API de Google Gemini (`GEMINI_API_KEY`) opcional — el motor cuenta con **fallback determinista instantáneo** si no se configura clave de red.

### Instalación Paso a Paso

```bash
# 1. Clonar el repositorio e ingresar al directorio
git clone https://github.com/ykro/freelance-cashflow-smoother.git
cd freelance-cashflow-smoother

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno locales
cp .env.example .env.local
```

### Configuración de `.env.local`
Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Clave de Google AI Studio / Vertex AI para el Coach Estacional y Parser NL
GEMINI_API_KEY="tu_api_key_aqui"

# Modelos configurados en /api/cashflow-ai
NEXT_PUBLIC_DEFAULT_AI_MODEL="gemini-3.8-flash"
NEXT_PUBLIC_LOCAL_PARSER_MODEL="gemma-4-e2b"
```

> **💡 Nota sobre Resiliencia Offline/Demo:** Si ejecutas `npm run dev` sin `GEMINI_API_KEY`, el endpoint `/api/cashflow-ai` activa automáticamente su motor heurístico y parser regex local calibrado para español guatemalteco/latinoamericano (`GTQ` y `USD`), garantizando cero errores durante demostraciones en vivo.

### Comandos de Ejecución y Verificación

```bash
# Levantar servidor de desarrollo en http://localhost:3000
npm run dev

# Compilar versión de producción y validar tipos TypeScript
npm run build

# Ejecutar linter
npm run lint
```

---

## 2. Entendiendo los INPUTS y OUTPUTS del Dashboard

El diseño sigue una filosofía de **fricción cero (consumo en 5 segundos)**:

### 📥 Los 3 Niveles de Input
1. **Configuración Base (1 sola vez):**
   - **Piso Mensual de Gastos Fijos (`monthlyFloor` / $F_{mes}$):** Renta/vivienda, alimentación básica, servicios/internet y transporte/herramientas de trabajo.
   - **Fondo Colchón Actual (`currentBuffer` / $B_{actual}$):** Ahorro líquido disponible hoy para cubrir semanas bajas.
2. **Historial de Estacionalidad (12 Meses):**
   - Serie mensual de Enero a Diciembre que permite al algoritmo detectar cuántos meses caen por debajo del piso de vida y cuándo ocurre la próxima temporada baja.
3. **Check-in Semanal (`weeklyIncome` / $I_t$):**
   - El control deslizante o numérico principal de cada viernes: *"¿Cuánto dinero te entró esta semana?"*.

### 📊 Los Outputs Accionables ("Las 3 Cubetas Semanales")
Al ingresar o ajustar el ingreso de la semana ($I_t$), el motor calcula en tiempo real:
- 🛡️ **Cubeta 1 — Aparta Hoy (`saveForLowSeason`):** Monto exacto en dinero y porcentaje que debes transferir hoy a tu Fondo de Temporada Baja.
- 🏠 **Cubeta 2 — Reserva para Gastos Fijos (`fixedCostAllocation`):** Cuota intocable para cubrir una semana de tu Piso Mensual ($F_{sem} = F_{mes} / 4.33$).
- ✨ **Cubeta 3 — Tu Sueldo Libre Seguro (`safeToSpend`):** Dinero disponible para gastar esta semana sin culpa ni riesgo de descapitalizarte.
  - *Modo Rescate (Semana en Déficit):* Si $I_t < F_{sem}$, la tarjeta cambia automáticamente a estado ámbar indicando **$0 a apartar** y el **monto exacto a retirar de tu Fondo Colchón** (`withdrawFromBuffer`) para completar tus gastos fijos sin endeudarte.

---

## 3. Probando los 3 Perfiles Reales (Guatemala / LATAM) en `GTQ (Q)` y `USD ($)`

En la barra superior del dashboard encontrarás el selector de **Perfiles Demo 1-Click** y el conmutador bimoneda **`GTQ (Q)` ↔ `USD ($)`** (tasa base `Q7.75 = $1.00 USD`):

| ID de Perfil | Nombre y Rol | Ubicación | Caso de Uso a Probar |
| :--- | :--- | :--- | :--- |
| `creative-freelancer` | **Sofía Méndez**<br>*Diseñadora UX & Dev Freelance* | Antigua Guatemala / Remoto LATAM | **Semana con Superávit:** Piso mensual de `Q7,800` (`$1,006 USD`), colchón de `Q6,200` e ingreso semanal de `Q3,100`. Observa cómo el algoritmo retiene una cuota óptima para blindar Enero y Febrero. |
| `commission-merchant` | **Carlos Alvarado**<br>*Comerciante & Ventas por Comisión* | Ciudad de Guatemala / Mixco | **Estacionalidad Comercial:** Picos en Bono 14 (Julio) y Navidad, con caídas fuertes en época de lluvias (Mayo, Septiembre, Octubre). Ideal para probar el **Mapa Estacional de 12 Meses**. |
| `app-driver` | **Jorge Ixchop**<br>*Conductor de App & Repartidor* | Quetzaltenango / Zona Metropolitana | **Semana en Déficit (Modo Rescate):** Configurado intencionalmente con un ingreso semanal bajo (`Q980` vs. piso semanal de `Q1,201`) para demostrar cómo el Fondo Colchón inyecta automáticamente `Q221` para proteger sus gastos fijos. |

---

## 4. Uso del Onboarding en Lenguaje Natural y el Switch A/B del Coach IA

### Dictado / Texto Coloquial (`gemma-4-e2b` / `gemini-3.8-flash`)
En el panel **"Configuración por Voz o Texto Libre"**, puedes escribir frases en lenguaje natural como:
> *"De alquiler y comida gasto como Q6,800 al mes, ahorita tengo Q4,500 guardados, esta semana me entraron Q2,900 y mis meses más flojos son enero, mayo y septiembre"*

Al presionar **Extraer Parámetros con IA**, el endpoint `/api/cashflow-ai` (`action: "parse_natural_language"`) transforma el texto en el JSON estructurado del dashboard y recalcula las 3 cubetas al instante.

### Switch A/B de Modelos en Vivo (`gemini-3.8-flash` vs `gemma-4-e2b`)
En la sección **Coach Financiero Estacional & Prueba A/B**:
1. Selecciona **Variante A (`gemini-3.8-flash`)** para obtener una estrategia estacional profunda de 3 meses con análisis de riesgo y recomendaciones accionables.
2. Selecciona **Variante B (`gemma-4-e2b`)** para comparar velocidad de inferencia, latencia en milisegundos (`latencyMs`) y concisión de respuesta pensada para ejecución local/edge.
3. Usa el **Simulador de Crisis (Stress Test)** deslizando una caída de ingresos del `0%` al `80%` para verificar cuántas semanas resiste tu Fondo Colchón (`stressedRunwayWeeks`).

---

## 5. Despliegue Continuo en Vercel (Auto-Deploy)

El repositorio está vinculado a **Vercel** para despliegue automático en cada push a `main`:
- **URL Productiva:** `https://freelance-cashflow-smoother.vercel.app`
- **Ramas Activas:**
  - `main`: Rama principal de producción.
  - `benchmark/argon-v1`: Rama congelada de referencia para el benchmark comparativo [`ykro/gemini-argon-agy-benchmark`](https://github.com/ykro/gemini-argon-agy-benchmark).
