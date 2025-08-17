const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const emailService = require('../services/emailService');
const authConfig = require('../config/auth');

class AuthController {
  // Inscription
  async register(req, res) {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, phone } = req.body;

      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'Un compte existe déjà avec cet email'
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, authConfig.saltRounds);

      // Générer un token de vérification
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + authConfig.emailVerificationExpiresIn);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone,
          verificationToken,
          verificationExpires
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          emailVerified: true,
          createdAt: true
        }
      });

      // Envoyer l'email de vérification
      await emailService.sendVerificationEmail(user, verificationToken);

      res.status(201).json({
        message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
        user
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'inscription',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  // Vérification email
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          error: 'Token de vérification manquant'
        });
      }

      // Trouver l'utilisateur avec ce token
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
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationExpires: null
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          emailVerified: true
        }
      });

      // Envoyer email de bienvenue
      await emailService.sendWelcomeEmail(updatedUser);

      res.json({
        message: 'Email vérifié avec succès',
        user: updatedUser
      });

    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        error: 'Erreur lors de la vérification'
      });
    }
  }

  // Connexion
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          fullName: true,
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          role: true,
          profilePicture: true,
          rating: true,
          totalRatings: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Votre compte a été désactivé. Contactez le support.'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier si l'email est vérifié
      if (!user.emailVerified) {
        return res.status(401).json({
          error: 'Veuillez vérifier votre email avant de vous connecter',
          needsVerification: true
        });
      }

      // Mettre à jour lastLoginAt
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Générer le token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiresIn }
      );

      // Retirer le mot de passe de la réponse
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Connexion réussie',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Erreur lors de la connexion'
      });
    }
  }
}

module.exports = new AuthController();
