const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit'); // ✅ AJOUT pour rate limiting
const router = express.Router();
const prisma = require('../config/database');
const authConfig = require('../config/auth');
const authMiddleware = require('../middleware/auth');
// ✅ CORRECTION : Import unique du service email
const emailService = require('../services/emailService');

// ✅ AJOUT : Rate limiting pour le renvoi d'email
const resendVerificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1, // 1 tentative par minute par IP
  message: {
    error: 'Trop de tentatives. Veuillez attendre 1 minute avant de renvoyer un email.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================
// INSCRIPTION
// ================================

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validation des données
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Email, mot de passe et nom complet requis'
      });
    }

    // ✅ VALIDATION RENFORCÉE DU MOT DE PASSE
    if (password.length < 8 || 
        !/[A-Z]/.test(password) || 
        !/[a-z]/.test(password) || 
        !/\d/.test(password) || 
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Un compte avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Générer un token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
        phone,
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Générer un JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ Nouvel utilisateur créé:', user.email);

    // ✅ ENVOYER EMAIL DE VÉRIFICATION
    try {
      const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
      if (emailResult.success) {
        console.log('✅ Email de vérification envoyé');
      } else {
        console.error('❌ Erreur envoi email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erreur critique envoi email:', emailError);
    }

    res.status(201).json({
      message: 'Compte créé avec succès',
      user,
      token,
      note: 'Vérifiez votre email pour activer votre compte'
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du compte'
    });
  }
});

// ================================
// CONNEXION
// ================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Compte désactivé'
      });
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Générer un JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ Connexion réussie:', user.email);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        role: user.role,
        profilePicture: user.profilePicture,
        rating: user.rating,
        totalRatings: user.totalRatings
      },
      token
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion'
    });
  }
});

// ================================
// MOT DE PASSE OUBLIÉ
// ================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requis'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return res.json({
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000) // 1h
      }
    });

    console.log('✅ Token de réinitialisation généré pour:', user.email);

    // ✅ ENVOYER EMAIL DE RÉINITIALISATION
    try {
      const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);
      if (emailResult.success) {
        console.log('✅ Email de réinitialisation envoyé');
      } else {
        console.error('❌ Erreur envoi email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erreur critique envoi email:', emailError);
    }

    res.json({
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation'
    });

  } catch (error) {
    console.error('❌ Erreur mot de passe oublié:', error);
    res.status(500).json({
      error: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// ================================
// RÉINITIALISER MOT DE PASSE
// ================================

router.post('/reset-password', async (req, res) => {
  try {
    console.log('📝 Début reset-password:', new Date().toISOString());
    
    const { token, password } = req.body;

    if (!token || !password) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        error: 'Token et nouveau mot de passe requis'
      });
    }

    // Validation du mot de passe
    if (password.length < 8 || 
        !/[A-Z]/.test(password) || 
        !/[a-z]/.test(password) || 
        !/\d/.test(password) || 
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      console.log('❌ Mot de passe invalide');
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      });
    }

    console.log('🔍 Recherche utilisateur avec token...');
    
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      console.log('❌ Token invalide ou expiré');
      return res.status(400).json({
        error: 'Token invalide ou expiré'
      });
    }

    console.log('✅ Utilisateur trouvé:', user.email);

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('🔒 Mise à jour du mot de passe...');

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    console.log('✅ Mot de passe réinitialisé pour:', user.email);

    // ✅ CONNEXION AUTOMATIQUE APRÈS RESET
    const loginToken = jwt.sign(
      { id: user.id, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('🎫 Token de connexion généré');

    res.json({
      message: 'Mot de passe réinitialisé avec succès',
      token: loginToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        role: user.role
      }
    });

    console.log('📝 Fin reset-password réussie:', new Date().toISOString());

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE reset-password:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation'
    });
  }
});

// ================================
// VÉRIFICATION EMAIL
// ================================

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token de vérification requis'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null
      }
    });

    console.log('✅ Email vérifié:', user.email);

    // ✅ ENVOYER EMAIL DE BIENVENUE
    try {
      const emailResult = await emailService.sendWelcomeEmail(user);
      if (emailResult.success) {
        console.log('✅ Email de bienvenue envoyé');
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email de bienvenue:', emailError);
    }

    res.json({
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur vérification email:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification'
    });
  }
});

// ✅ NOUVELLE ROUTE : RENVOYER EMAIL DE VÉRIFICATION
router.post('/resend-verification', 
  resendVerificationLimiter, 
  authMiddleware, 
  async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        verificationToken: true,
        verificationExpires: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Votre email est déjà vérifié'
      });
    }

    // Générer un nouveau token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Mettre à jour le token dans la base de données
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken,
        verificationExpires
      }
    });

    // Envoyer l'email de vérification
    try {
      const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
      
      if (emailResult.success) {
        console.log(`✅ Email de vérification renvoyé à: ${user.email}`);
        
        res.json({
          message: 'Email de vérification envoyé avec succès',
          email: user.email,
          sentAt: new Date().toISOString()
        });
      } else {
        throw new Error('Échec de l\'envoi de l\'email');
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email de vérification:', emailError);
      
      res.status(500).json({
        error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
      });
    }

  } catch (error) {
    console.error('❌ Erreur renvoi vérification:', error);
    res.status(500).json({
      error: 'Erreur lors du renvoi de l\'email de vérification'
    });
  }
});

// ✅ NOUVELLE ROUTE : STATUT EMAIL
router.get('/email-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailVerified: true,
        verificationExpires: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      email: user.email,
      emailVerified: user.emailVerified,
      verificationExpired: user.verificationExpires ? 
        new Date() > user.verificationExpires : false
    });

  } catch (error) {
    console.error('❌ Erreur statut email:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du statut'
    });
  }
});

// ✅ ROUTE DE TEST EMAIL
router.get('/test-email', async (req, res) => {
  try {
    const testResult = await emailService.getServiceStatus();
    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// ✅ NOUVELLE ROUTE : RENVOYER EMAIL DE VÉRIFICATION (PUBLIQUE)
router.post('/resend-verification-public', 
  resendVerificationLimiter, 
  async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requis'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        verificationToken: true,
        verificationExpires: true
      }
    });

    if (!user) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return res.json({
        message: 'Si cet email existe et n\'est pas vérifié, un nouvel email sera envoyé.'
      });
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Cet email est déjà vérifié. Vous pouvez vous connecter.'
      });
    }

    // Générer un nouveau token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Mettre à jour le token dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires
      }
    });

    // Envoyer l'email de vérification
    try {
      const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
      
      if (emailResult.success) {
        console.log(`✅ Email de vérification public renvoyé à: ${user.email}`);
        
        res.json({
          message: 'Email de vérification envoyé avec succès ! Vérifiez votre boîte mail.',
          email: user.email,
          sentAt: new Date().toISOString()
        });
      } else {
        throw new Error('Échec de l\'envoi de l\'email');
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email de vérification public:', emailError);
      
      res.status(500).json({
        error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
      });
    }

  } catch (error) {
    console.error('❌ Erreur renvoi vérification public:', error);
    res.status(500).json({
      error: 'Erreur lors du renvoi de l\'email de vérification'
    });
  }
});

// ================================
// AUTRES ROUTES
// ================================

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        profilePicture: true,
        rating: true,
        totalRatings: true,
        role: true,
        birthDate: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        identityVerified: true,
        createdAt: true,
        _count: {
          select: {
            trips: true,
            items: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('❌ Erreur profil:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    console.log('✅ Déconnexion:', req.user.email);
    res.json({
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la déconnexion'
    });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // ✅ VALIDATION RENFORCÉE DU NOUVEAU MOT DE PASSE
    if (newPassword.length < 8 || 
        !/[A-Z]/.test(newPassword) || 
        !/[a-z]/.test(newPassword) || 
        !/\d/.test(newPassword) || 
        !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Vérifier le mot de passe actuel
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    // ✅ AJOUT: Générer un token de connexion automatique
    const loginToken = jwt.sign(
      { id: user.id, email: user.email },
      authConfig.jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ Mot de passe changé pour:', user.email);

    res.json({
      message: 'Mot de passe modifié avec succès',
      // ✅ AJOUT: Retourner le token et les données utilisateur
      token: loginToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({
      error: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;