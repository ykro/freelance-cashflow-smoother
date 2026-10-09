# Estabilizador (`freelance-cashflow-smoother`)

**Presupuesto para ingresos variables**: para trabajadores informales o freelancers, **aprende tus meses o semanas buenas y malas y calcula cuanto apartar cada semana para no quedarte sin dinero en temporada baja**.

> **Demo en Vivo (Produccion en Vercel):** [**https://freelance-cashflow-smoother.vercel.app**](https://freelance-cashflow-smoother.vercel.app)
>
> **Especificacion del Proyecto:** [`SPEC.md`](./SPEC.md) · **Arquitectura Visual:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · **Guia de Onboarding:** [`docs/ONBOARDING.md`](./docs/ONBOARDING.md) · **Motor Matematico:** [`docs/ALGORITHM.md`](./docs/ALGORITHM.md)

---

## El Problema vs. La Solucion

Los trabajadores independientes, comerciantes informales y freelancers no fracasan financieramente por ganar poco durante el ano, sino por la **asimetria estacional**: en los meses o semanas de cosecha alta gastan como si el pico fuera permanente, y cuando llega la temporada baja recurren a endeudamiento caro para cubrir sus gastos esenciales.

**Estabilizador (`freelance-cashflow-smoother`)** resuelve esto mediante un flujo claro en **dos pantallas separadas** (`1. Ingresos y gastos` y `2. Plan semanal`) y un motor bimonetario simultaneo en **Quetzales (`Q`) y Dolares (`$`)**:

1. **Captura flexible por Mes o por Semana (`Modo Mes` vs. `Modo Semana`):** Permite ingresar los ultimos 2 a 6 meses o las ultimas 3 a 8 semanas de ingresos combinando Quetzales (`Q`) y Dolares (`$`) al mismo tiempo.
2. **Aprendizaje automatico de temporadas:** Clasifica cada periodo en **Temporada Alta**, **Normal** o **Temporada Baja**, calculando el promedio real de tus periodos buenos frente a tus periodos bajos.
3. **Meta clara de cuanto apartar cada semana:** Calcula el monto exacto semanal en `Q` y `$` que debes guardar durante las semanas buenas o normales, y cuanto retirar de tu reserva durante las semanas bajas para mantener un **sueldo propio estabilizado**.

---

## Flujo de Dos Pantallas: Captura vs. Plan Semanal

![Flujo de dos pantallas de Estabilizador](./docs/diagrams/cashflow-pipeline.svg)

| Pantalla / Modulo | Componentes Clave | Regla de Negocio |
| :--- | :--- | :--- |
| **Pantalla 1: Ingresos y gastos (`input`)** | Selector `Modo Mes` (2-6 meses) o `Modo Semana` (3-8 semanas), 3 casos de ejemplo en 1 clic, `Gastos esenciales` (`Q` + `$`) y `Reserva disponible` (`Q` + `$`) | Permite registrar ingresos y gastos en Quetzales, en Dolares o en ambas monedas simultaneamente, etiquetando al instante cada periodo como `Temporada Alta`, `Normal` o `Temporada Baja`. |
| **Pantalla 2: Cuanto apartar cada semana (`output`)** | Tarjeta focal con cuota semanal a apartar en `Q` y `$`, regla explicita para semana buena vs. temporada baja y sueldo estabilizado semanal/mensual | Indica cuanto transferir cada semana a tu reserva en epoca buena y cuanto retirar de tu fondo en temporada baja sin endeudarte. |
| **Pantalla 2: Aprendizaje y Bimoneda (`Q + $`)** | Promedio en periodos buenos vs. bajos, progreso hacia la meta de reserva y desglose bimonetario nativo (`GTQ` + `USD`) | Calcula si conviene cambiar `USD -> GTQ`, `GTQ -> USD` o mantener cada moneda separada para evitar perdidas por diferencial cambiario. |
| **Pantalla 2: Grafica y Simulador (`-50%` a `+50%`)** | Comparativa `Ingreso real vs. sueldo estabilizado` + control deslizante bidireccional desde `-50%` (Temporada Baja) hasta `+50%` (Temporada Alta) | Muestra cuantas semanas resiste tu reserva ante una caida de ingresos o cuanto se acelera tu fondo si tus ingresos suben. |

---

## Algoritmo Bimonetario y Estabilizacion Estacional

![Algoritmo bimonetario y estabilizacion estacional](./docs/diagrams/dual-currency-smoothing.svg)

---

## Inicio Rapido y Documentacion

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

- **Arquitectura del sistema y diagramas SVG/HTML:** Lee [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
- **Como configurar el proyecto y probar los perfiles bimonetarios `GTQ`/`USD`:** Lee [`docs/ONBOARDING.md`](./docs/ONBOARDING.md).
- **Formulas exactas del motor estacional y simulador bidireccional:** Lee [`docs/ALGORITHM.md`](./docs/ALGORITHM.md).
- **Especificacion funcional del prototipo:** Lee [`SPEC.md`](./SPEC.md).
