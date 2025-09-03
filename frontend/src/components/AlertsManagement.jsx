import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Plus, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, 
  Calendar, Euro, Package, Plane, Star, AlertCircle, CheckCircle,
  Loader, Filter, Search, TrendingUp, Clock, Target, Globe, X
} from 'lucide-react';

const API_URL = 'https://cheapship-back.onrender.com/api';

const AlertsManagement = ({ user }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États pour l'autocomplétion des villes (corrigés pour GeoNames)
  const [departureCities, setDepartureCities] = useState([]);
  const [arrivalCities, setArrivalCities] = useState([]);
  const [showDepartureResults, setShowDepartureResults] = useState(false);
  const [showArrivalResults, setShowArrivalResults] = useState(false);
  const [loadingDeparture, setLoadingDeparture] = useState(false);
  const [loadingArrival, setLoadingArrival] = useState(false);
  
  const departureTimeout = useRef(null);
  const arrivalTimeout = useRef(null);
  const departureInputRef = useRef(null);
  const arrivalInputRef = useRef(null);
  const departureResultsRef = useRef(null);
  const arrivalResultsRef = useRef(null);

  // État du formulaire d'alerte
  const [alertForm, setAlertForm] = useState({
    type: 'PARCEL_NEEDED',
    departureCity: '',
    arrivalCity: '',
    maxPrice: '',
    maxWeight: '',
    departureDateFlex: 7,
    radius: 500,
    description: ''
  });

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts/my-alerts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        setError('Erreur lors du chargement des alertes');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleCreateAlert = async () => {
    setError('');
    setSuccess('');

    // Validation des villes
    if (!alertForm.departureCity || !alertForm.arrivalCity) {
      setError('Les villes de départ et d\'arrivée sont requises');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...alertForm,
          maxPrice: alertForm.maxPrice ? parseFloat(alertForm.maxPrice) : null,
          maxWeight: alertForm.maxWeight ? parseFloat(alertForm.maxWeight) : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(prev => [data.alert, ...prev]);
        setShowCreateForm(false);
        setAlertForm({
          type: 'PARCEL_NEEDED',
          departureCity: '',
          arrivalCity: '',
          maxPrice: '',
          maxWeight: '',
          departureDateFlex: 7,
          radius: 500,
          description: ''
        });
        setDepartureCities([]);
        setArrivalCities([]);
        setShowDepartureResults(false);
        setShowArrivalResults(false);
        setSuccess('Alerte créée avec succès !');
        fetchStats();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      setError('Erreur de connexion');
    }
  };

  const handleToggleAlert = async (alertId) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      const response = await fetch(`${API_URL}/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !alert.isActive
        })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, isActive: !a.isActive } : a
        ));
        setSuccess(`Alerte ${alert.isActive ? 'désactivée' : 'activée'} !`);
      }
    } catch (error) {
      setError('Erreur lors de la modification');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const response = await fetch(`${API_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        setSuccess('Alerte supprimée !');
        fetchStats();
      }
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  // Fonction de recherche de villes avec API GeoNames corrigée
  const searchCities = async (query, setResults, setLoading, setShowResults) => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    console.log('🔍 Searching cities for:', query); // Debug
    
    try {
      const url = `${API_URL}/cities/search?q=${encodeURIComponent(query)}&limit=8`;
      console.log('📡 API Call:', url); // Debug
      
      const response = await fetch(url);
      console.log('📥 Response status:', response.status); // Debug
      
      const data = await response.json();
      console.log('📄 Response data:', data); // Debug
      
      // ✅ GESTION DES DIFFÉRENTS FORMATS DE RÉPONSE
      if (data.success && data.cities && Array.isArray(data.cities)) {
        // Format attendu de votre backend cities.js
        const formattedCities = data.cities.map(city => ({
          id: city.id || city.geonameId,
          name: city.name,
          displayName: `${city.name}${city.region ? ', ' + city.region : ''}, ${city.country}`,
          country: city.country,
          countryCode: city.countryCode?.toLowerCase(),
          coordinates: city.coordinates
        }));
        console.log('✅ Formatted cities:', formattedCities); // Debug
        setResults(formattedCities);
        setShowResults(true);
      } else if (data.geonames && Array.isArray(data.geonames)) {
        // Format direct de GeoNames (fallback)
        const formattedCities = data.geonames.map(city => ({
          id: city.geonameId,
          name: city.name,
          displayName: `${city.name}${city.adminName1 ? ', ' + city.adminName1 : ''}, ${city.countryName}`,
          country: city.countryName,
          countryCode: city.countryCode?.toLowerCase(),
          coordinates: {
            lat: parseFloat(city.lat),
            lng: parseFloat(city.lng)
          }
        }));
        console.log('✅ GeoNames direct format:', formattedCities); // Debug
        setResults(formattedCities);
        setShowResults(true);
      } else {
        console.warn('⚠️ No cities found or API error:', data);
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('❌ Erreur recherche villes:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire pour ville de départ
  const handleDepartureSearch = (value) => {
    setAlertForm({...alertForm, departureCity: value});
    
    if (departureTimeout.current) {
      clearTimeout(departureTimeout.current);
    }
    
    departureTimeout.current = setTimeout(() => {
      searchCities(value, setDepartureCities, setLoadingDeparture, setShowDepartureResults);
    }, 300);
  };

  // Gestionnaire pour ville d'arrivée
  const handleArrivalSearch = (value) => {
    setAlertForm({...alertForm, arrivalCity: value});
    
    if (arrivalTimeout.current) {
      clearTimeout(arrivalTimeout.current);
    }
    
    arrivalTimeout.current = setTimeout(() => {
      searchCities(value, setArrivalCities, setLoadingArrival, setShowArrivalResults);
    }, 300);
  };

  // Sélection ville de départ
  const selectDepartureCity = (city) => {
    setAlertForm({...alertForm, departureCity: city.displayName});
    setShowDepartureResults(false);
    setDepartureCities([]);
  };

  // Sélection ville d'arrivée
  const selectArrivalCity = (city) => {
    setAlertForm({...alertForm, arrivalCity: city.displayName});
    setShowArrivalResults(false);
    setArrivalCities([]);
  };

  // Effacer ville de départ
  const clearDepartureCity = () => {
    setAlertForm({...alertForm, departureCity: ''});
    setDepartureCities([]);
    setShowDepartureResults(false);
    if (departureInputRef.current) {
      departureInputRef.current.focus();
    }
  };

  // Effacer ville d'arrivée
  const clearArrivalCity = () => {
    setAlertForm({...alertForm, arrivalCity: ''});
    setArrivalCities([]);
    setShowArrivalResults(false);
    if (arrivalInputRef.current) {
      arrivalInputRef.current.focus();
    }
  };

  // Gestion des clics en dehors des composants
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        departureResultsRef.current && 
        !departureResultsRef.current.contains(event.target) &&
        departureInputRef.current &&
        !departureInputRef.current.contains(event.target)
      ) {
        setShowDepartureResults(false);
      }
      
      if (
        arrivalResultsRef.current && 
        !arrivalResultsRef.current.contains(event.target) &&
        arrivalInputRef.current &&
        !arrivalInputRef.current.contains(event.target)
      ) {
        setShowArrivalResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (departureTimeout.current) {
        clearTimeout(departureTimeout.current);
      }
      if (arrivalTimeout.current) {
        clearTimeout(arrivalTimeout.current);
      }
    };
  }, []);

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'FLIGHT_NEEDED':
        return <Plane className="text-blue-600" size={20} />;
      case 'PARCEL_NEEDED':
        return <Package className="text-purple-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'FLIGHT_NEEDED':
        return 'Recherche de vol';
      case 'PARCEL_NEEDED':
        return 'Recherche de transporteur';
      default:
        return 'Alerte générale';
    }
  };

  const getFlexibilityLabel = (days) => {
    switch (days) {
      case 7:
        return '±7 jours';
      case 15:
        return '±15 jours';
      case 30:
        return '±30 jours';
      default:
        return `±${days} jours`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Chargement de vos alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Bell className="text-blue-600" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Alertes</h1>
                <p className="text-gray-600">Recevez des notifications pour les offres qui vous intéressent</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Créer une alerte
            </button>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
                <div className="text-sm text-gray-600">Alertes créées</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.active}</div>
                <div className="text-sm text-gray-600">Alertes actives</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats.triggered}</div>
                <div className="text-sm text-gray-600">Correspondances trouvées</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {stats.triggered > 0 ? Math.round((stats.triggered / stats.total) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Taux de réussite</div>
              </div>
            </div>
          )}
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
              ×
            </button>
          </div>
        )}

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Créer une nouvelle alerte</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'alerte
                  </label>
                  <select
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({...alertForm, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PARCEL_NEEDED">Recherche de transporteur pour colis</option>
                    <option value="FLIGHT_NEEDED">Recherche de vol</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flexibilité des dates
                  </label>
                  <select
                    value={alertForm.departureDateFlex}
                    onChange={(e) => setAlertForm({...alertForm, departureDateFlex: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>±7 jours</option>
                    <option value={15}>±15 jours</option>
                    <option value={30}>±30 jours</option>
                  </select>
                </div>

                {/* 🔥 CHAMP VILLE DE DÉPART CORRIGÉ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville de départ
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <MapPin size={20} />
                    </div>
                    <input
                      ref={departureInputRef}
                      type="text"
                      value={alertForm.departureCity}
                      onChange={(e) => handleDepartureSearch(e.target.value)}
                      placeholder="Ex: Lyon, France"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={() => {
                        if (departureCities.length > 0) {
                          setShowDepartureResults(true);
                        }
                      }}
                    />
                    
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      {loadingDeparture && <Loader className="animate-spin text-blue-500" size={16} />}
                      {alertForm.departureCity && (
                        <button
                          type="button"
                          onClick={clearDepartureCity}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    {/* Résultats de recherche départ */}
                    {showDepartureResults && departureCities.length > 0 && (
                      <div 
                        ref={departureResultsRef}
                        className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                      >
                        {departureCities.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => selectDepartureCity(city)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                          >
                            {city.countryCode && (
                              <img
                                src={`https://flagcdn.com/w20/${city.countryCode}.png`}
                                alt={city.country}
                                className="w-5 h-auto rounded"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {city.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {city.country}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔥 CHAMP VILLE D'ARRIVÉE CORRIGÉ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville d'arrivée
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <MapPin size={20} />
                    </div>
                    <input
                      ref={arrivalInputRef}
                      type="text"
                      value={alertForm.arrivalCity}
                      onChange={(e) => handleArrivalSearch(e.target.value)}
                      placeholder="Ex: Paris, France"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={() => {
                        if (arrivalCities.length > 0) {
                          setShowArrivalResults(true);
                        }
                      }}
                    />
                    
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      {loadingArrival && <Loader className="animate-spin text-blue-500" size={16} />}
                      {alertForm.arrivalCity && (
                        <button
                          type="button"
                          onClick={clearArrivalCity}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    {/* Résultats de recherche arrivée */}
                    {showArrivalResults && arrivalCities.length > 0 && (
                      <div 
                        ref={arrivalResultsRef}
                        className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                      >
                        {arrivalCities.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => selectArrivalCity(city)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                          >
                            {city.countryCode && (
                              <img
                                src={`https://flagcdn.com/w20/${city.countryCode}.png`}
                                alt={city.country}
                                className="w-5 h-auto rounded"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {city.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {city.country}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix maximum (€)
                  </label>
                  <input
                    type="number"
                    value={alertForm.maxPrice}
                    onChange={(e) => setAlertForm({...alertForm, maxPrice: e.target.value})}
                    placeholder="Ex: 50"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poids maximum (kg)
                  </label>
                  <input
                    type="number"
                    value={alertForm.maxWeight}
                    onChange={(e) => setAlertForm({...alertForm, maxWeight: e.target.value})}
                    placeholder="Ex: 5"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rayon de recherche (km)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={alertForm.radius}
                    onChange={(e) => setAlertForm({...alertForm, radius: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[80px]">
                    {alertForm.radius} km
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={alertForm.description}
                  onChange={(e) => setAlertForm({...alertForm, description: e.target.value})}
                  placeholder="Décrivez votre recherche..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCreateAlert}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Créer l'alerte
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des alertes */}
        <div className="space-y-6">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Bell className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune alerte configurée</h3>
              <p className="text-gray-600 mb-6">
                Créez votre première alerte pour être notifié des offres qui vous intéressent
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Créer ma première alerte
              </button>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getAlertTypeIcon(alert.type)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getAlertTypeLabel(alert.type)}
                      </h3>
                      
                      <button
                        onClick={() => handleToggleAlert(alert.id)}
                        className="flex items-center gap-2"
                      >
                        {alert.isActive ? (
                          <ToggleRight className="text-green-600" size={24} />
                        ) : (
                          <ToggleLeft className="text-gray-400" size={24} />
                        )}
                      </button>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        alert.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} />
                        <span className="text-sm">
                          {alert.departureCity} → {alert.arrivalCity}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">
                          {getFlexibilityLabel(alert.departureDateFlex)}
                        </span>
                      </div>
                      
                      {alert.maxPrice && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Euro size={16} />
                          <span className="text-sm">Max {alert.maxPrice}€</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Target size={16} />
                        <span className="text-sm">{alert.radius} km</span>
                      </div>
                    </div>

                    {alert.description && (
                      <p className="text-gray-600 text-sm mb-4">{alert.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Créée le {new Date(alert.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span>•</span>
                      <span>{alert.triggerCount} correspondances trouvées</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsManagement;