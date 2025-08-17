// frontend/src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  // Connexion Socket.IO avec token JWT
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log('🔌 Connecting to Socket.IO server...');

    this.socket = io('http://localhost:4000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Configuration des événements de base
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    // Événements de chat
    this.socket.on('new_message', (message) => {
      console.log('📨 New message received:', message);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data.userName);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log('⌨️ User stopped typing:', data.userId);
    });

    // Événements de notifications
    this.socket.on('new_notification', (notification) => {
      console.log('🔔 New notification:', notification);
    });
  }

  // ================================
  // MÉTHODES DE CHAT
  // ================================

  // Rejoindre une conversation
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
      console.log(`👥 Joining conversation: ${conversationId}`);
    }
  }

  // Quitter une conversation
  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
      console.log(`👥 Leaving conversation: ${conversationId}`);
    }
  }

  // Envoyer un message
  sendMessage(conversationId, content, messageType = 'TEXT', metadata = null) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        messageType,
        metadata
      });
      console.log(`📤 Sending message to conversation ${conversationId}`);
    } else {
      console.warn('❌ Cannot send message: not connected to Socket.IO');
    }
  }

  // Marquer un message comme lu
  markMessageAsRead(conversationId, messageId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', {
        conversationId,
        messageId
      });
    }
  }

  // ================================
  // INDICATEURS DE FRAPPE
  // ================================

  // Commencer à taper
  startTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  // Arrêter de taper
  stopTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  // ================================
  // NOTIFICATIONS
  // ================================

  // Demander les notifications non lues
  getUnreadNotifications() {
    if (this.socket?.connected) {
      this.socket.emit('get_unread_notifications');
    }
  }

  // Marquer une notification comme lue
  markNotificationAsRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_notification_read', notificationId);
    }
  }

  // ================================
  // ÉCOUTEURS D'ÉVÉNEMENTS
  // ================================

  // Écouter les nouveaux messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
      this.addListener('new_message', callback);
    }
  }

  // Écouter les indicateurs de frappe
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
      this.addListener('user_typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
      this.addListener('user_stop_typing', callback);
    }
  }

  // Écouter les accusés de lecture
  onMessageRead(callback) {
    if (this.socket) {
      this.socket.on('message_read', callback);
      this.addListener('message_read', callback);
    }
  }

  // Écouter les nouvelles notifications
  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new_notification', callback);
      this.addListener('new_notification', callback);
    }
  }

  // Écouter les notifications non lues
  onUnreadNotifications(callback) {
    if (this.socket) {
      this.socket.on('unread_notifications', callback);
      this.addListener('unread_notifications', callback);
    }
  }

  // ================================
  // GESTION DES LISTENERS
  // ================================

  // Ajouter un listener au stockage
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Ajouter un listener générique
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.addListener(event, callback);
    }
  }

  // Retirer un listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Nettoyer du stockage
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }

  // ================================
  // UTILITAIRES
  // ================================

  // Vérifier l'état de connexion
  isConnected() {
    return this.socket?.connected || false;
  }

  // Déconnexion propre
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO...');
      
      // Nettoyer tous les listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();

      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 Socket.IO disconnected');
    }
  }

  // Reconnecter
  reconnect(token) {
    this.disconnect();
    return this.connect(token);
  }

  // Status de connexion
  getConnectionStatus() {
    return {
      connected: this.connected,
      socketId: this.socket?.id || null,
      transport: this.socket?.io?.engine?.transport?.name || null
    };
  }
}

// Instance singleton
const socketService = new SocketService();

export default socketService;