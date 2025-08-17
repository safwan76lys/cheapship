const { body, validationResult } = require('express-validator');

// Règles de validation pour l'inscription
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  body('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom complet doit contenir au moins 2 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide')
];

// Règles de validation pour la connexion
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  handleValidationErrors
};
const validateAlert = (req, res, next) => {
  const {
    type,
    departureCity,
    departureDateFlex,
    maxPrice,
    maxWeight,
    radius
  } = req.body;

  const errors = [];

  // Type obligatoire
  if (!type || !['FLIGHT_NEEDED', 'PARCEL_NEEDED'].includes(type)) {
    errors.push('Type d\'alerte invalide (FLIGHT_NEEDED ou PARCEL_NEEDED requis)');
  }

  // Ville de départ obligatoire
  if (!departureCity || departureCity.trim().length < 2) {
    errors.push('Ville de départ requise (minimum 2 caractères)');
  }

  // Validation flexibilité date
  if (departureDateFlex && (departureDateFlex < 0 || departureDateFlex > 90)) {
    errors.push('Flexibilité de date invalide (0-90 jours)');
  }

  // Validation prix max
  if (maxPrice && (maxPrice < 0 || maxPrice > 10000)) {
    errors.push('Prix maximum invalide (0-10000€)');
  }

  // Validation poids max
  if (maxWeight && (maxWeight < 0 || maxWeight > 100)) {
    errors.push('Poids maximum invalide (0-100kg)');
  }

  // Validation rayon
  if (radius && (radius < 10 || radius > 1000)) {
    errors.push('Rayon invalide (10-1000km)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Données d\'alerte invalides',
      details: errors
    });
  }

  next();
};

const validateAlertUpdate = (req, res, next) => {
  // Validation similaire mais tous les champs sont optionnels pour la mise à jour
  const {
    departureDateFlex,
    maxPrice,
    maxWeight,
    radius
  } = req.body;

  const errors = [];

  if (departureDateFlex !== undefined && (departureDateFlex < 0 || departureDateFlex > 90)) {
    errors.push('Flexibilité de date invalide (0-90 jours)');
  }

  if (maxPrice !== undefined && (maxPrice < 0 || maxPrice > 10000)) {
    errors.push('Prix maximum invalide (0-10000€)');
  }

  if (maxWeight !== undefined && (maxWeight < 0 || maxWeight > 100)) {
    errors.push('Poids maximum invalide (0-100kg)');
  }

  if (radius !== undefined && (radius < 10 || radius > 1000)) {
    errors.push('Rayon invalide (10-1000km)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Données de mise à jour invalides',
      details: errors
    });
  }

  next();
};