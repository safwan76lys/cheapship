// ================================
// MIDDLEWARE PHONE VERIFICATION - backend/src/middleware/phoneVerification.js  
// Middleware pour protéger les actions critiques
// ================================

/**
 * Middleware qui vérifie si l'utilisateur a vérifié son téléphone
 * Bloque l'accès aux actions critiques si non vérifié
 */
const checkPhoneVerification = (req, res, next) => {
  console.log('🔍 Vérification téléphone pour utilisateur:', req.user.id);
  console.log('📱 Statut téléphone vérifié:', req.user.phoneVerified);
  
  if (!req.user.phoneVerified) {
    console.log('❌ Téléphone non vérifié - accès bloqué');
    
    return res.status(403).json({
      error: 'Téléphone non vérifié',
      message: 'Vous devez vérifier votre numéro de téléphone pour effectuer cette action',
      requiresPhoneVerification: true,
      code: 'PHONE_VERIFICATION_REQUIRED'
    });
  }
  
  console.log('✅ Téléphone vérifié - accès autorisé');
  next();
};

/**
 * Middleware optionnel qui recommande la vérification sans bloquer
 */
const recommendPhoneVerification = (req, res, next) => {
  if (!req.user.phoneVerified) {
    res.locals.phoneVerificationRecommended = true;
  }
  next();
};

module.exports = {
  checkPhoneVerification,
  recommendPhoneVerification
};