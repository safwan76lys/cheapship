const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Corrigé: votre middleware d'auth
const prisma = require('../config/database'); // Corrigé: votre config database

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Validation middleware simple
const validateAlert = (req, res, next) => {
  const { type, departureCity } = req.body;
  
  if (!type || !['FLIGHT_NEEDED', 'PARCEL_NEEDED'].includes(type)) {
    return res.status(400).json({
      error: 'Type d\'alerte invalide (FLIGHT_NEEDED ou PARCEL_NEEDED requis)'
    });
  }
  
  if (!departureCity || departureCity.trim().length < 2) {
    return res.status(400).json({
      error: 'Ville de départ requise (minimum 2 caractères)'
    });
  }
  
  next();
};

// ================================
// CRÉER UNE ALERTE
// ================================
router.post('/', validateAlert, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      departureCity,
      arrivalCity,
      departureDate,
      departureDateFlex,
      maxPrice,
      maxWeight,
      description,
      departureLat,
      departureLng,
      radius,
      expiresAt
    } = req.body;

    // Vérifier le nombre d'alertes actives (limite par user)
    const activeAlertsCount = await prisma.alert.count({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (activeAlertsCount >= 10) {
      return res.status(400).json({
        error: 'Limite d\'alertes atteinte',
        message: 'Vous ne pouvez avoir que 10 alertes actives maximum'
      });
    }

    // Créer l'alerte
    const alert = await prisma.alert.create({
      data: {
        userId,
        type,
        departureCity,
        arrivalCity,
        departureDate: departureDate ? new Date(departureDate) : null,
        departureDateFlex,
        maxPrice,
        maxWeight,
        description,
        departureLat,
        departureLng,
        radius: radius || 500,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true } // Corrigé: fullName au lieu de name
        }
      }
    });

    // Log audit
    console.log(`[ALERT] ✅ Nouvelle alerte créée - User: ${userId}, Type: ${type}, Ville: ${departureCity}`);

    res.status(201).json({
      success: true,
      alert,
      message: 'Alerte créée avec succès ! Vous serez notifié dès qu\'une offre correspond à vos critères.'
    });

  } catch (error) {
    console.error('❌ Erreur création alerte:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'alerte',
      details: error.message
    });
  }
});

// ================================
// LISTE MES ALERTES
// ================================
router.get('/my-alerts', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', type = 'all' } = req.query;

    const where = { userId };
    
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (type !== 'all') {
      where.type = type.toUpperCase();
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        notifications: {
          where: { status: { in: ['PENDING', 'SENT'] } },
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { notifications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      alerts,
      stats: {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'ACTIVE').length,
        paused: alerts.filter(a => a.status === 'PAUSED').length
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération alertes:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des alertes'
    });
  }
});

// ================================
// METTRE À JOUR UNE ALERTE
// ================================
router.put('/:alertId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { alertId } = req.params;
    const updateData = req.body;

    // Vérifier que l'alerte appartient à l'utilisateur
    const existingAlert = await prisma.alert.findFirst({
      where: { id: alertId, userId }
    });

    if (!existingAlert) {
      return res.status(404).json({
        error: 'Alerte non trouvée'
      });
    }

    // Convertir les dates si présentes
    if (updateData.departureDate) {
      updateData.departureDate = new Date(updateData.departureDate);
    }
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true } // Corrigé: fullName
        }
      }
    });

    res.json({
      success: true,
      alert: updatedAlert,
      message: 'Alerte mise à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour alerte:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'alerte'
    });
  }
});

// ================================
// ACTIVER/DÉSACTIVER UNE ALERTE
// ================================
router.patch('/:alertId/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const { alertId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      return res.status(400).json({
        error: 'Status invalide',
        validStatuses: ['ACTIVE', 'PAUSED']
      });
    }

    const alert = await prisma.alert.updateMany({
      where: { id: alertId, userId },
      data: { status, updatedAt: new Date() }
    });

    if (alert.count === 0) {
      return res.status(404).json({
        error: 'Alerte non trouvée'
      });
    }

    res.json({
      success: true,
      message: `Alerte ${status === 'ACTIVE' ? 'activée' : 'mise en pause'} avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur changement status alerte:', error);
    res.status(500).json({
      error: 'Erreur lors du changement de status'
    });
  }
});

// ================================
// SUPPRIMER UNE ALERTE
// ================================
router.delete('/:alertId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { alertId } = req.params;

    const result = await prisma.alert.deleteMany({
      where: { id: alertId, userId }
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: 'Alerte non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Alerte supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression alerte:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'alerte'
    });
  }
});

// ================================
// HISTORIQUE NOTIFICATIONS D'UNE ALERTE
// ================================
router.get('/:alertId/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { alertId } = req.params;

    // Vérifier que l'alerte appartient à l'utilisateur
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, userId }
    });

    if (!alert) {
      return res.status(404).json({
        error: 'Alerte non trouvée'
      });
    }

    const notifications = await prisma.alertNotification.findMany({
      where: { alertId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      notifications,
      total: notifications.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération notifications alerte:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des notifications'
    });
  }
});

// ================================
// STATISTIQUES DES ALERTES
// ================================
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await prisma.alert.groupBy({
      by: ['status', 'type'],
      where: { userId },
      _count: true
    });
    
    const alertStats = {
      total: 0,
      active: 0,
      paused: 0,
      byType: { FLIGHT_NEEDED: 0, PARCEL_NEEDED: 0 }
    };
    
    stats.forEach(stat => {
      alertStats.total += stat._count;
      alertStats[stat.status.toLowerCase()] += stat._count;
      alertStats.byType[stat.type] += stat._count;
    });

    res.json({
      success: true,
      stats: alertStats
    });

  } catch (error) {
    console.error('❌ Erreur stats alertes:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
