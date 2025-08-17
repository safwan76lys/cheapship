import { useState, useEffect, useRef } from 'react'
import { 
  Package, 
  MapPin, 
  Camera, 
  Euro, 
  Calendar, 
  Clock, 
  Weight,
  ArrowRight,
  Search,
  Check,
  AlertCircle,
  Loader,
  Info,
  Plus,
  X,
  Upload,
  Eye,
  Trash2,
  Star,
  Shield
} from 'lucide-react'

const API_URL = 'http://localhost:4000/api'

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
      const response = await fetch(`http://api.geonames.org/searchJSON?q=${encodeURIComponent(searchQuery)}&maxRows=8&featureClass=P&orderby=population&username=cheapship`)
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
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-purple-50"
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

// Catégories de colis
const PARCEL_CATEGORIES = [
  'Documents', 'Vêtements', 'Électronique', 'Livres', 'Bijoux', 
  'Produits de beauté', 'Souvenirs', 'Médicaments', 'Nourriture', 'Autre'
]

// Niveaux d'urgence
const URGENCY_LEVELS = [
  { value: 'flexible', label: 'Flexible', color: 'green', description: 'Pas pressé, dates flexibles' },
  { value: 'normal', label: 'Normal', color: 'blue', description: 'Dans les 7-14 jours' },
  { value: 'urgent', label: 'Urgent', color: 'orange', description: 'Dans les 2-3 jours' },
  { value: 'express', label: 'Express', color: 'red', description: 'Dans les 24-48h' }
]

function ParcelFormPremium() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadingImages, setUploadingImages] = useState(false)
  
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    weight: '',
    value: '',
    images: [],
    pickupCity: '',
    pickupCountry: 'France',
    deliveryCity: '',
    deliveryCountry: 'France',
    pickupDate: '',
    deliveryDate: '',
    urgency: 'normal',
    maxPrice: '',
    insurance: false,
    fragile: false,
    notes: '',
    // Nouveaux champs pour les coordonnées GPS
    pickupLatitude: null,
    pickupLongitude: null,
    pickupGeonameId: null,
    deliveryLatitude: null,
    deliveryLongitude: null,
    deliveryGeonameId: null
  })

  const [estimatedCost, setEstimatedCost] = useState(null)

  // Calcul de distance avec coordonnées GPS
  const calculateDistance = () => {
    if (formData.pickupLatitude && formData.deliveryLatitude) {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (formData.deliveryLatitude - formData.pickupLatitude) * Math.PI / 180;
      const dLng = (formData.deliveryLongitude - formData.pickupLongitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(formData.pickupLatitude * Math.PI / 180) * Math.cos(formData.deliveryLatitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    }
    return null;
  }

  // Upload d'images
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (formData.images.length + files.length > 5) {
      setError('Maximum 5 photos par colis')
      return
    }

    setUploadingImages(true)
    setError('')

    try {
      const uploadedImages = []
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`Image ${file.name} trop volumineuse (max 5MB)`)
          continue
        }

        // Créer une preview locale
        const preview = URL.createObjectURL(file)
        uploadedImages.push({
          file,
          preview,
          name: file.name
        })
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }))

    } catch (error) {
      setError('Erreur lors de l\'upload des images')
    } finally {
      setUploadingImages(false)
    }
  }

  // Supprimer une image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Calcul estimation coût
  useEffect(() => {
    if (formData.weight && formData.pickupCity && formData.deliveryCity) {
      const weight = parseFloat(formData.weight)
      const distance = calculateDistance() || 500; // Fallback distance
      const basePrice = 8 // Prix de base par kg
      const distanceMultiplier = Math.max(1, distance / 500); // Plus c'est loin, plus c'est cher
      const urgencyMultiplier = {
        flexible: 0.8,
        normal: 1,
        urgent: 1.3,
        express: 1.8
      }
      
      const estimated = (weight * basePrice * urgencyMultiplier[formData.urgency] * distanceMultiplier).toFixed(2)
      setEstimatedCost(estimated)
    }
  }, [formData.weight, formData.urgency, formData.pickupCity, formData.deliveryCity, formData.pickupLatitude, formData.deliveryLatitude])

  // Validation étape par étape
  const validateStep = (step) => {
    switch(step) {
      case 1:
        return formData.name && formData.category && formData.weight && formData.value
      case 2:
        return formData.pickupCity && formData.deliveryCity && 
               formData.pickupCity !== formData.deliveryCity
      case 3:
        return formData.pickupDate && formData.deliveryDate && formData.maxPrice
      default:
        return true
    }
  }

  // Navigation entre étapes
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      setError('')
    } else {
      setError('Veuillez remplir tous les champs obligatoires')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setError('Veuillez vérifier tous les champs')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Préparer les données avec coordonnées GPS
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        weight: parseFloat(formData.weight),
        value: parseFloat(formData.value),
        pickupCity: formData.pickupCity,
        pickupCountry: formData.pickupCountry,
        deliveryCity: formData.deliveryCity,
        deliveryCountry: formData.deliveryCountry,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        urgency: formData.urgency,
        maxPrice: parseFloat(formData.maxPrice),
        insurance: formData.insurance,
        fragile: formData.fragile,
        notes: formData.notes,
        // Ajouter les coordonnées GPS
        pickupLatitude: formData.pickupLatitude,
        pickupLongitude: formData.pickupLongitude,
        pickupGeonameId: formData.pickupGeonameId,
        deliveryLatitude: formData.deliveryLatitude,
        deliveryLongitude: formData.deliveryLongitude,
        deliveryGeonameId: formData.deliveryGeonameId,
        distanceKm: calculateDistance()
      }

      const response = await fetch(`${API_URL}/parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        setSuccess('Demande de transport créée avec succès!')
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          weight: '',
          value: '',
          images: [],
          pickupCity: '',
          pickupCountry: 'France',
          deliveryCity: '',
          deliveryCountry: 'France',
          pickupDate: '',
          deliveryDate: '',
          urgency: 'normal',
          maxPrice: '',
          insurance: false,
          fragile: false,
          notes: '',
          pickupLatitude: null,
          pickupLongitude: null,
          pickupGeonameId: null,
          deliveryLatitude: null,
          deliveryLongitude: null,
          deliveryGeonameId: null
        })
        setCurrentStep(1)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Composant Progress Bar
  const ProgressBar = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
            step < currentStep 
              ? 'bg-green-500 text-white' 
              : step === currentStep 
              ? 'bg-purple-600 text-white' 
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
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Envoyer un colis</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Trouvez quelqu'un pour transporter votre colis en toute sécurité
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
          
          {/* Étape 1: Description du colis */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Décrivez votre colis</h2>
                <p className="text-gray-600">Donnez-nous les détails de ce que vous voulez envoyer</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom du colis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du colis *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Livre vintage, Vêtements d'hiver..."
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {PARCEL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Poids */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Weight className="inline mr-2" size={16} />
                    Poids (kg) *
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    min="0.1"
                    max="30"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 2.5"
                  />
                </div>

                {/* Valeur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Euro className="inline mr-2" size={16} />
                    Valeur estimée (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 150"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pour l'assurance et la responsabilité</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Décrivez votre colis en détail..."
                />
              </div>

              {/* Options spéciales */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fragile}
                    onChange={(e) => setFormData({...formData, fragile: e.target.checked})}
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <div className="font-medium">Fragile</div>
                    <div className="text-sm text-gray-500">Nécessite un soin particulier</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.insurance}
                    onChange={(e) => setFormData({...formData, insurance: e.target.checked})}
                    className="w-5 h-5 text-purple-600"
                  />
                  <div>
                    <div className="font-medium">Assurance</div>
                    <div className="text-sm text-gray-500">Protection contre les dommages</div>
                  </div>
                </label>
              </div>

              {/* Upload d'images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="inline mr-2" size={16} />
                  Photos du colis (optionnel)
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Images uploadées */}
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Colis ${index + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Bouton d'upload */}
                  {formData.images.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-purple-400 transition-colors"
                    >
                      {uploadingImages ? (
                        <Loader className="animate-spin text-purple-600" size={20} />
                      ) : (
                        <>
                          <Plus className="text-gray-400" size={20} />
                          <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <p className="text-xs text-gray-500 mt-2">
                  Max 5 photos, 5MB chacune. Formats: JPG, PNG
                </p>
              </div>
            </div>
          )}

          {/* Étape 2: Itinéraire */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Itinéraire</h2>
                <p className="text-gray-600">D'où et vers où voulez-vous envoyer votre colis ?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ville d'enlèvement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline mr-2" size={16} />
                    Enlèvement *
                  </label>
                  <CityAutocomplete
                    value={formData.pickupCity}
                    onChange={(city) => {
                      setFormData({
                        ...formData,
                        pickupCity: city?.name || '',
                        pickupCountry: city?.countryName || 'France',
                        pickupLatitude: city?.latitude,
                        pickupLongitude: city?.longitude,
                        pickupGeonameId: city?.geonameId
                      });
                    }}
                    placeholder="Ex: Paris, Lyon, Londres..."
                  />
                </div>

                {/* Ville de livraison */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline mr-2" size={16} />
                    Livraison *
                  </label>
                  <CityAutocomplete
                    value={formData.deliveryCity}
                    onChange={(city) => {
                      setFormData({
                        ...formData,
                        deliveryCity: city?.name || '',
                        deliveryCountry: city?.countryName || 'France',
                        deliveryLatitude: city?.latitude,
                        deliveryLongitude: city?.longitude,
                        deliveryGeonameId: city?.geonameId
                      });
                    }}
                    placeholder="Ex: Marseille, Nice, Berlin..."
                  />
                </div>
              </div>

              {/* Aperçu itinéraire */}
              {formData.pickupCity && formData.deliveryCity && (
                <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-purple-900 font-medium">{formData.pickupCity}</div>
                      <ArrowRight className="text-purple-600" size={20} />
                      <div className="text-purple-900 font-medium">{formData.deliveryCity}</div>
                    </div>
                    <div className="text-sm text-purple-700">
                      {calculateDistance() && `Distance: ${calculateDistance()}km`}
                      {estimatedCost && ` • Coût estimé: ~${estimatedCost}€`}
                    </div>
                  </div>
                  {/* Afficher les coordonnées si disponibles */}
                  {formData.pickupLatitude && formData.deliveryLatitude && (
                    <div className="mt-2 text-xs text-purple-600">
                      ✅ Géolocalisation précise activée
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Dates et contraintes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dates et budget</h2>
                <p className="text-gray-600">Quand voulez-vous envoyer votre colis et quel est votre budget ?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date d'enlèvement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Date d'enlèvement souhaitée *
                  </label>
                  <input
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Date de livraison */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline mr-2" size={16} />
                    Date de livraison souhaitée *
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Niveau d'urgence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Niveau d'urgence
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {URGENCY_LEVELS.map(level => (
                    <label
                      key={level.value}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.urgency === level.value
                          ? `border-${level.color}-500 bg-${level.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={level.value}
                        checked={formData.urgency === level.value}
                        onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium mb-1">{level.label}</div>
                        <div className="text-xs text-gray-500">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget maximum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="inline mr-2" size={16} />
                  Budget maximum (€) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.maxPrice}
                    onChange={(e) => setFormData({...formData, maxPrice: e.target.value})}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 25"
                  />
                  {estimatedCost && (
                    <div className="absolute right-3 top-3 text-sm text-gray-500">
                      Estimé: {estimatedCost}€
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Prix que vous êtes prêt à payer pour le transport
                </p>
              </div>
            </div>
          )}

          {/* Étape 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalisation</h2>
                <p className="text-gray-600">Vérifiez les détails et publiez votre demande</p>
              </div>

              {/* Notes supplémentaires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes supplémentaires (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Instructions spéciales, informations de contact, etc."
                />
              </div>

              {/* Récapitulatif */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif de votre demande</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colis:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Catégorie:</span>
                    <span className="font-medium">{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Poids:</span>
                    <span className="font-medium">{formData.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valeur:</span>
                    <span className="font-medium">{formData.value}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Itinéraire:</span>
                    <span className="font-medium">{formData.pickupCity} → {formData.deliveryCity}</span>
                  </div>
                  {calculateDistance() && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">{calculateDistance()} km</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enlèvement:</span>
                    <span className="font-medium">{formData.pickupDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Livraison:</span>
                    <span className="font-medium">{formData.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Urgence:</span>
                    <span className="font-medium">
                      {URGENCY_LEVELS.find(u => u.value === formData.urgency)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Budget maximum:</span>
                    <span className="font-bold text-purple-600">{formData.maxPrice}€</span>
                  </div>
                  
                  {/* Options spéciales */}
                  {(formData.fragile || formData.insurance) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Options:</span>
                      <div className="text-right">
                        {formData.fragile && <div className="text-sm text-orange-600">🔸 Fragile</div>}
                        {formData.insurance && <div className="text-sm text-blue-600">🛡️ Assuré</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos preview */}
              {formData.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Photos du colis</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.preview}
                        alt={`Colis ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
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
                className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Suivant
                <ArrowRight size={20} />
              </button>
            ) : (
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
                    Publier la demande
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Informations utiles */}
        <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start gap-3">
            <Info className="text-purple-600 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Comment ça marche ?</h3>
              <ul className="text-purple-800 space-y-1 text-sm">
                <li>• Décrivez votre colis et définissez votre budget</li>
                <li>• Nous trouvons des voyageurs sur votre trajet</li>
                <li>• Négociez directement avec eux via notre chat</li>
                <li>• Organisez la remise et suivez votre colis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParcelFormPremium