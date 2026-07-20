# 026 · Composición corporal del cliente

**Estado:** pendiente
**Depende de:** 020 (ficha/perfil alumno)

## Qué hace
Permite al **trainer** registrar mediciones antropométricas (peso, % grasa, IMC y circunferencias) como **historial fechado**. El **cliente** solo puede **consultar** su historial; no crea ni edita registros.

## Dominio (Base de Datos)
Cada registro pertenece a un `client_id` y tiene un `measured_at` (fecha).
Todas las circunferencias son en centímetros (`DECIMAL(5,2)`).

| Campo | Tipo | Regla Estricta para Implementación |
| :--- | :--- | :--- |
| `measured_at` | DATE | Fecha de la toma. Por defecto la fecha actual. |
| `weight_kg` | DECIMAL | Peso corporal. Obligatorio en el POST. |
| `height_cm` | DECIMAL | Altura. El Frontend DEBE pre-llenar este campo consultando el último registro histórico. Obligatorio en el POST. |
| `bmi` | DECIMAL | IMC. NO pedir en payload. Calcular exclusivamente en la capa Service del Backend antes de guardar. |
| `body_fat_pct` | DECIMAL | % de grasa corporal (Nullable). |
| `chest_cm` | DECIMAL | Pecho en cm (Nullable). |
| `waist_cm` | DECIMAL | Cintura en cm (Nullable). |
| `triceps_cm` | DECIMAL | Tríceps en cm (Nullable). |
| `biceps_cm` | DECIMAL | Bíceps en cm (Nullable). |
| `glutes_cm` | DECIMAL | Glúteos en cm (Nullable). |
| `quads_cm` | DECIMAL | Pierna/Cuádriceps en cm (Nullable). |
| `calves_cm` | DECIMAL | Pantorrilla en cm (Nullable). |
| `back_cm` | DECIMAL | Espalda en cm (Nullable). |
| `notes` | TEXT | Observaciones del trainer (Nullable). |

## Criterios de aceptación
- [x] Schema: Tabla `body_composition_logs` con todos los campos del dominio.
- [x] Trainer: `POST` / `PUT` para crear y actualizar mediciones de alumnos propios.
- [x] Client: `GET` listado de solo lectura; **sin** POST/PUT/DELETE.
- [x] Frontend Trainer: Modal o formulario de nueva medición. Si es la primera vez, altura está en blanco. Si ya hay registros, autocompletar `height_cm` con el último valor.
- [x] Backend: Cálculo de IMC ($kg/m^2$) en el servicio.

### UI

- [x] Trainer: sección en ficha del alumno para crear/editar/ver historial de composición corporal
- [x] Client: vista de solo lectura (bloque en “Mi progreso” / dashboard o ruta ligera bajo shell)
- [x] Contraste tema dark / CTAs `color="primary"` según reglas UI del proyecto

### Cierre

- [x] Docs `api` / `data-flows` / `database-schema`
- [x] Build OK (frontend) y API arranca sin errores de ruta

## Fuera de alcance

- Charts avanzados / comparativas entre alumnos
- Export CSV/PDF
- El cliente auto-registra datos.
- Charts y comparativas gráficas.
- Fotos de progreso / Image CDN
- Sustituir o mezclar con logs de workout (021)
- Circunferencias y métricas avanzadas (backlog de ampliación de esta feature)
