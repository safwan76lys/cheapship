// frontend/src/config/api.js
// Configuration API centralisée avec validation et utilitaires

// Validation des URLs critiques
const validateUrl = (url, name) => {
  if (!url) {
    console.error(`❌ Variable manquante: ${name}`);
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    console.error(`❌ URL invalide pour ${name}:`, url);
    return false;
  }
};

// Configuration principale
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL,
  socketURL: import.meta.env.VITE_SOCKET_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000
};

// Configuration application
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Cheapship',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description: import.meta.env.VITE_APP_DESCRIPTION || '',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@cheapship.fr',
  websiteUrl: import.meta.env.VITE_WEBSITE_URL || ''
};

// Feature flags
export const FEATURES = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  socket: import.meta.env.VITE_ENABLE_SOCKET === 'true',
  notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  smsVerification: import.meta.env.VITE_ENABLE_SMS_VERIFICATION === 'true'
};

// Validation des configurations critiques
const validateConfig = () => {
  const errors = [];
  
  if (!validateUrl(API_CONFIG.baseURL, 'VITE_API_URL')) {
    errors.push('API_URL invalide');
  }
  
  if (!validateUrl(API_CONFIG.socketURL, 'VITE_SOCKET_URL')) {
    errors.push('SOCKET_URL invalide');
  }
  
  if (API_CONFIG.timeout < 1000) {
    errors.push('Timeout trop faible (minimum 1000ms)');
  }
  
  if (errors.length > 0) {
    console.error('🚨 Erreurs de configuration:', errors);
    return false;
  }
  
  return true;
};

// Fonction apiCall réutilisable
export const apiCall = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    data,
    headers = {},
    timeout = API_CONFIG.timeout,
    ...otherOptions
  } = options;

  // Construire l'URL complète
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Configuration de la requête
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    ...otherOptions
  };

  // Ajouter le token d'authentification si disponible
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ajouter le body pour les requêtes POST/PUT/PATCH
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = JSON.stringify(data);
  }

  try {
    // Timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Tentative de parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();

  } catch (error) {
    // Gestion des erreurs spécifiques
    if (error.name === 'AbortError') {
      throw new Error(`Timeout: La requête vers ${endpoint} a pris trop de temps`);
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Connexion impossible au serveur. Vérifiez votre connexion internet.`);
    }

    throw error;
  }
};

// Health check du backend
export const healthCheck = async () => {
  try {
    const startTime = performance.now();
    const response = await apiCall('/health', { timeout: 5000 });
    const endTime = performance.now();
    
    return {
      status: 'ok',
      responseTime: Math.round(endTime - startTime),
      data: response,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Vérification automatique de la configuration
export const isConfigValid = validateConfig();

// Debug en développement uniquement
if (import.meta.env.DEV) {
  console.log('🔧 Cheapship Config:', {
    api: API_CONFIG,
    app: APP_CONFIG,
    features: FEATURES,
    env: import.meta.env.MODE,
    configValid: isConfigValid
  });
  
  // Test de health check automatique en dev
  healthCheck().then(health => {
    console.log('🏥 Backend Health:', health);
  });
}

// Utilitaires d'export
export const utils = {
  // Construire une URL complète
  buildUrl: (endpoint) => `${API_CONFIG.baseURL}${endpoint}`,
  
  // Vérifier si on est en production
  isProduction: () => import.meta.env.PROD,
  
  // Obtenir le token utilisateur
  getAuthToken: () => localStorage.getItem('token'),
  
  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  // Formater les erreurs API
  formatError: (error) => {
    if (error.message.includes('401')) return 'Session expirée. Veuillez vous reconnecter.';
    if (error.message.includes('403')) return 'Accès non autorisé.';
    if (error.message.includes('404')) return 'Ressource non trouvée.';
    if (error.message.includes('500')) return 'Erreur serveur. Réessayez plus tard.';
    return error.message || 'Une erreur est survenue.';
  }
};