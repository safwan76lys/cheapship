import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, Package, MapPin, ArrowRight, Star, Shield, Clock, Users, TrendingUp, 
  Menu, X, ChevronDown, Search, Filter, Navigation, Target, Globe, Loader,
  AlertCircle, RefreshCw, Eye, MessageCircle, Heart, CheckCircle, Play,
  Smartphone, Lock, Award, Globe2
} from 'lucide-react';

const CheapshipLanding = () => {
  const [activeTab, setActiveTab] = useState('vols');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyFlights, setNearbyFlights] = useState([]);
  const [nearbyParcels, setNearbyParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  
  const navigate = useNavigate();
  
  // ✅ SOLUTION : Contrôle des re-montages avec des refs
  const initializationRef = useRef(false);
  const locationFetchedRef = useRef(false);
  
  // API Configuration
  const API_BASE = 'http://localhost:4000/api';

  // ✅ Navigation sécurisée avec React Router
  const handleActionClick = useCallback(() => {
    console.log("🎯 handleActionClick déclenché depuis Landing");
    
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log("🚀 Utilisateur connecté - Navigation vers /dashboard");
      navigate('/dashboard');
    } else {
      console.log("🚀 Utilisateur non connecté - Navigation vers /auth");
      navigate('/auth');
    }
  }, [navigate]);

  // ✅ Initialisation unique contrôlée
  useEffect(() => {
    if (!initializationRef.current) {
      console.log("🎯 CheapshipLanding - Initialisation unique");
      initializationRef.current = true;
      initializeLocation();
    }
  }, []);

  // Initialisation de la géolocalisation
  const initializeLocation = useCallback(async () => {
    if (locationFetchedRef.current) {
      console.log("⚠️ Géolocalisation déjà en cours, abandon");
      return;
    }
    
    locationFetchedRef.current = true;
    setLocationLoading(true);
    
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const response = await fetch(
                `http://api.geonames.org/findNearbyPlaceNameJSON?lat=${latitude}&lng=${longitude}&maxRows=1&username=cheapship`
              );
              const data = await response.json();
              
              if (data.geonames && data.geonames.length > 0) {
                const place = data.geonames[0];
                const locationInfo = {
                  city: place.name,
                  country: place.countryName,
                  region: place.adminName1,
                  latitude,
                  longitude,
                  accuracy: position.coords.accuracy
                };
                
                setUserLocation(locationInfo);
                setGpsEnabled(true);
                
                await fetchLocalData(locationInfo);
              } else {
                await fallbackToIP();
              }
            } catch (error) {
              console.error('Erreur reverse geocoding:', error);
              await fallbackToIP();
            }
          },
          async (error) => {
            console.error('Erreur géolocalisation GPS:', error);
            await fallbackToIP();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        await fallbackToIP();
      }
    } catch (error) {
      console.error('Erreur initialisation géolocalisation:', error);
      setDefaultLocation();
    }
  }, []);

  // Fallback sur géolocalisation IP
  const fallbackToIP = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/location`);
      const data = await response.json();
      
      if (data.success && data.location) {
        const locationInfo = {
          city: data.location.city,
          country: data.location.country,
          region: data.location.region,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: 10000
        };
        
        setUserLocation(locationInfo);
        setGpsEnabled(false);
        await fetchLocalData(locationInfo);
      } else {
        setDefaultLocation();
      }
    } catch (error) {
      console.error('Erreur géolocalisation IP:', error);
      setDefaultLocation();
    }
  }, []);

  // Location par défaut (Lyon)
  const setDefaultLocation = useCallback(() => {
    const defaultLocation = {
      city: 'Lyon',
      country: 'France',
      region: 'Auvergne-Rhône-Alpes',
      latitude: 45.7640,
      longitude: 4.8357,
      accuracy: 10000
    };
    
    setUserLocation(defaultLocation);
    setGpsEnabled(false);
    fetchLocalData(defaultLocation);
  }, []);

  // Récupération des données locales avec l'API
  const fetchLocalData = useCallback(async (location) => {
    console.log("🔍 Récupération des données locales pour:", location.city);
    
    try {
      const radius = 300;
      
      // APPEL API RÉEL POUR LES VOLS
      try {
        const flightsResponse = await fetch(
          `${API_BASE}/trips/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=${radius}`
        );
        
        if (flightsResponse.ok) {
          const flightsData = await flightsResponse.json();
          if (flightsData.success && flightsData.trips) {
            const formattedFlights = flightsData.trips.map(trip => ({
              id: trip.id,
              user: {
                name: trip.user.name,
                rating: trip.user.rating,
                photo: trip.user.photo,
                verified: trip.user.verified
              },
              departure: trip.departure,
              arrival: trip.arrival,
              date: new Date(trip.departureDate).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              }),
              time: new Date(trip.departureDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              price: `${trip.price}€/kg`,
              capacity: `${trip.availableWeight} kg`,
              distance: trip.distance ? `${trip.distance} km` : 'N/A'
            }));
            setNearbyFlights(formattedFlights);
          } else {
            setNearbyFlights(getFallbackFlights(location));
          }
        } else {
          setNearbyFlights(getFallbackFlights(location));
        }
      } catch (error) {
        console.error('Erreur API vols:', error);
        setNearbyFlights(getFallbackFlights(location));
      }

      // APPEL API RÉEL POUR LES COLIS
      try {
        const parcelsResponse = await fetch(
          `${API_BASE}/parcels/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=${radius}`
        );
        
        if (parcelsResponse.ok) {
          const parcelsData = await parcelsResponse.json();
          if (parcelsData.success && parcelsData.parcels) {
            const formattedParcels = parcelsData.parcels.map(parcel => ({
              id: parcel.id,
              user: {
                name: parcel.user.name,
                rating: parcel.user.rating,
                photo: parcel.user.photo,
                verified: parcel.user.verified
              },
              item: parcel.name,
              pickup: parcel.pickupCity,
              delivery: parcel.deliveryCity,
              budget: `${parcel.maxPrice}€`,
              urgency: parcel.urgency,
              weight: `${parcel.weight} kg`,
              distance: parcel.distance ? `${parcel.distance} km` : 'N/A'
            }));
            setNearbyParcels(formattedParcels);
          } else {
            setNearbyParcels(getFallbackParcels(location));
          }
        } else {
          setNearbyParcels(getFallbackParcels(location));
        }
      } catch (error) {
        console.error('Erreur API colis:', error);
        setNearbyParcels(getFallbackParcels(location));
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données locales:', error);
      setNearbyFlights(getFallbackFlights(location));
      setNearbyParcels(getFallbackParcels(location));
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  }, []);

  // Données de fallback
  const getFallbackFlights = useCallback((location) => {
    return [
      {
        id: 1,
        user: { name: 'Marie D.', rating: 4.9, photo: '/api/placeholder/40/40', verified: true },
        departure: location.city,
        arrival: 'Paris',
        date: '15 Jan 2025',
        time: '14h30',
        price: '8€/kg',
        capacity: '15 kg',
        distance: '12 km'
      },
      {
        id: 2,
        user: { name: 'Thomas L.', rating: 4.8, photo: '/api/placeholder/40/40', verified: true },
        departure: location.city,
        arrival: location.country === 'France' ? 'Marseille' : 'London',
        date: '16 Jan 2025',
        time: '09h15',
        price: '12€/kg',
        capacity: '8 kg',
        distance: '18 km'
      },
      {
        id: 3,
        user: { name: 'Sophie M.', rating: 4.7, photo: '/api/placeholder/40/40', verified: true },
        departure: location.country === 'France' ? 'Nice' : 'Berlin',
        arrival: location.city,
        date: '17 Jan 2025',
        time: '16h45',
        price: '10€/kg',
        capacity: '12 kg',
        distance: '25 km'
      }
    ];
  }, []);

  const getFallbackParcels = useCallback((location) => {
    return [
      {
        id: 1,
        user: { name: 'Pierre B.', rating: 4.8, photo: '/api/placeholder/40/40', verified: true },
        item: 'Livre ancien',
        pickup: `${location.city} Centre`,
        delivery: location.country === 'France' ? 'Paris 15e' : 'London',
        budget: '25€',
        urgency: 'Normal',
        weight: '0.8 kg',
        distance: '8 km'
      },
      {
        id: 2,
        user: { name: 'Claire F.', rating: 4.9, photo: '/api/placeholder/40/40', verified: true },
        item: 'Électronique',
        pickup: `${location.city}`,
        delivery: location.country === 'France' ? 'Marseille' : 'Amsterdam',
        budget: '50€',
        urgency: 'Urgent',
        weight: '2.5 kg',
        distance: '15 km'
      },
      {
        id: 3,
        user: { name: 'Marc L.', rating: 4.6, photo: '/api/placeholder/40/40', verified: true },
        item: 'Documents importants',
        pickup: location.country === 'France' ? 'Nice' : 'Brussels',
        delivery: location.city,
        budget: '30€',
        urgency: 'Express',
        weight: '0.3 kg',
        distance: '22 km'
      }
    ];
  }, []);

  // Refresh contrôlé
  const refreshLocation = useCallback(() => {
    console.log("🔄 Refresh demandé");
    locationFetchedRef.current = false;
    setLocationLoading(true);
    setLoading(true);
    initializeLocation();
  }, [initializeLocation]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="p-2 bg-blue-600 rounded-lg mr-3">
                <Plane className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900">Cheapship</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#comment-ca-marche" className="text-gray-600 hover:text-blue-600 transition-colors">Comment ça marche</a>
              <a href="#garanties" className="text-gray-600 hover:text-blue-600 transition-colors">Garanties</a>
              <a href="#aide" className="text-gray-600 hover:text-blue-600 transition-colors">Aide</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleActionClick}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Se connecter
              </button>
              <button 
                onClick={handleActionClick}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                S'inscrire
              </button>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-4">
              <div className="space-y-4">
                <a href="#comment-ca-marche" className="block text-gray-600 hover:text-blue-600">Comment ça marche</a>
                <a href="#garanties" className="block text-gray-600 hover:text-blue-600">Garanties</a>
                <a href="#aide" className="block text-gray-600 hover:text-blue-600">Aide</a>
                <div className="border-t pt-4 space-y-2">
                  <button 
                    onClick={handleActionClick}
                    className="block w-full text-left text-gray-600 hover:text-gray-900"
                  >
                    Se connecter
                  </button>
                  <button 
                    onClick={handleActionClick}
                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    S'inscrire
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Voyagez malin,<br />
              <span className="text-blue-200">transportez intelligent</span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Rejoignez la première plateforme de transport collaboratif géolocalisée. 
              Proposez vos vols ou trouvez des transporteurs près de chez vous.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">50k+</div>
                <div className="text-blue-100">Membres actifs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">200k+</div>
                <div className="text-blue-100">Colis transportés</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">4.9★</div>
                <div className="text-blue-100">Note moyenne</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleActionClick}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🎒 Publier un voyage
              </button>
              <button 
                onClick={handleActionClick}
                className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-400"
              >
                📦 Envoyer un colis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-white py-12 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-3">
                {locationLoading ? (
                  <>
                    <Loader className="text-blue-600 animate-spin" size={20} />
                    <span className="text-gray-600">Localisation en cours...</span>
                  </>
                ) : (
                  <>
                    {gpsEnabled ? (
                      <Navigation className="text-green-600" size={20} />
                    ) : (
                      <MapPin className="text-blue-600" size={20} />
                    )}
                    <span className="text-gray-600">Position actuelle : </span>
                    <span className="font-semibold text-gray-900">
                      {userLocation ? `${userLocation.city}, ${userLocation.country}` : 'Non disponible'}
                    </span>
                    {gpsEnabled && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full ml-2">
                        GPS activé
                      </span>
                    )}
                    <button
                      onClick={refreshLocation}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Actualiser la position"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => setActiveTab('vols')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'vols'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✈️ Vols disponibles
              </button>
              <button
                onClick={() => setActiveTab('colis')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'colis'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📦 Colis à transporter
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Recherche d'offres près de vous...</p>
                {userLocation && (
                  <p className="text-sm text-gray-500 mt-2">
                    Dans un rayon de 300km autour de {userLocation.city}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'vols' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Plane className="text-blue-600 mr-2" size={20} />
                        Vols proches de vous
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Target className="mr-1" size={16} />
                        <span>Dans un rayon de 300km</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {nearbyFlights.length > 0 ? (
                        nearbyFlights.map((flight) => (
                          <div 
                            key={flight.id} 
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50"
                            onClick={handleActionClick}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="font-semibold text-blue-600">
                                      {flight.user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <span className="font-semibold text-gray-900">{flight.user.name}</span>
                                      {flight.user.verified && (
                                        <Shield className="text-green-500 ml-1" size={16} />
                                      )}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Star className="text-yellow-400 mr-1" size={14} fill="currentColor" />
                                      {flight.user.rating}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center text-lg font-semibold mb-2">
                                  <span className="text-gray-900">{flight.departure}</span>
                                  <ArrowRight className="text-gray-400 mx-3" size={20} />
                                  <span className="text-gray-900">{flight.arrival}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <Clock className="mr-2" size={16} />
                                  <span>{flight.date} à {flight.time}</span>
                                  <MapPin className="ml-4 mr-1" size={16} />
                                  <span>{flight.distance}</span>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{flight.price}</div>
                                <div className="text-sm text-gray-600">Capacité: {flight.capacity}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun vol trouvé</h4>
                          <p className="text-gray-600 mb-4">
                            Aucun vol disponible près de {userLocation?.city || 'votre position'}
                          </p>
                          <button 
                            onClick={handleActionClick}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Publier votre voyage →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'colis' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Package className="text-purple-600 mr-2" size={20} />
                        Colis à transporter près de vous
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Target className="mr-1" size={16} />
                        <span>Dans un rayon de 300km</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {nearbyParcels.length > 0 ? (
                        nearbyParcels.map((parcel) => (
                          <div 
                            key={parcel.id} 
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50/50"
                            onClick={handleActionClick}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="font-semibold text-purple-600">
                                      {parcel.user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <span className="font-semibold text-gray-900">{parcel.user.name}</span>
                                      {parcel.user.verified && (
                                        <Shield className="text-green-500 ml-1" size={16} />
                                      )}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Star className="text-yellow-400 mr-1" size={14} fill="currentColor" />
                                      {parcel.user.rating}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mb-2">
                                  <span className="font-semibold text-gray-900">{parcel.item}</span>
                                  <span className="text-gray-600 ml-2">({parcel.weight})</span>
                                </div>
                                
                                <div className="flex items-center text-lg mb-2">
                                  <span className="text-gray-900">{parcel.pickup}</span>
                                  <ArrowRight className="text-gray-400 mx-3" size={16} />
                                  <span className="text-gray-900">{parcel.delivery}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium mr-3 ${
                                    parcel.urgency === 'Express' ? 'bg-red-100 text-red-700' :
                                    parcel.urgency === 'Urgent' ? 'bg-orange-100 text-orange-700' :
                                    parcel.urgency === 'Normal' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {parcel.urgency}
                                  </span>
                                  <MapPin className="mr-1" size={16} />
                                  <span>{parcel.distance}</span>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-purple-600 mb-1">{parcel.budget}</div>
                                <div className="text-sm text-gray-600">Budget max</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun colis trouvé</h4>
                          <p className="text-gray-600 mb-4">
                            Aucun colis à transporter près de {userLocation?.city || 'votre position'}
                          </p>
                          <button 
                            onClick={handleActionClick}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Publier votre demande →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simplifions le transport collaboratif en 3 étapes simples
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                📱 Inscrivez-vous et vérifiez votre identité
              </h3>
              <p className="text-gray-600">
                Créez votre profil en quelques minutes. Vérification d'identité obligatoire pour garantir la sécurité de tous.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🎯 Publiez ou trouvez
              </h3>
              <p className="text-gray-600">
                Publiez votre voyage pour transporter des colis, ou trouvez un transporteur près de chez vous grâce à la géolocalisation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                💬 Négociez et transportez
              </h3>
              <p className="text-gray-600">
                Discutez via notre chat temps réel, négociez le prix, et effectuez le transport en toute sécurité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Garanties */}
      <section id="garanties" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Vos garanties de sécurité
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transportez et envoyez vos colis en toute confiance grâce à nos garanties
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Identité vérifiée
              </h3>
              <p className="text-gray-600 text-sm">
                Tous les membres doivent vérifier leur identité avec une pièce officielle
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Système de notation
              </h3>
              <p className="text-gray-600 text-sm">
                Notes et avis après chaque transport pour maintenir la qualité du service
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Support 24/7
              </h3>
              <p className="text-gray-600 text-sm">
                Notre équipe est disponible 24h/24 pour vous aider en cas de problème
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-purple-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Assurance colis
              </h3>
              <p className="text-gray-600 text-sm">
                Tous les colis sont couverts par notre assurance en cas de dommage
              </p>
            </div>
          </div>

          <div className="mt-16 bg-gray-50 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">99.8%</div>
                <div className="text-gray-600">Transports réussis</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
                <div className="text-gray-600">Satisfaction moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">24h</div>
                <div className="text-gray-600">Temps de réponse support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Prêt à rejoindre la révolution du transport ?
          </h2>
          <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Rejoignez plus de 50 000 membres qui font confiance à Cheapship pour leurs transports collaboratifs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button 
              onClick={handleActionClick}
              className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              🎒 Je propose un voyage
            </button>
            <button 
              onClick={handleActionClick}
              className="bg-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-400 transition-all duration-200 transform hover:scale-105 shadow-xl border-2 border-blue-400"
            >
              📦 J'envoie un colis
            </button>
          </div>

          <div className="text-blue-200 text-sm">
            <p>✅ Inscription gratuite • ✅ Aucun frais caché • ✅ Support 24/7</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-600 rounded-lg mr-3">
                  <Plane className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold">Cheapship</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                La première plateforme de transport collaboratif géolocalisée. 
                Connectons les voyageurs et les expéditeurs partout en Europe.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Cheapship</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#comment-ca-marche" className="hover:text-white transition-colors">Comment ça marche</a></li>
                <li><a href="#garanties" className="hover:text-white transition-colors">Garanties</a></li>
                <li><button onClick={handleActionClick} className="hover:text-white transition-colors">Publier un voyage</button></li>
                <li><button onClick={handleActionClick} className="hover:text-white transition-colors">Envoyer un colis</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#aide" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Nous contacter</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Conditions d'utilisation</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Politique de confidentialité</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 Cheapship. Tous droits réservés.
            </div>
            <div className="flex items-center text-gray-400 text-sm mt-4 md:mt-0">
              <Globe2 className="mr-2" size={16} />
              <span>Disponible dans toute l'Europe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CheapshipLanding;