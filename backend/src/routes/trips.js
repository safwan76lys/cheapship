const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../config/database');
const alertService = require('../services/alertService'); // NOUVEAU
const { trackEvent } = require('../middleware/analytics');
const { checkPhoneVerification } = require('../middleware/phoneVerification');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Créer un voyage
router.post('/', checkPhoneVerification, async (req, res) => { // ✅ CORRECTION: Enlever le double authMiddleware
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

    console.log('✅ Création de voyage autorisée - téléphone vérifié'); // ✅ CORRECTION: Déplacer le log avant la création

    const trip = await prisma.trip.create({
      data: {
        userId: req.user.id,
        departureCity,
        departureCountry,
        arrivalCity,
        arrivalCountry,
        departureDate: new Date(departureDate),
        arrivalDate: new Date(arrivalDate),
        availableWeight: parseFloat(availableWeight),
        pricePerKg: parseFloat(pricePerKg),
        description,
        status: 'ACTIVE'
      }
    });

    // NOUVEAU : Vérifier les alertes après création du voyage
    try {
      const tripForAlerts = {
        id: trip.id,
        departureCity: trip.departureCity,
        arrivalCity: trip.arrivalCity,
        departureDate: trip.departureDate,
        price: trip.pricePerKg, // Prix par kg pour les alertes
        weight: trip.availableWeight,
        departureLat: null, // Vous pouvez ajouter géolocalisation plus tard
        departureLng: null
      };
      
      await alertService.checkAlertsForNewOffer(tripForAlerts, 'FLIGHT');
      console.log(`[TRIPS] ✅ Alertes vérifiées pour le voyage ${trip.id}`);
    } catch (alertError) {
      // Ne pas faire échouer la création du voyage si les alertes échouent
      console.error('[TRIPS] ❌ Erreur vérification alertes:', alertError);
    }

    res.status(201).json({
      success: true,
      message: 'Voyage créé avec succès',
      trip
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du voyage',
      details: error.message
    });
  }
});
// Supprimer un voyage
router.delete('/:id', async (req, res) => {
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

    console.log('✅ Voyage supprimé:', id);

    res.json({
      success: true,
      message: 'Voyage supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du voyage' 
    });
  }
});

// Modifier un voyage
router.put('/:id', async (req, res) => {
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

    if (updateData.availableWeight && (parseFloat(updateData.availableWeight) <= 0 || parseFloat(updateData.availableWeight) > 30)) {
      return res.status(400).json({ 
        error: 'Le poids doit être entre 0.5 et 30 kg' 
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

    console.log('✅ Voyage mis à jour:', updatedTrip.id);

    res.json({
      success: true,
      message: 'Voyage mis à jour avec succès',
      trip: updatedTrip
    });

  } catch (error) {
    console.error('❌ Error updating trip:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du voyage' 
    });
  }
});
// Récupérer mes voyages
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
// NOUVELLE ROUTE : Rechercher des voyages
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

// NOUVELLE ROUTE : Obtenir un voyage spécifique
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

// NOUVELLE ROUTE : Changer le statut d'un voyage
router.patch('/:id/status', async (req, res) => {
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

// NOUVELLE ROUTE : Statistiques des voyages de l'utilisateur
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

module.exports = router;