// src/middleware/rate-limiters.js

const rateLimit = require('express-rate-limit');

// Définition sécurisée de trustProxy
// En production : confiance au 1er proxy (Render, Cloudflare, etc.)
// En développement : pas de proxy
const trustProxy = process.env.NODE_ENV === 'production' ? 1 : false;

// ================================
// RATE LIMITERS PRINCIPAUX
// ================================

// Rate limiter général pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  trustProxy,
  validate: true,
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return req.path.startsWith('/api/health') || req.path.startsWith('/api/docs');
    }
    return false;
  }
});

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  trustProxy,
  validate: true,
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
  max: 30,
  trustProxy,
  validate: true,
  message: {
    error: 'Trop de messages envoyés, ralentissez un peu'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter pour les uploads
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  trustProxy,
  validate: true,
  message: {
    error: 'Trop d\'uploads, réessayez dans 10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter pour le renvoi de vérification email
const resendVerificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1,
  trustProxy,
  validate: true,
  message: {
    error: 'Trop de tentatives. Veuillez attendre 1 minute avant de renvoyer un email.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// ================================
// RATE LIMITERS SMS
// ================================

// Limiteur pour demander un code SMS (ex: /api/auth/send-sms)
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  trustProxy,
  validate: true,
  message: {
    error: 'Trop de demandes SMS',
    message: 'Vous avez envoyé trop de demandes SMS. Réessayez dans 1 heure.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `sms_${req.user?.id || req.ip}`;
  }
});

// Limiteur pour vérifier un code SMS (ex: /api/auth/verify-sms)
const smsVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  trustProxy,
  validate: true,
  message: {
    error: 'Trop de tentatives de vérification',
    message: 'Trop de tentatives de vérification du code SMS. Réessayez dans 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `sms_verify_${req.user?.id || req.ip}`;
  }
});

// ✅ Export complet
module.exports = {
  apiLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  resendVerificationLimiter,
  smsLimiter,
  smsVerifyLimiter
};