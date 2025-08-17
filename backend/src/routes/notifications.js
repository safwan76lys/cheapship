const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../config/database');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ================================
// NOTIFICATIONS
// ================================

// Récupérer toutes les notifications de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      type 
    } = req.query;

    // Construire les filtres
    const whereClause = { userId };
    
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }
    
    if (type && ['MESSAGE', 'OFFER', 'ACCEPTANCE', 'REJECTION', 'TRIP_UPDATE', 'SYSTEM', 'REMINDER'].includes(type)) {
      whereClause.type = type;
    }

    // Récupérer les notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Compter le total
    const total = await prisma.notification.count({
      where: whereClause
    });

    // Compter les non-lues
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des notifications' 
    });
  }
});

// Créer une notification (usage interne/admin)
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      content, 
      type, 
      relatedId, 
      metadata,
      targetUserId 
    } = req.body;

    // Utiliser targetUserId si fourni, sinon l'utilisateur actuel
    const userId = targetUserId || req.user.id;

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        relatedId,
        metadata
      }
    });

    console.log('✅ Notification créée:', notification.id);

    // TODO: Envoyer via Socket.IO si l'utilisateur est connecté
    // socketService.sendToUser(userId, 'newNotification', notification);

    res.status(201).json({
      message: 'Notification créée avec succès',
      notification
    });

  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la notification' 
    });
  }
});

// Marquer une notification comme lue
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    // Marquer comme lue
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    res.json({
      message: 'Notification marquée comme lue',
      notification: updatedNotification
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de la notification' 
    });
  }
});

// Marquer toutes les notifications comme lues
router.patch('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    res.json({
      message: 'Toutes les notifications marquées comme lues',
      updatedCount: result.count
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour des notifications' 
    });
  }
});

// Supprimer une notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({
      message: 'Notification supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la notification' 
    });
  }
});

// Supprimer toutes les notifications lues
router.delete('/clear-read', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        read: true
      }
    });

    res.json({
      message: 'Notifications lues supprimées',
      deletedCount: result.count
    });

  } catch (error) {
    console.error('❌ Error clearing read notifications:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression des notifications lues' 
    });
  }
});

// Obtenir le nombre de notifications non-lues
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({ unreadCount });

  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du nombre de notifications' 
    });
  }
});

// Obtenir les statistiques des notifications
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Statistiques par type
    const statsByType = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        id: true
      }
    });

    // Statistiques générales
    const totalNotifications = await prisma.notification.count({
      where: { userId }
    });

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    // Notifications récentes (dernières 24h)
    const recentNotifications = await prisma.notification.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const stats = {
      total: totalNotifications,
      unread: unreadNotifications,
      recent24h: recentNotifications,
      byType: {}
    };

    statsByType.forEach(stat => {
      stats.byType[stat.type] = stat._count.id;
    });

    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching notification stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;