import { useState, useEffect, useRef } from 'react'
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Clock, 
  Euro, 
  Weight,
  ArrowRight,
  Search,
  Check,
  AlertCircle,
  Loader,
  Save,
  X,
  ArrowLeft
} from 'lucide-react'

const API_URL = 'https://cheapship-backend.onrender.com/api'

// Composant d'autocomplétion des villes avec API GeoNames
const CityAutocomplete = ({ value, onChange, placeholder }) => {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  const searchCities = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`https://api.geonames.org/searchJSON?q=${encodeURIComponent(searchQuery)}&maxRows=8&featureClass=P&orderby=population&username=cheapship`)
      const data = await response.json()
      
      if (data.geonames) {
        const cities = data.geonames.map(city => ({
          name: city.name,
          countryName: city.countryName,
          adminName1: city.adminName1,
          latitude: parseFloat(city.lat),
          longitude: parseFloat(city.lng),
          geonameId: city.geonameId,
          population: city.population
        }))
        setSuggestions(cities)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Erreur recherche villes:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    searchCities(newValue)
  }

  const handleCitySelect = (city) => {
    const cityName = city.name
    setQuery(cityName)
    setShowSuggestions(false)
    onChange(city)
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <Loader className="animate-spin text-gray-400" size={20} />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={city.geonameId}
              onClick={() => handleCitySelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
            >
              <div className="font-medium text-gray-900">{city.name}</div>
              <div className="text-sm text-gray-500">
                {city.adminName1 && `${city.adminName1}, `}{city.countryName}
                {city.population && ` • ${(city.population/1000).toFixed(0)}k hab.`}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-gray-500 text-center">Aucune ville trouvée</div>
        </div>
      )}
    </div>
  )
}

function TripEditForm({ trip, onSave, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    departureCity: '',
    departureCountry: 'France',
    departureLatitude: null,
    departureLongitude: null,
    departureGeonameId: null,
    arrivalCity: '',
    arrivalCountry: 'France',
    arrivalLatitude: null,
    arrivalLongitude: null,
    arrivalGeonameId: null,
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    availableWeight: '',
    pricePerKg: '',
    description: ''
  })

  // Pré-remplir le formulaire avec les données du voyage
  useEffect(() => {
    if (trip) {
      // Formater les dates pour les inputs
      const departureDateTime = new Date(trip.departureDate || trip.departureDateTime)
      const arrivalDateTime = new Date(trip.arrivalDate || trip.arrivalDateTime)
      
      setFormData({
        departureCity: trip.departureCity || '',
        departureCountry: trip.departureCountry || 'France',
        departureLatitude: trip.departureLatitude,
        departureLongitude: trip.departureLongitude,
        departureGeonameId: trip.departureGeonameId,
        arrivalCity: trip.arrivalCity || '',
        arrivalCountry: trip.arrivalCountry || 'France',
        arrivalLatitude: trip.arrivalLatitude,
        arrivalLongitude: trip.arrivalLongitude,
        arrivalGeonameId: trip.arrivalGeonameId,
        departureDate: departureDateTime.toISOString().split('T')[0],
        departureTime: departureDateTime.toTimeString().slice(0, 5),
        arrivalDate: arrivalDateTime.toISOString().split('T')[0],
        arrivalTime: arrivalDateTime.toTimeString().slice(0, 5),
        availableWeight: trip.availableWeight?.toString() || '',
        pricePerKg: trip.pricePerKg?.toString() || '',
        description: trip.description || ''
      })
    }
  }, [trip])

  // Validation du formulaire
  const validateForm = () => {
    if (!formData.departureCity || !formData.arrivalCity) {
      setError('Les villes de départ et d\'arrivée sont obligatoires')
      return false
    }

    if (formData.departureCity === formData.arrivalCity) {
      setError('Les villes de départ et d\'arrivée doivent être différentes')
      return false
    }

    if (!formData.departureDate || !formData.departureTime || !formData.arrivalDate || !formData.arrivalTime) {
      setError('Toutes les dates et heures sont obligatoires')
      return false
    }

    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`)
    const arrivalDateTime = new Date(`${formData.arrivalDate}T${formData.arrivalTime}`)

    if (departureDateTime >= arrivalDateTime) {
      setError('La date d\'arrivée doit être après la date de départ')
      return false
    }

    if (!formData.availableWeight || parseFloat(formData.availableWeight) <= 0) {
      setError('Le poids disponible doit être supérieur à 0')
      return false
    }

    if (!formData.pricePerKg || parseFloat(formData.pricePerKg) <= 0) {
      setError('Le prix par kg doit être supérieur à 0')
      return false
    }

    return true
  }

  // Calcul de distance avec coordonnées GPS
  const calculateDistance = () => {
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
    return null;
  }

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          departureCity: formData.departureCity,
          departureCountry: formData.departureCountry,
          departureLatitude: formData.departureLatitude,
          departureLongitude: formData.departureLongitude,
          departureGeonameId: formData.departureGeonameId,
          arrivalCity: formData.arrivalCity,
          arrivalCountry: formData.arrivalCountry,
          arrivalLatitude: formData.arrivalLatitude,
          arrivalLongitude: formData.arrivalLongitude,
          arrivalGeonameId: formData.arrivalGeonameId,
          departureDate: new Date(`${formData.departureDate}T${formData.departureTime}`),
          arrivalDate: new Date(`${formData.arrivalDate}T${formData.arrivalTime}`),
          availableWeight: parseFloat(formData.availableWeight),
          pricePerKg: parseFloat(formData.pricePerKg),
          description: formData.description,
          distanceKm: calculateDistance()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Voyage modifié avec succès!')
        setTimeout(() => {
          onSave(data.trip)
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Calculer les gains potentiels
  const calculateEstimatedEarnings = () => {
    const weight = parseFloat(formData.availableWeight) || 0
    const price = parseFloat(formData.pricePerKg) || 0
    return (weight * price).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modifier le voyage</h1>
              <p className="text-gray-600">
                {trip?.departureCity} → {trip?.arrivalCity}
              </p>
            </div>
          </div>
        </div>

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
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Itinéraire */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Itinéraire</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ville de départ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Ville de départ
                </label>
                <CityAutocomplete
                  value={formData.departureCity}
                  onChange={(city) => {
                    setFormData({
                      ...formData,
                      departureCity: city?.name || '',
                      departureCountry: city?.countryName || 'France',
                      departureLatitude: city?.latitude,
                      departureLongitude: city?.longitude,
                      departureGeonameId: city?.geonameId
                    });
                  }}
                  placeholder="Ex: Paris, Lyon, Londres..."
                />
              </div>

              {/* Ville d'arrivée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Ville d'arrivée
                </label>
                <CityAutocomplete
                  value={formData.arrivalCity}
                  onChange={(city) => {
                    setFormData({
                      ...formData,
                      arrivalCity: city?.name || '',
                      arrivalCountry: city?.countryName || 'France',
                      arrivalLatitude: city?.latitude,
                      arrivalLongitude: city?.longitude,
                      arrivalGeonameId: city?.geonameId
                    });
                  }}
                  placeholder="Ex: Marseille, Nice, Berlin..."
                />
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
                    {calculateDistance() && `Distance: ${calculateDistance()}km`}
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

          {/* Dates et heures */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Dates et heures</h2>
            
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

          {/* Capacité et prix */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Capacité et tarifs</h2>
            
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

          {/* Description */}
          <div className="mb-8">
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

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Modification...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripEditForm