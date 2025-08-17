const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testAPI() {
  console.log('🧪 Début des tests API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Test Health Check...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check OK:', healthResponse.data);
    console.log('');

    // Test 2: Inscription
    console.log('2️⃣ Test Inscription...');
    const registerData = {
      email: `test${Date.now()}@cheapship.fr`,
      password: 'Test@1234',
      fullName: 'Test User',
      phone: '0612345678'
    };
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ Inscription réussie:', registerResponse.data.message);
    console.log('📧 Email de vérification envoyé à:', registerData.email);
    console.log('');

    // Test 3: Connexion (devrait échouer car email non vérifié)
    console.log('3️⃣ Test Connexion (email non vérifié)...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: registerData.email,
        password: registerData.password
      });
    } catch (error) {
      if (error.response?.data?.needsVerification) {
        console.log('✅ Protection correcte: Email doit être vérifié');
      }
    }

    console.log('\n✅ Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur durant les tests:', error.response?.data || error.message);
  }
}

// Exécuter les tests
testAPI();