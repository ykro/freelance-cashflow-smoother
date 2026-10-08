# 🌊 Freelance Cashflow Smoother (`freelance-cashflow-smoother`)

Dashboard interactivo de presupuesto para ingresos variables: diseñado para trabajadores informales, comisionistas y freelancers. Aprende de sus meses buenos y malos y calcula cada semana **cuánto apartar** y **cuánto puede gastar con tranquilidad**.

> 📌 **Documento de Especificación (Inputs, Outputs, Algoritmo y Plan de 1 Semana):** [Ver SPEC.md](./SPEC.md)
> 🔗 **Índice General de Proyectos:** [`ykro/hackathon-prototipos-index`](https://github.com/ykro/hackathon-prototipos-index)
> 🧪 **Benchmark Gemini 4 Argon & A/B Tests:** [`ykro/gemini-argon-agy-benchmark`](https://github.com/ykro/gemini-argon-agy-benchmark)

## 📥 ¿Cuál es el Input? (3 niveles de fricción cero)
Para que el dashboard se consuma en segundos sin formularios tediosos:
1. **Input Inicial (Onboarding en 30 seg):**
   - **Gasto Fijo Mensual Mínimo ("Mi Piso de Vida"):** Renta + comida básica + servicios + transporte (ej. `$12,000/mes`).
   - **Fondo Colchón Actual:** Cuánto tiene guardado hoy (puede ser `$0`).
   - **Historial de Ingresos (3 opciones):**
     - *Opción 1-Click Demo:* Seleccionar un perfil pre-cargado (*Freelancer Creativo*, *Comerciante / Tianguis*, *Conductor de App*).
     - *Opción Rápida (Sliders/Etiquetas):* Indicar cuánto gana en un "Mes Bueno", en un "Mes Normal" y cuáles meses del año suelen ser su "Temporada Baja".
     - *Opción CSV/Texto:* Pegar o subir sus ingresos de los últimos 6–12 meses.
2. **Input Semanal Recurrente (Cada Viernes):**
   - Un único campo grande: ***"¿Cuánto dinero te entró esta semana?"*** (ej. `$4,800`).

## 📊 ¿Cuál es el Output? (Dashboard de Consumo Inmediato)
1. **Semáforo de la Semana (Las 3 Cubetas en Grande):**
   - 🛡️ **APARTA HOY:** Monto exacto en `$` y `%` que debe mover a su Fondo de Temporada Baja.
   - 🏠 **PARA TUS FIJOS:** Cuota reservada para cubrir el Piso de Vida de la semana.
   - ✨ **TU SUELDO LIBRE SEMANAL:** Cuánto puede gastar esta semana sin culpa ni riesgo (o, si fue una semana mala, **cuánto retirar de su Fondo Colchón** para completar su sueldo fijo).
2. **Indicador de "Semanas de Oxígeno" (Runway):** *"Con tu reserva actual, tienes **6.5 semanas** de gastos básicos cubiertos si tus ingresos cayeran a cero"*.
3. **Gráfica "Montaña Rusa vs. Tu Sueldo Estabilizado":** Comparativa visual de sus ingresos reales volátiles contra la línea plana de tranquilidad que logra con el algoritmo.
4. **Calendario de Clima Financiero (12 Meses):** Mapa visual de qué meses vienen fuertes (*época de sembrar/guardar*) y qué meses vienen bajos (*época de usar el colchón*), con consejos generados por **`gemini-3.8-flash`** (y clasificación local rápida con **`gemma-4-e2b`**).

## 🛠️ Stack & Despliegue
- **Frontend:** Next.js + Tailwind CSS + Recharts (Dashboard interactivo Mobile & Desktop)
- **IA:** API de **Gemini (`gemini-3.8-flash`)** para el coach financiero estacional y simulador de crisis + **Gemma 4 E2B** para categorización rápida de entradas de texto libre (ej. *"me pagaron 3200 del proyecto web y 800 de propinas"*).
- **Deploy:** **Vercel** (o Google Cloud Run en `pm-innovationlab`).
