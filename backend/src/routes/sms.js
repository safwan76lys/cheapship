const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const vonageService = require('../services/vonageService');
const prisma = require('../config/database');
const rateLimiter = require('../middleware/rateLimiter');
const crypto = require('crypto');

// Route pour démarrer la vérification SMS
router.post('/verify/start', authMiddleware, rateLimiter.smsLimiter, async (req, res) => {
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
          phone: formattedPhone, // Sauvegarder aussi le numéro
          phoneVerificationToken: smsResult.code, // Stocker le code généré
          phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          phoneVerificationAttempts: { increment: 1 } // Incrémenter les tentatives
        }
      });

      res.json({
        success: true,
        message: 'Code de vérification envoyé par SMS',
        messageId: smsResult.messageId,
        phone: vonageService.maskPhoneNumber(formattedPhone), // Numéro masqué
        expiresIn: 600 // 10 minutes
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
router.post('/verify/check', authMiddleware, rateLimiter.smsVerifyLimiter, async (req, res) => {
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
          phoneVerificationExpires: null,
          phoneVerificationAttempts: 0 // Reset compteur
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

// ================================
// 🔐 MIDDLEWARE SÉCURITÉ WEBHOOK
// ================================

const validateWebhookSignature = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.VONAGE_SIGNATURE_SECRET) {
    try {
      const signature = req.headers['authorization'] || req.headers['x-nexmo-signature'];
      const payload = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.VONAGE_SIGNATURE_SECRET)
        .update(payload)
        .digest('hex');
      
      if (!signature || !signature.includes(expectedSignature)) {
        console.log('❌ Signature webhook Vonage invalide');
        return res.status(401).json({ error: 'Unauthorized webhook' });
      }
    } catch (error) {
      console.log('⚠️ Erreur validation signature:', error.message);
    }
  }
  
  next();
};

// ================================
// 📨 WEBHOOK : SMS ENTRANTS
// ================================

router.post('/webhook', rateLimiter.apiLimiter, validateWebhookSignature, async (req, res) => {
  try {
    const {
      messageId,
      from,         // Utilisateur qui répond
      to,           // Ton numéro Cheapship
      text,         // Message reçu
      timestamp,
      type = 'text'
    } = req.body;

    console.log(`📨 SMS entrant: ${from} → ${to}: "${text?.substring(0, 30)}..."`);

    // Vérification automatique de code
    const codePattern = /^\s*(\d{6})\s*$/;
    const codeMatch = text?.match(codePattern);
    
    if (codeMatch) {
      const code = codeMatch[1];
      console.log('🔐 Code de vérification détecté:', code);
      
      try {
        // Chercher l'utilisateur avec ce numéro et ce code
        const user = await prisma.user.findFirst({
          where: {
            phone: from,
            phoneVerificationToken: code,
            phoneVerificationExpires: { gt: new Date() },
            phoneVerified: false
          }
        });

        if (user) {
          // Vérifier automatiquement
          await prisma.user.update({
            where: { id: user.id },
            data: {
              phoneVerified: true,
              phoneVerificationToken: null,
              phoneVerificationExpires: null,
              phoneVerificationAttempts: 0
            }
          });

          console.log(`✅ Vérification automatique réussie pour utilisateur ${user.id}`);
          
          // SMS de confirmation
          await vonageService.sendVerificationSMS(from, 
            "✅ Cheapship: Votre téléphone est maintenant vérifié ! Bienvenue sur notre plateforme."
          );
        } else {
          console.log('❌ Code incorrect ou expiré');
        }
      } catch (dbError) {
        console.error('❌ Erreur vérification auto:', dbError);
      }
    }

    // Réponses automatiques
    const lowerText = text?.toLowerCase() || '';
    
    if (lowerText.includes('help') || lowerText.includes('aide')) {
      await vonageService.sendVerificationSMS(from, 
        "🆘 Cheapship Support: Visitez https://cheapship.fr/help ou écrivez à support@cheapship.fr"
      );
    } else if (lowerText.includes('stop') || lowerText.includes('arret')) {
      console.log('🛑 Désabonnement demandé par:', from);
      // Marquer comme désabonné
    }

    res.status(200).json({ 
      success: true,
      messageId,
      processed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur webhook SMS:', error);
    res.status(200).json({ success: false, error: 'Processed with errors' });
  }
});

// ================================
// 📊 WEBHOOK : STATUT LIVRAISON
// ================================

router.post('/status', rateLimiter.apiLimiter, validateWebhookSignature, async (req, res) => {
  try {
    const {
      messageId,
      to,
      status,           // delivered, failed, expired, rejected
      timestamp,
      'err-code': errorCode,
      'err-text': errorText,
      price,
      'client-ref': clientRef,
      network
    } = req.body;

    const maskedTo = to?.replace(/(\+\d{2})(\d+)(\d{2})/, '$1***$3');
    console.log(`📊 Statut ${messageId}: ${status} → ${maskedTo}`);

    // Analytics tracking
    if (req.socketService) {
      try {
        const AnalyticsService = require('../services/analyticsService');
        await AnalyticsService.trackEvent({
          eventType: 'sms_delivery_status',
          metadata: {
            messageId,
            status,
            errorCode,
            price: price ? parseFloat(price) : null,
            network,
            deliveredAt: timestamp
          }
        });
      } catch (analyticsError) {
        console.log('⚠️ Analytics SMS échoué:', analyticsError.message);
      }
    }

    // Gestion par statut
    switch (status) {
      case 'delivered':
        console.log('✅ SMS livré avec succès');
        break;
        
      case 'failed':
        console.log(`❌ Échec livraison SMS: ${errorCode} - ${errorText}`);
        // Optionnel : retry ou notification admin
        break;
        
      case 'expired':
        console.log('⏰ SMS expiré avant livraison');
        break;
        
      case 'rejected':
        console.log('🚫 SMS rejeté par l\'opérateur');
        break;
        
      default:
        console.log(`❓ Statut SMS inconnu: ${status}`);
    }

    res.status(200).json({
      success: true,
      messageId,
      status,
      processed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur webhook statut:', error);
    res.status(200).json({ success: false, error: 'Status processed with errors' });
  }
});

// ================================
// 🔧 ENDPOINT TEST WEBHOOKS
// ================================

router.get('/webhooks/status', (req, res) => {
  res.json({
    webhooks: {
      sms_entrants: {
        endpoint: '/api/sms/webhook',
        method: 'POST',
        status: '✅ Opérationnel'
      },
      statut_livraison: {
        endpoint: '/api/sms/status', 
        method: 'POST',
        status: '✅ Opérationnel'
      }
    },
    configuration: {
      vonage_configured: process.env.VONAGE_API_KEY ? '✅' : '❌',
      signature_validation: process.env.VONAGE_SIGNATURE_SECRET ? '✅' : '❌',
      environment: process.env.NODE_ENV
    },
    urls_vonage: {
      inbound: 'https://cheapship-back.onrender.com/api/sms/webhook',
      delivery_receipt: 'https://cheapship-back.onrender.com/api/sms/status'
    }
  });
});

module.exports = router;