// frontend/src/config/api.js
// Configuration API centralisée pour Cheapship
// Détection automatique de l'environnement

const isProduction = import.meta.env.PROD;

// URLs dynamiques selon l'environnement
export const API_CONFIG = {
  baseURL: isProduction 
    ? 'https://cheapship-back-62ph.onrender.com/api'  // Votre URL Render actuelle
    : 'http://localhost:4000/api',
    
  socketURL: isProduction
    ? 'https://cheapship-back-62ph.onrender.com'      // Votre URL Render actuelle
    : 'http://localhost:4000',
    
  timeout: 30000 // 30 secondes pour Render (services gratuits plus lents)
};

// Export pour la compatibilité avec AuthPage.jsx
export const API_URL = API_CONFIG.baseURL;

// Fonction utilitaire pour les appels API avec retry
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const config = {
    timeout: API_CONFIG.timeout,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Retry logic pour les services gratuits Render qui peuvent être lents au réveil
  let attempts = isProduction ? 3 : 1;
  
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Si succès, retourner la réponse
      if (response.ok || i === attempts - 1) {
        return response;
      }
      
      // Si c'est un service Render qui se réveille, attendre avant retry
      if (isProduction && response.status >= 500) {
        console.log(`🔄 Retry ${i + 1}/${attempts} for ${endpoint}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (i === attempts - 1) {
        console.error(`API call failed after ${attempts} attempts: ${endpoint}`, error);
        throw error;
      }
      
      if (isProduction) {
        console.log(`🔄 Retry ${i + 1}/${attempts} after error for ${endpoint}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
};

// Fonction pour tester la connexion au backend
export const testBackendConnection = async () => {
  try {
    console.log(`🔍 Testing backend connection to: ${API_CONFIG.baseURL}`);
    const response = await fetch(`${API_CONFIG.baseURL.replace('/api', '')}/health`);
    
    if (response.ok) {
      console.log('✅ Backend is reachable');
      return true;
    } else {
      console.warn('⚠️ Backend responded with non-200 status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend unreachable:', error.message);
    return false;
  }
};

console.log(`🔧 API Config chargée - Mode: ${isProduction ? 'production' : 'development'}`);
console.log(`📡 Backend URL: ${API_CONFIG.baseURL}`);
console.log(`🔌 Socket URL: ${API_CONFIG.socketURL}`);

// Test automatique en production
if (isProduction) {
  testBackendConnection();
}