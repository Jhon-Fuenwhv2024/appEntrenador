const { notificationService } = require('./notifications.service');

const notificationsController = {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.getUserNotifications(userId);
      const unreadCount = await notificationService.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, error: 'Error al obtener notificaciones' });
    }
  },

  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;
      
      const success = await notificationService.markAsRead(notificationId, userId);
      
      if (!success) {
        return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
      }
      
      res.json({ success: true, message: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, error: 'Error al actualizar notificación' });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);
      
      res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, error: 'Error al actualizar notificaciones' });
    }
  }
};

module.exports = { notificationsController };
