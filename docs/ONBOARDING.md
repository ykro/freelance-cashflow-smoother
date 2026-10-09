# Guia de Onboarding: Estabilizador (`freelance-cashflow-smoother`)

Bienvenido a la guia de **Estabilizador (`freelance-cashflow-smoother`)**, la herramienta de presupuesto para ingresos variables disenada para que trabajadores informales y freelancers aprendan cuales son sus meses o semanas buenas y malas y calculen cuanto apartar cada semana para no quedarse sin dinero en temporada baja.

- **Produccion en Vivo (Vercel):** [https://freelance-cashflow-smoother.vercel.app](https://freelance-cashflow-smoother.vercel.app)
- **Especificacion Funcional:** [`SPEC.md`](../SPEC.md)
- **Arquitectura del Sistema:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Documentacion Matematica:** [`docs/ALGORITHM.md`](./ALGORITHM.md)

---

## 1. Configuracion de Desarrollo Local

### Requisitos Previos
- **Node.js** `>= 20.x`
- **npm** `>= 10.x`

### Instalacion y Ejecucion

```bash
# 1. Clonar el repositorio e ingresar al directorio
git clone https://github.com/ykro/freelance-cashflow-smoother.git
cd freelance-cashflow-smoother

# 2. Instalar dependencias
npm install

# 3. Levantar servidor de desarrollo en http://localhost:3000
npm run dev

# 4. Compilar version de produccion y verificar tipos TypeScript
npm run build
```

---

## 2. Recorrido por las Dos Pantallas de la Aplicacion

### Pantalla 1: Ingresos y gastos (`1. Ingresos y gastos`)
1. **Selecciona `Modo Mes` o `Modo Semana`:**
   - Usa **Modo Mes** para evaluar tus ultimos 2 a 6 meses.
   - Usa **Modo Semana** para evaluar tus ultimas 3 a 8 semanas.
2. **Prueba los 3 ejemplos rapidos en 1 clic:**
   - **Freelancer Diseno / Dev (`Modo Mes · Bimonetario $ + Q`):** Cobra proyectos en Dolares y Quetzales, paga gastos locales en `Q` y herramientas en `$`.
   - **Comerciante / Independiente (`Modo Semana · En Quetzales Q`):** Registra semanas altas de quincena/fin de mes y semanas bajas por lluvias o menor venta.
   - **Consultor Mixto (`Modo Mes · Estacionalidad Alta`):** Combina honorarios locales en `Q` y consultoria en `$` con picos marcados.
3. **Ingresa tus gastos esenciales y tu reserva en `Q` y `$` al mismo tiempo:**
   - No necesitas elegir una sola moneda: puedes capturar tus montos en Quetzales, en Dolares o en ambos simultaneamente.
4. **Agrega o edita tus meses o semanas recientes:**
   - Cada fila muestra al instante su etiqueta automatica (`Temporada Alta`, `Normal` o `Temporada Baja`) y el total combinado en `Q` y `$`.
5. **Haz clic en `Calcular cuanto apartar cada semana`** para abrir tu plan semanal.

### Pantalla 2: Plan semanal (`2. Plan semanal`)
1. **Cuanto apartar cada semana (Tarjeta Hero):**
   - Muestra el monto exacto en `Q` y `$` que debes apartar por semana, diferenciando la regla para semanas buenas frente a la regla de retiro en temporada baja.
2. **Tu sueldo propio estabilizado:**
   - Presenta tu ingreso seguro semanal y su equivalente mensual estable.
3. **Aprendizaje de temporadas y Desglose bimonetario (`Q` + `$`):**
   - Resume el promedio de tus periodos buenos y malos, el avance de tu reserva y la recomendacion practica de manejo entre Quetzales y Dolares.
4. **Grafica interactiva y Simulador (`-50%` a `+50%`):**
   - Desliza hacia la izquierda (`-50%`) para simular una temporada baja o hacia la derecha (`+50%`) para simular una temporada alta.
5. **Boton `Volver a editar mis ingresos y gastos`:**
   - Ubicado en el encabezado superior para regresar en cualquier momento a la Pantalla 1.
