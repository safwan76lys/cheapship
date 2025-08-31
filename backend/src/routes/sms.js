const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const vonageService = require('../services/vonageService');
const prisma = require('../config/database');

// Route pour démarrer la vérification SMS
router.post('/verify/start', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    if (!phone) {
      return res.status(400).json({
        error: 'Numéro de téléphone requis'
      });
    }

    // Formater le numéro de téléphone
    const formattedPhone = vonageService.formatPhoneNumber(phone, '+20'); // Égypte

    // Envoyer le SMS
    const smsResult = await vonageService.sendVerificationSMS(formattedPhone);

    if (smsResult.success) {
      // Sauvegarder le code en base pour cet utilisateur
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneVerificationToken: smsResult.code, // Stocker le code généré
          phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
      });

      res.json({
        success: true,
        message: 'Code de vérification envoyé par SMS',
        messageId: smsResult.messageId
      });
    } else {
      res.status(400).json({
        error: 'Erreur lors de l\'envoi du SMS'
      });
    }

  } catch (error) {
    console.error('Erreur démarrage vérification SMS:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi du SMS de vérification'
    });
  }
});

// Route pour vérifier le code SMS
router.post('/verify/check', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        error: 'Code de vérification requis'
      });
    }

    // Récupérer le code stocké depuis la base
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerificationToken: true,
        phoneVerificationExpires: true
      }
    });

    if (!user.phoneVerificationToken) {
      return res.status(400).json({
        error: 'Aucune vérification en cours'
      });
    }

    if (new Date() > user.phoneVerificationExpires) {
      return res.status(400).json({
        error: 'Code de vérification expiré'
      });
    }

    // Comparer le code
    if (user.phoneVerificationToken === code) {
      // Marquer le téléphone comme vérifié
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneVerified: true,
          phoneVerificationToken: null,
          phoneVerificationExpires: null
        }
      });

      res.json({
        success: true,
        message: 'Téléphone vérifié avec succès'
      });
    } else {
      res.status(400).json({
        error: 'Code de vérification incorrect'
      });
    }

  } catch (error) {
    console.error('Erreur vérification code SMS:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du code'
    });
  }
});

module.exports = router;