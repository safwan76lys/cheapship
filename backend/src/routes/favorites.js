const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const prisma = require('../config/database');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ================================
// FAVORIS
// ================================

// Récupérer tous les favoris de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, page = 1, limit = 20 } = req.query;

    // Filtres
    const whereClause = { userId };
    if (type && ['ITEM', 'TRIP', 'USER'].includes(type)) {
      whereClause.type = type;
    }

    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      include: {
        item: {
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
        },
        // Note: Trip relation will be added when we update the schema
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Compter le total
    const total = await prisma.favorite.count({
      where: whereClause
    });

    // Formatter les favoris
    const formattedFavorites = favorites.map(fav => ({
      id: fav.id,
      type: fav.type,
      createdAt: fav.createdAt,
      item: fav.item ? {
        id: fav.item.id,
        name: fav.item.name,
        description: fav.item.description,
        category: fav.item.category,
        weight: fav.item.weight,
        value: fav.item.value,
        maxPrice: fav.item.maxPrice,
        pickupCity: fav.item.pickupCity,
        deliveryCity: fav.item.deliveryCity,
        pickupDate: fav.item.pickupDate,
        deliveryDate: fav.item.deliveryDate,
        urgency: fav.item.urgency,
        fragile: fav.item.fragile,
        insurance: fav.item.insurance,
        images: fav.item.images,
        status: fav.item.status,
        user: fav.item.user
      } : null
    }));

    res.json({
      favorites: formattedFavorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des favoris' 
    });
  }
});

// Ajouter aux favoris
router.post('/', async (req, res) => {
  try {
    const { itemId, tripId, itemType } = req.body;
    const userId = req.user.id;

    // Valider les paramètres
    if (!itemId && !tripId) {
      return res.status(400).json({
        error: 'itemId ou tripId requis'
      });
    }

    if (itemId && tripId) {
      return res.status(400).json({
        error: 'Impossible d\'ajouter un item et un trip en même temps'
      });
    }

    // Déterminer le type de favori
    let favoriteType = 'ITEM';
    let targetId = itemId;

    if (tripId) {
      favoriteType = 'TRIP';
      targetId = tripId;
    }

    // Vérifier que l'objet existe
    if (favoriteType === 'ITEM') {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true, userId: true }
      });

      if (!item) {
        return res.status(404).json({
          error: 'Colis non trouvé'
        });
      }

      // Empêcher d'ajouter ses propres items aux favoris
      if (item.userId === userId) {
        return res.status(400).json({
          error: 'Impossible d\'ajouter vos propres colis aux favoris'
        });
      }
    }

    if (favoriteType === 'TRIP') {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { id: true, userId: true }
      });

      if (!trip) {
        return res.status(404).json({
          error: 'Voyage non trouvé'
        });
      }

      // Empêcher d'ajouter ses propres voyages aux favoris
      if (trip.userId === userId) {
        return res.status(400).json({
          error: 'Impossible d\'ajouter vos propres voyages aux favoris'
        });
      }
    }

    // Vérifier si déjà en favoris
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        ...(favoriteType === 'ITEM' ? { itemId } : {}),
        ...(favoriteType === 'TRIP' ? { tripId } : {})
      }
    });

    if (existingFavorite) {
      return res.status(409).json({
        error: 'Déjà ajouté aux favoris'
      });
    }

    // Créer le favori
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        type: favoriteType,
        ...(favoriteType === 'ITEM' ? { itemId } : {}),
        ...(favoriteType === 'TRIP' ? { tripId } : {})
      },
      include: {
        item: favoriteType === 'ITEM' ? {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
                identityVerified: true,
                rating: true
              }
            }
          }
        } : false
      }
    });

    console.log('✅ Favori ajouté:', favorite.id);

    res.status(201).json({
      message: 'Ajouté aux favoris avec succès',
      favorite
    });

  } catch (error) {
    console.error('❌ Error adding favorite:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'ajout aux favoris' 
    });
  }
});

// Retirer des favoris (par ID d'item/trip)
router.delete('/:targetId', async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user.id;

    // Chercher le favori (peut être un item ou un trip)
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        OR: [
          { itemId: targetId },
          { tripId: targetId }
        ]
      }
    });

    if (!favorite) {
      return res.status(404).json({
        error: 'Favori non trouvé'
      });
    }

    // Supprimer le favori
    await prisma.favorite.delete({
      where: { id: favorite.id }
    });

    console.log('✅ Favori retiré:', favorite.id);

    res.json({
      message: 'Retiré des favoris avec succès'
    });

  } catch (error) {
    console.error('❌ Error removing favorite:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du favori' 
    });
  }
});

// Supprimer un favori par son ID direct
router.delete('/direct/:favoriteId', async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const userId = req.user.id;

    // Vérifier que le favori appartient à l'utilisateur
    const favorite = await prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId
      }
    });

    if (!favorite) {
      return res.status(404).json({
        error: 'Favori non trouvé'
      });
    }

    // Supprimer le favori
    await prisma.favorite.delete({
      where: { id: favoriteId }
    });

    console.log('✅ Favori supprimé:', favoriteId);

    res.json({
      message: 'Favori supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting favorite:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du favori' 
    });
  }
});

// Vérifier si un item/trip est en favoris
router.get('/check/:targetId', async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        OR: [
          { itemId: targetId },
          { tripId: targetId }
        ]
      }
    });

    res.json({
      isFavorite: !!favorite,
      favoriteId: favorite?.id || null
    });

  } catch (error) {
    console.error('❌ Error checking favorite:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification' 
    });
  }
});

// Obtenir les statistiques des favoris
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.favorite.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        id: true
      }
    });

    const formattedStats = {
      total: 0,
      items: 0,
      trips: 0,
      users: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat._count.id;
      
      if (stat.type === 'ITEM') {
        formattedStats.items = stat._count.id;
      } else if (stat.type === 'TRIP') {
        formattedStats.trips = stat._count.id;
      } else if (stat.type === 'USER') {
        formattedStats.users = stat._count.id;
      }
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('❌ Error fetching favorite stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;