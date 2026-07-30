const { pushService } = require('./push.service');

const pushController = {
  async getVapidPublicKey(req, res) {
    try {
      const publicKey = pushService.getPublicKey();
      if (!publicKey) {
        return res.status(503).json({
          success: false,
          error: 'Push no configurado en el servidor (faltan claves VAPID).',
          code: 503,
        });
      }
      return res.json({
        success: true,
        data: { publicKey, enabled: true },
      });
    } catch (error) {
      console.error('Error getVapidPublicKey:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener clave VAPID',
        code: 500,
      });
    }
  },

  async upsertSubscription(req, res) {
    try {
      const { endpoint, keys, userAgent } = req.body || {};
      const data = await pushService.upsertSubscription(req.user.id, {
        endpoint,
        keys,
        userAgent: userAgent || req.get('user-agent') || null,
      });
      return res.status(201).json({
        success: true,
        data,
        message: 'Suscripción push guardada',
      });
    } catch (error) {
      const status = error.status || 500;
      if (status >= 500) {
        console.error('Error upsertSubscription:', error.message);
      }
      return res.status(status).json({
        success: false,
        error: error.message || 'Error al guardar suscripción',
        code: status,
      });
    }
  },

  async deleteSubscription(req, res) {
    try {
      const { endpoint } = req.body || {};
      const deleted = await pushService.deleteSubscription(req.user.id, endpoint);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Suscripción no encontrada',
          code: 404,
        });
      }
      return res.json({
        success: true,
        message: 'Suscripción eliminada',
      });
    } catch (error) {
      const status = error.status || 500;
      if (status >= 500) {
        console.error('Error deleteSubscription:', error.message);
      }
      return res.status(status).json({
        success: false,
        error: error.message || 'Error al eliminar suscripción',
        code: status,
      });
    }
  },
};

module.exports = { pushController };
