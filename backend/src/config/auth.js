module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-key',
  jwtExpiresIn: '7d',
  
  // Sécurité
  saltRounds: 12,
  
  // Tokens de vérification
  verificationTokenExpiry: 24 * 60 * 60 * 1000, // 24 heures
  resetTokenExpiry: 60 * 60 * 1000, // 1 heure
  
  // Règles mot de passe
  passwordMinLength: 6,
  
  // Rate limiting
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
};