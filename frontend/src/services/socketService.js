// frontend/src/services/socketService.js
import { io } from 'socket.io-client';
// ✅ AJOUT : Import configuration API centralisée
import { API_CONFIG } from '../config/api';

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

    console.log('Connecting to Socket.IO server...');

    // ✅ MODIFICATION : Utiliser API_CONFIG au lieu d'URL hardcodée
    const SOCKET_URL = API_CONFIG.socketURL;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 30000, // ✅ Augmenté à 30s pour Render gratuit
      forceNew: true,
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,        // ✅ AJOUTÉ
      reconnectionAttempts: 5,   // ✅ AJOUTÉ 
      reconnectionDelay: 1000    // ✅ AJOUTÉ
    });

    this.setupEventListeners();

    // Ajout de l'écouteur de reconnexion
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.connected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.warn('Reconnection error:', error.message);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      
      // ✅ Message spécial pour la production Render
      if (API_CONFIG.socketURL.includes('onrender.com')) {
        console.log('⏳ Render service might be starting up, retrying...');
      }
    });

    return this.socket;
  }

  // Configuration des événements de base
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    // Événements de chat
    this.socket.on('new_message', (message) => {
      console.log('New message received:', message);
    });

    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data.userName);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log('User stopped typing:', data.userId);
    });

    // Événements de notifications
    this.socket.on('new_notification', (notification) => {
      console.log('New notification:', notification);
    });
  }

  // MÉTHODES DE CHAT
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
      console.log(`Joining conversation: ${conversationId}`);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
      console.log(`Leaving conversation: ${conversationId}`);
    }
  }

  sendMessage(conversationId, content, messageType = 'TEXT', metadata = null) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        messageType,
        metadata
      });
      console.log(`Sending message to conversation ${conversationId}`);
    } else {
      console.warn('Cannot send message: not connected to Socket.IO');
    }
  }

  markMessageAsRead(conversationId, messageId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', {
        conversationId,
        messageId
      });
    }
  }

  // INDICATEURS DE FRAPPE
  startTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  stopTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  // NOTIFICATIONS
  getUnreadNotifications() {
    if (this.socket?.connected) {
      this.socket.emit('get_unread_notifications');
    }
  }

  markNotificationAsRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_notification_read', notificationId);
    }
  }

  // ÉCOUTEURS D'ÉVÉNEMENTS
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
      this.addListener('new_message', callback);
    }
  }

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

  onMessageRead(callback) {
    if (this.socket) {
      this.socket.on('message_read', callback);
      this.addListener('message_read', callback);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new_notification', callback);
      this.addListener('new_notification', callback);
    }
  }

  onUnreadNotifications(callback) {
    if (this.socket) {
      this.socket.on('unread_notifications', callback);
      this.addListener('unread_notifications', callback);
    }
  }

  // GESTION DES LISTENERS
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.addListener(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
     
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }

  // UTILITAIRES
  isConnected() {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from Socket.IO...');
     
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();

      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket.IO disconnected');
    }
  }

  reconnect(token) {
    this.disconnect();
    return this.connect(token);
  }

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