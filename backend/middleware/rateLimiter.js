// ================================
// RATE LIMITER MIDDLEWARE - CHEAPSHIP
// ================================

const rateLimit = require('express-rate-limit');

// ✅ HELPER FUNCTION POUR IPv6 (résout l'erreur Railway)
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         'unknown';
};

// ================================
// RATE LIMITERS GÉNÉRAUX
// ================================

// Rate limiter général pour l'API
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limite par IP
  message: {
    error: 'Trop de requêtes. Réessayez dans 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP, // ✅ FIX IPv6
  skip: (req) => {
    // Ignorer en développement si configuré
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  }
});

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 tentatives max
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP, // ✅ FIX IPv6
  skipSuccessfulRequests: true // Ne compte que les échecs
});

// ================================
// RATE LIMITERS SPÉCIALISÉS
// ================================

// Rate limiter pour la création de compte
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 comptes par heure max
  message: {
    error: 'Trop de créations de compte. Réessayez dans 1 heure.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// Rate limiter pour le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives de login
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP, // ✅ FIX IPv6
  skipSuccessfulRequests: true
});

// Rate limiter pour les emails (vérification, reset, etc.)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 emails par heure
  message: {
    error: 'Trop d\'emails envoyés. Réessayez dans 1 heure.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// Rate limiter pour les uploads de fichiers
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads par 15 minutes
  message: {
    error: 'Trop d\'uploads. Réessayez dans 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// Rate limiter pour les messages/chat
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages par minute
  message: {
    error: 'Trop de messages. Ralentissez le rythme.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// Rate limiter pour les recherches
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 recherches par minute
  message: {
    error: 'Trop de recherches. Réessayez dans 1 minute.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// ================================
// RATE LIMITERS MÉTIER
// ================================

// Rate limiter pour la création de voyages
const tripCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 voyages par heure
  message: {
    error: 'Trop de voyages créés. Réessayez dans 1 heure.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// Rate limiter pour la création de colis
const parcelCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 15, // 15 colis par heure
  message: {
    error: 'Trop de colis créés. Réessayez dans 1 heure.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// Rate limiter pour les notifications
const notificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 notifications par 5 minutes
  message: {
    error: 'Trop de notifications. Réessayez dans 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP // ✅ FIX IPv6
});

// ================================
// EXPORTS
// ================================

module.exports = {
  // Limiters généraux
  apiLimiter,
  authLimiter,
  
  // Limiters d'authentification
  createAccountLimiter,
  loginLimiter,
  emailLimiter,
  
  // Limiters de fonctionnalités
  uploadLimiter,
  messageLimiter,
  searchLimiter,
  
  // Limiters métier
  tripCreationLimiter,
  parcelCreationLimiter,
  notificationLimiter,
  
  // Helper function
  getClientIP
};

// ================================
// LOGGING ET DEBUG
// ================================

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Rate limiters configurés:');
  console.log(`   • API: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/15min`);
  console.log(`   • Auth: ${process.env.AUTH_RATE_LIMIT_MAX || 5} req/15min`);
  console.log(`   • Upload: 20 req/15min`);
  console.log(`   • Messages: 30 req/1min`);
  console.log(`   • Recherche: 20 req/1min`);
  console.log(`   • IPv6 support: ✅ Activé`);
}