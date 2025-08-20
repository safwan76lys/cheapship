const rateLimit = require('express-rate-limit');

// Rate limiter général pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting en développement pour certaines routes
    if (process.env.NODE_ENV === 'development') {
      return req.path.startsWith('/api/health') || req.path.startsWith('/api/docs');
    }
    return false;
  }
});

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    error: 'Trop de tentatives de connexion, réessayez dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Ne compte que les échecs
});

// Rate limiter pour les messages
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages par minute
  message: {
    error: 'Trop de messages envoyés, ralentissez un peu'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter pour les uploads
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 uploads par 10 minutes
  message: {
    error: 'Trop d\'uploads, réessayez dans 10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ✅ NOUVEAU : Rate limiter pour la vérification email
const resendVerificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1, // 1 tentative par minute par IP
  message: {
    error: 'Trop de tentatives. Veuillez attendre 1 minute avant de renvoyer un email.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Compte toutes les tentatives
});

module.exports = {
  apiLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  resendVerificationLimiter // ✅ AJOUT
};