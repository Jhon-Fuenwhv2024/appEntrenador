# 037 · Motor SaaS B2B y Panel SuperAdmin (Gestión Manual)

**Estado:** pendiente
**Depende de:** 011 (Autenticación / Usuarios)

## Qué hace
Implementa la arquitectura base para el modelo de negocio B2B. Introduce el rol oculto de `SuperAdmin` (Dueño) y un motor de límites que restringe a los entrenadores en el plan `FREE` a un máximo de clientes. Provee un panel Backoffice para gestionar manualmente las suscripciones de los entrenadores.

## Criterios de Aceptación (Grado Producción)

- [ ] **Base de Datos (RBAC y Suscripciones B2B):**
      - Añadir columna `is_superadmin` (BOOLEAN DEFAULT FALSE) a la tabla de `users`.
      - Añadir columnas a la tabla/perfil del entrenador (o crear `trainer_subscriptions`): `saas_plan` (ENUM: 'FREE', 'PRO' DEFAULT 'FREE'), `saas_expiration_date` (DATE NULL).
- [ ] **Lógica de Negocio y Middlewares (El Gatekeeper):**
      - **Middleware `requireSuperAdmin`:** Rechaza con `403 Forbidden` cualquier petición a rutas `/api/saas/*` si el usuario no tiene `is_superadmin = TRUE`.
      - **Middleware `checkTrainerLimits`:** Al hacer POST en `/api/clients` (crear alumno), cuenta los alumnos activos del entrenador. Si el plan es `FREE` y tiene >= 3 alumnos, rechaza con `402 Payment Required`.
- [ ] **UI Dueño (Panel Backoffice / Modo Dios):**
      - Vista oculta `/backoffice` accesible solo si el store/perfil indica `is_superadmin: true`.
      - Tabla listando todos los entrenadores registrados en la plataforma.
      - Acciones por entrenador: Cambiar plan (FREE/PRO), establecer fecha de vencimiento y suspender cuenta (soft-delete o flag).
- [ ] **UI Entrenador (Paywall B2B):**
      - Si intenta crear un 4to cliente estando en `FREE`, el frontend atrapa el error `402` y muestra un modal: "Límite alcanzado. Actualiza a PRO contactando al administrador".

## Fuera de alcance
- Pagos automatizados con Stripe/MercadoPago.
- Portales de facturación para el entrenador.