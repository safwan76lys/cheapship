import { useState, useEffect } from 'react'
import { 
  Search,
  MapPin,
  Calendar,
  Clock,
  Euro,
  Weight,
  Star,
  User,
  MessageCircle,
  ArrowRight,
  Loader,
  AlertCircle,
  CheckCircle,
  Filter,
  Zap,
  Shield,
  Heart,
  X,
  ArrowLeft,
  Send
} from 'lucide-react'

const API_URL = 'https://cheapship-production.up.railway.app/api'

// Scores de compatibilité
const COMPATIBILITY_SCORES = {
  PERFECT: { label: 'Parfait', color: 'green', min: 90 },
  EXCELLENT: { label: 'Excellent', color: 'blue', min: 80 },
  GOOD: { label: 'Bon', color: 'yellow', min: 70 },
  AVERAGE: { label: 'Moyen', color: 'orange', min: 50 },
  LOW: { label: 'Faible', color: 'red', min: 0 }
}

function ParcelMatchingSystem({ parcel, onBack }) {
  const [compatibleTrips, setCompatibleTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterPrice, setFilterPrice] = useState('all')
  const [filterRating, setFilterRating] = useState('all')
  const [sortBy, setSortBy] = useState('compatibility')
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showContactModal, setShowContactModal] = useState(null)

  useEffect(() => {
    if (parcel) {
      fetchCompatibleTrips()
    }
  }, [parcel])

  const fetchCompatibleTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/parcels/${parcel.id}/compatible-trips`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCompatibleTrips(data.compatibleTrips || [])
      } else {
        setError('Erreur lors de la recherche de voyages compatibles')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Calculer le score de compatibilité
  const calculateCompatibilityScore = (trip) => {
    let score = 100

    // Vérifier le prix (30% du score)
    const tripCost = parseFloat(trip.estimatedCost)
    const budgetRatio = tripCost / parcel.maxPrice
    if (budgetRatio > 1) {
      score -= 30 // Dépasse le budget
    } else if (budgetRatio > 0.8) {
      score -= 10 // Proche du budget max
    }

    // Vérifier les dates (25% du score)
    const tripDate = new Date(trip.departureDate)
    const preferredDate = new Date(parcel.pickupDate)
    const daysDiff = Math.abs((tripDate - preferredDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) {
      // Date parfaite
    } else if (daysDiff <= 1) {
      score -= 5
    } else if (daysDiff <= 3) {
      score -= 15
    } else {
      score -= 25
    }

    // Rating du voyageur (20% du score)
    const rating = trip.user?.rating || 0
    if (rating >= 4.5) {
      score += 5
    } else if (rating >= 4) {
      // Pas de bonus
    } else if (rating >= 3) {
      score -= 10
    } else {
      score -= 20
    }

    // Capacité restante (15% du score)
    const weightRatio = parcel.weight / trip.availableWeight
    if (weightRatio <= 0.5) {
      score += 5 // Beaucoup de place
    } else if (weightRatio <= 0.8) {
      // Pas de bonus
    } else {
      score -= 10 // Peu de place
    }

    // Vérifications d'identité (10% du score)
    if (trip.user?.identityVerified) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  // Obtenir le badge de compatibilité
  const getCompatibilityBadge = (score) => {
    for (const [key, config] of Object.entries(COMPATIBILITY_SCORES)) {
      if (score >= config.min) {
        return config
      }
    }
    return COMPATIBILITY_SCORES.LOW
  }

  // Filtrer et trier les voyages
  const filteredAndSortedTrips = compatibleTrips
    .map(trip => ({
      ...trip,
      compatibilityScore: calculateCompatibilityScore(trip)
    }))
    .filter(trip => {
      if (filterPrice === 'affordable' && !trip.isAffordable) return false
      if (filterRating === 'high' && (trip.user?.rating || 0) < 4) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.estimatedCost) - parseFloat(b.estimatedCost)
        case 'rating':
          return (b.user?.rating || 0) - (a.user?.rating || 0)
        case 'date':
          return new Date(a.departureDate) - new Date(b.departureDate)
        default: // compatibility
          return b.compatibilityScore - a.compatibilityScore
      }
    })

  // Formater la date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-600">Recherche de voyages compatibles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-full">
              <Search className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voyages compatibles</h1>
              <p className="text-gray-600">
                Pour votre colis : {parcel?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Récapitulatif du colis */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Votre demande</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-purple-600" size={20} />
              <div>
                <div className="text-sm text-gray-500">Itinéraire</div>
                <div className="font-medium">{parcel?.pickupCity} → {parcel?.deliveryCity}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Weight className="text-purple-600" size={20} />
              <div>
                <div className="text-sm text-gray-500">Poids</div>
                <div className="font-medium">{parcel?.weight} kg</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-purple-600" size={20} />
              <div>
                <div className="text-sm text-gray-500">Enlèvement</div>
                <div className="font-medium">{formatDate(parcel?.pickupDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Euro className="text-purple-600" size={20} />
              <div>
                <div className="text-sm text-gray-500">Budget max</div>
                <div className="font-medium">{parcel?.maxPrice}€</div>
              </div>
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
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Filtres et tri */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-wrap">
              {/* Filtre prix */}
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous les prix</option>
                <option value="affordable">Dans mon budget</option>
              </select>

              {/* Filtre rating */}
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Toutes les notes</option>
                <option value="high">4+ étoiles</option>
              </select>
            </div>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="compatibility">Compatibilité</option>
              <option value="price">Prix croissant</option>
              <option value="rating">Note décroissante</option>
              <option value="date">Date de départ</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {filteredAndSortedTrips.length} voyage(s) trouvé(s) sur {compatibleTrips.length} total
          </div>
        </div>

        {/* Liste des voyages */}
        {filteredAndSortedTrips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Search className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun voyage compatible</h3>
            <p className="text-gray-600 mb-6">
              Aucun voyage ne correspond à vos critères actuels.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Essayez d'ajuster vos dates ou votre budget</p>
              <p>• Vérifiez que votre itinéraire est correct</p>
              <p>• De nouveaux voyages sont ajoutés régulièrement</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                parcel={parcel}
                onContact={() => setShowContactModal(trip)}
                formatDate={formatDate}
                formatTime={formatTime}
                getCompatibilityBadge={getCompatibilityBadge}
              />
            ))}
          </div>
        )}

        {/* Modal de contact */}
        {showContactModal && (
          <ContactModal
            trip={showContactModal}
            parcel={parcel}
            onClose={() => setShowContactModal(null)}
            onSuccess={() => {
              setShowContactModal(null)
              setSuccess('Message envoyé avec succès!')
            }}
          />
        )}
      </div>
    </div>
  )
}

// Composant carte voyage
function TripCard({ trip, parcel, onContact, formatDate, formatTime, getCompatibilityBadge }) {
  const compatibilityBadge = getCompatibilityBadge(trip.compatibilityScore)
  const isAffordable = trip.isAffordable

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      {/* Header avec compatibilité */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${compatibilityBadge.color}-50 text-${compatibilityBadge.color}-700 border border-${compatibilityBadge.color}-200`}>
            {compatibilityBadge.label} ({trip.compatibilityScore}%)
          </div>
          <div className="flex items-center gap-2">
            {!isAffordable && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                Dépasse budget
              </span>
            )}
            {trip.user?.identityVerified && (
              <Shield className="text-green-600" size={16} title="Identité vérifiée" />
            )}
          </div>
        </div>

        {/* Voyageur */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            {trip.user?.profilePicture ? (
              <img 
                src={`${API_URL}/users/avatar/${trip.user.profilePicture}`}
                alt="Voyageur"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User className="text-white" size={20} />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{trip.user?.fullName}</div>
            <div className="flex items-center gap-1">
              <Star className="text-yellow-500 fill-current" size={14} />
              <span className="text-sm text-gray-600">
                {trip.user?.rating > 0 ? `${trip.user.rating.toFixed(1)} (${trip.user.totalRatings})` : 'Nouveau'}
              </span>
            </div>
          </div>
        </div>

        {/* Itinéraire */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <MapPin className="text-purple-600" size={20} />
              <span className="font-medium text-gray-900">{trip.departureCity}</span>
              <ArrowRight className="text-gray-400" size={16} />
              <span className="font-medium text-gray-900">{trip.arrivalCity}</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-green-600" size={16} />
            <div>
              <div className="text-sm text-gray-500">Départ</div>
              <div className="font-medium">{formatDate(trip.departureDate)}</div>
              <div className="text-sm text-gray-600">{formatTime(trip.departureDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-orange-600" size={16} />
            <div>
              <div className="text-sm text-gray-500">Arrivée</div>
              <div className="font-medium">{formatDate(trip.arrivalDate)}</div>
              <div className="text-sm text-gray-600">{formatTime(trip.arrivalDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails financiers */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{trip.availableWeight}kg</div>
            <div className="text-xs text-gray-500">Disponible</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{trip.pricePerKg}€</div>
            <div className="text-xs text-gray-500">Par kg</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isAffordable ? 'text-green-600' : 'text-red-600'}`}>
              {trip.estimatedCost}€
            </div>
            <div className="text-xs text-gray-500">Pour votre colis</div>
          </div>
        </div>

        {/* Description */}
        {trip.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">{trip.description}</p>
          </div>
        )}

        {/* Bouton de contact */}
        <button
          onClick={onContact}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <MessageCircle size={18} />
          Contacter le voyageur
        </button>
      </div>
    </div>
  )
}

// Modal de contact
function ContactModal({ trip, parcel, onClose, onSuccess }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Message pré-rempli
  useEffect(() => {
    setMessage(`Bonjour ${trip.user?.fullName},

Je souhaite vous proposer le transport de mon colis "${parcel?.name}" pour votre voyage ${trip.departureCity} → ${trip.arrivalCity}.

Détails du colis :
- Poids : ${parcel?.weight} kg
- Valeur : ${parcel?.value}€
- Prix proposé : ${trip.estimatedCost}€

Êtes-vous disponible pour en discuter ?

Cordialement`)
  }, [trip, parcel])

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Veuillez saisir un message')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId: trip.user.id,
          content: message,
          relatedTripId: trip.id,
          relatedParcelId: parcel.id
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Contacter {trip.user?.fullName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="8"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Rédigez votre message..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParcelMatchingSystem