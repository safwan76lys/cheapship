import { useState, useEffect } from 'react'
import { 
  Package, MapPin, MessageCircle, LogOut, Star, User, Plus, Compass, Search, Bell, BarChart3,
  TrendingUp, TrendingDown, DollarSign, Clock, Target, Award, AlertCircle,
  Calendar, ArrowUp, ArrowDown, Activity, Zap, PieChart
} from 'lucide-react'
import Reviews from './Reviews'
import UserProfile from './UserProfile'
import TravelForm from './TravelForm'
import ParcelForm from './ParcelForm'
import TripsManagement from './TripsManagement'
import ParcelsManagement from './ParcelsManagement'
import MessagingSystem from './MessagingSystem'
import GeographicSearch from './GeographicSearch'
import AlertsManagement from './AlertsManagement'

const API_URL = 'http://localhost:4000/api'

// Composant Analytics
function AnalyticsDashboard({ user }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/analytics/dashboard?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Erreur analytics:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-600">Chargement de vos analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h3 className="ml-2 text-red-800 font-medium">Erreur de chargement</h3>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <h3 className="ml-2 text-yellow-800 font-medium">Analytics non disponibles</h3>
        </div>
        <p className="mt-2 text-yellow-700">Aucune donnée analytics trouvée.</p>
      </div>
    )
  }

  const { basic, earnings, performance, trust, predictions, insights } = analytics

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur de période */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-600">Votre performance sur Cheapship</p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">3 derniers mois</option>
          <option value="1y">12 derniers mois</option>
        </select>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenus totaux */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Revenus totaux</p>
              <p className="text-2xl font-bold">{earnings?.total || 0}€</p>
              <div className="flex items-center mt-1">
                {earnings?.monthlyGrowth >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-200" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-300" />
                )}
                <span className="text-sm text-green-100 ml-1">
                  {Math.abs(earnings?.monthlyGrowth || 0)}% ce mois
                </span>
              </div>
            </div>
            <DollarSign className="h-12 w-12 text-green-200" />
          </div>
        </div>

        {/* Taux de succès */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Taux de succès</p>
              <p className="text-2xl font-bold">{performance?.successRate || 0}%</p>
              <p className="text-sm text-blue-100">
                {performance?.successfulTransactions || 0} livraisons
              </p>
            </div>
            <Target className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        {/* Score de confiance */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Score de confiance</p>
              <p className="text-2xl font-bold">{trust?.trustScore || 0}/100</p>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 text-yellow-300 fill-current" />
                <span className="text-sm text-purple-100 ml-1">
                  {trust?.ratingBreakdown?.current || 0}/5
                </span>
              </div>
            </div>
            <Award className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        {/* Temps de réponse */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Temps de réponse</p>
              <p className="text-2xl font-bold">{performance?.avgResponseTime || '0h'}</p>
              <p className="text-sm text-orange-100">Moyenne</p>
            </div>
            <Clock className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Prédictions IA */}
      {predictions && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Zap className="h-6 w-6 mr-2" />
            🤖 Prédictions IA
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold">Revenus prochains</h3>
              <p className="text-2xl font-bold">{predictions.nextMonthEarnings}€</p>
              <p className="text-sm opacity-80">Mois prochain</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold">Croissance demande</h3>
              <p className="text-2xl font-bold">+{predictions.demandGrowth}%</p>
              <p className="text-sm opacity-80">Tendance marché</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="font-semibold">Confiance IA</h3>
              <p className="text-2xl font-bold">{predictions.confidence}%</p>
              <p className="text-sm opacity-80">Précision modèle</p>
            </div>
          </div>
        </div>
      )}

      {/* Métriques détaillées */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-gray-600" />
          Performance détaillée
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{performance?.reliability || 0}</p>
            <p className="text-sm text-gray-600">Score fiabilité</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{performance?.efficiency || 0}</p>
            <p className="text-sm text-gray-600">Score efficacité</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{performance?.cancelationRate || 0}%</p>
            <p className="text-sm text-gray-600">Taux annulation</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{performance?.onTimeDeliveryRate || 0}%</p>
            <p className="text-sm text-gray-600">Livraisons à temps</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard')

  const renderCurrentView = () => {
    switch(currentView) {
      case 'analytics':
        return <AnalyticsDashboard user={user} />
      case 'reviews':
        return <Reviews userId={user?.id} />
      case 'profile':
        return <UserProfile />
      case 'myTrips':
        return <TripsManagement onCreateTrip={() => setCurrentView('createTrip')} />
      case 'createTrip':
        return <TravelForm />
      case 'myParcels':
        return <ParcelsManagement onCreateParcel={() => setCurrentView('createParcel')} /> 
      case 'createParcel':
        return <ParcelForm /> 
      case 'messages':
        return <MessagingSystem user={user} onClose={() => setCurrentView('dashboard')} />
      case 'search':
        return <GeographicSearch user={user} onClose={() => setCurrentView('dashboard')} />
      case 'alerts':
        return <AlertsManagement user={user} />
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* MES COLIS - Cliquable */}
              <button
                onClick={() => setCurrentView('myParcels')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Package className="text-blue-600" size={32} />
                  <h2 className="text-xl font-semibold">Mes Colis</h2>
                </div>
                <p className="text-gray-600">Gérez vos demandes de transport</p>
              </button>
               
              {/* MES VOYAGES - Cliquable */}
              <button
                onClick={() => setCurrentView('myTrips')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <MapPin className="text-green-600" size={32} />
                  <h2 className="text-xl font-semibold">Mes Voyages</h2>
                </div>
                <p className="text-gray-600">Planifiez vos trajets</p>
              </button>

              {/* MESSAGES - Cliquable */}
              <button
                onClick={() => setCurrentView('messages')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <MessageCircle className="text-purple-600" size={32} />
                  <h2 className="text-xl font-semibold">Messages</h2>
                </div>
                <p className="text-gray-600">Communiquez avec les utilisateurs</p>
              </button>
            </div>

            {/* DEUXIÈME LIGNE - Fonctionnalités principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* ALERTES INTELLIGENTES */}
              <button
                onClick={() => setCurrentView('alerts')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Bell className="text-red-600" size={32} />
                  <h2 className="text-xl font-semibold">Mes Alertes</h2>
                </div>
                <p className="text-gray-600">Soyez notifié des nouvelles offres</p>
              </button>

              {/* RECHERCHE GÉOGRAPHIQUE */}
              <button
                onClick={() => setCurrentView('search')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Compass className="text-orange-600" size={32} />
                  <h2 className="text-xl font-semibold">Recherche géographique</h2>
                </div>
                <p className="text-gray-600">Trouvez colis et voyages près de vous</p>
              </button>

              {/* MES AVIS */}
              <button
                onClick={() => setCurrentView('reviews')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Star className="text-yellow-500" size={32} />
                  <h2 className="text-xl font-semibold">Mes Avis</h2>
                </div>
                <p className="text-gray-600">
                  {user?.rating > 0
                    ? `Note: ${user.rating.toFixed(1)}/5 (${user.totalRatings} avis)`
                    : 'Aucun avis pour le moment'
                  }
                </p>
              </button>
            </div>

            {/* TROISIÈME LIGNE - Analytics et Profil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* ANALYTICS - NOUVEAU */}
              <button
                onClick={() => setCurrentView('analytics')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left border-2 border-purple-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <BarChart3 className="text-purple-600" size={32} />
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Analytics</h2>
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs">
                      IA
                    </span>
                  </div>
                </div>
                <p className="text-gray-600">Performances et insights intelligents</p>
              </button>

              {/* MON PROFIL */}
              <button
                onClick={() => setCurrentView('profile')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <User className="text-blue-500" size={32} />
                  <h2 className="text-xl font-semibold">Mon Profil</h2>
                </div>
                <p className="text-gray-600">Gérer mes informations personnelles</p>
              </button>
            </div>

            {/* DONNÉES UTILISATEUR EN BAS */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                📊 Vos données utilisateur
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {user?.rating ? user.rating.toFixed(1) : '0.0'}
                  </p>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                </div>
                
                <div className="text-center bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {user?.totalRatings || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total avis</p>
                </div>
                
                <div className="text-center bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {user?.identityVerified ? '✅' : '⏳'}
                  </p>
                  <p className="text-sm text-gray-600">Vérification</p>
                </div>
                
                <div className="text-center bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {user?.emailVerified ? '✅' : '⏳'}
                  </p>
                  <p className="text-sm text-gray-600">Email vérifié</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Informations personnelles</h4>
                  <p className="text-sm text-gray-600">Nom: {user?.fullName || 'Non défini'}</p>
                  <p className="text-sm text-gray-600">Email: {user?.email || 'Non défini'}</p>
                  <p className="text-sm text-gray-600">
                    Membre depuis: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Non défini'}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Statut du compte</h4>
                  <p className="text-sm text-gray-600">
                    Vérification identité: {user?.identityVerified ? '✅ Vérifié' : '⏳ En attente'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email confirmé: {user?.emailVerified ? '✅ Confirmé' : '⏳ En attente'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Téléphone: {user?.phoneVerified ? '✅ Vérifié' : '⏳ Non vérifié'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Cheapship</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Bonjour, {user?.fullName}</span>
            
            {/* Indicateur Analytics */}
            {currentView !== 'analytics' && (
              <button
                onClick={() => setCurrentView('analytics')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                📊 Analytics
              </button>
            )}
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              <LogOut size={20} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView !== 'dashboard' && (
          <button
            onClick={() => setCurrentView('dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Retour au tableau de bord
          </button>
        )}
        
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default Dashboard