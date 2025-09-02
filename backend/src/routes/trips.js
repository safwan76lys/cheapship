const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPhoneVerification } = require('../middleware/phoneVerification');
const prisma = require('../config/database');
const alertService = require('../services/alertService');
const { trackEvent } = require('../middleware/analytics');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ================================
// ROUTES DE CONSULTATION (pas de vérification téléphone)
// ================================

// Rechercher des voyages (PUBLIC)
router.get('/search', async (req, res) => {
  try {
    const {
      departureCity,
      arrivalCity,
      departureDate,
      minWeight,
      maxPricePerKg,
      page = 1,
      limit = 10
    } = req.query;

    const where = {
      status: 'ACTIVE',
      userId: { not: req.user.id }, // Exclure ses propres voyages
      availableWeight: minWeight ? { gte: parseFloat(minWeight) } : undefined,
      pricePerKg: maxPricePerKg ? { lte: parseFloat(maxPricePerKg) } : undefined
    };

    // Filtres de villes
    if (departureCity) {
      where.departureCity = {
        contains: departureCity,
        mode: 'insensitive'
      };
    }

    if (arrivalCity) {
      where.arrivalCity = {
        contains: arrivalCity,
        mode: 'insensitive'
      };
    }

    // Filtre de date
    if (departureDate) {
      const searchDate = new Date(departureDate);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.departureDate = {
        gte: searchDate,
        lt: nextDay
      };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            phoneVerified: true,
            identityVerified: true,
            rating: true,
            totalRatings: true
          }
        }
      },
      orderBy: {
        departureDate: 'asc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.trip.count({ where });

    res.json({
      success: true,
      trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching trips:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche des voyages' });
  }
});

// Obtenir mes voyages
router.get('/my-trips', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const whereClause = { userId };
    if (status && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      whereClause.status = status;
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.trip.count({
      where: whereClause
    });

    res.json({
      success: true,
      trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching my trips:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des voyages' 
    });
  }
});

// Obtenir un voyage spécifique
router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
            phoneVerified: true,
            identityVerified: true,
            rating: true,
            totalRatings: true
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ 
        error: 'Voyage non trouvé' 
      });
    }

    res.json({
      success: true,
      trip
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du voyage' 
    });
  }
});

// Statistiques des voyages de l'utilisateur
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.trip.groupBy({
      by: ['status'],
      where: { userId },
      _count: true
    });

    const totalTrips = await prisma.trip.count({
      where: { userId }
    });

    const totalWeight = await prisma.trip.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { availableWeight: true }
    });

    const totalEarnings = await prisma.trip.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { pricePerKg: true }
    });

    const summary = {
      total: totalTrips,
      active: 0,
      completed: 0,
      cancelled: 0,
      totalWeightTransported: totalWeight._sum.availableWeight || 0,
      estimatedEarnings: totalEarnings._sum.pricePerKg || 0
    };

    stats.forEach(stat => {
      summary[stat.status.toLowerCase()] = stat._count;
    });

    res.json({
      success: true,
      stats: summary
    });
  } catch (error) {
    console.error('Error fetching trip stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// ================================
// ROUTES D'ACTIONS CRITIQUES (vérification téléphone obligatoire)
// ================================

// Créer un voyage (PROTÉGÉ)
router.post('/', checkPhoneVerification, async (req, res) => {
  try {
    const {
      departureCity,
      departureCountry,
      arrivalCity,
      arrivalCountry,
      departureDate,
      arrivalDate,
      availableWeight,
      pricePerKg,
      description
    } = req.body;

    console.log('Création de voyage autorisée - téléphone vérifié');

    // Validation des données
    if (!departureCity || !arrivalCity || !departureDate || !arrivalDate || 
        !availableWeight || !pricePerKg) {
      return res.status(400).json({ 
        error: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    if (parseFloat(availableWeight) <= 0 || parseFloat(availableWeight) > 50) {
      return res.status(400).json({ 
        error: 'Le poids disponible doit être entre 0.1 et 50 kg' 
      });
    }

    if (parseFloat(pricePerKg) <= 0) {
      return res.status(400).json({ 
        error: 'Le prix par kg doit être supérieur à 0' 
      });
    }

    // Vérifier les dates
    const departure = new Date(departureDate);
    const arrival = new Date(arrivalDate);
    const now = new Date();

    if (departure < now) {
      return res.status(400).json({ 
        error: 'La date de départ ne peut pas être dans le passé' 
      });
    }

    if (arrival < departure) {
      return res.status(400).json({ 
        error: 'La date d\'arrivée doit être après la date de départ' 
      });
    }

    const trip = await prisma.trip.create({
      data: {
        userId: req.user.id,
        departureCity,
        departureCountry: departureCountry || 'France',
        arrivalCity,
        arrivalCountry: arrivalCountry || 'France',
        departureDate: departure,
        arrivalDate: arrival,
        availableWeight: parseFloat(availableWeight),
        pricePerKg: parseFloat(pricePerKg),
        description,
        status: 'ACTIVE'
      }
    });

    // Vérifier les alertes après création
    try {
      const tripForAlerts = {
        id: trip.id,
        departureCity: trip.departureCity,
        arrivalCity: trip.arrivalCity,
        departureDate: trip.departureDate,
        price: trip.pricePerKg,
        weight: trip.availableWeight,
        departureLat: null,
        departureLng: null
      };
      
      await alertService.checkAlertsForNewOffer(tripForAlerts, 'FLIGHT');
      console.log(`[TRIPS] Alertes vérifiées pour le voyage ${trip.id}`);
    } catch (alertError) {
      console.error('[TRIPS] Erreur vérification alertes:', alertError);
    }

    res.status(201).json({
      success: true,
      message: 'Voyage créé avec succès',
      trip
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du voyage'
    });
  }
});

// Modifier un voyage (PROTÉGÉ)
router.put('/:id', checkPhoneVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le voyage appartient à l'utilisateur
    const existingTrip = await prisma.trip.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!existingTrip) {
      return res.status(404).json({ 
        error: 'Voyage non trouvé' 
      });
    }

    // Ne permettre la modification que si le voyage est encore actif
    if (existingTrip.status !== 'ACTIVE') {
      return res.status(400).json({ 
        error: 'Impossible de modifier un voyage terminé ou annulé' 
      });
    }

    // Validation des données
    if (updateData.departureDate && updateData.arrivalDate) {
      const departure = new Date(updateData.departureDate);
      const arrival = new Date(updateData.arrivalDate);
      
      if (departure >= arrival) {
        return res.status(400).json({ 
          error: 'La date d\'arrivée doit être après la date de départ' 
        });
      }
    }

    if (updateData.availableWeight && (parseFloat(updateData.availableWeight) <= 0 || parseFloat(updateData.availableWeight) > 50)) {
      return res.status(400).json({ 
        error: 'Le poids doit être entre 0.1 et 50 kg' 
      });
    }

    // Nettoyer les données d'update
    const allowedFields = [
      'departureCity', 'departureCountry', 'arrivalCity', 'arrivalCountry',
      'departureDate', 'arrivalDate', 'availableWeight', 'pricePerKg', 'description'
    ];
    
    const cleanedData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'departureDate' || key === 'arrivalDate') {
          cleanedData[key] = new Date(updateData[key]);
        } else if (key === 'availableWeight' || key === 'pricePerKg') {
          cleanedData[key] = parseFloat(updateData[key]);
        } else {
          cleanedData[key] = updateData[key];
        }
      }
    });

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: cleanedData
    });

    console.log('Voyage mis à jour:', updatedTrip.id);

    res.json({
      success: true,
      message: 'Voyage mis à jour avec succès',
      trip: updatedTrip
    });

  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du voyage' 
    });
  }
});

// Supprimer un voyage (PROTÉGÉ)
router.delete('/:id', checkPhoneVerification, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le voyage appartient à l'utilisateur
    const existingTrip = await prisma.trip.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!existingTrip) {
      return res.status(404).json({ 
        error: 'Voyage non trouvé' 
      });
    }

    // Ne permettre la suppression que si le voyage est encore actif
    if (existingTrip.status !== 'ACTIVE') {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un voyage terminé ou annulé' 
      });
    }

    await prisma.trip.delete({
      where: { id }
    });

    console.log('Voyage supprimé:', id);

    res.json({
      success: true,
      message: 'Voyage supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du voyage' 
    });
  }
});

// Changer le statut d'un voyage (PROTÉGÉ)
router.patch('/:id/status', checkPhoneVerification, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Statut invalide',
        validStatuses: ['ACTIVE', 'COMPLETED', 'CANCELLED']
      });
    }

    // Vérifier que le voyage appartient à l'utilisateur
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingTrip) {
      return res.status(404).json({ 
        error: 'Voyage non trouvé ou non autorisé' 
      });
    }

    const updatedTrip = await prisma.trip.update({
      where: {
        id: req.params.id
      },
      data: {
        status
      }
    });

    res.json({
      success: true,
      message: `Voyage ${status === 'ACTIVE' ? 'activé' : status === 'COMPLETED' ? 'marqué comme terminé' : 'annulé'} avec succès`,
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du statut' 
    });
  }
});

module.exports = router;