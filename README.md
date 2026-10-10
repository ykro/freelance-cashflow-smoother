# Estabilizador (`freelance-cashflow-smoother`)

**Presupuesto para ingresos variables**: para trabajadores informales o freelancers, **aprende tus meses o semanas buenas y malas y calcula cuanto apartar cada semana para no quedarte sin dinero en temporada baja**.

> **Demo en Vivo:** [**https://freelance-cashflow-smoother.vercel.app**](https://freelance-cashflow-smoother.vercel.app)
>
> **Especificacion:** [`SPEC.md`](./SPEC.md) · **Arquitectura:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · **Onboarding:** [`docs/ONBOARDING.md`](./docs/ONBOARDING.md) · **Motor Matematico:** [`docs/ALGORITHM.md`](./docs/ALGORITHM.md)

---

## El Problema y la Solucion

Los trabajadores independientes, comerciantes informales y freelancers sufren por la **asimetria estacional**: en los periodos de cosecha alta gastan como si el ingreso extraordinario fuera permanente, y cuando llega la temporada baja recurren a deuda para cubrir sus gastos fijos.

**Estabilizador** organiza el presupuesto en **4 paginas** (`1. Ingresos` · `2. Gastos` · `3. Tu Plan` · `4. Grafica y Simulador`) con soporte en Quetzales (`Q`) y Dolares (`$`):

1. **1. Ingresos:** Captura de los ultimos meses (`Por Mes`) o semanas (`Por Semana`) en `Q` y `$`, clasificando cada periodo como `Alta`, `Normal` o `Baja`.
2. **2. Gastos:** Registro de gastos esenciales fijos y reserva disponible actual en `Q` y `$`.
3. **3. Tu Plan:** Calculo directo de cuanto apartar cada semana, sueldo seguro semanal/mensual, comparativa visual de temporadas y flujo neto por moneda.
4. **4. Grafica y Simulador:** Comparativa entre ingreso real y sueldo estabilizado con simulador de temporada baja (`-50%`) y temporada alta (`+50%`).

---

## Flujo de la Aplicacion

![Flujo de Estabilizador](./docs/diagrams/cashflow-pipeline.svg)

| Pagina | Componentes | Funcion |
| :--- | :--- | :--- |
| **1. Ingresos** | Selector `Por Mes` / `Por Semana`, 3 perfiles de ejemplo y lista de periodos (`Q` y `$`) | Registra ingresos historicos y detecta automaticamente si cada periodo fue `Alta`, `Normal` o `Baja`. |
| **2. Gastos** | Tarjetas de `Gastos esenciales fijos` y `Reserva disponible hoy` (`Q` y `$`) | Define el piso de gastos fijos y el colchon disponible. |
| **3. Tu Plan** | Meta semanal a apartar, sueldo seguro, barras de aprendizaje estacional y tira bimonetaria | Indica cuanto guardar en semana buena, cuanto retirar en temporada baja y cuanto puedes gastar de forma estable. |
| **4. Grafica y Simulador** | Grafica `CashflowChart` y control deslizante de `-50%` a `+50%` | Simula caidas o subidas de ingresos y su impacto en la cobertura de semanas. |

---

## Motor de Estabilizacion Estacional

![Algoritmo bimonetario y estabilizacion estacional](./docs/diagrams/dual-currency-smoothing.svg)

---

## Desarrollo Local

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

- **Arquitectura:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **Guia de uso y pruebas:** [`docs/ONBOARDING.md`](./docs/ONBOARDING.md)
- **Formulas del motor:** [`docs/ALGORITHM.md`](./docs/ALGORITHM.md)
- **Especificacion funcional:** [`SPEC.md`](./SPEC.md)
