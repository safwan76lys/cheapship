// backup-data.js - Script pour sauvegarder vos données avant migration
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backupData() {
  try {
    console.log('🔄 Début de la sauvegarde des données...');
    
    // Récupérer toutes les données importantes
    const users = await prisma.user.findMany();
    const trips = await prisma.trip.findMany();
    const items = await prisma.item.findMany();
    const messages = await prisma.message.findMany();
    const reviews = await prisma.review.findMany();
    const alerts = await prisma.alert.findMany();
    
    const backup = {
      timestamp: new Date().toISOString(),
      users: users.length,
      trips: trips.length,
      items: items.length,
      messages: messages.length,
      reviews: reviews.length,
      alerts: alerts.length,
      data: {
        users,
        trips,
        items,
        messages,
        reviews,
        alerts
      }
    };
    
    // Sauvegarder dans un fichier JSON
    const backupFileName = `backup-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backup, null, 2));
    
    console.log('✅ Sauvegarde terminée:', backupFileName);
    console.log(`📊 ${users.length} utilisateurs, ${trips.length} voyages, ${items.length} colis sauvegardés`);
    
    return backupFileName;
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  backupData();
}

module.exports = { backupData };