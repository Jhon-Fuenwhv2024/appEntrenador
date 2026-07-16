# 034 · Mensajería Interna (Chat en Tiempo Real - SSE)

**Estado:** implementado
**Depende de:** 020 (Perfil del alumno)

## Qué hace
Crea un canal de comunicación directo y en tiempo real entre el cliente y su entrenador asignado. Utiliza Server-Sent Events (SSE) para un flujo de mensajes instantáneo sin la sobrecarga de WebSockets ni el consumo de batería del Polling.

## Criterios de Aceptación

- [x] **Base de Datos (`messages`):**
      - Campos: `id` (PK), `sender_id` (FK a usuarios), `receiver_id` (FK a usuarios), `content` (TEXT), `is_read` (BOOLEAN DEFAULT FALSE), `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP).
- [x] **API (REST & SSE):**
      - `GET /api/messages/:partnerId`: Obtiene el historial de chat con un usuario específico. Marca automáticamente como leídos (`is_read = TRUE`) los mensajes donde el usuario actual es el receptor.
      - `POST /api/messages`: Inserta el mensaje en la base de datos y, **si el destinatario está conectado al stream SSE**, le envía el mensaje en tiempo real.
      - `GET /api/messages/stream`: Endpoint de suscripción SSE. Mantiene la petición HTTP abierta devolviendo el header `Content-Type: text/event-stream`.
- [x] **UI Cliente (Chat Unidireccional):**
      - Interfaz de chat "tipo WhatsApp" (burbujas a izquierda y derecha).
      - Auto-scroll al final del contenedor al abrir o recibir un nuevo mensaje.
      - Se conecta al endpoint `/stream` mediante la API nativa `EventSource` al montar el componente, y la cierra al desmontarlo.
- [x] **UI Entrenador (Inbox):**
      - Vista dividida (Desktop) o en flujo de pantallas (Móvil). Lista de alumnos a un lado y ventana activa de chat al otro.

## Fuera de alcance
- WebSockets, Socket.io o Redis Pub/Sub.
- Envío de archivos adjuntos, imágenes o notas de voz (solo texto en el MVP).
- Emojis nativos desde teclado permitidos, pero sin selector de emojis customizado.