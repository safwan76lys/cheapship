import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plane, 
  Package, 
  Search, 
  MessageCircle, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Star,
  CreditCard,
  History,
  HelpCircle
} from 'lucide-react';

const Navigation = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier si une route est active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation items pour la barre principale
  const navigationItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/search', label: 'Rechercher', icon: Search },
    { path: '/trips', label: 'Mes voyages', icon: Plane },
    { path: '/parcels', label: 'Mes colis', icon: Package },
    { path: '/messages', label: 'Messages', icon: MessageCircle, badge: 3 },
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: 5 }
  ];

  // Menu utilisateur dropdown
  const userMenuItems = [
    { path: '/profile', label: 'Mon profil', icon: User },
    { path: '/reviews', label: 'Mes avis', icon: Star },
    { path: '/payments', label: 'Paiements', icon: CreditCard },
    { path: '/history', label: 'Historique', icon: History },
    { path: '/help', label: 'Aide', icon: HelpCircle },
    { action: 'logout', label: 'Déconnexion', icon: LogOut, danger: true }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleUserMenuClick = (item) => {
    if (item.action === 'logout') {
      onLogout();
    } else {
      navigate(item.path);
    }
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            <div className="p-2 bg-blue-600 rounded-lg mr-3">
              <Plane className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">Cheapship</span>
          </div>

          {/* Navigation principale - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`relative flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} className="mr-2" />
                {item.label}
                
                {/* Badge pour notifications */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Boutons d'action rapide - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Bouton créer voyage */}
            <button
              onClick={() => navigate('/trips/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <Plane size={18} className="mr-2" />
              Publier
            </button>
            
            {/* Bouton créer colis */}
            <button
              onClick={() => navigate('/parcels/create')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center"
            >
              <Package size={18} className="mr-2" />
              Envoyer
            </button>

            {/* Menu utilisateur */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-sm font-semibold text-blue-600">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{user?.fullName || 'Utilisateur'}</span>
              </button>

              {/* Dropdown menu utilisateur */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {userMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleUserMenuClick(item)}
                      className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                        item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                      }`}
                    >
                      <item.icon size={18} className="mr-3" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu hamburger - Mobile */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4">
            
            {/* Navigation items mobile */}
            <div className="space-y-2 mb-4">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Boutons d'action mobile */}
            <div className="space-y-2 mb-4 border-t pt-4">
              <button
                onClick={() => handleNavigation('/trips/create')}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <Plane size={18} className="mr-2" />
                Publier un voyage
              </button>
              
              <button
                onClick={() => handleNavigation('/parcels/create')}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
              >
                <Package size={18} className="mr-2" />
                Envoyer un colis
              </button>
            </div>

            {/* Menu utilisateur mobile */}
            <div className="border-t pt-4">
              <div className="flex items-center px-4 py-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="font-semibold text-blue-600">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user?.fullName || 'Utilisateur'}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
              </div>
              
              {userMenuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleUserMenuClick(item)}
                  className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                  }`}
                >
                  <item.icon size={18} className="mr-3" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overlay pour fermer les menus */}
      {(isUserMenuOpen || isMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navigation;