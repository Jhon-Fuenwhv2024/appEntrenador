# SKILL: Express & MySQL Backend Architecture

## 🎯 OBJETIVO PRINCIPAL

Como agente de IA, DEBES aplicar estrictamente estas reglas cada vez que leas, modifiques o crees código relacionado con el backend (Express.js) y la base de datos (MySQL). Tu prioridad es la seguridad, la modularidad y la consistencia.

## 🏛️ 1. ARQUITECTURA MODULAR OBLIGATORIA

Prohibido colocar lógica de negocio o consultas SQL dentro de los archivos de rutas. Todo endpoint debe seguir este flujo unidireccional:

*   **Route:** Solo define el método HTTP (GET, POST), el path, los middlewares (auth/validación) y llama al controlador.

*   **Controller:** Extrae datos del request `req.body`, `req.params`), llama al Service, y devuelve la respuesta al cliente. NO contiene consultas SQL.

*   **Service:** Contiene TODA la lógica de negocio y ejecuta las consultas a la base de datos.

## 🗄️ 2. SEGURIDAD Y MYSQL

*   **Cero Inyección SQL:** NUNCA concatenes variables directamente en un string SQL (ej. `SELECT * FROM users WHERE id = ${id}`).

*   **Prepared Statements:** Utiliza SIEMPRE consultas parametrizadas o prepared statements (ej. usando el pool de `mysql2/promise` con `execute('SELECT * FROM users WHERE id = ?', [id])`).

*   **Transacciones:** Si una operación requiere múltiples inserciones/actualizaciones (ej. crear cliente y asignarle una rutina), DEBES usar transacciones `BEGIN`, `COMMIT`, `ROLLBACK`).

## 📤 3. ESTANDARIZACIÓN DE RESPUESTAS (API RESPONSES)

Todas las respuestas de la API deben tener una estructura JSON predecible. No devuelvas arrays o strings planos.

**Éxito (200, 201):**

```json

{

  "success": true,

  "data": { ... },

  "message": "Operación exitosa"

}