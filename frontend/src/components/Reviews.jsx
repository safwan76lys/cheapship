import { useState, useEffect } from 'react'
import { Star, User } from 'lucide-react'
import { API_URL } from "../config/api";

function Reviews({ userId }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [userId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des avis...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Avis et évaluations</h2>
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Laisser un avis
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.average.toFixed(1)}</div>
              <div className="flex justify-center my-1">
                <StarRating rating={stats.average} />
              </div>
              <div className="text-sm text-gray-600">{stats.total} avis</div>
            </div>
            
            <div className="flex-1 ml-8">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-sm w-4">{star}</span>
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${stats.distribution ? (stats.distribution[star] / stats.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.distribution ? stats.distribution[star] : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des avis */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun avis pour le moment</p>
        ) : (
          reviews.map(review => (
            <ReviewItem key={review.id} review={review} />
          ))
        )}
      </div>

      {/* Formulaire d'avis */}
      {showReviewForm && (
        <ReviewForm
          receiverId={userId}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false)
            fetchReviews()
          }}
        />
      )}
    </div>
  )
}

// Composant pour afficher un avis
function ReviewItem({ review }) {
  return (
    <div className="border-b pb-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <User size={20} className="text-gray-500" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium">{review.author.fullName}</h4>
            <span className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          
          <StarRating rating={review.rating} />
          
          {review.trip && (
            <p className="text-sm text-gray-600 mt-1">
              Voyage: {review.trip.departureCity} → {review.trip.arrivalCity}
            </p>
          )}
          
          {review.comment && (
            <p className="mt-2 text-gray-700">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant pour le formulaire d'avis
function ReviewForm({ receiverId, tripId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId,
          tripId,
          rating,
          comment
        })
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Erreur lors de l\'envoi de l\'avis')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Laisser un avis</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Note</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Partagez votre expérience..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Composant pour afficher les étoiles
function StarRating({ rating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

export default Reviews