/**
 * 🚀 CHEAPSHIP API - Cloudflare Workers Complète
 * Fichier: src/workers/index.js
 */

// ================================
// UTILITAIRES
// ================================

// Génération d'UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Hash de mot de passe
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'cheapship_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vérification mot de passe
async function verifyPassword(password, hash) {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

// Génération JWT simple
function generateJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24h
  
  const body = btoa(JSON.stringify({ 
    ...payload, 
    iat: now,
    exp: exp 
  }));
  
  const signature = btoa(`${header}.${body}.${secret}`);
  return `${header}.${body}.${signature}`;
}

// Vérification JWT
function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = btoa(`${header}.${payload}.${secret}`);
    
    if (signature !== expectedSignature) {
      throw new Error('Signature invalide');
    }
    
    const decodedPayload = JSON.parse(atob(payload));
    
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expiré');
    }
    
    return decodedPayload;
  } catch (error) {
    throw new Error('Token invalide');
  }
}

// Vérification d'authentification
async function authenticateUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token manquant', status: 401 };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyJWT(token, env.JWT_SECRET || 'dev-secret-cheapship-2024');
    return { user: payload };
  } catch (error) {
    return { error: 'Token invalide: ' + error.message, status: 401 };
  }
}

// ================================
// HANDLER PRINCIPAL
// ================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    console.log(`${method} ${path}`);
    
    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Helper pour réponses JSON
    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    function errorResponse(message, status = 400) {
      return jsonResponse({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      }, status);
    }
    
    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    try {
      // ================================
      // ROUTES PUBLIQUES
      // ================================
      
      // Health check
      if (method === 'GET' && path === '/api/health') {
        return jsonResponse({
          status: 'ok',
          service: 'Cheapship API Workers',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          region: 'EU',
          database: 'D1 Connected',
          environment: env.NODE_ENV || 'development'
        });
      }
      
      // Test base de données
      if (method === 'GET' && path === '/api/test-db') {
        const result = await env.CHEAPSHIP_DB.prepare('SELECT COUNT(*) as count FROM users').first();
        return jsonResponse({
          success: true,
          message: 'Base de données connectée !',
          userCount: result.count || 0,
          tables: ['users', 'trips', 'parcels', 'messages', 'reviews']
        });
      }
      
      // ================================
      // ROUTES D'AUTHENTIFICATION
      // ================================
      
      // Inscription
      if (method === 'POST' && path === '/api/auth/register') {
        const { email, password, firstName, lastName, phone } = await request.json();
        
        // Validation
        if (!email || !password || !firstName || !lastName) {
          return errorResponse('Champs obligatoires manquants: email, password, firstName, lastName');
        }
        
        if (password.length < 6) {
          return errorResponse('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        // Vérifier si l'utilisateur existe
        const existingUser = await env.CHEAPSHIP_DB.prepare(
          'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();
        
        if (existingUser) {
          return errorResponse('Un compte existe déjà avec cet email', 409);
        }
        
        // Créer l'utilisateur
        const userId = generateUUID();
        const hashedPassword = await hashPassword(password);
        
        const result = await env.CHEAPSHIP_DB.prepare(`
          INSERT INTO users (id, email, password, firstName, lastName, phone, isVerified, isActive, rating)
          VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0.0)
        `).bind(userId, email, hashedPassword, firstName, lastName, phone || null).run();
        
        if (!result.success) {
          return errorResponse('Erreur lors de la création du compte', 500);
        }
        
        // Générer token
        const token = generateJWT({ 
          userId, 
          email,
          firstName,
          lastName 
        }, env.JWT_SECRET || 'dev-secret-cheapship-2024');
        
        return jsonResponse({
          success: true,
          message: 'Compte créé avec succès ! Bienvenue sur Cheapship 🎉',
          token,
          user: { 
            id: userId, 
            email, 
            firstName, 
            lastName,
            phone: phone || null,
            isVerified: true,
            rating: 0.0
          }
        }, 201);
      }
      
      // Connexion
      if (method === 'POST' && path === '/api/auth/login') {
        const { email, password } = await request.json();
        
        if (!email || !password) {
          return errorResponse('Email et mot de passe requis');
        }
        
        // Récupérer l'utilisateur
        const user = await env.CHEAPSHIP_DB.prepare(
          'SELECT * FROM users WHERE email = ? AND isActive = 1 AND isBanned = 0'
        ).bind(email).first();
        
        if (!user) {
          return errorResponse('Identifiants invalides', 401);
        }
        
        // Vérifier le mot de passe
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
          return errorResponse('Identifiants invalides', 401);
        }
        
        // Générer token
        const token = generateJWT({ 
          userId: user.id, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName 
        }, env.JWT_SECRET || 'dev-secret-cheapship-2024');
        
        return jsonResponse({
          success: true,
          message: `Bon retour ${user.firstName} ! 👋`,
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isVerified: Boolean(user.isVerified),
            rating: user.rating,
            profilePicture: user.profilePicture,
            redCards: user.redCards
          }
        });
      }
      
      // ================================
      // ROUTES PROTÉGÉES
      // ================================
      
      // Vérification de token pour routes protégées
      if (path.startsWith('/api/users') || path.startsWith('/api/trips') || path.startsWith('/api/parcels')) {
        const authResult = await authenticateUser(request, env);
        if (authResult.error) {
          return errorResponse(authResult.error, authResult.status);
        }
        request.user = authResult.user;
      }
      
      // Profil utilisateur
      if (method === 'GET' && path === '/api/users/me') {
        const user = await env.CHEAPSHIP_DB.prepare(
          'SELECT id, email, firstName, lastName, phone, isVerified, rating, profilePicture, redCards, createdAt FROM users WHERE id = ?'
        ).bind(request.user.userId).first();
        
        if (!user) {
          return errorResponse('Utilisateur non trouvé', 404);
        }
        
        return jsonResponse({
          success: true,
          user: {
            ...user,
            isVerified: Boolean(user.isVerified)
          }
        });
      }
      
      // Lister les voyages
      if (method === 'GET' && path === '/api/trips') {
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
        const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);
        
        const trips = await env.CHEAPSHIP_DB.prepare(`
          SELECT t.*, u.firstName, u.lastName, u.rating 
          FROM trips t 
          JOIN users u ON t.userId = u.id 
          WHERE t.status = 'active' 
          ORDER BY t.createdAt DESC 
          LIMIT ? OFFSET ?
        `).bind(limit, offset).all();
        
        return jsonResponse({
          success: true,
          trips: trips.results || [],
          pagination: { 
            limit, 
            offset, 
            total: trips.results?.length || 0 
          }
        });
      }
      
      // Créer un voyage
      if (method === 'POST' && path === '/api/trips') {
        const { departure, destination, departureDate, availableSpace, pricePerKg, description } = await request.json();
        
        // Validation
        if (!departure || !destination || !departureDate || !availableSpace || !pricePerKg) {
          return errorResponse('Champs obligatoires: departure, destination, departureDate, availableSpace, pricePerKg');
        }
        
        if (availableSpace < 1 || availableSpace > 50) {
          return errorResponse('L\'espace disponible doit être entre 1 et 50 kg');
        }
        
        if (pricePerKg < 1 || pricePerKg > 100) {
          return errorResponse('Le prix par kg doit être entre 1€ et 100€');
        }
        
        const tripId = generateUUID();
        
        const result = await env.CHEAPSHIP_DB.prepare(`
          INSERT INTO trips (id, userId, departure, destination, departureDate, availableSpace, pricePerKg, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `).bind(
          tripId, 
          request.user.userId, 
          departure, 
          destination, 
          departureDate, 
          availableSpace, 
          pricePerKg, 
          description || null
        ).run();
        
        if (!result.success) {
          return errorResponse('Erreur lors de la création du voyage', 500);
        }
        
        return jsonResponse({
          success: true,
          message: 'Voyage créé avec succès ! ✈️',
          trip: {
            id: tripId,
            departure,
            destination,
            departureDate,
            availableSpace,
            pricePerKg,
            description,
            status: 'active'
          }
        }, 201);
      }
      
      // Lister les colis
      if (method === 'GET' && path === '/api/parcels') {
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
        const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);
        
        const parcels = await env.CHEAPSHIP_DB.prepare(`
          SELECT p.*, u.firstName, u.lastName, u.rating 
          FROM parcels p 
          JOIN users u ON p.userId = u.id 
          WHERE p.status = 'pending' 
          ORDER BY p.createdAt DESC 
          LIMIT ? OFFSET ?
        `).bind(limit, offset).all();
        
        return jsonResponse({
          success: true,
          parcels: parcels.results || [],
          pagination: { 
            limit, 
            offset, 
            total: parcels.results?.length || 0 
          }
        });
      }
      
      // Créer un colis
      if (method === 'POST' && path === '/api/parcels') {
        const { title, description, weight, origin, destination, maxPrice } = await request.json();
        
        // Validation
        if (!title || !weight || !origin || !destination || !maxPrice) {
          return errorResponse('Champs obligatoires: title, weight, origin, destination, maxPrice');
        }
        
        if (weight < 0.1 || weight > 30) {
          return errorResponse('Le poids doit être entre 0.1kg et 30kg');
        }
        
        if (maxPrice < 5 || maxPrice > 500) {
          return errorResponse('Le prix maximum doit être entre 5€ et 500€');
        }
        
        const parcelId = generateUUID();
        
        const result = await env.CHEAPSHIP_DB.prepare(`
          INSERT INTO parcels (id, userId, title, description, weight, origin, destination, maxPrice, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
          parcelId, 
          request.user.userId, 
          title, 
          description || null, 
          weight, 
          origin, 
          destination, 
          maxPrice
        ).run();
        
        if (!result.success) {
          return errorResponse('Erreur lors de la création du colis', 500);
        }
        
        return jsonResponse({
          success: true,
          message: 'Colis créé avec succès ! 📦',
          parcel: {
            id: parcelId,
            title,
            description,
            weight,
            origin,
            destination,
            maxPrice,
            status: 'pending'
          }
        }, 201);
      }
      
      // ================================
      // ROUTE PAR DÉFAUT
      // ================================
      return jsonResponse({
        message: 'Cheapship API Workers',
        version: '1.0.0',
        availableRoutes: {
          public: [
            'GET /api/health',
            'GET /api/test-db',
            'POST /api/auth/register',
            'POST /api/auth/login'
          ],
          protected: [
            'GET /api/users/me',
            'GET /api/trips',
            'POST /api/trips',
            'GET /api/parcels',
            'POST /api/parcels'
          ]
        },
        requestedPath: path
      });
      
    } catch (error) {
      console.error('❌ Erreur Workers:', error);
      return errorResponse('Erreur serveur interne: ' + error.message, 500);
    }
  }
};