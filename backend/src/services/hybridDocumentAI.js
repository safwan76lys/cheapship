// backend/services/hybridDocumentAI.js
const AutonomousDocumentAI = require('./autonomousAI');

class HybridDocumentAI {
  constructor() {
    this.autonomousAI = new AutonomousDocumentAI();
    this.fallbackToManual = true;
    
    // Statistiques pour optimisation
    this.stats = {
      totalAnalyses: 0,
      autonomousSuccesses: 0,
      fallbackToManual: 0
    };
  }

  async initialize() {
    console.log('🚀 Initialisation IA hybride...');
    
    // Initialisation IA autonome
    const autonomousReady = await this.autonomousAI.initialize();
    
    console.log(`✅ IA autonome: ${autonomousReady ? 'OK' : 'KO'}`);
    
    return { autonomousReady };
  }

  // Point d'entrée principal - stratégie intelligente
  async analyzeDocument(imageBuffer, options = {}) {
    this.stats.totalAnalyses++;
    console.log(`🔍 Analyse hybride #${this.stats.totalAnalyses}`);
    
    const startTime = Date.now();
    let finalResult = null;
    const analysisPath = [];

    try {
      // ÉTAPE 1 : Analyse autonome rapide (toujours en premier)
      console.log('🤖 Phase 1: IA autonome...');
      const autonomousResult = await this.autonomousAI.analyzeDocument(imageBuffer, options);
      analysisPath.push('autonomous');
      
      // Décision intelligente : est-ce que l'IA autonome suffit ?
      if (autonomousResult.confidence > 0.8 && autonomousResult.suspiciousIndicators.length === 0) {
        console.log('✅ IA autonome suffisante - validation directe');
        this.stats.autonomousSuccesses++;
        
        finalResult = {
          ...autonomousResult,
          provider: 'autonomous',
          processingTime: Date.now() - startTime,
          analysisPath: ['autonomous'],
          costEstimate: 0
        };
        
        return this.enrichResult(finalResult);
      }

      // ÉTAPE 2 : Décision finale basée sur l'autonome
      finalResult = autonomousResult;
      finalResult.provider = 'autonomous_only';
      finalResult.analysisPath = analysisPath;
      finalResult.processingTime = Date.now() - startTime;
      finalResult.costEstimate = 0;

      // Si confiance toujours faible → review manuelle
      if (finalResult.confidence < 0.6) {
        console.log('📋 Envoi en review manuelle');
        this.stats.fallbackToManual++;
        finalResult.requiresManualReview = true;
        finalResult.manualReviewPriority = finalResult.confidence < 0.3 ? 'high' : 'normal';
      }

      return this.enrichResult(finalResult);

    } catch (error) {
      console.error('❌ Erreur analyse hybride:', error);
      
      return {
        success: false,
        error: error.message,
        provider: 'error',
        analysisPath,
        processingTime: Date.now() - startTime,
        requiresManualReview: true,
        manualReviewPriority: 'high',
        recommendations: ['Erreur technique - vérification manuelle obligatoire']
      };
    }
  }

  // Enrichissement du résultat final
  enrichResult(result) {
    // Ajout de métadonnées utiles
    result.timestamp = new Date().toISOString();
    result.version = '1.0.0';
    result.stats = { ...this.stats };
    
    // Score de qualité global
    result.overallQuality = this.calculateOverallQuality(result);
    
    // Prochaines étapes recommandées
    result.nextSteps = this.generateNextSteps(result);
    
    // Estimation du temps de traitement pour review manuelle
    if (result.requiresManualReview) {
      result.estimatedReviewTime = this.estimateReviewTime(result);
    }
    
    return result;
  }

  calculateOverallQuality(result) {
    let quality = 0;
    
    quality += result.confidence * 0.4;
    quality += result.qualityScore * 0.3;
    quality += (Object.keys(result.detectedFields || {}).length / 5) * 0.2;
    quality += (result.suspiciousIndicators?.length === 0 ? 0.1 : 0);
    
    return Math.min(1, quality);
  }

  generateNextSteps(result) {
    const steps = [];
    
    if (result.confidence > 0.8 && !result.requiresManualReview) {
      steps.push('✅ Marquer l\'utilisateur comme vérifié');
      steps.push('🎯 Envoyer notification de validation');
    } else if (result.requiresManualReview) {
      steps.push('📋 Créer ticket de review manuelle');
      steps.push('📧 Notifier l\'équipe de modération');
      
      if (result.qualityScore < 0.5) {
        steps.push('📸 Demander à l\'utilisateur une photo de meilleure qualité');
      }
    }
    
    return steps;
  }

  estimateReviewTime(result) {
    if (result.manualReviewPriority === 'high') {
      return '1-2 heures';
    } else if (result.confidence > 0.5) {
      return '2-6 heures';
    } else {
      return '6-24 heures';
    }
  }

  // Méthodes utilitaires et statistiques
  getPerformanceStats() {
    const total = this.stats.totalAnalyses;
    if (total === 0) return null;
    
    return {
      totalAnalyses: total,
      autonomousSuccessRate: (this.stats.autonomousSuccesses / total * 100).toFixed(1) + '%',
      manualReviewRate: (this.stats.fallbackToManual / total * 100).toFixed(1) + '%',
      avgCostPerAnalysis: '0€'
    };
  }

  // Configuration dynamique selon le volume
  async adaptToVolume(dailyVolume) {
    if (dailyVolume < 100) {
      this.autonomousThreshold = 0.7;
      console.log('📊 Mode: Petit volume (IA autonome privilégiée)');
    } else if (dailyVolume < 1000) {
      this.autonomousThreshold = 0.8;
      console.log('📊 Mode: Volume moyen (IA autonome optimisée)');
    } else {
      this.autonomousThreshold = 0.85;
      console.log('📊 Mode: Gros volume (validation stricte)');
    }
  }
}

module.exports = HybridDocumentAI;