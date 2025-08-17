const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const prisma = require('../config/database');

// NOUVEAU : Import du service d'alertes
let alertService;
try {
  alertService = require('../services/alertService');
} catch (error) {
  console.warn('⚠️ Alert service not found - alerts disabled for parcels');
}

// ================================
// MIDDLEWARE DE TRACKING (DÉFINI LOCALEMENT)
// ================================

const trackEvent = (eventType) => {
  return async (req, res, next) => {
    res.locals.trackEvent = {
      eventType,
      userId: req.user?.id,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    };
    next();
  };
};

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ================================
// CRÉER UNE DEMANDE DE COLIS
// ================================

router.post('/', trackEvent('create_parcel'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      weight,
      value,
      pickupCity,
      pickupCountry,
      deliveryCity,
      deliveryCountry,
      pickupDate,
      deliveryDate,
      urgency,
      maxPrice,
      insurance,
      fragile,
      notes
    } = req.body;

    // Validation des données
    if (!name || !category || !weight || !value || !pickupCity || !deliveryCity || !maxPrice) {
      return res.status(400).json({ 
        error: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    if (parseFloat(weight) <= 0 || parseFloat(weight) > 30) {
      return res.status(400).json({ 
        error: 'Le poids doit être entre 0.1 et 30 kg' 
      });
    }

    if (parseFloat(value) <= 0) {
      return res.status(400).json({ 
        error: 'La valeur doit être supérieure à 0' 
      });
    }

    if (parseFloat(maxPrice) <= 0) {
      return res.status(400).json({ 
        error: 'Le budget doit être supérieur à 0' 
      });
    }

    // Vérifier que les dates sont cohérentes
    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);
    const now = new Date();

    if (pickup < now) {
      return res.status(400).json({ 
        error: 'La date d\'enlèvement ne peut pas être dans le passé' 
      });
    }

    if (delivery < pickup) {
      return res.status(400).json({ 
        error: 'La date de livraison doit être après la date d\'enlèvement' 
      });
    }

    // Créer la demande de colis
    const parcel = await prisma.item.create({
      data: {
        userId: req.user.id,
        name,
        description: description || '',
        category,
        weight: parseFloat(weight),
        value: parseFloat(value),
        pickupCity,
        pickupCountry: pickupCountry || 'France',
        deliveryCity,
        deliveryCountry: deliveryCountry || 'France',
        pickupDate: pickup,
        deliveryDate: delivery,
        urgency: urgency || 'normal',
        maxPrice: parseFloat(maxPrice),
        insurance: insurance || false,
        fragile: fragile || false,
        notes: notes || '',
        status: 'PENDING',
        images: [] // Les images seront ajoutées séparément
      }
    });

    // NOUVEAU : Vérifier les alertes après création du colis
    if (alertService) {
      try {
        const parcelForAlerts = {
          id: parcel.id,
          departureCity: parcel.pickupCity,
          arrivalCity: parcel.deliveryCity,
          departureDate: parcel.pickupDate,
          price: parcel.maxPrice, // Prix maximum que le client est prêt à payer
          weight: parcel.weight,
          departureLat: null, // Vous pouvez ajouter géolocalisation plus tard
          departureLng: null
        };
        
        await alertService.checkAlertsForNewOffer(parcelForAlerts, 'PARCEL');
        console.log(`[PARCELS] ✅ Alertes vérifiées pour le colis ${parcel.id}`);
      } catch (alertError) {
        // Ne pas faire échouer la création du colis si les alertes échouent
        console.error('[PARCELS] ❌ Erreur vérification alertes:', alertError);
      }
    }

    console.log('✅ Colis créé:', parcel.id);

    res.status(201).json({
      success: true,
      message: 'Demande de colis créée avec succès',
      parcel: {
        id: parcel.id,
        name: parcel.name,
        category: parcel.category,
        weight: parcel.weight,
        pickupCity: parcel.pickupCity,
        deliveryCity: parcel.deliveryCity,
        maxPrice: parcel.maxPrice,
        status: parcel.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la demande de colis',
      details: error.message 
    });
  }
});

// ================================
// RÉCUPÉRER LES COLIS DE L'UTILISATEUR
// ================================

router.get('/my-parcels', trackEvent('view_parcels'), async (req, res) => {
  try {
    const parcels = await prisma.item.findMany({
      where: { 
        userId: req.user.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      select: {
        id: true,
        name: true,
        category: true,
        weight: true,
        value: true,
        pickupCity: true,
        deliveryCity: true,
        pickupDate: true,
        deliveryDate: true,
        maxPrice: true,
        status: true,
        urgency: true,
        fragile: true,
        insurance: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      parcels,
      total: parcels.length
    });

  } catch (error) {
    console.error('❌ Error fetching user parcels:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des colis' 
    });
  }
});

// ================================
// RÉCUPÉRER UN COLIS SPÉCIFIQUE
// ================================

router.get('/:id', trackEvent('view_parcel_details'), async (req, res) => {
  try {
    const { id } = req.params;

    const parcel = await prisma.item.findFirst({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            rating: true,
            totalRatings: true
          }
        }
      }
    });

    if (!parcel) {
      return res.status(404).json({ 
        error: 'Colis non trouvé' 
      });
    }

    res.json({
      success: true,
      parcel
    });

  } catch (error) {
    console.error('❌ Error fetching parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du colis' 
    });
  }
});

// ================================
// METTRE À JOUR UN COLIS
// ================================

router.put('/:id', trackEvent('update_parcel'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le colis appartient à l'utilisateur
    const existingParcel = await prisma.item.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!existingParcel) {
      return res.status(404).json({ 
        error: 'Colis non trouvé' 
      });
    }

    // Ne permettre la modification que si le colis est encore en attente
    if (existingParcel.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Impossible de modifier un colis déjà assigné' 
      });
    }

    // Nettoyer les données d'update
    const allowedFields = [
      'name', 'description', 'weight', 'value', 'pickupDate', 
      'deliveryDate', 'maxPrice', 'urgency', 'notes'
    ];
    
    const cleanedData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'weight' || key === 'value' || key === 'maxPrice') {
          cleanedData[key] = parseFloat(updateData[key]);
        } else if (key === 'pickupDate' || key === 'deliveryDate') {
          cleanedData[key] = new Date(updateData[key]);
        } else {
          cleanedData[key] = updateData[key];
        }
      }
    });

    const updatedParcel = await prisma.item.update({
      where: { id },
      data: cleanedData
    });

    console.log('✅ Colis mis à jour:', updatedParcel.id);

    res.json({
      success: true,
      message: 'Colis mis à jour avec succès',
      parcel: updatedParcel
    });

  } catch (error) {
    console.error('❌ Error updating parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du colis' 
    });
  }
});

// ================================
// SUPPRIMER UN COLIS
// ================================

router.delete('/:id', trackEvent('delete_parcel'), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le colis appartient à l'utilisateur
    const existingParcel = await prisma.item.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!existingParcel) {
      return res.status(404).json({ 
        error: 'Colis non trouvé' 
      });
    }

    // Ne permettre la suppression que si le colis est encore en attente
    if (existingParcel.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un colis déjà assigné' 
      });
    }

    await prisma.item.delete({
      where: { id }
    });

    console.log('✅ Colis supprimé:', id);

    res.json({
      success: true,
      message: 'Colis supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du colis' 
    });
  }
});

// ================================
// RECHERCHER DES VOYAGES COMPATIBLES
// ================================

router.get('/:id/compatible-trips', trackEvent('search_compatible_trips'), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le colis
    const parcel = await prisma.item.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!parcel) {
      return res.status(404).json({ 
        error: 'Colis non trouvé' 
      });
    }

    // Rechercher des voyages compatibles avec algorithme avancé
    const compatibleTrips = await prisma.trip.findMany({
      where: {
        userId: { not: req.user.id }, // Pas ses propres voyages
        status: 'ACTIVE',
        departureCity: {
          equals: parcel.pickupCity,
          mode: 'insensitive'
        },
        arrivalCity: {
          equals: parcel.deliveryCity,
          mode: 'insensitive'
        },
        // Date flexible ±3 jours
        departureDate: {
          gte: new Date(new Date(parcel.pickupDate).getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(new Date(parcel.deliveryDate).getTime() + 3 * 24 * 60 * 60 * 1000)
        },
        availableWeight: {
          gte: parcel.weight
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            rating: true,
            totalRatings: true,
            profilePicture: true,
            identityVerified: true,
            emailVerified: true
          }
        }
      },
      orderBy: [
        { departureDate: 'asc' },
        { pricePerKg: 'asc' }
      ]
    });

    // Calculer le coût et la compatibilité pour chaque voyage
    const tripsWithDetails = compatibleTrips.map(trip => {
      const estimatedCost = (trip.pricePerKg * parcel.weight).toFixed(2);
      const isAffordable = parseFloat(estimatedCost) <= parcel.maxPrice;
      
      return {
        ...trip,
        estimatedCost,
        isAffordable
      };
    });

    res.json({
      success: true,
      parcel: {
        id: parcel.id,
        name: parcel.name,
        weight: parcel.weight,
        maxPrice: parcel.maxPrice,
        pickupCity: parcel.pickupCity,
        deliveryCity: parcel.deliveryCity,
        pickupDate: parcel.pickupDate
      },
      compatibleTrips: tripsWithDetails,
      totalFound: tripsWithDetails.length
    });

  } catch (error) {
    console.error('❌ Error finding compatible trips:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche de voyages compatibles' 
    });
  }
});

// ================================
// RECHERCHER DES COLIS
// ================================

router.get('/search', trackEvent('search_parcels'), async (req, res) => {
  try {
    const {
      pickupCity,
      deliveryCity,
      pickupDate,
      maxWeight,
      minPrice,
      category,
      page = 1,
      limit = 10
    } = req.query;

    const where = {
      status: 'PENDING',
      userId: { not: req.user.id }, // Exclure ses propres colis
      weight: maxWeight ? { lte: parseFloat(maxWeight) } : undefined,
      maxPrice: minPrice ? { gte: parseFloat(minPrice) } : undefined,
      category: category ? { equals: category } : undefined
    };

    // Filtres de villes
    if (pickupCity) {
      where.pickupCity = {
        contains: pickupCity,
        mode: 'insensitive'
      };
    }

    if (deliveryCity) {
      where.deliveryCity = {
        contains: deliveryCity,
        mode: 'insensitive'
      };
    }

    // Filtre de date
    if (pickupDate) {
      const searchDate = new Date(pickupDate);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.pickupDate = {
        gte: searchDate,
        lt: nextDay
      };
    }

    const parcels = await prisma.item.findMany({
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
        pickupDate: 'asc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.item.count({ where });

    res.json({
      success: true,
      parcels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching parcels:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche des colis' });
  }
});

// ================================
// CHANGER LE STATUT D'UN COLIS
// ================================

router.patch('/:id/status', trackEvent('update_parcel_status'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Statut invalide',
        validStatuses: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
      });
    }

    // Vérifier que le colis appartient à l'utilisateur
    const existingParcel = await prisma.item.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingParcel) {
      return res.status(404).json({ 
        error: 'Colis non trouvé ou non autorisé' 
      });
    }

    const updatedParcel = await prisma.item.update({
      where: {
        id: req.params.id
      },
      data: {
        status
      }
    });

    res.json({
      success: true,
      message: `Colis ${status === 'PENDING' ? 'remis en attente' : 
                status === 'ASSIGNED' ? 'assigné' : 
                status === 'IN_TRANSIT' ? 'en transit' : 
                status === 'DELIVERED' ? 'livré' : 'annulé'} avec succès`,
      parcel: updatedParcel
    });
  } catch (error) {
    console.error('Error updating parcel status:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du statut' 
    });
  }
});

// ================================
// STATISTIQUES DES COLIS DE L'UTILISATEUR
// ================================

router.get('/stats/summary', trackEvent('view_parcel_stats'), async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.item.groupBy({
      by: ['status'],
      where: { userId },
      _count: true
    });

    const totalParcels = await prisma.item.count({
      where: { userId }
    });

    const totalValue = await prisma.item.aggregate({
      where: { userId, status: 'DELIVERED' },
      _sum: { value: true }
    });

    const totalSpent = await prisma.item.aggregate({
      where: { userId, status: 'DELIVERED' },
      _sum: { maxPrice: true }
    });

    const summary = {
      total: totalParcels,
      pending: 0,
      assigned: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
      totalValueShipped: totalValue._sum.value || 0,
      totalSpent: totalSpent._sum.maxPrice || 0
    };

    stats.forEach(stat => {
      summary[stat.status.toLowerCase()] = stat._count;
    });

    res.json({
      success: true,
      stats: summary
    });
  } catch (error) {
    console.error('Error fetching parcel stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// ================================
// CATÉGORIES POPULAIRES
// ================================

router.get('/categories', trackEvent('view_categories'), async (req, res) => {
  try {
    const categories = await prisma.item.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 20
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    res.json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des catégories' 
    });
  }
});

// ================================
// ASSIGNER UN COLIS À UN VOYAGE
// ================================

router.post('/:id/assign', trackEvent('assign_parcel'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tripId } = req.body;

    // Vérifier que le colis appartient à l'utilisateur
    const parcel = await prisma.item.findFirst({
      where: { 
        id,
        userId: req.user.id,
        status: 'PENDING'
      }
    });

    if (!parcel) {
      return res.status(404).json({ 
        error: 'Colis non trouvé ou déjà assigné' 
      });
    }

    // Vérifier que le voyage existe et est compatible
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        status: 'ACTIVE',
        availableWeight: { gte: parcel.weight }
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    if (!trip) {
      return res.status(400).json({ 
        error: 'Voyage non compatible ou non disponible' 
      });
    }

    // Assigner le colis au voyage
    const updatedParcel = await prisma.item.update({
      where: { id },
      data: {
        tripId,
        status: 'ASSIGNED'
      }
    });

    // Réduire le poids disponible du voyage
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        availableWeight: {
          decrement: parcel.weight
        }
      }
    });

    // Ici vous pouvez ajouter une notification au transporteur
    console.log(`✅ Colis ${id} assigné au voyage ${tripId}`);

    res.json({
      success: true,
      message: 'Colis assigné avec succès au voyage',
      parcel: updatedParcel,
      transporterInfo: {
        name: trip.user.fullName,
        email: trip.user.email
      }
    });

  } catch (error) {
    console.error('❌ Error assigning parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'assignation du colis' 
    });
  }
});

module.exports = router;