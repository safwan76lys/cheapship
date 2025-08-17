const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const authConfig = require('../config/auth');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map();    // socketId -> userId
  }

  // Initialiser Socket.IO avec le serveur HTTP
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
          process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ Socket.IO initialized');
  }

  // Middleware d'authentification pour Socket.IO
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token manquant'));
        }

        const decoded = jwt.verify(token, authConfig.jwtSecret);
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return next(new Error('Utilisateur non trouvé ou inactif'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();

      } catch (error) {
        console.error('❌ Socket auth error:', error);
        next(new Error('Token invalide'));
      }
    });
  }

  // Configuration des événements Socket.IO
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.user.fullName} (${socket.userId})`);
      
      // Enregistrer la connexion
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, socket.userId);

      // Rejoindre une room personnelle pour les notifications
      socket.join(`user:${socket.userId}`);

      // Événements de messagerie
      this.setupMessageEvents(socket);
      
      // Événements de typing
      this.setupTypingEvents(socket);
      
      // Événements de notifications
      this.setupNotificationEvents(socket);

      // Déconnexion
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.user.fullName}`);
        this.connectedUsers.delete(socket.userId);
        this.userSockets.delete(socket.id);
      });
    });
  }

  // Événements de messagerie
  setupMessageEvents(socket) {
    // Rejoindre une conversation
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Vérifier que l'utilisateur participe à cette conversation
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: socket.userId
          }
        });

        if (participant) {
          socket.join(`conversation:${conversationId}`);
          console.log(`👥 ${socket.user.fullName} joined conversation ${conversationId}`);
          
          // Marquer les messages comme lus
          await this.markMessagesAsRead(conversationId, socket.userId);
        } else {
          socket.emit('error', { message: 'Accès non autorisé à cette conversation' });
        }
      } catch (error) {
        console.error('❌ Error joining conversation:', error);
        socket.emit('error', { message: 'Erreur lors de la connexion à la conversation' });
      }
    });

    // Quitter une conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`👥 ${socket.user.fullName} left conversation ${conversationId}`);
    });

    // Envoyer un message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'TEXT', metadata } = data;

        // Créer le message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId,
            content: content.trim(),
            messageType,
            metadata,
            status: 'SENT'
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true
              }
            }
          }
        });

        // Diffuser le message à tous les participants de la conversation
        this.io.to(`conversation:${conversationId}`).emit('new_message', {
          id: message.id,
          content: message.content,
          messageType: message.messageType,
          metadata: message.metadata,
          senderId: message.senderId,
          sender: message.sender,
          conversationId: message.conversationId,
          createdAt: message.createdAt,
          status: 'DELIVERED'
        });

        console.log(`📨 Message sent in conversation ${conversationId} by ${socket.user.fullName}`);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });
  }

  // Événements de typing
  setupTypingEvents(socket) {
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.fullName,
        conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId
      });
    });
  }

  // Événements de notifications
  setupNotificationEvents(socket) {
    // L'utilisateur demande ses notifications non lues
    socket.on('get_unread_notifications', async () => {
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            userId: socket.userId,
            read: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        });

        socket.emit('unread_notifications', notifications);
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      }
    });
  }

  // Marquer les messages comme lus
  async markMessagesAsRead(conversationId, userId) {
    try {
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: {
            not: userId
          },
          readAt: null
        },
        data: {
          readAt: new Date(),
          status: 'READ'
        }
      });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  // Méthodes utilitaires publiques

  // Envoyer un message à un utilisateur spécifique
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Diffuser à tous les utilisateurs connectés
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Obtenir les statistiques de connexion
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalSockets: this.io?.engine?.clientsCount || 0,
      rooms: this.io ? Array.from(this.io.sockets.adapter.rooms.keys()) : []
    };
  }

  // Vérifier si un utilisateur est connecté
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Obtenir les utilisateurs connectés
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

// Instance singleton
const socketService = new SocketService();

module.exports = socketService;