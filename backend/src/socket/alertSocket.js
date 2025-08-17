// ================================
// INTÉGRATION SOCKET.IO POUR ALERTES TEMPS RÉEL
// src/socket/alertSocket.js
// ================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const setupAlertSocket = (io) => {
  // Gérer les connexions utilisateurs pour les alertes
  const connectedUsers = new Map();
  
  io.on('connection', (socket) => {
    console.log(`[SOCKET_ALERTS] 🔌 Nouvelle connexion: ${socket.id}`);
    
    // ================================
    // AUTHENTIFICATION DU SOCKET
    // ================================
    socket.on('authenticate', (userData) => {
      if (userData && userData.userId) {
        // Rejoindre la room spécifique à l'utilisateur
        socket.join(`user_${userData.userId}`);
        socket.join(`alerts_${userData.userId}`);
        
        // Stocker l'association socket -> userId
        connectedUsers.set(socket.id, userData.userId);
        
        console.log(`[SOCKET_ALERTS] ✅ User ${userData.userId} authentifié sur socket ${socket.id}`);
        
        socket.emit('authenticated', { 
          success: true,
          message: 'Socket authentifié pour les alertes'
        });
        
        // Envoyer les alertes non lues
        sendUnreadAlerts(userData.userId, socket);
      } else {
        socket.emit('authentication_error', { 
          error: 'Données utilisateur invalides' 
        });
      }
    });
    
    // ================================
    // GESTION DES ALERTES
    // ================================
    
    // Créer une nouvelle alerte
    socket.on('create_alert', async (alertData) => {
      try {
        const userId = connectedUsers.get(socket.id);
        if (!userId) {
          socket.emit('alert_error', { error: 'Non authentifié' });
          return;
        }
        
        // Ici vous pouvez traiter la création d'alerte
        console.log(`[SOCKET_ALERTS] 📝 Création alerte pour user ${userId}:`, alertData);
        
        socket.emit('alert_created', { 
          success: true,
          message: 'Alerte créée avec succès'
        });
        
      } catch (error) {
        console.error('[SOCKET_ALERTS] Erreur création alerte:', error);
        socket.emit('alert_error', { error: 'Erreur lors de la création' });
      }
    });
    
    // Marquer notification comme vue
    socket.on('alert_notification_viewed', async (notificationId) => {
      try {
        const userId = connectedUsers.get(socket.id);
        if (!userId) return;
        
        await prisma.alertNotification.update({
          where: { 
            id: notificationId,
            userId: userId // Sécurité : vérifier que c'est bien la notif de l'user
          },
          data: { 
            status: 'VIEWED',
            viewedAt: new Date()
          }
        });
        
        console.log(`[SOCKET_ALERTS] 👀 Notification ${notificationId} marquée comme vue par user ${userId}`);
        
        socket.emit('notification_updated', {
          notificationId,
          status: 'VIEWED'
        });
        
      } catch (error) {
        console.error('[SOCKET_ALERTS] Erreur marquage notification:', error);
      }
    });
    
    // Marquer notification comme cliquée
    socket.on('alert_notification_clicked', async (notificationId) => {
      try {
        const userId = connectedUsers.get(socket.id);
        if (!userId) return;
        
        await prisma.alertNotification.update({
          where: { 
            id: notificationId,
            userId: userId
          },
          data: { 
            status: 'CLICKED'
          }
        });
        
        console.log(`[SOCKET_ALERTS] 🖱️ Notification ${notificationId} cliquée par user ${userId}`);
        
      } catch (error) {
        console.error('[SOCKET_ALERTS] Erreur clic notification:', error);
      }
    });
    
    // Demander les statistiques d'alertes
    socket.on('get_alert_stats', async () => {
      try {
        const userId = connectedUsers.get(socket.id);
        if (!userId) return;
        
        const alertService = require('../services/alertService');
        const userAlerts = await alertService.getUserAlerts(userId);
        
        socket.emit('alert_stats', {
          alerts: userAlerts,
          totalActive: userAlerts.filter(a => a.status === 'ACTIVE').length,
          totalNotifications: userAlerts.reduce((sum, a) => sum + a.notifications.length, 0)
        });
        
      } catch (error) {
        console.error('[SOCKET_ALERTS] Erreur stats alertes:', error);
      }
    });
    
    // ================================
    // GESTION DE LA DÉCONNEXION
    // ================================
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        console.log(`[SOCKET_ALERTS] 🔌 User ${userId} déconnecté (socket ${socket.id})`);
      }
    });
  });
  
  // ================================
  // FONCTIONS UTILITAIRES
  // ================================
  
  // Envoyer les alertes non lues à la connexion
  const sendUnreadAlerts = async (userId, socket) => {
    try {
      const unreadNotifications = await prisma.alertNotification.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'SENT'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Dernières 10 notifications non lues
      });
      
      if (unreadNotifications.length > 0) {
        socket.emit('unread_alerts', {
          notifications: unreadNotifications,
          count: unreadNotifications.length
        });
        
        console.log(`[SOCKET_ALERTS] 📬 ${unreadNotifications.length} alertes non lues envoyées à user ${userId}`);
      }
      
    } catch (error) {
      console.error('[SOCKET_ALERTS] Erreur envoi alertes non lues:', error);
    }
  };
  
  // ================================
  // API PUBLIQUE DU SOCKET MANAGER
  // ================================
  return {
    connectedUsers,
    
    // Envoyer une alerte à un utilisateur spécifique
    sendAlertToUser: (userId, alertData) => {
      io.to(`user_${userId}`).emit('alert_notification', alertData);
      io.to(`alerts_${userId}`).emit('new_alert_notification', alertData);
      console.log(`[SOCKET_ALERTS] 🔔 Alerte envoyée à user ${userId}`);
    },
    
    // Envoyer une notification à tous les utilisateurs connectés
    broadcastAlert: (alertData) => {
      io.emit('global_alert', alertData);
      console.log(`[SOCKET_ALERTS] 📢 Alerte diffusée à tous les utilisateurs connectés`);
    },
    
    // Obtenir le nombre d'utilisateurs connectés
    getConnectedUsersCount: () => {
      return connectedUsers.size;
    },
    
    // Vérifier si un utilisateur est connecté
    isUserConnected: (userId) => {
      const values = Array.from(connectedUsers.values());
      return values.includes(userId);
    }
  };
};

module.exports = { setupAlertSocket };