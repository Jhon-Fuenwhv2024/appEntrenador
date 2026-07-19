# Feature 046 — Exercise muscle tagger (HITL)

## Objetivo

Herramienta interna temporal para que un superadmin clasifique ejercicios del catálogo viendo el GIF/video local y asignando músculo principal + secundarios.

## Requisitos

1. Columnas `primary_muscle` y `secondary_muscles` en `exercises`.
2. `GET /api/admin/exercises/untagged` → 1 ejercicio sin principal.
3. `PATCH /api/admin/exercises/:id/tag` → guarda y responde 200.
4. UI Vue centrada con media, botones de principal, chips de secundarios, CTA «Guardar y siguiente».
5. Estado vacío: banner «¡Catálogo completado al 100%!».
6. Endpoints protegidos con `authenticate` + `requireSuperAdmin`.
