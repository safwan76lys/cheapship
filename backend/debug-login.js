require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
  const email = 'safwan76st@gmail.com'; // Changez par l'email que vous testez
  const password = 'Lysft@2236'; // Changez par le mot de passe que vous testez
  
  console.log('🔍 Debug de la connexion...\n');
  
  try {
    // 1. Chercher l'utilisateur
    console.log('1️⃣ Recherche utilisateur avec email:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé !');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Full Name:', user.fullName);
    console.log('- Email Verified:', user.emailVerified);
    console.log('- Is Active:', user.isActive);
    console.log('- Role:', user.role);
    console.log('- Password Hash:', user.password?.substring(0, 20) + '...');
    console.log('');
    
    // 2. Vérifier si le compte est actif
    console.log('2️⃣ Vérification du statut du compte...');
    if (!user.isActive) {
      console.log('❌ Compte désactivé !');
      return;
    }
    console.log('✅ Compte actif');
    console.log('');
    
    // 3. Vérifier la vérification email (si requis)
    console.log('3️⃣ Vérification de l\'email...');
    if (!user.emailVerified) {
      console.log('⚠️  Email non vérifié - cela peut bloquer la connexion selon votre logique');
    } else {
      console.log('✅ Email vérifié');
    }
    console.log('');
    
    // 4. Tester le mot de passe
    console.log('4️⃣ Vérification du mot de passe...');
    if (!user.password) {
      console.log('❌ Aucun mot de passe enregistré !');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('- Mot de passe fourni:', password);
    console.log('- Hash en base:', user.password);
    console.log('- Comparaison bcrypt:', isPasswordValid ? '✅ Valide' : '❌ Invalide');
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect !');
      return;
    }
    
    console.log('\n🎉 Toutes les vérifications sont OK !');
    console.log('Le problème est probablement dans votre route de login.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();



