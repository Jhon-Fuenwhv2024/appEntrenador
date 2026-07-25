# 068 · Tasks

> **Gate:** no marcar ni ejecutar tareas de código/infra hasta el proyecto de producción Coolify + VPS.

## SDD

- [x] Crear `spec.md` / `plan.md` / `tasks.md`
- [x] Registrar en `spec/constitution/roadmap.md` como diferida

## Infra Coolify (prod)

- [ ] Desplegar MinIO en Coolify con volumen persistente
- [ ] Crear bucket + access keys; configurar env `S3_*` en el servicio API
- [ ] Verificar que redeploy del API no borra objetos

## Backend

- [ ] Capa `shared/storage` (S3 + fallback local)
- [ ] Conectar avatares (profile/account) a storage
- [ ] Conectar fotos de check-in a storage
- [ ] Conectar media de ejercicios globales + upload trainer
- [ ] Cuotas FREE/PRO + validación mime/tamaño
- [ ] Script migración `public/uploads` → bucket (si aplica)

## Frontend

- [ ] Ajustar resolución de URLs (públicas / firmadas) en avatar, check-in y player/preview si cambia el contrato
- [ ] UI de upload de media de ejercicio del trainer (si no existe) + mensajes de cuota

## Docs / validación

- [ ] ADR + `docs/api.md` + data-flows + go-live Coolify
- [ ] Actualizar `tech-stack.md` (Coolify + MinIO)
- [ ] Smoke: subir avatar, foto check-in, GIF/MP4 ejercicio → redeploy API → seguir visibles
