const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const vonageService = require('../services/vonageService');
const prisma = require('../config/database');
const rateLimiter = require('../middleware/rateLimiter');


// route de test sms.js 
router.post('/test-config', authMiddleware, async (req, res) => {
  try {
    res.json({
      hasApiKey: !!process.env.VONAGE_API_KEY,
      hasApiSecret: !!process.env.VONAGE_API_SECRET,
      hasSignatureSecret: !!process.env.VONAGE_SIGNATURE_SECRET,
      apiKeyValue: process.env.VONAGE_API_KEY ? process.env.VONAGE_API_KEY.substring(0, 4) + '***' : 'MANQUANT',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
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

    // Vérifier si le téléphone n'est pas déjà vérifié
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true }
    });

    if (user.phoneVerified) {
      return res.status(400).json({
        error: 'Votre téléphone est déjà vérifié'
      });
    }

    // Formater le numéro international (détection automatique du pays)
    const formattedPhone = vonageService.formatPhoneNumber(phone);
    
    // Envoyer le SMS de vérification
    const smsResult = await vonageService.sendVerificationSMS(formattedPhone);

    if (smsResult.success) {
      // Sauvegarder le code et le numéro en base
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: formattedPhone,
          phoneVerificationToken: smsResult.code,
          phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          phoneVerified: false
        }
      });

      res.json({
        success: true,
        message: 'Code de vérification envoyé par SMS',
        phone: formattedPhone.replace(/(\+\d{2})(\d+)(\d{2})/, '$1***$3'), // Masquer le numéro
        expiresIn: 600 // 10 minutes en secondes
      });

    } else {
      res.status(400).json({
        error: 'Impossible d\'envoyer le SMS. Vérifiez votre numéro.'
      });
    }

  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi du SMS de vérification'
    });
  }
});

// Route pour vérifier le code SMS saisi par l'utilisateur
router.post('/verify/check', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        error: 'Code de vérification requis'
      });
    }

    // Récupérer les données de vérification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerificationToken: true,
        phoneVerificationExpires: true,
        phone: true
      }
    });

    if (!user.phoneVerificationToken) {
      return res.status(400).json({
        error: 'Aucune vérification en cours. Demandez un nouveau code.'
      });
    }

    if (new Date() > user.phoneVerificationExpires) {
      return res.status(400).json({
        error: 'Code de vérification expiré. Demandez un nouveau code.'
      });
    }

    // Vérifier le code
    if (user.phoneVerificationToken !== code.trim()) {
      return res.status(400).json({
        error: 'Code de vérification incorrect'
      });
    }

    // SUCCÈS : Marquer le téléphone comme vérifié
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
      message: 'Téléphone vérifié avec succès !',
      phone: user.phone,
      canUseServices: true // L'utilisateur peut maintenant utiliser les services
    });

  } catch (error) {
    console.error('Erreur vérification code:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du code'
    });
  }
});

// Route pour vérifier le statut de vérification du téléphone
router.get('/verify/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        phoneVerified: true,
        phoneVerificationExpires: true
      }
    });

    res.json({
      success: true,
      phoneVerified: user.phoneVerified,
      phone: user.phone,
      canUseServices: user.phoneVerified, // Peut utiliser transport de colis
      hasVerificationInProgress: !user.phoneVerified && user.phoneVerificationExpires > new Date()
    });

  } catch (error) {
    console.error('Erreur statut vérification:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du statut'
    });
  }
});

// Route simple pour les webhooks Vonage (confirmations de livraison)
router.post('/status', (req, res) => {
  const { messageId, to, status, timestamp } = req.body;
  console.log(`SMS ${messageId} vers ${to}: ${status} à ${timestamp}`);
  res.status(200).send('OK');
});

module.exports = router;