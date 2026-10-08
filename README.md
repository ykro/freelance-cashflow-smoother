# 🌊 Freelance Cashflow Smoother (`freelance-cashflow-smoother`)

Presupuesto inteligente para ingresos variables: diseñado para trabajadores informales, comisionistas y freelancers. Aprende de sus meses buenos (*vacas gordas*) y malos (*vacas flacas*) y calcula exactamente **cuánto apartar cada semana** para asegurar un "sueldo fijo propio" y no quedarse sin dinero en temporada baja.

> 📌 **Documento de Especificación (Alcance, Algoritmo y Plan de 1 Semana):** [Ver SPEC.md](./SPEC.md)

## 🎯 El Problema
Las apps de presupuesto tradicionales asumen una quincena fija. Los trabajadores independientes o informales viven en una montaña rusa financiera: en un mes bueno gastan con confianza y en un mes malo caen en deudas o no pueden cubrir sus gastos fijos básicos.

## 💡 La Solución (MVP de 1 Semana)
Un motor de **Suavizado de Ingresos (Income Smoothing / Waterfall Buffer)** que convierte ingresos volátiles en una mesada/sueldo semanal predecible:
1. Analiza el historial de ingresos (últimos 6–12 meses o ingreso rápido manual/CSV).
2. Identifica patrones de estacionalidad (**meses buenos vs. meses malos**) y calcula el **Piso de Supervivencia Semanal**.
3. Cada vez que entra dinero esta semana, indica exactamente:
   - **Cuánto puedes gastar libremente esta semana** (*Safe-to-Spend*).
   - **Cuánto debes apartar en tu "Fondo Colchón de Temporada Baja"**.
   - Cuántas semanas de tranquilidad (*Runway*) tienes acumuladas hoy.

## 🛠️ Stack Sugerido para Hackathon
- **Frontend:** Next.js + Tailwind CSS + Recharts (gráficas de montaña rusa vs. línea estabilizada)
- **Motor Matemático + IA:** Python (FastAPI / Pandas) o TypeScript directo + LLM (Gemini Flash) para consejos accionables semanales y simulador de escenarios ("¿Qué pasa si el próximo mes bajan mis ventas 40%?").

## 🚀 Cómo empezar
Revisa el detalle completo del algoritmo de suavizado, arquitectura, pantallas y plan día por día en **[SPEC.md](./SPEC.md)**.
