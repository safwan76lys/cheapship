// Configuration API centralisée pour Cheapship
// Détection automatique de l'environnement

const isProduction = import.meta.env.PROD;

  // URLs dynamiques selon l'environnement
export const API_CONFIG = {
  baseURL: isProduction 
    ? 'https://cheapship-back-62ph.onrender.com/api'  // Nouvelle URL réelle
    : 'http://localhost:4000/api',
    
  socketURL: isProduction
    ? 'https://cheapship-back-62ph.onrender.com'      // Nouvelle URL réelle
    : 'http://localhost:4000',
    
  timeout: 15000 // 15 secondes pour Render
};

// Export pour la compatibilité avec AuthPage.jsx
export const API_URL = API_CONFIG.baseURL;

// Fonction utilitaire pour les appels API
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

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

console.log(`🔧 API Config chargée - Mode: ${isProduction ? 'production' : 'development'}`);
console.log(`📡 Backend URL: ${API_CONFIG.baseURL}`);
console.log(`🔌 Socket URL: ${API_CONFIG.socketURL}`);