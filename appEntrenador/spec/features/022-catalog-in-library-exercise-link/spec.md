# 022 · Catálogo dentro de Biblioteca + vínculo estable

**Estado:** pendiente

**Depende de:** 016 (nav); 018 (Biblioteca); catálogo 008/009

## Qué hace

1. Reubica la UX del catálogo de ejercicios como parte de **Biblioteca** (subsección o ruta anidada), no como ítem de barra.
2. Introduce vínculo estable entre líneas de rutina/plantilla y el diccionario `exercises` (p. ej. `exercise_id`), dejando de depender solo de copiar el nombre.

## Criterios de aceptación

- [ ] Acceso a catálogo desde Biblioteca (y/o al editar plantilla/rutina); sin slot “Ejercicios” en barra
- [ ] Schema: columna nullable `exercise_id` (o equivalente) en `ejercicios` y/o líneas de plantilla → FK a `exercises`
- [ ] Crear/editar rutina o plantilla puede persistir `exercise_id` + nombre denormalizado para display
- [ ] Player/media resuelve por `exercise_id` cuando existe; fallback por nombre si NULL
- [ ] Migración documentada; `script_db.sql` actualizado
- [ ] Docs schema / api / architecture
- [ ] Build OK

## Fuera de alcance

- Re-seed masivo renombrando ejercicios
- Hosting propio de media
- Dietas
