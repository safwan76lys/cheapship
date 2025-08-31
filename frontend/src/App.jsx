import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Import des composants
import CheapshipLanding from './components/CheapshipLanding';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import Reviews from './components/Reviews';
import TravelForm from './components/TravelForm';
import ParcelForm from './components/ParcelForm';
import TripsManagement from './components/TripsManagement';
import ParcelsManagement from './components/ParcelsManagement';
import TripEditForm from './components/TripEditForm';
import ParcelEditForm from './components/ParcelEditForm';
import socketService from './services/socketService';
import SMSTestPage from './pages/SMSTestPage';

// ✅ AJOUT : Import configuration API centralisée
import { API_CONFIG } from './config/api.js';

// Composant principal avec Router
const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  useEffect(() => {
    console.log("Vérification authentification au démarrage...");
    
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || token === 'null' || token === 'undefined' || token.length < 10) {
          console.log("Token invalide ou manquant, nettoyage...");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }
        
        if (token && userData) {
          console.log("Token trouvé, validation avec le backend...");
          
          try {
            // ✅ MODIFICATION : Utiliser API_CONFIG au lieu d'URL hardcodée
            const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const backendUserData = await response.json();
              console.log("Token valide, restauration session");
              setUser(backendUserData.user);
              setIsAuthenticated(true);
              
              // Socket.IO conditionnel
              if (location.pathname !== '/' && location.pathname !== '/auth' && 
                  location.pathname !== '/help' && location.pathname !== '/terms' && 
                  location.pathname !== '/privacy') {
                socketService.connect(token);
              }
            } else {
              console.log("Token invalide (status:", response.status, "), nettoyage...");
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (tokenError) {
            console.error('Erreur validation token:', tokenError);
            console.log("Nettoyage du localStorage à cause de l'erreur");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          console.log("Pas de token, utilisateur non connecté");
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (token, userData) => {
    console.log('Connexion réussie:', userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    socketService.connect(token);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    console.log('Déconnexion utilisateur');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    
    socketService.disconnect();
    navigate('/', { replace: true });
  };

  // Composant pour protéger les routes privées
  const PrivateRoute = ({ children }) => {
    console.log("Vérification route privée - Auth:", isAuthenticated);
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      console.log("Accès refusé - Redirection vers /auth");
      return <Navigate to="/auth" replace />;
    }
    
    return children;
  };

  // Composant pour rediriger les utilisateurs connectés des pages publiques
  const PublicRoute = ({ children }) => {
    console.log("Vérification route publique - Auth:", isAuthenticated);
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (isAuthenticated && location.pathname === '/auth') {
      console.log("Utilisateur connecté sur /auth - Redirection vers /dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de Cheapship...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Pages publiques */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <CheapshipLanding />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/auth" 
          element={
            <PublicRoute>
              <AuthPage onLogin={handleLogin} />
            </PublicRoute>
          } 
        />

        {/* ===== PAGE DE TEST SMS (DÉVELOPPEMENT) ===== */}
        <Route 
          path="/test-sms" 
          element={
            <PrivateRoute>
              <SMSTestPage />
            </PrivateRoute>
          } 
        />

        {/* Pages privées */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <UserProfile user={user} />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/reviews" 
          element={
            <PrivateRoute>
              <Reviews userId={user?.id} />
            </PrivateRoute>
          } 
        />

        {/* Gestion des voyages */}
        <Route 
          path="/trips" 
          element={
            <PrivateRoute>
              <TripsManagement />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/trips/create" 
          element={
            <PrivateRoute>
              <TravelForm />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/trips/edit/:id" 
          element={
            <PrivateRoute>
              <TripEditForm />
            </PrivateRoute>
          } 
        />

        {/* Gestion des colis */}
        <Route 
          path="/parcels" 
          element={
            <PrivateRoute>
              <ParcelsManagement />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/parcels/create" 
          element={
            <PrivateRoute>
              <ParcelForm />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/parcels/edit/:id" 
          element={
            <PrivateRoute>
              <ParcelEditForm />
            </PrivateRoute>
          } 
        />

        {/* Pages futures */}
        <Route 
          path="/search" 
          element={
            <PrivateRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">🔍 Recherche</h1>
                  <p className="text-gray-600">Page de recherche à développer</p>
                </div>
              </div>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/messages" 
          element={
            <PrivateRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">💬 Messages</h1>
                  <p className="text-gray-600">Chat temps réel à développer</p>
                </div>
              </div>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/notifications" 
          element={
            <PrivateRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">🔔 Notifications</h1>
                  <p className="text-gray-600">Centre de notifications à développer</p>
                </div>
              </div>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/payments" 
          element={
            <PrivateRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">💳 Paiements</h1>
                  <p className="text-gray-600">Gestion des paiements à développer</p>
                </div>
              </div>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/history" 
          element={
            <PrivateRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">📊 Historique</h1>
                  <p className="text-gray-600">Historique des transactions à développer</p>
                </div>
              </div>
            </PrivateRoute>
          } 
        />

        {/* Pages d'aide et légales */}
        <Route 
          path="/help" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">❓ Centre d'aide</h1>
                <p className="text-gray-600">FAQ et support à développer</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          } 
        />
        
        <Route 
          path="/terms" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">📋 Conditions d'utilisation</h1>
                <p className="text-gray-600">CGU à rédiger</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          } 
        />
        
        <Route 
          path="/privacy" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">🔒 Politique de confidentialité</h1>
                <p className="text-gray-600">Politique de confidentialité à rédiger</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          } 
        />

        {/* 404 - redirige vers la landing */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </div>
  );
};

// Composant principal App avec Router
function App() {
  console.log("🚀 App.jsx - Démarrage avec React Router");
  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;