import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Star, Clock, Package,
  Users, BarChart3, PieChart, Target, Award, AlertCircle,
  Calendar, ArrowUp, ArrowDown, Activity, Zap
} from 'lucide-react'

const API_URL = 'https://cheapship-back.onrender.com/api'

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

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques de base */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
            Activité générale
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Voyages publiés</span>
              <span className="font-semibold">{basic?.totalTripsPublished || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Colis envoyés</span>
              <span className="font-semibold">{basic?.totalParcelsSent || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total transactions</span>
              <span className="font-semibold">{performance?.totalTransactions || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Membre depuis</span>
              <span className="font-semibold">{basic?.joinedDaysAgo || 0} jours</span>
            </div>
          </div>
        </div>

        {/* Insights & Recommandations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-gray-600" />
            🎯 Insights & Recommandations
          </h2>
          
          {insights && insights.actionPlan && insights.actionPlan.length > 0 ? (
            <div className="space-y-3">
              {insights.actionPlan.slice(0, 5).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>Continuez à utiliser Cheapship pour recevoir des insights personnalisés !</p>
            </div>
          )}
        </div>
      </div>

      {/* Métriques de performance avancées */}
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

      {/* Badges de confiance */}
      {trust?.trustBadges && trust.trustBadges.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-gray-600" />
            🏆 Badges & Achievements
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trust.trustBadges.map((badge, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-semibold text-sm text-gray-800">{badge.type}</p>
                <p className="text-xs text-gray-600 capitalize">{badge.level}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard