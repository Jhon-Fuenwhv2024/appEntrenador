### 1. 016 · Plantillas de rutinas (biblioteca del trainer)

Guardar rutinas en biblioteca personal y asignarlas a alumnos sin clonar a mano. Es lo que ya documentaste en `docs/plantillas de rutinas y memoria de progresión.md` y lo primero del roadmap.

### 2. 017 · Memoria de progresión (último peso / reps)

Al ejecutar o reasignar, mostrar el último peso/reps del alumno por ejercicio (basado en `workout_set_logs` de 012) y registrar el nuevo sin tocar la plantilla.

### 3. 018 · Perfil alumno (`alumnos_info`)

API + UI (trainer edita / cliente ve-edita lo permitido): teléfono, nacimiento, sexo, lesiones, objetivo. Schema ya existe; falta conectar.

### 4. 019 · Historial y progreso para el cliente

Vista “Mi progreso”: sesiones pasadas, pesos por ejercicio, tendencia simple. Hoy el historial casi solo lo ve el trainer.

### 5. 020 · Vincular líneas de rutina al catálogo (`exercises`)

Pasar de copiar solo el `nombre` a FK o `exercise_id` estable → media/descripción siempre correctas aunque cambie el nombre en catálogo.

### 6. 021 · Invitaciones como módulo + gestión

Extraer `modules/invites`, listar tokens (usados/pendientes), revocar/regenerar, caducidad. En roadmap como backlog técnico con valor operativo.

### 7. 022 · Notificaciones reales (mínimo viable)

Badge del dashboard: alumno nuevo, sesión completada, alumno sin plan. Hoy el botón está deshabilitado (fuera de alcance de 015).

### 8. 023 · Ajustes / perfil de cuenta

Ruta settings (placeholder en bottom nav): cambiar nombre/password, datos básicos del trainer/cliente.

### 9. 024 · Hardening config + despliegue

Credenciales solo por `.env`, checklist de deploy (frontend Netlify + API), sin secretos en código. Tech-stack lo marca pendiente.

### 10. 025 · Planes de nutrición (MVP ligero) _o_ Tests E2E críticos

- Nutrición: la card “Planes de Dieta” sigue siendo placeholder; encaja si quieres producto “completo” del mock.
- Tests: si priorizas estabilidad, suite mínima (login, ownership, workout save) antes de más features.

atencioalciudadano@iudigital.edu.co