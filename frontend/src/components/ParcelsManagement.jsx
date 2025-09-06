import { useState, useEffect } from 'react'
import { 
  Package,
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
  Star,
  Shield,
  Camera,
  Zap
} from 'lucide-react'
import ParcelEditForm from './ParcelEditForm'
import ParcelMatching from './ParcelMatching'

const API_URL = 'https://cheapship-production.up.railway.app/api'

// Statuts des colis avec couleurs
const PARCEL_STATUSES = {
  PENDING: { label: 'En attente', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  ASSIGNED: { label: 'Assigné', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  IN_TRANSIT: { label: 'En transit', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  DELIVERED: { label: 'Livré', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  CANCELLED: { label: 'Annulé', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' }
}

// Niveaux d'urgence
const URGENCY_LEVELS = {
  flexible: { label: 'Flexible', color: 'green', icon: '🟢' },
  normal: { label: 'Normal', color: 'blue', icon: '🔵' },
  urgent: { label: 'Urgent', color: 'orange', icon: '🟠' },
  express: { label: 'Express', color: 'red', icon: '🔴' }
}

function ParcelsManagementDashboard({ onCreateParcel }) {
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingParcel, setEditingParcel] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [searchingParcel, setSearchingParcel] = useState(null)

  useEffect(() => {
    fetchUserParcels()
  }, [])

  const fetchUserParcels = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/parcels/my-parcels`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setParcels(data.parcels || [])
      } else {
        setError('Erreur lors du chargement des colis')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les colis
  const filteredParcels = parcels.filter(parcel => {
    const matchesStatus = filterStatus === 'all' || parcel.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      parcel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.pickupCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.deliveryCity.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Supprimer un colis
  const handleDeleteParcel = async (parcelId) => {
    try {
      const response = await fetch(`${API_URL}/parcels/${parcelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setParcels(parcels.filter(parcel => parcel.id !== parcelId))
        setSuccess('Colis supprimé avec succès')
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
     // Modifier le return pour gérer l'édition :
if (editingParcel) {
  return (
    <ParcelEditForm
      parcel={editingParcel}
      onSave={(updatedParcel) => {
        // Mettre à jour la liste des colis
        setParcels(parcels.map(parcel => 
          parcel.id === updatedParcel.id ? updatedParcel : parcel
        ))
        setEditingParcel(null)
        setSuccess('Colis modifié avec succès!')
      }}
      onCancel={() => setEditingParcel(null)}
    />
  )
}
  // Formater les dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-600">Chargement de vos colis...</p>
        </div>
      </div>
    )
  }
  if (searchingParcel) {
  return (
    <ParcelMatching
      parcel={searchingParcel}
      onBack={() => setSearchingParcel(null)}
    />
  )
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-full">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Colis</h1>
              <p className="text-gray-600">Gérez vos demandes de transport</p>
            </div>
          </div>
          
          <button
            onClick={onCreateParcel}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Nouveau colis
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
                placeholder="Rechercher par nom ou ville..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filtres par statut */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({parcels.length})
              </button>
              {Object.entries(PARCEL_STATUSES).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === status 
                      ? `bg-${config.color}-600 text-white` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.label} ({parcels.filter(p => p.status === status).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des colis */}
        {filteredParcels.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun colis trouvé' 
                : 'Aucun colis en attente'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Commencez par créer votre première demande de transport'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button 
                onClick={onCreateParcel}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Créer une demande
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredParcels.map((parcel) => (
              <ParcelCard
                key={parcel.id}
                parcel={parcel}
                onEdit={setEditingParcel}
                onDelete={() => setShowDeleteModal(parcel)}
                onSearchTrips={setSearchingParcel}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <DeleteConfirmationModal
            parcel={showDeleteModal}
            onConfirm={() => handleDeleteParcel(showDeleteModal.id)}
            onCancel={() => setShowDeleteModal(null)}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  )
}

// Composant carte colis
function ParcelCard({ parcel, onEdit, onDelete, onSearchTrips , formatDate }) {
  const statusConfig = PARCEL_STATUSES[parcel.status]
  const urgencyConfig = URGENCY_LEVELS[parcel.urgency]
  const isEditable = parcel.status === 'PENDING'
  const isDeletable = parcel.status === 'PENDING'

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      {/* Header avec statut */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
              {statusConfig.label}
            </div>
            <div className="text-sm flex items-center gap-1">
              <span>{urgencyConfig.icon}</span>
              <span className="text-gray-600">{urgencyConfig.label}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(parcel)}
              disabled={!isEditable}
              className={`p-2 rounded-lg transition-colors ${
                isEditable 
                  ? 'text-purple-600 hover:bg-purple-50' 
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

        {/* Nom du colis */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{parcel.name}</h3>
          <p className="text-sm text-gray-600">{parcel.category}</p>
        </div>

        {/* Itinéraire */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <MapPin className="text-purple-600" size={20} />
              <span className="font-medium text-gray-900">{parcel.pickupCity}</span>
              <ArrowRight className="text-gray-400" size={16} />
              <span className="font-medium text-gray-900">{parcel.deliveryCity}</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-green-600" size={16} />
            <div>
              <div className="text-sm text-gray-500">Enlèvement</div>
              <div className="font-medium">{formatDate(parcel.pickupDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-orange-600" size={16} />
            <div>
              <div className="text-sm text-gray-500">Livraison</div>
              <div className="font-medium">{formatDate(parcel.deliveryDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Weight className="text-gray-500" size={16} />
            </div>
            <div className="text-lg font-bold text-gray-900">{parcel.weight}kg</div>
            <div className="text-xs text-gray-500">Poids</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Euro className="text-gray-500" size={16} />
            </div>
            <div className="text-lg font-bold text-gray-900">{parcel.value}€</div>
            <div className="text-xs text-gray-500">Valeur</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="text-gray-500" size={16} />
            </div>
            <div className="text-lg font-bold text-purple-600">{parcel.maxPrice}€</div>
            <div className="text-xs text-gray-500">Budget max</div>
          </div>
        </div>

        {/* Options spéciales */}
        {(parcel.fragile || parcel.insurance) && (
          <div className="flex gap-2 mb-4">
            {parcel.fragile && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                🔸 Fragile
              </span>
            )}
            {parcel.insurance && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                🛡️ Assuré
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
            <Eye size={16} />
            Voir les offres
          </button>
          {parcel.status === 'PENDING' && (
  <button 
    onClick={() => onSearchTrips(parcel)}
    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
  >
    <Search size={16} />
    Chercher voyages
  </button>
)}
        </div>
      </div>
    </div>
  )
}

// Modal de confirmation de suppression
function DeleteConfirmationModal({ parcel, onConfirm, onCancel, formatDate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer ce colis ?</h3>
          <p className="text-gray-600">Cette action est irréversible.</p>
        </div>

        {/* Détails du colis */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="font-medium text-gray-900 mb-1">{parcel.name}</div>
            <div className="text-sm text-gray-600 mb-1">
              {parcel.pickupCity} → {parcel.deliveryCity}
            </div>
            <div className="text-sm text-gray-600">
              Enlèvement: {formatDate(parcel.pickupDate)}
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

export default ParcelsManagementDashboard