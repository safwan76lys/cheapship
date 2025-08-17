const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Routes
router.post('/', reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/can-review', reviewController.canReview);

module.exports = router;