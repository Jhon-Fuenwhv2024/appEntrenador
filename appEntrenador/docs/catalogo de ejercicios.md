# ARQUITECTURA DE CATÁLOGO DE EJERCICIOS Y SEEDING (HYBRID APPROACH)

Actúa como Arquitecto de Base de Datos y Desarrollador Backend. Vamos a implementar la base de nuestro diccionario de ejercicios (Feature 008), asegurando que el sistema pueda manejar tanto un dataset gratuito global como ejercicios personalizados por los entrenadores. 

Aplica estrictamente nuestras reglas de `AGENTS.md` y la skill `express-mysql-backend`.

## 1. DISEÑO DEL ESQUEMA (MYSQL)
Necesito que diseñes y me muestres el query SQL para crear la tabla `Exercises`. Debe incluir:
- `id` (Primary Key).
- `name`, `description`, `target_muscle`.
- `media_type` (ENUM o VARCHAR restrictivo: 'image', 'gif', 'youtube', 'video', 'none').
- `media_url` (VARCHAR para guardar el enlace de GitHub, YouTube o el hosting del entrenador).
- `created_by_trainer_id` (Foreign Key opcional que apunte a la tabla de entrenadores. Si es NULL, es un ejercicio global del sistema. Si tiene ID, es privado de ese entrenador).

repositorios: 
https://github.com/wrkout/exercises.json.git

https://github.com/seagomezar/Exercises-Compiled-Database.git


## 2. SCRIPT DE SEEDING (POBLACIÓN INICIAL)
No vamos a depender de APIs externas. Vamos a descargar un archivo JSON de GitHub.
- Crea un script en el backend (ej. `backend/scripts/seedExercises.js`).
- El script debe estar preparado para leer un archivo local `exercises_dataset.json` (asume que tendrá una estructura de array de objetos con nombre, músculo y una URL de GIF/imagen).
- El script debe usar el pool de conexiones de `mysql2/promise` para insertar los datos usando un bucle con *Prepared Statements* (evitando inyecciones SQL). Estos ejercicios deben insertarse con `created_by_trainer_id` como `NULL`.

## 3. ACTUALIZACIÓN DE DOCUMENTACIÓN
Asegúrate de actualizar nuestro archivo `docs/database-schema.md` con esta nueva tabla y sus relaciones, respetando nuestro flujo de trabajo de Obsidian.

## 4. ENTREGABLE
Ejecuta la creación del script y muéstrame el SQL propuesto para la tabla. **No ejecutes el query en MySQL todavía**, primero quiero revisar el esquema que propones.