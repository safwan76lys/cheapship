// backend/services/autonomousAI.js
const sharp = require('sharp');
const tesseract = require('tesseract.js');

class AutonomousDocumentAI {
  constructor() {
    this.documentPatterns = {
      // Patterns pour cartes d'identité françaises
      cinFrance: [
        /CARTE\s+NATIONALE\s+D['\s]IDENTITE/i,
        /REPUBLIQUE\s+FRANCAISE/i,
        /LIBERTE\s+EGALITE\s+FRATERNITE/i,
        /^[0-9]{12}$/  // Numéro de carte
      ],
      
      // Patterns passeports français
      passeportFrance: [
        /PASSEPORT/i,
        /PASSPORT/i,
        /REPUBLIQUE\s+FRANCAISE/i,
        /^[0-9]{2}[A-Z]{2}[0-9]{5}$/ // Format passeport français
      ],
      
      // Patterns permis de conduire
      permis: [
        /PERMIS\s+DE\s+CONDUIRE/i,
        /DRIVING\s+LICENCE/i,
        /^[0-9]{12}$/ // Numéro permis
      ]
    };
  }

  // Initialisation
  async initialize() {
    console.log('🤖 Initialisation IA autonome...');
    try {
      // Test rapide pour vérifier que tout fonctionne
      await this.testCapabilities();
      console.log('✅ IA autonome prête');
      return true;
    } catch (error) {
      console.warn('⚠️ Erreur init IA:', error.message);
      return false;
    }
  }

  async testCapabilities() {
    // Test simple avec une image factice
    const testBuffer = Buffer.from('test');
    await sharp(testBuffer).metadata().catch(() => {
      // C'est normal que ça échoue, on teste juste que Sharp fonctionne
    });
  }

  // Point d'entrée principal - analyse complète
  async analyzeDocument(imageBuffer, options = {}) {
    console.log('🔍 Analyse IA autonome en cours...');
    
    const analysis = {
      documentType: 'unknown',
      confidence: 0,
      isValidDocument: false,
      extractedText: '',
      detectedFields: {},
      qualityScore: 0,
      suspiciousIndicators: [],
      recommendations: []
    };

    try {
      // 1. Préparation de l'image
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // 2. Extraction de texte (OCR gratuit)
      const ocrResult = await this.performOCR(processedImage);
      analysis.extractedText = ocrResult.text;
      
      // 3. Classification du type de document
      analysis.documentType = await this.classifyDocument(ocrResult.text);
      
      // 4. Extraction des champs importants
      analysis.detectedFields = await this.extractFields(ocrResult.text, analysis.documentType);
      
      // 5. Analyse de la qualité
      analysis.qualityScore = await this.assessQuality(processedImage, ocrResult);
      
      // 6. Détection d'anomalies
      analysis.suspiciousIndicators = await this.detectAnomalies(ocrResult, processedImage);
      
      // 7. Calcul du score de confiance final
      analysis.confidence = this.calculateConfidence(analysis);
      analysis.isValidDocument = analysis.confidence > 0.6;
      
      // 8. Recommandations
      analysis.recommendations = this.generateRecommendations(analysis);
      
      console.log(`🎯 Analyse terminée - Confiance: ${(analysis.confidence * 100).toFixed(1)}%`);
      return analysis;
      
    } catch (error) {
      console.error('❌ Erreur analyse IA:', error);
      analysis.recommendations.push('Erreur technique - vérification manuelle requise');
      return analysis;
    }
  }

  // Préparation optimisée de l'image
  async preprocessImage(imageBuffer) {
    return sharp(imageBuffer)
      .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
      .normalize() // Améliore le contraste
      .sharpen() // Améliore la netteté pour l'OCR
      .grayscale() // Meilleur pour l'OCR
      .jpeg({ quality: 95 })
      .toBuffer();
  }

  // OCR gratuit avec Tesseract.js
  async performOCR(imageBuffer) {
    try {
      console.log('📖 OCR en cours...');
      
      const { data } = await tesseract.recognize(imageBuffer, 'fra+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        lines: data.lines
      };
      
    } catch (error) {
      console.error('❌ Erreur OCR:', error);
      return { text: '', confidence: 0, words: [], lines: [] };
    }
  }

  // Classification intelligente du type de document
  async classifyDocument(text) {
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
    
    // Test des patterns pour chaque type
    for (const [docType, patterns] of Object.entries(this.documentPatterns)) {
      let matchCount = 0;
      
      for (const pattern of patterns) {
        if (pattern.test(cleanText)) {
          matchCount++;
        }
      }
      
      // Si au moins 2 patterns correspondent
      if (matchCount >= 2) {
        console.log(`📋 Document détecté: ${docType} (${matchCount} patterns)`);
        return docType;
      }
    }
    
    // Classification par mots-clés si pas de pattern exact
    if (cleanText.includes('CARTE') && cleanText.includes('IDENTITE')) {
      return 'cinFrance';
    } else if (cleanText.includes('PASSEPORT') || cleanText.includes('PASSPORT')) {
      return 'passeportFrance';
    } else if (cleanText.includes('PERMIS')) {
      return 'permis';
    }
    
    return 'unknown';
  }

  // Extraction intelligente des champs
  async extractFields(text, documentType) {
    const fields = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    try {
      switch (documentType) {
        case 'cinFrance':
          fields.nom = this.extractName(lines);
          fields.prenom = this.extractFirstName(lines);
          fields.dateNaissance = this.extractBirthDate(lines);
          fields.numeroDocument = this.extractDocumentNumber(lines, /^[0-9]{12}$/);
          break;
          
        case 'passeportFrance':
          fields.nom = this.extractName(lines);
          fields.prenom = this.extractFirstName(lines);
          fields.dateNaissance = this.extractBirthDate(lines);
          fields.numeroPasseport = this.extractDocumentNumber(lines, /^[0-9]{2}[A-Z]{2}[0-9]{5}$/);
          break;
          
        case 'permis':
          fields.nom = this.extractName(lines);
          fields.prenom = this.extractFirstName(lines);
          fields.dateNaissance = this.extractBirthDate(lines);
          fields.numeroPermis = this.extractDocumentNumber(lines, /^[0-9]{12}$/);
          break;
      }
      
      console.log('📝 Champs extraits:', Object.keys(fields).length);
      
    } catch (error) {
      console.warn('⚠️ Erreur extraction champs:', error.message);
    }
    
    return fields;
  }

  // Méthodes d'extraction spécialisées
  extractName(lines) {
    const namePatterns = [
      /^NOM[\s:]+(.+)$/i,
      /^SURNAME[\s:]+(.+)$/i,
      /^([A-Z\s-]+)$/ // Ligne en majuscules (souvent le nom)
    ];
    
    for (const line of lines) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 1) {
          return match[1].trim();
        }
      }
    }
    return null;
  }

  extractFirstName(lines) {
    const firstNamePatterns = [
      /^PRENOM[\s:]+(.+)$/i,
      /^GIVEN\s+NAME[\s:]+(.+)$/i,
      /^FIRST\s+NAME[\s:]+(.+)$/i
    ];
    
    for (const line of lines) {
      for (const pattern of firstNamePatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    return null;
  }

  extractBirthDate(lines) {
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g, // DD/MM/YYYY
      /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g, // YYYY/MM/DD
      /NE[\s\(]*LE[\s:]*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/i
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const matches = [...line.matchAll(pattern)];
        if (matches.length > 0) {
          return matches[0][0];
        }
      }
    }
    return null;
  }

  extractDocumentNumber(lines, pattern) {
    for (const line of lines) {
      const cleanLine = line.replace(/\s/g, '');
      if (pattern.test(cleanLine)) {
        return cleanLine;
      }
    }
    return null;
  }

  // Analyse de la qualité de l'image/document
  async assessQuality(imageBuffer, ocrResult) {
    let score = 0;
    
    try {
      // Analyse des métadonnées de l'image
      const metadata = await sharp(imageBuffer).metadata();
      
      // Points pour la résolution
      if (metadata.width >= 800 && metadata.height >= 600) score += 0.3;
      else if (metadata.width >= 400 && metadata.height >= 300) score += 0.15;
      
      // Points pour la confiance OCR
      if (ocrResult.confidence > 80) score += 0.4;
      else if (ocrResult.confidence > 60) score += 0.2;
      else if (ocrResult.confidence > 40) score += 0.1;
      
      // Points pour la quantité de texte détecté
      const wordCount = ocrResult.words ? ocrResult.words.length : 0;
      if (wordCount > 50) score += 0.3;
      else if (wordCount > 20) score += 0.2;
      else if (wordCount > 10) score += 0.1;
      
    } catch (error) {
      console.warn('⚠️ Erreur évaluation qualité:', error.message);
    }
    
    return Math.min(score, 1);
  }

  // Détection d'anomalies et indicateurs suspects
  async detectAnomalies(ocrResult, imageBuffer) {
    const suspicious = [];
    
    try {
      const text = ocrResult.text;
      
      // Détection de caractères suspects
      if (/[^\x00-\x7F]/.test(text) && text.length > 50) {
        suspicious.push('Caractères non-standards détectés');
      }
      
      // Détection de répétitions suspectes
      const words = text.split(/\s+/);
      const uniqueWords = new Set(words);
      if (words.length > 20 && uniqueWords.size / words.length < 0.5) {
        suspicious.push('Répétitions de mots suspectes');
      }
      
      // Vérification de la confiance OCR par zone
      if (ocrResult.words) {
        const lowConfidenceWords = ocrResult.words.filter(w => w.confidence < 50);
        if (lowConfidenceWords.length > ocrResult.words.length * 0.3) {
          suspicious.push('Nombreuses zones de faible qualité');
        }
      }
      
      // Analyse des métadonnées de l'image
      const metadata = await sharp(imageBuffer).metadata();
      if (metadata.density && metadata.density < 72) {
        suspicious.push('Résolution très faible (possible capture d\'écran)');
      }
      
    } catch (error) {
      suspicious.push('Erreur lors de l\'analyse - vérification manuelle recommandée');
    }
    
    return suspicious;
  }

  // Calcul du score de confiance global
  calculateConfidence(analysis) {
    let confidence = 0;
    
    // Base : type de document reconnu
    if (analysis.documentType !== 'unknown') confidence += 0.3;
    
    // Qualité de l'image
    confidence += analysis.qualityScore * 0.3;
    
    // Champs extraits
    const fieldsCount = Object.keys(analysis.detectedFields).length;
    confidence += Math.min(fieldsCount / 4, 1) * 0.2;
    
    // Pénalités pour indicateurs suspects
    confidence -= analysis.suspiciousIndicators.length * 0.1;
    
    // Bonus si texte détecté cohérent
    if (analysis.extractedText.length > 100) confidence += 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  // Génération de recommandations intelligentes
  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.confidence < 0.3) {
      recommendations.push('❌ Document non reconnu - vérification manuelle obligatoire');
    } else if (analysis.confidence < 0.6) {
      recommendations.push('⚠️ Confiance faible - review manuelle recommandée');
    } else if (analysis.confidence < 0.8) {
      recommendations.push('✅ Document probablement valide - validation rapide possible');
    } else {
      recommendations.push('🟢 Document validé automatiquement');
    }
    
    if (analysis.qualityScore < 0.5) {
      recommendations.push('📸 Demander une photo de meilleure qualité');
    }
    
    if (analysis.suspiciousIndicators.length > 0) {
      recommendations.push(`🚨 ${analysis.suspiciousIndicators.length} indicateurs suspects détectés`);
    }
    
    if (Object.keys(analysis.detectedFields).length === 0) {
      recommendations.push('📝 Aucun champ standard détecté - vérifier le type de document');
    }
    
    return recommendations;
  }
}

module.exports = AutonomousDocumentAI;