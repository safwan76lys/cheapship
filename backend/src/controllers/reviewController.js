const prisma = require('../config/database');

class ReviewController {
  // Créer un avis
  async createReview(req, res) {
    try {
      const { receiverId, tripId, rating, comment } = req.body;
      const authorId = req.user.id;

      // Vérifier qu'on ne s'évalue pas soi-même
      if (authorId === receiverId) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas vous évaluer vous-même'
        });
      }

      // Créer l'avis
      const review = await prisma.review.create({
        data: {
          authorId,
          receiverId,
          tripId,
          rating: parseInt(rating),
          comment
        }
      });

      res.status(201).json({
        message: 'Avis publié avec succès',
        review
      });

    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        error: 'Erreur lors de la création de l\'avis'
      });
    }
  }

  // Récupérer les avis d'un utilisateur
  async getUserReviews(req, res) {
    try {
      const { userId } = req.params;

      const reviews = await prisma.review.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });

      res.json({ reviews });

    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des avis'
      });
    }
  }

  // Vérifier si peut laisser un avis
  async canReview(req, res) {
    try {
      const { receiverId, tripId } = req.query;
      const authorId = req.user.id;

      if (authorId === receiverId) {
        return res.json({ canReview: false, reason: 'Vous ne pouvez pas vous évaluer' });
      }

      res.json({ canReview: true });

    } catch (error) {
      console.error('Can review error:', error);
      res.status(500).json({
        error: 'Erreur lors de la vérification'
      });
    }
  }
}

module.exports = new ReviewController();