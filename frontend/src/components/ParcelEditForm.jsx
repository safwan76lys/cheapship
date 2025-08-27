import { useState, useEffect, useRef } from 'react'
import { 
  Package,
  MapPin,
  Calendar,
  Clock,
  Euro,
  Weight,
  Camera,
  ArrowRight,
  Search,
  Check,
  AlertCircle,
  Loader,
  Save,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Upload
} from 'lucide-react'

const API_URL = 'https://cheapship-back-62ph.onrender.com/api'

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

function ParcelEditForm({ parcel, onSave, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
    pickupLatitude: null,
    pickupLongitude: null,
    pickupGeonameId: null,
    deliveryCity: '',
    deliveryCountry: 'France',
    deliveryLatitude: null,
    deliveryLongitude: null,
    deliveryGeonameId: null,
    pickupDate: '',
    deliveryDate: '',
    urgency: 'normal',
    maxPrice: '',
    insurance: false,
    fragile: false,
    notes: ''
  })

  const [estimatedCost, setEstimatedCost] = useState(null)

  // Pré-remplir le formulaire avec les données du colis
  useEffect(() => {
    if (parcel) {
      // Formater les dates pour les inputs
      const pickupDate = parcel.pickupDate ? new Date(parcel.pickupDate).toISOString().split('T')[0] : ''
      const deliveryDate = parcel.deliveryDate ? new Date(parcel.deliveryDate).toISOString().split('T')[0] : ''
      
      setFormData({
        name: parcel.name || '',
        description: parcel.description || '',
        category: parcel.category || '',
        weight: parcel.weight?.toString() || '',
        value: parcel.value?.toString() || '',
        images: parcel.images || [],
        pickupCity: parcel.pickupCity || '',
        pickupCountry: parcel.pickupCountry || 'France',
        pickupLatitude: parcel.pickupLatitude,
        pickupLongitude: parcel.pickupLongitude,
        pickupGeonameId: parcel.pickupGeonameId,
        deliveryCity: parcel.deliveryCity || '',
        deliveryCountry: parcel.deliveryCountry || 'France',
        deliveryLatitude: parcel.deliveryLatitude,
        deliveryLongitude: parcel.deliveryLongitude,
        deliveryGeonameId: parcel.deliveryGeonameId,
        pickupDate: pickupDate,
        deliveryDate: deliveryDate,
        urgency: parcel.urgency || 'normal',
        maxPrice: parcel.maxPrice?.toString() || '',
        insurance: parcel.insurance || false,
        fragile: parcel.fragile || false,
        notes: parcel.notes || ''
      })
    }
  }, [parcel])

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
          name: file.name,
          isNew: true // Marquer comme nouvelle image
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

  // Validation du formulaire
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Le nom du colis est obligatoire')
      return false
    }

    if (!formData.category) {
      setError('La catégorie est obligatoire')
      return false
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setError('Le poids doit être supérieur à 0')
      return false
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      setError('La valeur doit être supérieure à 0')
      return false
    }

    if (!formData.pickupCity || !formData.deliveryCity) {
      setError('Les villes d\'enlèvement et de livraison sont obligatoires')
      return false
    }

    if (formData.pickupCity === formData.deliveryCity) {
      setError('Les villes d\'enlèvement et de livraison doivent être différentes')
      return false
    }

    if (!formData.pickupDate || !formData.deliveryDate) {
      setError('Les dates d\'enlèvement et de livraison sont obligatoires')
      return false
    }

    const pickup = new Date(formData.pickupDate)
    const delivery = new Date(formData.deliveryDate)

    if (pickup >= delivery) {
      setError('La date de livraison doit être après la date d\'enlèvement')
      return false
    }

    if (!formData.maxPrice || parseFloat(formData.maxPrice) <= 0) {
      setError('Le budget maximum doit être supérieur à 0')
      return false
    }

    return true
  }

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/parcels/${parcel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          weight: parseFloat(formData.weight),
          value: parseFloat(formData.value),
          pickupCity: formData.pickupCity,
          pickupCountry: formData.pickupCountry,
          pickupLatitude: formData.pickupLatitude,
          pickupLongitude: formData.pickupLongitude,
          pickupGeonameId: formData.pickupGeonameId,
          deliveryCity: formData.deliveryCity,
          deliveryCountry: formData.deliveryCountry,
          deliveryLatitude: formData.deliveryLatitude,
          deliveryLongitude: formData.deliveryLongitude,
          deliveryGeonameId: formData.deliveryGeonameId,
          pickupDate: formData.pickupDate,
          deliveryDate: formData.deliveryDate,
          urgency: formData.urgency,
          maxPrice: parseFloat(formData.maxPrice),
          insurance: formData.insurance,
          fragile: formData.fragile,
          notes: formData.notes.trim(),
          distanceKm: calculateDistance()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Colis modifié avec succès!')
        setTimeout(() => {
          onSave(data.parcel)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
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
            <div className="p-3 bg-purple-600 rounded-full">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modifier le colis</h1>
              <p className="text-gray-600">
                {parcel?.name}
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
          
          {/* Description du colis */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Description du colis</h2>

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
            <div className="mt-6">
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
            <div className="mt-6 grid grid-cols-2 gap-4">
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
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="inline mr-2" size={16} />
                Photos du colis (optionnel)
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Images uploadées */}
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview || (image.isNew ? image.preview : `${API_URL}/uploads/parcels/${image}`)}
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

          {/* Itinéraire */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Itinéraire</h2>

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

          {/* Dates et contraintes */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Dates et budget</h2>

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
            <div className="mt-6">
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
            <div className="mt-6">
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

          {/* Notes supplémentaires */}
          <div className="mb-8">
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
              className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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

export default ParcelEditForm