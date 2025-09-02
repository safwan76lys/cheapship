const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPhoneVerification } = require('../middleware/phoneVerification');
const prisma = require('../config/database');

// Import du service d'alertes
let alertService;
try {
  alertService = require('../services/alertService');
} catch (error) {
  console.warn('⚠️ Alert service not found - alerts disabled for parcels');
}

// Middleware de tracking local
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
// ROUTES DE CONSULTATION (pas de vérification téléphone)
// ================================

// Rechercher des colis (PUBLIC)
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
            phoneVerified: true,
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

// Récupérer mes colis
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
    console.error('Error fetching user parcels:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des colis' 
    });
  }
});

// Récupérer un colis spécifique
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
    console.error('Error fetching parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du colis' 
    });
  }
});

// Rechercher des voyages compatibles pour un colis
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

    // Rechercher des voyages compatibles
    const compatibleTrips = await prisma.trip.findMany({
      where: {
        userId: { not: req.user.id },
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
            phoneVerified: true,
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
    console.error('Error finding compatible trips:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche de voyages compatibles' 
    });
  }
});

// Statistiques des colis de l'utilisateur
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

// Catégories populaires
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
// ROUTES D'ACTIONS CRITIQUES (vérification téléphone obligatoire)
// ================================

// Créer une demande de colis (PROTÉGÉ)
router.post('/', checkPhoneVerification, async (req, res) => {
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

    console.log('Création de colis autorisée - téléphone vérifié');

    // Validation des données obligatoires
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
        images: []
      }
    });

    // Vérifier les alertes après création du colis
    if (alertService) {
      try {
        const parcelForAlerts = {
          id: parcel.id,
          departureCity: parcel.pickupCity,
          arrivalCity: parcel.deliveryCity,
          departureDate: parcel.pickupDate,
          price: parcel.maxPrice,
          weight: parcel.weight,
          departureLat: null,
          departureLng: null
        };
        
        await alertService.checkAlertsForNewOffer(parcelForAlerts, 'PARCEL');
        console.log(`[PARCELS] Alertes vérifiées pour le colis ${parcel.id}`);
      } catch (alertError) {
        console.error('[PARCELS] Erreur vérification alertes:', alertError);
      }
    }

    console.log('Colis créé:', parcel.id);

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
        status: parcel.status,
        createdAt: parcel.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating parcel:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la demande de colis'
    });
  }
});

// Signaler un problème avec un colis (PROTÉGÉ)
router.post('/:id/report-issue', checkPhoneVerification, trackEvent('report_parcel_issue'), async (req, res) => {
  try {
    const { id } = req.params;
    const { issueType, description, severity } = req.body;

    const validIssueTypes = [
      'DELAYED_PICKUP',
      'DELAYED_DELIVERY', 
      'DAMAGED_PARCEL',
      'LOST_PARCEL',
      'TRANSPORTER_ISSUE',
      'PAYMENT_ISSUE',
      'OTHER'
    ];

    if (!issueType || !validIssueTypes.includes(issueType)) {
      return res.status(400).json({
        error: 'Type de problème requis',
        validTypes: validIssueTypes
      });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({
        error: 'Description du problème requise (minimum 10 caractères)'
      });
    }

    const parcel = await prisma.item.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        trip: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        }
      }
    });

    if (!parcel) {
      return res.status(404).json({
        error: 'Colis non trouvé'
      });
    }

    // Créer le signalement
    const issue = await prisma.issue.create({
      data: {
        reporterId: req.user.id,
        parcelId: id,
        tripId: parcel.tripId,
        transporterId: parcel.trip?.userId,
        type: issueType,
        description,
        severity: severity || 'MEDIUM',
        status: 'OPEN'
      }
    }).catch(() => {
      // Si la table issue n'existe pas, créer un log
      console.log(`Issue reported for parcel ${id}: ${issueType} - ${description}`);
      return {
        id: `issue_${Date.now()}`,
        type: issueType,
        description,
        status: 'LOGGED'
      };
    });

    // Notifier l'équipe support et le transporteur si nécessaire
    if (parcel.trip && ['DAMAGED_PARCEL', 'LOST_PARCEL', 'TRANSPORTER_ISSUE'].includes(issueType)) {
      console.log(`URGENT: Issue ${issueType} reported for parcel ${id} with transporter ${parcel.trip.user.fullName}`);
    }

    res.json({
      success: true,
      message: 'Signalement enregistré avec succès',
      issue: {
        id: issue.id,
        type: issueType,
        status: issue.status || 'LOGGED',
        description: description.substring(0, 100) + '...',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error reporting parcel issue:', error);
    res.status(500).json({
      error: 'Erreur lors du signalement'
    });
  }
});

// Dupliquer un colis (créer une nouvelle demande basée sur une existante) (PROTÉGÉ)
router.post('/:id/duplicate', checkPhoneVerification, trackEvent('duplicate_parcel'), async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupDate, deliveryDate, maxPrice } = req.body;

    const originalParcel = await prisma.item.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!originalParcel) {
      return res.status(404).json({
        error: 'Colis original non trouvé'
      });
    }

    // Valider les nouvelles dates
    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);
    const now = new Date();

    if (pickup < now) {
      return res.status(400).json({
        error: 'La nouvelle date d\'enlèvement ne peut pas être dans le passé'
      });
    }

    if (delivery < pickup) {
      return res.status(400).json({
        error: 'La nouvelle date de livraison doit être après la date d\'enlèvement'
      });
    }

    // Créer le nouveau colis avec les mêmes caractéristiques
    const duplicatedParcel = await prisma.item.create({
      data: {
        userId: req.user.id,
        name: `${originalParcel.name} (Copie)`,
        description: originalParcel.description,
        category: originalParcel.category,
        weight: originalParcel.weight,
        value: originalParcel.value,
        pickupCity: originalParcel.pickupCity,
        pickupCountry: originalParcel.pickupCountry,
        deliveryCity: originalParcel.deliveryCity,
        deliveryCountry: originalParcel.deliveryCountry,
        pickupDate: pickup,
        deliveryDate: delivery,
        urgency: originalParcel.urgency,
        maxPrice: maxPrice ? parseFloat(maxPrice) : originalParcel.maxPrice,
        insurance: originalParcel.insurance,
        fragile: originalParcel.fragile,
        notes: originalParcel.notes + '\n\n[Copie du colis ' + id + ']',
        status: 'PENDING',
        images: []
      }
    });

    console.log(`Colis ${id} dupliqué vers ${duplicatedParcel.id}`);

    res.status(201).json({
      success: true,
      message: 'Colis dupliqué avec succès',
      originalParcel: {
        id: originalParcel.id,
        name: originalParcel.name
      },
      duplicatedParcel: {
        id: duplicatedParcel.id,
        name: duplicatedParcel.name,
        pickupDate: duplicatedParcel.pickupDate,
        deliveryDate: duplicatedParcel.deliveryDate,
        maxPrice: duplicatedParcel.maxPrice,
        status: duplicatedParcel.status
      }
    });

  } catch (error) {
    console.error('Error duplicating parcel:', error);
    res.status(500).json({
      error: 'Erreur lors de la duplication du colis'
    });
  }
});

// Obtenir les recommandations de prix pour un trajet (PUBLIC)
router.get('/pricing/recommendations', async (req, res) => {
  try {
    const { pickup, delivery, weight, category } = req.query;

    if (!pickup || !delivery || !weight) {
      return res.status(400).json({
        error: 'Ville de départ, d\'arrivée et poids requis'
      });
    }

    // Calculer les prix moyens pour ce trajet
    const avgPrices = await prisma.item.aggregate({
      where: {
        pickupCity: { contains: pickup, mode: 'insensitive' },
        deliveryCity: { contains: delivery, mode: 'insensitive' },
        status: 'DELIVERED',
        weight: {
          gte: parseFloat(weight) - 2,
          lte: parseFloat(weight) + 2
        },
        category: category || undefined
      },
      _avg: { maxPrice: true, agreedPrice: true },
      _count: true
    });

    // Calculer les prix récents (30 derniers jours)
    const recentPrices = await prisma.item.aggregate({
      where: {
        pickupCity: { contains: pickup, mode: 'insensitive' },
        deliveryCity: { contains: delivery, mode: 'insensitive' },
        status: 'DELIVERED',
        weight: {
          gte: parseFloat(weight) - 2,
          lte: parseFloat(weight) + 2
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _avg: { agreedPrice: true },
      _count: true
    });

    const basePrice = parseFloat(weight) * 2; // Prix de base 2€/kg
    const averagePrice = avgPrices._avg.agreedPrice || avgPrices._avg.maxPrice || basePrice;
    const recentAverage = recentPrices._avg.agreedPrice || averagePrice;

    const recommendations = {
      suggested: {
        min: Math.round(Math.max(basePrice * 0.8, averagePrice * 0.7)),
        optimal: Math.round(recentAverage),
        max: Math.round(averagePrice * 1.3)
      },
      market: {
        average: Math.round(averagePrice),
        recent: Math.round(recentAverage),
        dataPoints: avgPrices._count,
        recentDataPoints: recentPrices._count
      },
      factors: {
        weight: `${weight} kg`,
        route: `${pickup} → ${delivery}`,
        category: category || 'Général',
        baseRate: `${basePrice}€ (2€/kg)`
      }
    };

    res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Error calculating price recommendations:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul des recommandations de prix'
    });
  }
});

// Obtenir les statistiques publiques de transport
router.get('/public/stats', trackEvent('view_public_stats'), async (req, res) => {
  try {
    // Stats générales de la plateforme
    const [
      totalParcels,
      deliveredParcels,
      activeParcels,
      avgDeliveryTime,
      topRoutes
    ] = await Promise.all([
      // Total des colis
      prisma.item.count(),
      
      // Colis livrés
      prisma.item.count({ where: { status: 'DELIVERED' } }),
      
      // Colis actifs
      prisma.item.count({ 
        where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_TRANSIT'] } } 
      }),
      
      // Temps de livraison moyen (simulé)
      Promise.resolve(3.2),
      
      // Top 5 des routes les plus demandées
      prisma.item.groupBy({
        by: ['pickupCity', 'deliveryCity'],
        _count: true,
        orderBy: { _count: { _all: 'desc' } },
        take: 5
      })
    ]);

    const successRate = totalParcels > 0 ? Math.round((deliveredParcels / totalParcels) * 100) : 0;

    const stats = {
      platform: {
        totalParcels: totalParcels,
        delivered: deliveredParcels,
        active: activeParcels,
        successRate: `${successRate}%`,
        avgDeliveryTime: `${avgDeliveryTime} jours`
      },
      popularRoutes: topRoutes.map((route, index) => ({
        rank: index + 1,
        route: `${route.pickupCity} → ${route.deliveryCity}`,
        count: route._count
      })),
      categories: await prisma.item.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { _all: 'desc' } },
        take: 6
      }).then(cats => cats.map(cat => ({
        name: cat.category,
        count: cat._count
      }))),
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Route de nettoyage et maintenance (ADMIN uniquement)
router.post('/admin/cleanup', checkPhoneVerification, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin (vous devrez implémenter cette logique)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Accès administrateur requis'
      });
    }

    const { action, daysOld } = req.body;
    const days = parseInt(daysOld) || 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let result = {};

    switch (action) {
      case 'cleanup_old_pending':
        // Nettoyer les colis en attente trop anciens
        const oldPending = await prisma.item.updateMany({
          where: {
            status: 'PENDING',
            createdAt: { lt: cutoffDate }
          },
          data: {
            status: 'CANCELLED',
            notes: `Auto-annulé après ${days} jours d'inactivité`
          }
        });
        result = { cancelledParcels: oldPending.count };
        break;

      case 'cleanup_orphaned':
        // Nettoyer les colis assignés à des voyages inexistants
        const orphaned = await prisma.item.findMany({
          where: {
            status: 'ASSIGNED',
            tripId: { not: null }
          },
          include: { trip: true }
        });
        
        const orphanedIds = orphaned
          .filter(p => !p.trip)
          .map(p => p.id);

        if (orphanedIds.length > 0) {
          await prisma.item.updateMany({
            where: { id: { in: orphanedIds } },
            data: {
              status: 'PENDING',
              tripId: null,
              assignedAt: null
            }
          });
        }
        result = { repairedParcels: orphanedIds.length };
        break;

      default:
        return res.status(400).json({
          error: 'Action non reconnue',
          validActions: ['cleanup_old_pending', 'cleanup_orphaned']
        });
    }

    console.log(`Admin cleanup performed: ${action}`, result);

    res.json({
      success: true,
      message: `Nettoyage ${action} effectué avec succès`,
      result
    });

  } catch (error) {
    console.error('Error in admin cleanup:', error);
    res.status(500).json({
      error: 'Erreur lors du nettoyage administratif'
    });
  }
});

module.exports = router;