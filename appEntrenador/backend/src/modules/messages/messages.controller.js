const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { createHttpError } = require('../../middleware/auth');
const messagesService = require('./messages.service');
const sseManager = require('./sseManager');

const HEARTBEAT_MS = 25000;

function sendError(res, error, fallbackMessage, fallbackCode = 500) {
  const code = error.code || fallbackCode;
  const message = error.message || fallbackMessage;
  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

/**
 * EventSource cannot set Authorization headers — accept Bearer or ?token=.
 */
function authenticateSse(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, headerToken] = header.split(' ');
  const queryToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  const token = (scheme === 'Bearer' && headerToken) ? headerToken : queryToken;

  if (!token) {
    return sendError(res, createHttpError('No autenticado. Token requerido.', 401), 'No autenticado.', 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload?.id || !payload?.rol) {
      return sendError(res, createHttpError('Token inválido.', 401), 'Token inválido.', 401);
    }

    if (!['trainer', 'client'].includes(payload.rol)) {
      return sendError(res, createHttpError('No tienes permiso para esta acción.', 403), 'Sin permiso.', 403);
    }

    req.user = {
      id: Number(payload.id),
      username: payload.username,
      nombre: payload.nombre,
      rol: payload.rol,
    };

    return next();
  } catch (error) {
    console.error('Error verificando JWT (SSE):', error.message);
    return sendError(res, createHttpError('Token inválido o expirado.', 401), 'Token inválido.', 401);
  }
}

const messagesController = {
  stream(req, res) {
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    sseManager.addClient(userId, res);

    res.write(`: connected ${userId}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseManager.removeClient(userId, res);
      }
    }, HEARTBEAT_MS);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseManager.removeClient(userId, res);
    });
  },

  async getPartner(req, res) {
    try {
      const partner = await messagesService.getDefaultPartner(req.user);
      return res.json({
        success: true,
        data: partner,
        message: 'Entrenador asignado',
      });
    } catch (error) {
      console.error('Error getPartner:', error.message);
      return sendError(res, error, 'No se pudo obtener el contacto de chat');
    }
  },

  async getConversation(req, res) {
    try {
      const data = await messagesService.getConversation(req.user, req.params.partnerId);
      return res.json({
        success: true,
        data,
        message: 'Historial de conversación',
      });
    } catch (error) {
      console.error('Error getConversation:', error.message);
      return sendError(res, error, 'No se pudo cargar el historial');
    }
  },

  async sendMessage(req, res) {
    try {
      const message = await messagesService.sendMessage(req.user, {
        receiverId: req.body?.receiverId ?? req.body?.receiver_id,
        content: req.body?.content,
      });

      return res.status(201).json({
        success: true,
        data: message,
        message: 'Mensaje enviado',
      });
    } catch (error) {
      console.error('Error sendMessage:', error.message);
      return sendError(res, error, 'No se pudo enviar el mensaje');
    }
  },
};

module.exports = {
  messagesController,
  authenticateSse,
};
