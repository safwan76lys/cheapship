import { useState, useEffect, useRef } from 'react';
import {
  Plane,
  MapPin,
  Calendar,
  Clock,
  Euro,
  Weight,
  Users,
  ArrowRight,
  Search,
  Check,
  AlertCircle,
  Loader,
  Info,
  Plus,
  X
} from 'lucide-react';
import SMSVerification, { PhoneVerificationGuard } from './SMSVerification';

// ✅ CORRECTION : URL sans espaces
const API_URL = 'https://cheapship-back.onrender.com/api';

function TravelForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // États pour la vérification SMS
  const [showSMSVerification, setShowSMSVerification] = useState(false);
  const [user, setUser] = useState(null);

  // Charger les données utilisateur
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fonction callback pour la vérification SMS complétée
  const handlePhoneVerificationComplete = (phone) => {
    setShowSMSVerification(false);
    // Mettre à jour l'état utilisateur
    const updatedUser = { ...user, phone, phoneVerified: true };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setSuccess('Téléphone vérifié ! Vous pouvez maintenant proposer des voyages.');
  };

  // États pour l'autocomplétion des villes (version intégrée)
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

  const [formData, setFormData] = useState({
    departureCity: '',
    departureCountry: 'France',
    arrivalCity: '',
    arrivalCountry: 'France',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    availableWeight: '',
    pricePerKg: '',
    description: '',
    maxItems: '5',
    // Nouveaux champs pour les coordonnées GPS
    departureLatitude: null,
    departureLongitude: null,
    departureGeonameId: null,
    arrivalLatitude: null,
    arrivalLongitude: null,
    arrivalGeonameId: null
  });

  // Fonction de recherche de villes avec API GeoNames
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

      if (data.success && data.cities) {
        const formattedCities = data.cities.map(city => ({
          id: city.id,
          name: city.name,
          displayName: `${city.name}, ${city.region ? city.region + ', ' : ''}${city.country}`,
          country: city.country,
          countryCode: city.countryCode?.toLowerCase(),
          coordinates: city.coordinates,
          latitude: city.coordinates?.lat,
          longitude: city.coordinates?.lng,
          geonameId: city.id,
          countryName: city.country
        }));
        console.log('✅ Formatted cities:', formattedCities); // Debug
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
    setFormData({ ...formData, departureCity: value });

    if (departureTimeout.current) {
      clearTimeout(departureTimeout.current);
    }

    departureTimeout.current = setTimeout(() => {
      searchCities(value, setDepartureCities, setLoadingDeparture, setShowDepartureResults);
    }, 300);
  };

  // Gestionnaire pour ville d'arrivée
  const handleArrivalSearch = (value) => {
    setFormData({ ...formData, arrivalCity: value });

    if (arrivalTimeout.current) {
      clearTimeout(arrivalTimeout.current);
    }

    arrivalTimeout.current = setTimeout(() => {
      searchCities(value, setArrivalCities, setLoadingArrival, setShowArrivalResults);
    }, 300);
  };

  // Sélection ville de départ
  const selectDepartureCity = (city) => {
    setFormData({
      ...formData,
      departureCity: city.name,
      departureCountry: city.countryName || 'France',
      departureLatitude: city.latitude,
      departureLongitude: city.longitude,
      departureGeonameId: city.geonameId
    });
    setShowDepartureResults(false);
    setDepartureCities([]);
  };

  // Sélection ville d'arrivée
  const selectArrivalCity = (city) => {
    setFormData({
      ...formData,
      arrivalCity: city.name,
      arrivalCountry: city.countryName || 'France',
      arrivalLatitude: city.latitude,
      arrivalLongitude: city.longitude,
      arrivalGeonameId: city.geonameId
    });
    setShowArrivalResults(false);
    setArrivalCities([]);
  };

  // Effacer ville de départ
  const clearDepartureCity = () => {
    setFormData({
      ...formData,
      departureCity: '',
      departureCountry: 'France',
      departureLatitude: null,
      departureLongitude: null,
      departureGeonameId: null
    });
    setDepartureCities([]);
    setShowDepartureResults(false);
    if (departureInputRef.current) {
      departureInputRef.current.focus();
    }
  };

  // Effacer ville d'arrivée
  const clearArrivalCity = () => {
    setFormData({
      ...formData,
      arrivalCity: '',
      arrivalCountry: 'France',
      arrivalLatitude: null,
      arrivalLongitude: null,
      arrivalGeonameId: null
    });
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

  // Validation étape par étape
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.departureCity && formData.arrivalCity &&
               formData.departureCity !== formData.arrivalCity;
      case 2:
        return formData.departureDate && formData.departureTime &&
               formData.arrivalDate && formData.arrivalTime;
      case 3:
        return formData.availableWeight && formData.pricePerKg &&
               parseFloat(formData.availableWeight) > 0 && parseFloat(formData.pricePerKg) > 0;
      default:
        return true;
    }
  };

  // Navigation entre étapes
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError('');
    } else {
      setError('Veuillez remplir tous les champs obligatoires');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  // Calculs automatiques
  const calculateEstimatedEarnings = () => {
    const weight = parseFloat(formData.availableWeight) || 0;
    const price = parseFloat(formData.pricePerKg) || 0;
    return (weight * price).toFixed(2);
  };

  const calculateDistance = () => {
    // Si on a les coordonnées GPS, on peut calculer la vraie distance
    if (formData.departureLatitude && formData.arrivalLatitude) {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (formData.arrivalLatitude - formData.departureLatitude) * Math.PI / 180;
      const dLng = (formData.arrivalLongitude - formData.departureLongitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(formData.departureLatitude * Math.PI / 180) * Math.cos(formData.arrivalLatitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    }

    // Fallback pour les distances connues
    const distances = {
      'Paris-Lyon': 465,
      'Paris-Marseille': 775,
      'Lyon-Nice': 470,
      'Paris-London': 460,
      'Paris-Berlin': 1050
    };

    const key1 = `${formData.departureCity}-${formData.arrivalCity}`;
    const key2 = `${formData.arrivalCity}-${formData.departureCity}`;

    return distances[key1] || distances[key2] || Math.floor(Math.random() * 800 + 200);
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setError('Veuillez vérifier tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          departureCity: formData.departureCity,
          departureCountry: formData.departureCountry,
          arrivalCity: formData.arrivalCity,
          arrivalCountry: formData.arrivalCountry,
          departureDate: new Date(`${formData.departureDate}T${formData.departureTime}`),
          arrivalDate: new Date(`${formData.arrivalDate}T${formData.arrivalTime}`),
          availableWeight: parseFloat(formData.availableWeight),
          pricePerKg: parseFloat(formData.pricePerKg),
          description: formData.description,
          // Ajouter les coordonnées GPS
          departureLatitude: formData.departureLatitude,
          departureLongitude: formData.departureLongitude,
          departureGeonameId: formData.departureGeonameId,
          arrivalLatitude: formData.arrivalLatitude,
          arrivalLongitude: formData.arrivalLongitude,
          arrivalGeonameId: formData.arrivalGeonameId,
          distanceKm: calculateDistance()
        })
      });

      if (response.ok) {
        setSuccess('Voyage publié avec succès!');
        // Reset form
        setFormData({
          departureCity: '',
          departureCountry: 'France',
          arrivalCity: '',
          arrivalCountry: 'France',
          departureDate: '',
          departureTime: '',
          arrivalDate: '',
          arrivalTime: '',
          availableWeight: '',
          pricePerKg: '',
          description: '',
          maxItems: '5',
          departureLatitude: null,
          departureLongitude: null,
          departureGeonameId: null,
          arrivalLatitude: null,
          arrivalLongitude: null,
          arrivalGeonameId: null
        });
        setCurrentStep(1);
      } else {
        const data = await response.json();

        // Gestion de l'erreur de vérification téléphone
        if (data.requiresPhoneVerification || data.code === 'PHONE_VERIFICATION_REQUIRED') {
          setShowSMSVerification(true);
          setError('Vérification du téléphone requise pour continuer');
          return;
        }

        setError(data.error || 'Erreur lors de la publication');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Composant Progress Bar
  const ProgressBar = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
            step < currentStep
              ? 'bg-green-500 text-white'
              : step === currentStep
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step < currentStep ? <Check size={20} /> : step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
              step < currentStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Plane className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Publier un voyage</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Partagez votre voyage et gagnez de l'argent en transportant des colis
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar />

        {/* Messages d'état */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
            <Check size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* Étape 1: Itinéraire */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre itinéraire</h2>
                <p className="text-gray-600">D'où partez-vous et où allez-vous ?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ville de départ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline mr-2" size={16} />
                    Ville de départ
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <MapPin size={20} />
                    </div>
                    <input
                      ref={departureInputRef}
                      type="text"
                      value={formData.departureCity}
                      onChange={(e) => handleDepartureSearch(e.target.value)}
                      placeholder="Ex: Paris, Lyon, Londres..."
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={() => {
                        if (departureCities.length > 0) {
                          setShowDepartureResults(true);
                        }
                      }}
                    />
                    
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      {loadingDeparture && <Loader className="animate-spin text-blue-500" size={16} />}
                      {formData.departureCity && (
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

                {/* Ville d'arrivée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline mr-2" size={16} />
                    Ville d'arrivée
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <MapPin size={20} />
                    </div>
                    <input
                      ref={arrivalInputRef}
                      type="text"
                      value={formData.arrivalCity}
                      onChange={(e) => handleArrivalSearch(e.target.value)}
                      placeholder="Ex: Marseille, Nice, Berlin..."
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={() => {
                        if (arrivalCities.length > 0) {
                          setShowArrivalResults(true);
                        }
                      }}
                    />
                    
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      {loadingArrival && <Loader className="animate-spin text-blue-500" size={16} />}
                      {formData.arrivalCity && (
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
              </div>

              {/* Aperçu itinéraire */}
              {formData.departureCity && formData.arrivalCity && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-blue-900 font-medium">{formData.departureCity}</div>
                      <ArrowRight className="text-blue-600" size={20} />
                      <div className="text-blue-900 font-medium">{formData.arrivalCity}</div>
                    </div>
                    <div className="text-sm text-blue-700">
                      ~{calculateDistance()} km
                    </div>
                  </div>
                  {/* Afficher les coordonnées si disponibles */}
                  {formData.departureLatitude && formData.arrivalLatitude && (
                    <div className="mt-2 text-xs text-blue-600">
                      ✅ Géolocalisation précise activée
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Dates et heures */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dates et heures</h2>
                <p className="text-gray-600">Quand partez-vous et quand arrivez-vous ?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Départ */}
                <div className="p-6 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-600" size={20} />
                    Départ
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                      <input
                        type="time"
                        value={formData.departureTime}
                        onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Arrivée */}
                <div className="p-6 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="text-green-600" size={20} />
                    Arrivée
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})}
                        min={formData.departureDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                      <input
                        type="time"
                        value={formData.arrivalTime}
                        onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Capacité et prix */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Capacité et tarifs</h2>
                <p className="text-gray-600">Combien pouvez-vous transporter et à quel prix ?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Capacité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Weight className="inline mr-2" size={16} />
                    Poids disponible (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.availableWeight}
                    onChange={(e) => setFormData({...formData, availableWeight: e.target.value})}
                    min="0.5"
                    max="30"
                    step="0.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 30kg par voyage</p>
                </div>

                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Euro className="inline mr-2" size={16} />
                    Prix par kg (€)
                  </label>
                  <input
                    type="number"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})}
                    min="1"
                    max="50"
                    step="0.50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 8.50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Prix suggéré: 5-15€/kg</p>
                </div>
              </div>

              {/* Calculs automatiques */}
              {formData.availableWeight && formData.pricePerKg && (
                <div className="mt-6 p-6 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4">Estimation de vos gains</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{calculateEstimatedEarnings()}€</div>
                      <div className="text-sm text-green-600">Maximum possible</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{formData.availableWeight}kg</div>
                      <div className="text-sm text-green-600">Capacité totale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{formData.pricePerKg}€</div>
                      <div className="text-sm text-green-600">Prix par kg</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 4: Description et confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalisation</h2>
                <p className="text-gray-600">Ajoutez une description et confirmez votre voyage</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Partagez des informations utiles : conditions de transport, point de rendez-vous, etc."
                />
              </div>

              {/* Récapitulatif */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif de votre voyage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Itinéraire:</span>
                    <span className="font-medium">{formData.departureCity} → {formData.arrivalCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Départ:</span>
                    <span className="font-medium">
                      {formData.departureDate} à {formData.departureTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arrivée:</span>
                    <span className="font-medium">
                      {formData.arrivalDate} à {formData.arrivalTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{calculateDistance()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacité:</span>
                    <span className="font-medium">{formData.availableWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix:</span>
                    <span className="font-medium">{formData.pricePerKg}€/kg</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Gain maximum:</span>
                    <span className="font-bold text-green-600">{calculateEstimatedEarnings()}€</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Suivant
                <ArrowRight size={20} />
              </button>
            ) : (
              <PhoneVerificationGuard
                isVerified={user?.phoneVerified}
                onVerificationRequired={() => setShowSMSVerification(true)}
              >
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Publier le voyage
                    </>
                  )}
                </button>
              </PhoneVerificationGuard>
            )}
          </div>

          {/* Informations utiles */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Conseils pour optimiser votre voyage</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Proposez un prix compétitif pour attirer plus de demandes</li>
                  <li>• Soyez précis sur les conditions de transport dans votre description</li>
                  <li>• Vérifiez vos disponibilités avant de publier</li>
                  <li>• Communiquez clairement les points de rendez-vous</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de vérification SMS */}
        <SMSVerification
          user={user}
          isOpen={showSMSVerification}
          onClose={() => setShowSMSVerification(false)}
          onVerificationComplete={handlePhoneVerificationComplete}
          mode="required"
        />
      </div>
    </div>
  );
}

export default TravelForm;