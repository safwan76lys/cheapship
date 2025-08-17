const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const prisma = require('../config/database');
const authConfig = require('../config/auth');
const authMiddleware = require('../middleware/auth');

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

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
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

    // TODO: Envoyer email de vérification
    // await emailService.sendVerificationEmail(user.email, verificationToken);

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
// PROFIL UTILISATEUR
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

    // TODO: Envoyer email avec le lien
    // await emailService.sendPasswordReset(user.email, resetToken);

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
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token et nouveau mot de passe requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Token invalide ou expiré'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    res.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error);
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation'
    });
  }
});

// ================================
// DÉCONNEXION
// ================================

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Avec JWT, la déconnexion est côté client
    // On pourrait implémenter une blacklist de tokens ici
    
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

// ================================
// CHANGER MOT DE PASSE
// ================================

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
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

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Mot de passe changé pour:', user.email);

    res.json({
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({
      error: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;