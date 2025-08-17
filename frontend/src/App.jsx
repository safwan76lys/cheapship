import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Import des composants existants
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
import CityAutocompleteTest from './components/CityAutocompleteSimple';
import AlertsManagement from './components/AlertsManagement';

// Import Socket.IO seulement pour les pages connectées
// import socketService from './services/socketService';

// Composant principal avec Router
const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Vérifier l'authentification au démarrage
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Optionnel : vérifier la validité du token avec l'API
          // const response = await fetch('/api/auth/verify', {
          //   headers: { 'Authorization': `Bearer ${token}` }
          // });
          // if (response.ok) {
          //   const userData = await response.json();
          //   setUser(userData);
          //   setIsAuthenticated(true);
          // }
          
          // Version simplifiée pour la démo
          setIsAuthenticated(true);
          setUser({ id: '1', email: 'user@example.com' });
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Initialiser Socket.IO SEULEMENT pour les pages connectées
    if (isAuthenticated && !isLandingPage()) {
      // socketService.connect();
      console.log('🔌 Socket.IO connecté pour utilisateur authentifié');
    }

    return () => {


      // Déconnecter Socket.IO lors du nettoyage
      // if (isAuthenticated) {
      //   socketService.disconnect();
      // }
    };
  }, [isAuthenticated, location.pathname]);

  // Vérifier si on est sur la landing page
  const isLandingPage = () => {
    return location.pathname === '/' || location.pathname === '/landingpage';
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Rediriger vers le dashboard après connexion
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    
    // Déconnecter Socket.IO
    // socketService.disconnect();
    
    // Rediriger vers la landing page
    navigate('/');
  };

  // Composant pour protéger les routes privées
  const PrivateRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    return isAuthenticated ? children : <Navigate to="/auth" replace />;
  };

  // Composant pour rediriger les utilisateurs connectés
  const PublicRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
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
        {/* ===== PAGES PUBLIQUES ===== */}
        
        {/* Landing Page - Pas de Socket.IO */}
        <Route 
          path="/" 
          element={<CheapshipLanding />} 
        />
        
        {/* Alias pour la landing page */}
        <Route 
          path="/landingpage" 
          element={<Navigate to="/" replace />} 
        />
        
        {/* Page d'authentification */}
        <Route 
          path="/auth" 
          element={
            <PublicRoute>
              <AuthPage onLogin={handleLogin} />
            </PublicRoute>
          } 
        />

        {/* ===== PAGES PRIVÉES (NÉCESSITENT AUTHENTIFICATION) ===== */}
        
        {/* Dashboard principal */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          } 
        />
        
        {/* Profil utilisateur */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <UserProfile user={user} />
            </PrivateRoute>
          } 
        />
        
        {/* Avis et notation */}
        <Route 
          path="/reviews" 
          element={
            <PrivateRoute>
              <Reviews userId={user?.id} />
            </PrivateRoute>
          } 
        />

        {/* ===== GESTION DES VOYAGES ===== */}
        
        {/* Liste des voyages */}
        <Route 
          path="/trips" 
          element={
            <PrivateRoute>
              <TripsManagement />
            </PrivateRoute>
          } 
        />
        
        {/* Créer un voyage */}
        <Route 
          path="/trips/create" 
          element={
            <PrivateRoute>
              <TravelForm />
            </PrivateRoute>
          } 
        />
        
        {/* Modifier un voyage */}
        <Route 
          path="/trips/edit/:id" 
          element={
            <PrivateRoute>
              <TripEditForm />
            </PrivateRoute>
          } 
        />

        {/* ===== GESTION DES COLIS ===== */}
        
        {/* Liste des colis */}
        <Route 
          path="/parcels" 
          element={
            <PrivateRoute>
              <ParcelsManagement />
            </PrivateRoute>
          } 
        />
        
        {/* Créer un colis */}
        <Route 
          path="/parcels/create" 
          element={
            <PrivateRoute>
              <ParcelForm />
            </PrivateRoute>
          } 
        />
        
        {/* Modifier un colis */}
        <Route 
          path="/parcels/edit/:id" 
          element={
            <PrivateRoute>
              <ParcelEditForm />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/alerts" 
          element={
            <PrivateRoute>
              <AlertsManagement user={user} />
            </PrivateRoute>
          } 
/>
        {/* ===== PAGES FUTURES (PRÉPARÉES) ===== */}
        
        {/* Page de recherche */}
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
        
        {/* Chat/Messages */}
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
        
        {/* Notifications */}
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
        
        {/* Paiements */}
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
        
        {/* Historique */}
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

        {/* ===== PAGES D'AIDE ET LÉGALES ===== */}
        
        {/* Centre d'aide */}
        <Route 
          path="/help" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">❓ Centre d'aide</h1>
                <p className="text-gray-600">FAQ et support à développer</p>
              </div>
            </div>
          } 
        />
        
        {/* CGU */}
        <Route 
          path="/terms" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">📋 Conditions d'utilisation</h1>
                <p className="text-gray-600">CGU à rédiger</p>
              </div>
            </div>
          } 
        />
        
        {/* Politique de confidentialité */}
        <Route 
          path="/privacy" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">🔒 Politique de confidentialité</h1>
                <p className="text-gray-600">Politique de confidentialité à rédiger</p>
              </div>
            </div>
          } 
        />
<Route path="/test-cities" element={<CityAutocompleteTest />} />
        {/* ===== GESTION DES ERREURS ===== */}
        
        {/* Page 404 - redirige vers la landing */}
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
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;