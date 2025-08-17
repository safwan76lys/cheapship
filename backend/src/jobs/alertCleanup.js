// ================================
// CRON JOB POUR NETTOYER LES ALERTES EXPIRÉES
// src/jobs/alertCleanup.js
// ================================

const cron = require('node-cron');
const alertService = require('../services/alertService');

// Nettoyer les alertes expirées tous les jours à 02:00
const scheduleAlertCleanup = () => {
  // Cron expression: "0 2 * * *" = Tous les jours à 02:00
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[CRON] 🧹 Démarrage nettoyage alertes expirées...');
      const cleanedCount = await alertService.cleanupExpiredAlerts();
      console.log(`[CRON] ✅ ${cleanedCount} alertes expirées nettoyées`);
      
      // Log statistiques après nettoyage
      const stats = await alertService.getAlertStats();
      console.log(`[CRON] 📊 Stats alertes après nettoyage:`, stats);
      
    } catch (error) {
      console.error('[CRON] ❌ Erreur nettoyage alertes:', error);
    }
  });
  
  console.log('📅 Cron job alertes configuré : nettoyage quotidien à 02:00');
};

// Fonction pour nettoyer manuellement (optionnelle)
const manualCleanup = async () => {
  try {
    console.log('[MANUAL] 🧹 Nettoyage manuel des alertes expirées...');
    const cleanedCount = await alertService.cleanupExpiredAlerts();
    console.log(`[MANUAL] ✅ ${cleanedCount} alertes expirées nettoyées`);
    return cleanedCount;
  } catch (error) {
    console.error('[MANUAL] ❌ Erreur nettoyage manuel:', error);
    throw error;
  }
};

// Fonction pour tester le cron job (développement)
const testCleanupJob = () => {
  // Cron qui se lance toutes les 30 secondes pour test
  cron.schedule('*/30 * * * * *', async () => {
    try {
      console.log('[TEST_CRON] 🧪 Test nettoyage alertes...');
      const stats = await alertService.getAlertStats();
      console.log(`[TEST_CRON] 📊 Stats actuelles:`, stats);
    } catch (error) {
      console.error('[TEST_CRON] ❌ Erreur test:', error);
    }
  });
  
  console.log('🧪 Test cron job activé : stats toutes les 30 secondes');
};

module.exports = { 
  scheduleAlertCleanup,
  manualCleanup,
  testCleanupJob
};