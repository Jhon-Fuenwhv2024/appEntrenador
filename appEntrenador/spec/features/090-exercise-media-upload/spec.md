# 090 · Soporte dinámico URL vs subida de archivos multimedia en ejercicios

**Estado:** implementado  
**Depende de:** 008/009 (catálogo), 044 (media local), ADR-0005 (R2 GIFs)  
**Relacionada:** 068 (object storage Coolify — evolución futura)  
**Skills:** `vue-best-practices`, `express-mysql-backend`, `auth-roles-security`  
**Docs:** [api.md](../../../docs/api.md), [data-flows.md](../../../docs/data-flows.md)

## Qué hace

En la creación/edición de ejercicios del catálogo del trainer, permite elegir entre **enlazar una URL externa** (comportamiento actual) o **subir un archivo** (imagen, GIF o video corto) que se persiste en storage y se guarda en `local_media_path`.

## Criterios de aceptación

- [x] Formulario con selector de origen: Enlazar URL | Subir archivo.
- [x] URL: `v-text-field` + `media_type` como hoy.
- [x] Upload: `v-file-input` (`image/*`, `video/*`) + preview reactiva (`createObjectURL`).
- [x] Submit multipart (`FormData` + `media_file`) cuando hay archivo; JSON cuando es solo URL.
- [x] Backend Multer: máx. 10 MB; mime jpeg/png/webp/gif/mp4/webm.
- [x] DB: `local_media_path` + `media_type` inferido; URL en `media_url`. Sin migración.
- [x] Subida solo en ejercicios privados del trainer (no pisar GIFs globales Fitcron).
- [x] Loading en guardar; snackbar claro si supera 10 MB.
- [x] Docs API + data-flows actualizados.
- [x] Build FE OK; smoke backend.

## Fuera de alcance

- Feature 068 (MinIO / Coolify).
- Transcoding / HLS.
- Subida de media sobre ejercicios globales del sistema.
