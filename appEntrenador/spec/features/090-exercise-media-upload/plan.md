# 090 · Plan técnico

## Almacenamiento

- Multer campo `media_file` (memory si R2, disk si no).
- Persistencia vía capa existente + `putTrainerExerciseMedia`.
- Path público: `/uploads/exercises/trainer_{trainerId}_{uuid}.{ext}`.
- DB: `local_media_path` + `media_type` (`image`|`gif`|`video`); modo URL usa `media_url`.

## Backend

- `uploadExerciseMedia.js` middleware.
- Ampliar `exerciseMediaPaths` / `exerciseMediaStorage` / proxy R2.
- `POST/PUT /api/exercises` con multer opcional; service recibe `req.file`.

## Frontend

- `ExerciseCatalogForm.vue`: origen URL vs upload + preview.
- `exercisesApi.js`: `buildExerciseFormData`.
- Panel: snackbar tamaño; `saving` existente.

## Ownership

- Upload solo si `created_by_trainer_id = trainer` (create siempre privado).
- Globales: solo modo URL.
