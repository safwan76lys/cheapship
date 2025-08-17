// ================================
// SERVICE ALERTES - src/services/alertService.js
// ================================

const prisma = require('../config/database'); // Corrigé: chemin vers config/database

class AlertService {
  constructor() {
    this.prisma = prisma; // Utiliser l'instance partagée
  }

  // ================================
  // FONCTION PRINCIPALE : VÉRIFIER LES ALERTES LORS DE NOUVELLES OFFRES
  // ================================
  async checkAlertsForNewOffer(offerData, offerType) {
    try {
      console.log(`[ALERT_SERVICE] 🔍 Vérification alertes pour nouvelle offre ${offerType}`);
      
      // Déterminer le type d'alerte à chercher
      const alertType = offerType === 'FLIGHT' ? 'FLIGHT_NEEDED' : 'PARCEL_NEEDED';
      
      // Récupérer les alertes actives correspondantes
      const matchingAlerts = await this.findMatchingAlerts(offerData, alertType);
      
      console.log(`[ALERT_SERVICE] ${matchingAlerts.length} alertes correspondantes trouvées`);
      
      // Créer les notifications
      let notificationsCreated = 0;
      for (const alert of matchingAlerts) {
        try {
          await this.createAlertNotification(alert, offerData, offerType);
          notificationsCreated++;
        } catch (notifError) {
          console.error(`[ALERT_SERVICE] Erreur notification pour alerte ${alert.id}:`, notifError);
        }
      }
      
      return {
        success: true,
        alertsTriggered: matchingAlerts.length,
        notificationsSent: notificationsCreated
      };
      
    } catch (error) {
      console.error('[ALERT_SERVICE] ❌ Erreur vérification alertes:', error);
      // Ne pas faire échouer la création de l'offre
      return {
        success: false,
        error: error.message,
        alertsTriggered: 0,
        notificationsSent: 0
      };
    }
  }

  // ================================
  // TROUVER LES ALERTES CORRESPONDANTES
  // ================================
  async findMatchingAlerts(offerData, alertType) {
    const {
      departureCity,
      arrivalCity,
      departureDate,
      price,
      weight,
      departureLat,
      departureLng
    } = offerData;

    try {
      // Construire la requête de base
      const where = {
        type: alertType,
        status: 'ACTIVE',
        // Vérifier l'expiration
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      };

      // Filtre par ville de départ (obligatoire)
      if (departureCity) {
        where.departureCity = {
          contains: departureCity,
          mode: 'insensitive'
        };
      }

      // Récupérer toutes les alertes potentielles
      const alerts = await this.prisma.alert.findMany({
        where,
        include: {
          user: {
            select: { 
              id: true, 
              fullName: true, // Corrigé: fullName au lieu de name
              email: true, 
              phone: true 
            }
          }
        }
      });

      // Filtrer manuellement les alertes selon les critères avancés
      const matchingAlerts = alerts.filter(alert => {
        // Filtre ville d'arrivée (si spécifiée dans l'alerte)
        if (alert.arrivalCity && arrivalCity) {
          const alertArrival = alert.arrivalCity.toLowerCase();
          const offerArrival = arrivalCity.toLowerCase();
          if (!alertArrival.includes(offerArrival) && !offerArrival.includes(alertArrival)) {
            return false;
          }
        }

        // Filtre prix
        if (alert.maxPrice && price && price > alert.maxPrice) {
          return false;
        }
        
        // Filtre poids (pour les colis)
        if (alert.maxWeight && weight && weight > alert.maxWeight) {
          return false;
        }
        
        // Filtre date avec flexibilité
        if (alert.departureDate && departureDate) {
          const alertDate = new Date(alert.departureDate);
          const offerDate = new Date(departureDate);
          const flexDays = alert.departureDateFlex || 0;
          
          const diffTime = Math.abs(offerDate - alertDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > flexDays) {
            return false;
          }
        }
        
        // Filtre géolocalisation (rayon de 500km par défaut)
        if (alert.departureLat && alert.departureLng && departureLat && departureLng) {
          const distance = this.calculateDistance(
            alert.departureLat,
            alert.departureLng,
            departureLat,
            departureLng
          );
          
          if (distance > (alert.radius || 500)) {
            return false;
          }
        }
        
        return true;
      });

      return matchingAlerts;
    } catch (error) {
      console.error('[ALERT_SERVICE] Erreur recherche alertes:', error);
      return [];
    }
  }

  // ================================
  // CRÉER UNE NOTIFICATION D'ALERTE
  // ================================
  async createAlertNotification(alert, offerData, offerType) {
    try {
      const { id: offerId, departureCity, arrivalCity, departureDate, price } = offerData;
      
      // Construire le message de notification
      const title = offerType === 'FLIGHT' 
        ? `✈️ Nouveau vol disponible : ${departureCity} → ${arrivalCity || 'destination flexible'}`
        : `📦 Nouveau transport de colis disponible depuis ${departureCity}`;
      
      const message = this.buildNotificationMessage(alert, offerData, offerType);
      const actionUrl = `/app/${offerType.toLowerCase() === 'flight' ? 'trips' : 'parcels'}/${offerId}`;
      
      // Créer la notification en base
      const notification = await this.prisma.alertNotification.create({
        data: {
          alertId: alert.id,
          userId: alert.userId,
          triggeredBy: offerId,
          triggerType: offerType,
          title,
          message,
          actionUrl,
          status: 'PENDING'
        }
      });
      
      // Envoyer la notification (email, push, Socket.IO)
      await this.sendNotification(alert.user, notification);
      
      // Marquer comme envoyée
      await this.prisma.alertNotification.update({
        where: { id: notification.id },
        data: { status: 'SENT' }
      });
      
      console.log(`[ALERT_SERVICE] ✅ Notification envoyée à ${alert.user.email} pour l'alerte ${alert.id}`);
      
      return notification;
      
    } catch (error) {
      console.error('[ALERT_SERVICE] Erreur création notification:', error);
      throw error;
    }
  }

  // ================================
  // CONSTRUIRE LE MESSAGE DE NOTIFICATION
  // ================================
  buildNotificationMessage(alert, offerData, offerType) {
    const { departureCity, arrivalCity, departureDate, price, weight } = offerData;
    
    let message = `Une nouvelle offre correspond à vos critères !\n\n`;
    
    if (offerType === 'FLIGHT') {
      message += `✈️ Vol : ${departureCity}`;
      if (arrivalCity) message += ` → ${arrivalCity}`;
      if (departureDate) message += `\n📅 Date : ${new Date(departureDate).toLocaleDateString('fr-FR')}`;
      if (price) message += `\n💰 Prix : ${price}€/kg`;
      if (weight) message += `\n⚖️ Capacité : ${weight}kg`;
    } else {
      message += `📦 Demande de transport depuis ${departureCity}`;
      if (arrivalCity) message += ` vers ${arrivalCity}`;
      if (weight) message += `\n⚖️ Poids : ${weight}kg`;
      if (price) message += `\n💰 Budget : ${price}€`;
      if (departureDate) message += `\n📅 Enlèvement : ${new Date(departureDate).toLocaleDateString('fr-FR')}`;
    }
    
    message += `\n\n👆 Cliquez pour voir les détails et contacter la personne !`;
    
    return message;
  }

  // ================================
  // ENVOYER LA NOTIFICATION (EMAIL + PUSH + SOCKET.IO)
  // ================================
  async sendNotification(user, notification) {
    try {
      // 1. Email (si le service existe)
      try {
        await this.sendEmailNotification(user, notification);
      } catch (emailError) {
        console.log(`[ALERT_SERVICE] 📧 Service email non disponible pour ${user.email}`);
      }
      
      // 2. Socket.IO temps réel (si connecté)
      try {
        await this.sendSocketNotification(user, notification);
      } catch (socketError) {
        console.log(`[ALERT_SERVICE] 🔔 Socket.IO non disponible pour user_${user.id}`);
      }
      
      // 3. Log console pour debug
      console.log(`[ALERT_SERVICE] 🔔 Notification pour ${user.fullName}: ${notification.title}`);
      
    } catch (error) {
      console.error('[ALERT_SERVICE] Erreur envoi notification:', error);
    }
  }

  // ================================
  // ENVOYER EMAIL
  // ================================
  async sendEmailNotification(user, notification) {
    try {
      const emailService = require('../emailService'); // Corrigé: chemin relatif
      
      const emailData = {
        to: user.email,
        subject: `🔔 ${notification.title}`,
        html: `
          <h2>Nouvelle alerte Cheapship</h2>
          <p>Bonjour ${user.fullName},</p>
          <p>${notification.message.replace(/\n/g, '<br>')}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${notification.actionUrl}" 
             style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Voir l'offre
          </a>
        `
      };
      
      await emailService.sendEmail(emailData);
      console.log(`[ALERT_SERVICE] 📧 Email envoyé à ${user.email}`);
      
    } catch (error) {
      // Service email non disponible, pas grave
      throw error;
    }
  }

  // ================================
  // ENVOYER NOTIFICATION SOCKET.IO
  // ================================
  async sendSocketNotification(user, notification) {
    try {
      // Pour l'instant on log juste, Socket.IO sera intégré plus tard
      console.log(`[ALERT_SERVICE] 🔔 Socket.IO notification pour user_${user.id}`);
      
      // TODO: Intégrer avec votre système Socket.IO existant
      // const io = require('../socket/socketManager').getIO();
      // if (io) {
      //   io.to(`user_${user.id}`).emit('alert_notification', {
      //     id: notification.id,
      //     title: notification.title,
      //     message: notification.message,
      //     actionUrl: notification.actionUrl,
      //     createdAt: notification.createdAt
      //   });
      // }
      
    } catch (error) {
      throw error;
    }
  }

  // ================================
  // CALCULER DISTANCE GÉOGRAPHIQUE (Haversine)
  // ================================
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(value) {
    return (value * Math.PI) / 180;
  }

  // ================================
  // NETTOYER LES ALERTES EXPIRÉES (CRON JOB)
  // ================================
  async cleanupExpiredAlerts() {
    try {
      const result = await this.prisma.alert.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          status: { not: 'EXPIRED' }
        },
        data: { status: 'EXPIRED' }
      });
      
      console.log(`[ALERT_SERVICE] ${result.count} alertes expirées nettoyées`);
      return result.count;
      
    } catch (error) {
      console.error('[ALERT_SERVICE] Erreur nettoyage alertes expirées:', error);
      throw error;
    }
  }

  // ================================
  // MÉTHODES UTILITAIRES
  // ================================
  
  async getAlertStats() {
    try {
      const stats = await this.prisma.alert.groupBy({
        by: ['status', 'type'],
        _count: true
      });
      
      return stats;
    } catch (error) {
      console.error('[ALERT_SERVICE] Erreur stats alertes:', error);
      return [];
    }
  }

  async getUserAlerts(userId) {
    try {
      return await this.prisma.alert.findMany({
        where: { userId },
        include: {
          notifications: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('[ALERT_SERVICE] Erreur récupération alertes user:', error);
      return [];
    }
  }
}

// Exporter une instance unique du service
module.exports = new AlertService();