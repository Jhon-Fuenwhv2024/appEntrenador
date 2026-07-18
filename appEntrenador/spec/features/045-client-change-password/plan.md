# 045 · Plan — Cambio de Contraseña Cliente

## Enfoque

1. Auditar `account.routes.js` / `account.service.js`: confirmar `requireRole('trainer', 'client')` y flujo bcrypt.
2. En `ClientProfileView.vue`, reutilizar el patrón de `TrainerSettingsView.vue`:
   - importar `ChangePasswordForm`
   - estado `savingPassword` + handler que llama `changeMyPassword`
   - feedback success/error con el sistema de notificaciones del proyecto
3. Ajustes menores de layout mobile-first en la tarjeta de perfil (sin rediseñar toda la vista).
4. Actualizar docs de 024 / api si el spec decía “client password UI pendiente”.
5. Smoke manual: login client → cambiar password → logout → login con nueva.

## Archivos clave

- FE: `src/features/client/ClientProfileView.vue`
- Shared: `src/shared/components/ChangePasswordForm.vue`, `src/shared/api/accountApi.js`
- BE (solo verificación): `backend/src/modules/account/*`
- Referencia UI: `src/features/trainer/TrainerSettingsView.vue`

## Decisiones

- Cero features nuevas de auth: solo wiring UI.
- Forgot-password queda en **046**; no mezclar SMTP aquí.
