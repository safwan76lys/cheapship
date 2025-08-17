require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugEmails() {
  console.log('🔍 Debug des emails...\n');
  
  const testEmails = [
    'safwan76.st@gmail.com',  // Avec point
    'safwan76st@gmail.com',   // Sans point
  ];
  
  for (const email of testEmails) {
    console.log(`📧 Test email: "${email}"`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      console.log(`✅ TROUVÉ - ID: ${user.id}, Nom: ${user.fullName}`);
      console.log(`   Active: ${user.isActive}, Email vérifié: ${user.emailVerified}`);
    } else {
      console.log('❌ NON TROUVÉ');
    }
    console.log('');
  }
  
  // Voir tous les emails en base
  console.log('📋 Tous les emails en base:');
  const allUsers = await prisma.user.findMany({
    select: { email: true, fullName: true }
  });
  
  allUsers.forEach(user => {
    console.log(`- "${user.email}" (${user.fullName})`);
  });
  
  await prisma.$disconnect();
}

debugEmails();


