import { useState, useEffect } from 'react'
import { 
  Plane,
  MapPin,
  Calendar,
  Clock,
  Euro,
  Weight,
  Edit,
  Trash2,
  Eye,
  Plus,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  ArrowRight,
  Users,
  Package
} from 'lucide-react'
import TripEditForm from './TripEditForm'

const API_URL = 'http://localhost:4000/api'

// Statuts des voyages avec couleurs
const TRIP_STATUSES = {
  ACTIVE: { label: 'Actif', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  COMPLETED: { label: 'Terminé', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  CANCELLED: { label: 'Annulé', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' }
}

function TripsManagementDashboard({ onCreateTrip }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingTrip, setEditingTrip] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  
  useEffect(() => {
    fetchUserTrips()
  }, [])

  const fetchUserTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/trips/my-trips`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      } else {
        setError('Erreur lors du chargement des voyages')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les voyages
  const filteredTrips = trips.filter(trip => {
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      trip.departureCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.arrivalCity.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Supprimer un voyage
  const handleDeleteTrip = async (tripId) => {
    try {
      const response = await fetch(`${API_URL}/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setTrips(trips.filter(trip => trip.id !== tripId))
        setSuccess('Voyage supprimé avec succès')
        setShowDeleteModal(null)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  // Formater les dates
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
// Modifier le return pour gérer l'édition :
if (editingTrip) {
  return (
    <TripEditForm
      trip={editingTrip}
      onSave={(updatedTrip) => {
        // Mettre à jour la liste des voyages
        setTrips(trips.map(trip => 
          trip.id === updatedTrip.id ? updatedTrip : trip
        ))
        setEditingTrip(null)
        setSuccess('Voyage modifié avec succès!')
      }}
      onCancel={() => setEditingTrip(null)}
    />
  )
}
  // Calculer les gains potentiels
  const calculatePotentialEarnings = (trip) => {
    return (trip.availableWeight * trip.pricePerKg).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Chargement de vos voyages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Voyages</h1>
              <p className="text-gray-600">Gérez vos voyages publiés</p>
            </div>
          </div>
          
          <button
            onClick={onCreateTrip}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nouveau voyage
          </button>
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par ville..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtres par statut */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({trips.length})
              </button>
              {Object.entries(TRIP_STATUSES).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === status 
                      ? `bg-${config.color}-600 text-white` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.label} ({trips.filter(t => t.status === status).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des voyages */}
        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Plane className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun voyage trouvé' 
                : 'Aucun voyage publié'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Commencez par publier votre premier voyage'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                Publier un voyage
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={setEditingTrip}
                onDelete={() => setShowDeleteModal(trip)}
                formatDate={formatDate}
                formatTime={formatTime}
                calculatePotentialEarnings={calculatePotentialEarnings}
              />
            ))}
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            trip={showDeleteModal}
            onConfirm={() => handleDeleteTrip(showDeleteModal.id)}
            onCancel={() => setShowDeleteModal(null)}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  )
}

// Composant carte voyage
function TripCard({ trip, onEdit, onDelete, formatDate, formatTime, calculatePotentialEarnings }) {
  const statusConfig = TRIP_STATUSES[trip.status]
  const isEditable = trip.status === 'ACTIVE'
  const isDeletable = trip.status === 'ACTIVE'

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      {/* Header avec statut */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
            {statusConfig.label}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(trip)}
              disabled={!isEditable}
              className={`p-2 rounded-lg transition-colors ${
                isEditable 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={isEditable ? 'Modifier' : 'Modification impossible'}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={onDelete}
              disabled={!isDeletable}
              className={`p-2 rounded-lg transition-colors ${
                isDeletable 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={isDeletable ? 'Supprimer' : 'Suppression impossible'}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Itinéraire */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-600" size={20} />
              <span className="font-semibold text-gray-900">{trip.departureCity}</span>
              <ArrowRight className="text-gray-400" size={16} />
              <span className="font-semibold text-gray-900">{trip.arrivalCity}</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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
            <div className="flex items-center justify-center gap-1 mb-1">
              <Weight className="text-gray-500" size={16} />
            </div>
            <div className="text-lg font-bold text-gray-900">{trip.availableWeight}kg</div>
            <div className="text-xs text-gray-500">Disponible</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Euro className="text-gray-500" size={16} />
            </div>
            <div className="text-lg font-bold text-gray-900">{trip.pricePerKg}€</div>
            <div className="text-xs text-gray-500">Par kg</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="text-gray-500" size={16} />
            </div>
            <div className="text-lg font-bold text-green-600">{calculatePotentialEarnings(trip)}€</div>
            <div className="text-xs text-gray-500">Max possible</div>
          </div>
        </div>

        {/* Description */}
        {trip.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">{trip.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            <Eye size={16} />
            Voir les demandes
          </button>
          {trip.status === 'ACTIVE' && (
            <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
              <Users size={16} />
              Gérer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Modal de confirmation de suppression
function DeleteConfirmationModal({ trip, onConfirm, onCancel, formatDate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer ce voyage ?</h3>
          <p className="text-gray-600">Cette action est irréversible.</p>
        </div>

        {/* Détails du voyage */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="font-medium text-gray-900 mb-1">
              {trip.departureCity} → {trip.arrivalCity}
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(trip.departureDate)}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export default TripsManagementDashboard