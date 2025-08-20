const prisma = require('../config/database');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// ===== AJOUT : Import de l'IA =====
const HybridDocumentAI = require('../services/hybridDocumentAI');

// ===== AJOUT : Instance globale de l'IA =====
const documentAI = new HybridDocumentAI();

// ===== AJOUT : Initialisation de l'IA =====
let aiInitialized = false;
const initializeAI = async () => {
  if (!aiInitialized) {
    console.log('🤖 Initialisation de l\'IA de documents...');
    try {
      await documentAI.initialize();
      aiInitialized = true;
      console.log('✅ IA de documents prête');
    } catch (error) {
      console.warn('⚠️ IA non disponible:', error.message);
      aiInitialized = false;
    }
  }
};

class UserController {
  // Récupérer le profil
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          birthDate: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          profilePicture: true,
          identityDocument: true,
          identityVerified: true,
          emailVerified: true,
          phoneVerified: true,
          rating: true,
          totalRatings: true,
          createdAt: true,
          // ===== AJOUT : Nouveaux champs IA =====
          identityVerificationStatus: true,
          aiAnalysisResult: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // ===== AJOUT : Parser le résultat IA si disponible =====
      if (user.aiAnalysisResult) {
        try {
          user.aiAnalysisResult = JSON.parse(user.aiAnalysisResult);
        } catch (error) {
          console.warn('Erreur parsing AI result:', error);
          user.aiAnalysisResult = null;
        }
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
  }

  // Mettre à jour le profil
  async updateProfile(req, res) {
    try {
      const {
        fullName,
        phone,
        birthDate,
        address,
        city,
        postalCode,
        country
      } = req.body;

      const updateData = {};
      
      // Ne mettre à jour que les champs fournis
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (postalCode !== undefined) updateData.postalCode = postalCode;
      if (country !== undefined) updateData.country = country;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          birthDate: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          profilePicture: true,
          identityVerified: true,
          emailVerified: true
        }
      });

      res.json(user); 

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
  }

  // Upload photo de profil
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Redimensionner l'image
      const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
      const outputPath = path.join('./uploads/profiles', filename);

      await sharp(req.file.path)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      // Supprimer l'original
      await fs.unlink(req.file.path);

      // Supprimer l'ancienne photo si elle existe
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { profilePicture: true }
      });

      if (user.profilePicture) {
        const oldPath = path.join('./uploads/profiles', user.profilePicture);
        try {
          await fs.unlink(oldPath);
        } catch (error) {
          console.log('Ancienne photo non trouvée');
        }
      }

      // Mettre à jour la base de données
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture: filename }
      });

      res.json({
        message: 'Photo de profil mise à jour',
        profilePicture: filename
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  }

  // ===== FONCTION MISE À JOUR : Upload document d'identité avec IA =====
  async uploadIdentityDocument(req, res) {
    try {
      console.log('📄 Upload document d\'identité avec IA...');
      
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun document fourni' });
      }

      const userId = req.user.id;
      const originalName = req.file.originalname || req.file.filename;
      
      // Validation taille et format
      const fileBuffer = req.file.buffer || await fs.readFile(req.file.path);
      
      if (fileBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Le document ne doit pas dépasser 5MB' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Format non autorisé. Utilisez JPG, PNG ou PDF' });
      }

      // ===== INITIALISATION ET ANALYSE IA =====
      let aiAnalysis = null;
      let aiError = null;

      try {
        await initializeAI();
        
        if (aiInitialized) {
          console.log('🔍 Démarrage analyse IA...');
          aiAnalysis = await documentAI.analyzeDocument(fileBuffer, {
            userId,
            originalName,
            fileType: req.file.mimetype
          });
          
          console.log(`📊 Analyse IA terminée:
            - Confiance: ${(aiAnalysis.confidence * 100).toFixed(1)}%
            - Type: ${aiAnalysis.documentType}
            - Qualité: ${(aiAnalysis.qualityScore * 100).toFixed(1)}%
            - Provider: ${aiAnalysis.provider}
            - Temps: ${aiAnalysis.processingTime}ms
          `);
        }
      } catch (error) {
        console.error('❌ Erreur analyse IA:', error);
        aiError = error.message;
      }

      // ===== SAUVEGARDE DU FICHIER =====
      const filename = req.file.filename || `${userId}_${Date.now()}${path.extname(originalName)}`;
      let finalPath;

      if (req.file.path) {
        // Fichier déjà sauvé par multer
        finalPath = req.file.path;
      } else {
        // Sauvegarder le buffer
        finalPath = path.join('./uploads/documents', filename);
        await fs.writeFile(finalPath, fileBuffer);
      }

      console.log('💾 Document sauvegardé:', filename);

      // ===== MISE À JOUR BASE DE DONNÉES =====
      const updateData = {
        identityDocument: filename
      };

      // Statut basé sur l'analyse IA ou fallback manuel
      if (aiAnalysis) {
        updateData.identityVerified = aiAnalysis.confidence > 0.85;
        updateData.identityVerificationStatus = aiAnalysis.requiresManualReview ? 'pending_review' : 
                                               aiAnalysis.confidence > 0.85 ? 'verified' : 'pending';
        
        // Sauvegarde résultats IA pour audit
        updateData.aiAnalysisResult = JSON.stringify({
          confidence: aiAnalysis.confidence,
          documentType: aiAnalysis.documentType,
          qualityScore: aiAnalysis.qualityScore,
          provider: aiAnalysis.provider,
          processingTime: aiAnalysis.processingTime,
          timestamp: aiAnalysis.timestamp,
          recommendations: aiAnalysis.recommendations,
          suspiciousIndicators: aiAnalysis.suspiciousIndicators?.length || 0
        });
      } else {
        // Fallback : vérification manuelle obligatoire
        updateData.identityVerified = false;
        updateData.identityVerificationStatus = 'pending_manual';
        if (aiError) {
          updateData.aiAnalysisResult = JSON.stringify({
            error: aiError,
            fallbackReason: 'IA indisponible',
            timestamp: new Date().toISOString()
          });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // ===== CRÉATION TICKET REVIEW MANUELLE SI NÉCESSAIRE =====
      if (aiAnalysis?.requiresManualReview) {
        try {
          await this.createManualReviewTicket(userId, filename, aiAnalysis);
        } catch (ticketError) {
          console.warn('⚠️ Erreur création ticket review:', ticketError.message);
          // Continue malgré l'erreur de ticket
        }
      }

      // ===== RÉPONSE ENRICHIE =====
      const response = {
        success: true,
        identityDocument: filename,
        message: 'Document téléchargé avec succès'
      };

      // Ajout des résultats IA si disponibles
      if (aiAnalysis) {
        response.aiAnalysis = {
          confidence: aiAnalysis.confidence,
          documentType: aiAnalysis.documentType,
          qualityScore: aiAnalysis.qualityScore,
          isAutoValidated: aiAnalysis.confidence > 0.85,
          requiresManualReview: aiAnalysis.requiresManualReview,
          estimatedReviewTime: aiAnalysis.estimatedReviewTime,
          recommendations: aiAnalysis.recommendations?.slice(0, 3) || [],
          processingTime: aiAnalysis.processingTime
        };

        response.message = aiAnalysis.confidence > 0.85 
          ? 'Document validé automatiquement par IA !' 
          : aiAnalysis.requiresManualReview 
          ? 'Document reçu, en cours de vérification par notre équipe'
          : 'Document analysé avec succès';
      } else {
        response.aiAnalysis = {
          confidence: 0,
          requiresManualReview: true,
          error: aiError || 'IA non disponible'
        };
        response.message = 'Document reçu, vérification manuelle programmée';
      }

      res.json(response);

    } catch (error) {
      console.error('❌ Erreur upload document:', error);
      
      // Nettoyage en cas d'erreur
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.warn('Erreur suppression fichier temporaire:', unlinkError.message);
        }
      }
      
      res.status(500).json({ 
        error: 'Erreur lors du traitement du document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===== NOUVELLE FONCTION : Création ticket review manuelle =====
  async createManualReviewTicket(userId, filename, aiAnalysis) {
    try {
      const reviewTicket = {
        id: `review_${Date.now()}`,
        userId,
        filename,
        priority: aiAnalysis.manualReviewPriority || 'normal',
        confidence: aiAnalysis.confidence,
        documentType: aiAnalysis.documentType,
        suspiciousIndicators: aiAnalysis.suspiciousIndicators || [],
        recommendations: aiAnalysis.recommendations || [],
        aiHints: aiAnalysis.nextSteps || [],
        estimatedTime: aiAnalysis.estimatedReviewTime,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      console.log('📋 Ticket de review créé:', reviewTicket.id);
      
      // TODO: Intégrer avec votre système de tickets
      // await saveReviewTicketToDatabase(reviewTicket);
      // await notifyModerationTeam(reviewTicket);
      
      return reviewTicket;
      
    } catch (error) {
      console.error('❌ Erreur création ticket review:', error);
    }
  }

  // ===== NOUVELLE FONCTION : Statistiques IA =====
  async getAIStats(req, res) {
    try {
      if (!aiInitialized) {
        return res.json({ available: false });
      }
      
      const stats = documentAI.getPerformanceStats();
      
      res.json({
        available: true,
        stats,
        version: '1.0.0',
        providers: ['autonomous'],
        capabilities: [
          'document_classification',
          'field_extraction', 
          'quality_assessment',
          'fraud_detection',
          'auto_validation'
        ]
      });
      
    } catch (error) {
      console.error('❌ Erreur stats IA:', error);
      res.status(500).json({ error: 'Erreur récupération stats IA' });
    }
  }

  // ===== NOUVELLE FONCTION : Test IA =====
  async testAI(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Fichier test requis' });
      }
      
      await initializeAI();
      
      if (!aiInitialized) {
        return res.status(503).json({ error: 'IA non disponible' });
      }
      
      const fileBuffer = req.file.buffer || await fs.readFile(req.file.path);
      const startTime = Date.now();
      const result = await documentAI.analyzeDocument(fileBuffer);
      
      // Nettoyage fichier temporaire
      if (req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (error) {
          console.warn('Erreur suppression fichier test:', error.message);
        }
      }
      
      res.json({
        success: true,
        processingTime: Date.now() - startTime,
        result: {
          confidence: result.confidence,
          documentType: result.documentType,
          qualityScore: result.qualityScore,
          provider: result.provider,
          recommendations: result.recommendations,
          detectedFields: Object.keys(result.detectedFields || {}),
          suspiciousIndicators: result.suspiciousIndicators?.length || 0
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur test IA:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();