# 008 · Plan

1. DDL `CREATE TABLE exercises` en `script_db.sql` (nombre EN para no colisionar con `ejercicios`).
2. Seed local: `seedExercises.js` + `exercises_dataset.json`; solo globales (`created_by_trainer_id = NULL`); skip por nombre si ya existe.
3. Docs: `database-schema.md` + nota breve en architecture/api.
4. Gate: usuario revisa SQL antes de aplicarlo a su instancia MySQL.
