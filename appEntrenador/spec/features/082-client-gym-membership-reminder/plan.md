# 082 · Plan técnico

## Enfoque

1. Tabla propia `client_gym_memberships` (no mezclar con `client_memberships`).
2. API `/me/gym-membership` solo cliente.
3. Extender `notification-jobs` con `processGymMembershipAlert`.
4. Card editable en `ClientProfileView` + tipos en campana.
5. Skills: vue-best-practices, express-mysql-backend, auth-roles-security.

## Archivos clave

| Capa | Path |
|------|------|
| Migración | `backend/db/migrations/033_client_gym_memberships.sql` |
| Ensure | `backend/src/db/ensureClientGymMembershipsTable.js` |
| Módulo | `backend/src/modules/gym-membership/*` |
| Jobs | `backend/src/modules/notification-jobs/notification-jobs.service.js` |
| FE API | `src/features/client/api/gymMembershipApi.js` |
| FE UI | `src/features/client/components/ClientGymMembershipCard.vue` |
| Vista | `src/features/client/ClientProfileView.vue` |
