import { useState, useEffect, useRef } from 'react'
import { 
  User, 
  Camera, 
  Upload, 
  Star, 
  Shield, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Download
} from 'lucide-react'

const API_URL = 'http://localhost:4000/api'

function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const photoInputRef = useRef(null)
  const documentInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France'
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFormData({
          fullName: userData.fullName || '',
          phone: userData.phone || '',
          birthDate: userData.birthDate ? userData.birthDate.split('T')[0] : '',
          address: userData.address || '',
          city: userData.city || '',
          postalCode: userData.postalCode || '',
          country: userData.country || 'France'
        })
      }
    } catch (error) {
      setError('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        setEditing(false)
        setSuccess('Profil mis à jour avec succès!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5MB')
      return
    }

    setUploadingPhoto(true)
    setError('')

    const formData = new FormData()
    formData.append('photo', file)

    try {
      const response = await fetch(`${API_URL}/users/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📸 Photo upload response:', data)
        
        // Mettre à jour l'état avec le nouveau nom de fichier
        setUser(prev => ({ 
          ...prev, 
          profilePicture: data.profilePicture 
        }))
        
        setSuccess('Photo de profil mise à jour!')
        setTimeout(() => setSuccess(''), 3000)
        
        // Forcer le rechargement du composant
        window.location.reload()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Erreur upload photo:', error)
      setError('Erreur lors de l\'upload de la photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    console.log('📄 Fichier sélectionné:', file.name, file.type, file.size);

    if (file.size > 5 * 1024 * 1024) {
      setError('Le document ne doit pas dépasser 5MB')
      return
    }

    setUploadingDocument(true)
    setError('')

    const formData = new FormData()
    formData.append('document', file)

    console.log('📤 Envoi vers:', `${API_URL}/users/profile/identity`);

    try {
      const response = await fetch(`${API_URL}/users/profile/identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      console.log('📥 Response status:', response.status);
      const data = await response.json()
      console.log('📥 Response data:', data);

      if (response.ok) {
        const data = await response.json()
        console.log('📄 Document upload response:', data)
        
        // Mettre à jour l'état avec le nouveau document
        setUser(prev => ({ 
          ...prev, 
          identityDocument: data.identityDocument 
        }))
        
        setSuccess('Document d\'identité téléchargé! En attente de vérification.')
        setTimeout(() => setSuccess(''), 5000)
        
        // Recharger le profil pour avoir les dernières données
        fetchUserProfile()
      } else {
        setError(data.error || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('❌ Erreur upload document:', error);
      setError('Erreur lors de l\'upload du document')
    } finally {
      setUploadingDocument(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header avec photo de profil */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Photo de profil */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {user?.profilePicture ? (
                  <img 
                    src={`${API_URL}/users/avatar/${user.profilePicture}?t=${Date.now()}`}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Erreur chargement image via API, essai direct...');
                      // Fallback vers l'URL directe
                      e.target.src = `http://localhost:4000/uploads/profiles/${user.profilePicture}?t=${Date.now()}`;
                      e.target.crossOrigin = "anonymous";
                    }}
                    onLoad={() => {
                      console.log('✅ Image chargée:', user.profilePicture);
                    }}
                  />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Informations principales */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.fullName}</h1>
              <p className="text-gray-600 mb-4">{user?.email}</p>
              
              {/* Rating et vérifications */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                  <Star className="text-yellow-500 fill-current" size={16} />
                  <span className="font-medium">
                    {user?.rating > 0 ? `${user.rating.toFixed(1)} (${user.totalRatings})` : 'Pas encore noté'}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  user?.emailVerified ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {user?.emailVerified ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span className="text-sm font-medium">
                    {user?.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                  </span>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  user?.identityVerified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  <Shield size={16} />
                  <span className="text-sm font-medium">
                    {user?.identityVerified ? 'Identité vérifiée' : 'Identité non vérifiée'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton d'édition */}
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {editing ? <X size={20} /> : <Edit size={20} />}
              {editing ? 'Annuler' : 'Modifier'}
            </button>
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
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations personnelles */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <User className="text-blue-600" size={24} />
              Informations personnelles
            </h2>

            {editing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 rue de la République"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Lyon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="69000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Sauvegarder les modifications
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-3">
                  <Mail className="text-gray-400" size={20} />
                  <span className="text-gray-900">{user?.email}</span>
                </div>

                {user?.phone && (
                  <div className="flex items-center gap-3 py-3">
                    <Phone className="text-gray-400" size={20} />
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}

                {user?.birthDate && (
                  <div className="flex items-center gap-3 py-3">
                    <Calendar className="text-gray-400" size={20} />
                    <span className="text-gray-900">
                      {new Date(user.birthDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {(user?.address || user?.city) && (
                  <div className="flex items-center gap-3 py-3">
                    <MapPin className="text-gray-400" size={20} />
                    <span className="text-gray-900">
                      {[user?.address, user?.city, user?.postalCode, user?.country]
                        .filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {(!user?.phone && !user?.birthDate && !user?.address) && (
                  <p className="text-gray-500 italic py-8 text-center">
                    Aucune information complémentaire renseignée.
                    Cliquez sur "Modifier" pour compléter votre profil.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Vérification d'identité */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Shield className="text-blue-600" size={24} />
              Vérification d'identité
            </h2>

            <div className="space-y-6">
              <div className={`p-4 rounded-xl border-2 ${
                user?.identityVerified 
                  ? 'border-green-200 bg-green-50' 
                  : user?.identityDocument 
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {user?.identityVerified ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : user?.identityDocument ? (
                    <AlertCircle className="text-orange-600" size={24} />
                  ) : (
                    <Upload className="text-gray-400" size={24} />
                  )}
                  
                  <div>
                    <h3 className="font-semibold">
                      {user?.identityVerified 
                        ? 'Identité vérifiée' 
                        : user?.identityDocument 
                        ? 'En attente de vérification'
                        : 'Document d\'identité requis'
                      }
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user?.identityVerified 
                        ? 'Votre identité a été vérifiée avec succès'
                        : user?.identityDocument 
                        ? 'Votre document est en cours de vérification'
                        : 'Téléchargez votre pièce d\'identité pour être vérifié'
                      }
                    </p>
                  </div>
                </div>

                {user?.identityDocument && (
                  <div className="flex items-center gap-3 mt-4">
                    <button 
                      onClick={() => {
                        fetch(`${API_URL}/users/document/${user.identityDocument}`, {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        })
                        .catch(err => console.error('Erreur ouverture document:', err));
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye size={16} />
                      Voir le document
                    </button>
                    <button
                      onClick={() => {
                        fetch(`${API_URL}/users/document/${user.identityDocument}`, {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = user.identityDocument;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        })
                        .catch(err => console.error('Erreur téléchargement:', err));
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Download size={16} />
                      Télécharger
                    </button>
                  </div>
                )}
              </div>

              {!user?.identityVerified && (
                <div>
                  <button
                    onClick={() => documentInputRef.current?.click()}
                    disabled={uploadingDocument}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {uploadingDocument ? (
                      <Loader className="animate-spin" size={24} />
                    ) : (
                      <Upload size={24} />
                    )}
                    <span className="font-medium">
                      {user?.identityDocument 
                        ? 'Remplacer le document' 
                        : 'Télécharger votre pièce d\'identité'
                      }
                    </span>
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Formats acceptés: JPG, PNG, PDF (max 5MB)
                  </p>
                  
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2">Pourquoi vérifier votre identité ?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Accès à toutes les fonctionnalités</li>
                  <li>• Augmentation de la confiance des autres utilisateurs</li>
                  <li>• Sécurité renforcée de la plateforme</li>
                  <li>• Badge de vérification sur votre profil</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques et historique */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Statistiques</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Voyages publiés</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Colis transportés</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Colis envoyés</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {user?.rating > 0 ? user.rating.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-600">Note moyenne</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile