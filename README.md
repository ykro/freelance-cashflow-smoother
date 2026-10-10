# Estabilizador (`freelance-cashflow-smoother`)

Presupuesto para ingresos variables diseñado para trabajadores independientes o freelancers: analiza meses o semanas buenas y malas en Quetzales (`Q`) y Dólares (`$`) y calcula cuánto apartar cada semana para mantener liquidez en temporada baja.

- **Demo en Vivo:** [https://freelance-cashflow-smoother.vercel.app](https://freelance-cashflow-smoother.vercel.app)
- **Índice de Prototipos:** [`ykro/ilab-aibuilders-prototypes`](https://github.com/ykro/ilab-aibuilders-prototypes)

---

## Flujo en 3 Pantallas

1. **1. Ingresos:** Captura de los últimos meses (`Por Mes`) o semanas (`Por Semana`) en `Q` y `$`, clasificando automáticamente cada período como `Alta`, `Normal` o `Baja`.
2. **2. Gastos:** Registro de gastos esenciales fijos y reserva disponible actual en `Q` y `$`.
3. **3. Tu Plan:** Integra en una sola pantalla las métricas clave (`Apartar cada semana`, `Sueldo seguro disponible` y comparativa de temporadas) junto con la gráfica interactiva `Ingreso Real vs. Sueldo Estabilizado` y el simulador de temporada baja (`-50%`) y alta (`+50%`).

---

## Documentación y Artículos

- **Arquitectura y Diagramas:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **Fórmulas del Motor Matemático:** [`docs/ALGORITHM.md`](./docs/ALGORITHM.md)
- **Temas para Artículos Técnicos y de Producto (6 temas):** [`docs/ARTICLES.md`](./docs/ARTICLES.md)
- **Especificación Funcional:** [`SPEC.md`](./SPEC.md)
- **Guía de Uso y Pruebas:** [`docs/ONBOARDING.md`](./docs/ONBOARDING.md)

---

## Desarrollo Local

```bash
npm install
npm run dev
```
