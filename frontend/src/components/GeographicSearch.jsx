import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Calendar, Clock, Euro, Weight, Filter, Star, User, Package, Plane,
  Navigation, Target, Map, Route, ArrowRight, Eye, MessageCircle, Heart, Share2,
  Sliders, RefreshCw, RotateCcw, ChevronDown, ChevronUp, X, AlertCircle, Info,
  Compass, Globe, Crosshair, Zap, TrendingUp, Users, Shield, CheckCircle, ArrowLeft,
  Send, Download
} from 'lucide-react';

const API_URL = 'https://cheapship-back.onrender.com/api';


// Mock data pour les résultats
const mockParcels = [
  {
    id: 'p1',
    title: 'MacBook Pro 16" - Fragile',
    description: 'MacBook Pro neuf encore sous garantie, transport très soigneux requis',
    category: 'Électronique',
    weight: 2.1,
    value: 2500,
    maxPrice: 45,
    urgency: 'normal',
    fragile: true,
    insurance: true,
    from: { city: 'Paris', country: 'France', coords: [48.8566, 2.3522] },
    to: { city: 'Lyon', country: 'France', coords: [45.7640, 4.8357] },
    pickupDate: '2024-01-15',
    deliveryDate: '2024-01-16',
    distance: 465,
    user: {
      id: 'u1',
      name: 'Pierre Martin',
      avatar: '/api/placeholder/40/40',
      rating: 4.5,
      totalRatings: 23,
      verified: true
    },
    createdAt: new Date(Date.now() - 3600000),
    images: ['/api/placeholder/300/200', '/api/placeholder/300/200']
  },
  {
    id: 'p2',
    title: 'Livre rare - Histoire de France',
    description: 'Livre ancien de collection, protection contre l\'humidité nécessaire',
    category: 'Livres',
    weight: 0.8,
    value: 150,
    maxPrice: 15,
    urgency: 'flexible',
    fragile: false,
    insurance: false,
    from: { city: 'Lyon', country: 'France', coords: [45.7640, 4.8357] },
    to: { city: 'Nice', country: 'France', coords: [43.7102, 7.2620] },
    pickupDate: '2024-01-20',
    deliveryDate: '2024-01-22',
    distance: 470,
    user: {
      id: 'u2',
      name: 'Sophie Chen',
      avatar: '/api/placeholder/40/40',
      rating: 4.7,
      totalRatings: 45,
      verified: true
    },
    createdAt: new Date(Date.now() - 7200000),
    images: ['/api/placeholder/300/200']
  },
  {
    id: 'p3',
    title: 'Vêtements hiver + Chaussures',
    description: 'Carton de vêtements d\'hiver et chaussures, pas fragile',
    category: 'Vêtements',
    weight: 5.2,
    value: 300,
    maxPrice: 25,
    urgency: 'urgent',
    fragile: false,
    insurance: true,
    from: { city: 'Toulouse', country: 'France', coords: [43.6047, 1.4442] },
    to: { city: 'Bordeaux', country: 'France', coords: [44.8378, -0.5792] },
    pickupDate: '2024-01-18',
    deliveryDate: '2024-01-19',
    distance: 245,
    user: {
      id: 'u3',
      name: 'Lucas Bernard',
      avatar: '/api/placeholder/40/40',
      rating: 4.2,
      totalRatings: 12,
      verified: false
    },
    createdAt: new Date(Date.now() - 1800000),
    images: []
  }
];

const mockTrips = [
  {
    id: 't1',
    from: { city: 'Paris', country: 'France', coords: [48.8566, 2.3522] },
    to: { city: 'Lyon', country: 'France', coords: [45.7640, 4.8357] },
    departureDate: '2024-01-15',
    departureTime: '08:00',
    arrivalDate: '2024-01-15',
    arrivalTime: '12:30',
    availableWeight: 15.0,
    pricePerKg: 6.50,
    description: 'Voyage en train, transport soigneux garanti',
    distance: 465,
    transportType: 'train',
    user: {
      id: 't1',
      name: 'Marie Dubois',
      avatar: '/api/placeholder/40/40',
      rating: 4.8,
      totalRatings: 67,
      verified: true
    },
    createdAt: new Date(Date.now() - 5400000),
    tags: ['Rapide', 'Fiable', 'Écologique']
  },
  {
    id: 't2',
    from: { city: 'Marseille', country: 'France', coords: [43.2965, 5.3698] },
    to: { city: 'Nice', country: 'France', coords: [43.7102, 7.2620] },
    departureDate: '2024-01-16',
    departureTime: '09:00',
    arrivalDate: '2024-01-16',
    arrivalTime: '11:15',
    availableWeight: 8.0,
    pricePerKg: 8.00,
    description: 'Voiture personnelle, trajet régulier',
    distance: 200,
    transportType: 'car',
    user: {
      id: 't2',
      name: 'Jean Lefebvre',
      avatar: '/api/placeholder/40/40',
      rating: 4.9,
      totalRatings: 134,
      verified: true
    },
    createdAt: new Date(Date.now() - 3600000),
    tags: ['Flexible', 'Direct']
  },
  {
    id: 't3',
    from: { city: 'London', country: 'Royaume-Uni', coords: [51.5074, -0.1278] },
    to: { city: 'Paris', country: 'France', coords: [48.8566, 2.3522] },
    departureDate: '2024-01-20',
    departureTime: '06:30',
    arrivalDate: '2024-01-20',
    arrivalTime: '09:45',
    availableWeight: 20.0,
    pricePerKg: 12.00,
    description: 'Eurostar, voyage régulier professionnel',
    distance: 460,
    transportType: 'train',
    user: {
      id: 't3',
      name: 'David Wilson',
      avatar: '/api/placeholder/40/40',
      rating: 4.6,
      totalRatings: 89,
      verified: true
    },
    createdAt: new Date(Date.now() - 10800000),
    tags: ['International', 'Professionnel', 'Eurostar']
  }
];

// Fonctions utilitaires
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  });
};

const formatTime = (time) => {
  if (typeof time === 'string' && time.includes(':')) {
    return time.slice(0, 5);
  }
  return new Date(time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Composant carte colis
const ParcelCard = ({ parcel, formatDate, isFavorite, onToggleFavorite, onContact, onViewImages }) => {
  const getUrgencyColor = (urgency) => {
    if (!urgency) return 'bg-gray-100 text-gray-700 border-gray-200';
    
    switch (urgency) {
      case 'express': return 'bg-red-100 text-red-700 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'flexible': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{parcel.title}</h3>
              {parcel.urgency && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(parcel.urgency)}`}>
                  {parcel.urgency.charAt(0).toUpperCase() + parcel.urgency.slice(1)}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-3">{parcel.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-2xl font-bold text-purple-600">{parcel.maxPrice}€</span>
            <span className="text-xs text-gray-500">Budget max</span>
          </div>
        </div>

        {/* Itinéraire */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-900">{parcel.from.city}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="font-medium text-gray-900">{parcel.to.city}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
            <Route className="w-4 h-4" />
            <span>{Math.round(parcel.calculatedDistance)}km de vous</span>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <Weight className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-gray-900">{parcel.weight}kg</div>
            <div className="text-xs text-gray-500">Poids</div>
          </div>
          <div className="text-center">
            <Euro className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-gray-900">{parcel.value}€</div>
            <div className="text-xs text-gray-500">Valeur</div>
          </div>
          <div className="text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-gray-900">{formatDate(parcel.pickupDate)}</div>
            <div className="text-xs text-gray-500">Enlèvement</div>
          </div>
          <div className="text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-gray-900">{formatDate(parcel.deliveryDate)}</div>
            <div className="text-xs text-gray-500">Livraison</div>
          </div>
        </div>

        {/* Options spéciales */}
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
          {parcel.category && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              📦 {parcel.category}
            </span>
          )}
        </div>

        {/* Utilisateur */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src={parcel.user.avatar} 
              alt={parcel.user.name}
              className="w-10 h-10 rounded-full border-2 border-white shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{parcel.user.name}</span>
                {parcel.user.verified && (
                  <Shield className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">
                  {parcel.user.rating} ({parcel.user.totalRatings} avis)
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {parcel.images && parcel.images.length > 0 && (
              <button 
                onClick={onViewImages}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voir les photos"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={onContact}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Contacter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant carte voyage
const TripCard = ({ trip, formatDate, formatTime, isFavorite, onToggleFavorite, onContact }) => {
  const getTransportIcon = (type) => {
    switch (type) {
      case 'train': return '🚄';
      case 'car': return '🚗';
      case 'plane': return '✈️';
      case 'bus': return '🚌';
      default: return '🚗';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getTransportIcon(trip.transportType)}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {trip.from.city} → {trip.to.city}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">{trip.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-2xl font-bold text-green-600">{trip.pricePerKg}€/kg</span>
            <span className="text-xs text-gray-500">Prix par kg</span>
          </div>
        </div>

        {/* Horaires */}
        <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">{formatDate(trip.departureDate)}</div>
              <div className="text-sm text-gray-600">{formatTime(trip.departureTime)}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">{formatDate(trip.arrivalDate)}</div>
              <div className="text-sm text-gray-600">{formatTime(trip.arrivalTime)}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
            <Route className="w-4 h-4" />
            <span>{Math.round(trip.calculatedDistance)}km de vous</span>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <Weight className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-gray-900">{trip.availableWeight}kg</div>
            <div className="text-xs text-gray-500">Disponible</div>
          </div>
          <div className="text-center">
            <Route className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-gray-900">{trip.distance}km</div>
            <div className="text-xs text-gray-500">Distance</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gray-500" />
            <div className="font-medium text-green-600">{(trip.availableWeight * trip.pricePerKg).toFixed(0)}€</div>
            <div className="text-xs text-gray-500">Max possible</div>
          </div>
        </div>

        {/* Tags */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {trip.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Utilisateur */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src={trip.user.avatar} 
              alt={trip.user.name}
              className="w-10 h-10 rounded-full border-2 border-white shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{trip.user.name}</span>
                {trip.user.verified && (
                  <Shield className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">
                  {trip.user.rating} ({trip.user.totalRatings} avis)
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={onContact}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Proposer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de contact
const ContactModal = ({ item, itemType, onSubmit, onClose, loading }) => {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (itemType === 'parcels') {
      setMessage(`Bonjour ${item.user.name},

Je suis intéressé(e) par le transport de votre colis "${item.title}".

Détails du colis :
- Poids : ${item.weight} kg
- Valeur : ${item.value}€
- Trajet : ${item.from.city} → ${item.to.city}
- Budget maximum : ${item.maxPrice}€

Je peux effectuer ce transport dans de bonnes conditions. Pouvons-nous en discuter ?

Cordialement`);
    } else {
      setMessage(`Bonjour ${item.user.name},

Je souhaiterais profiter de votre voyage ${item.from.city} → ${item.to.city} pour faire transporter un colis.

Détails de votre voyage :
- Départ : ${item.departureDate} à ${item.departureTime}
- Capacité disponible : ${item.availableWeight} kg
- Prix : ${item.pricePerKg}€/kg

Êtes-vous disponible pour en discuter ?

Cordialement`);
    }
  }, [item, itemType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(item, message.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {itemType === 'parcels' ? 'Contacter l\'expéditeur' : 'Proposer un transport'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Aperçu de l'item */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                {itemType === 'parcels' ? (
                  <Package className="text-white" size={20} />
                ) : (
                  <Plane className="text-white" size={20} />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {itemType === 'parcels' ? item.title : `${item.from.city} → ${item.to.city}`}
                </h4>
                <p className="text-sm text-gray-600">
                  {itemType === 'parcels' 
                    ? `${item.weight}kg - Budget max: ${item.maxPrice}€`
                    : `${item.availableWeight}kg dispo - ${item.pricePerKg}€/kg`
                  }
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
              />
            </div>

            {itemType === 'trips' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix proposé (optionnel)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Votre offre en €"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal d'images
const ImagesModal = ({ item, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!item.images || item.images.length === 0) {
    return null;
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Photos - {item.title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <img
            src={item.images[currentImageIndex]}
            alt={`${item.title} - Image ${currentImageIndex + 1}`}
            className="w-full h-96 object-cover"
          />
          
          {item.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <ArrowRight size={20} />
              </button>
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-2">
                  {item.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Image {currentImageIndex + 1} sur {item.images.length}
            </span>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = item.images[currentImageIndex];
                link.download = `${item.title}-image-${currentImageIndex + 1}`;
                link.click();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Download size={16} />
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal GeographicSearchSystem
const GeographicSearchSystem = ({ user, onClose }) => {
  // États principaux
  const [searchType, setSearchType] = useState('parcels');
  const [searchMode, setSearchMode] = useState('around');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchRadius, setSearchRadius] = useState(50);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityResults, setShowCityResults] = useState(false);
  
  // États pour les nouvelles fonctionnalités
  const [favorites, setFavorites] = useState(new Set());
  const [showContactModal, setShowContactModal] = useState(null);
  const [showImagesModal, setShowImagesModal] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedCityData, setSelectedCityData] = useState(null); 

  // États des filtres
  const [filters, setFilters] = useState({
    maxDistance: 100,
    minPrice: 0,
    maxPrice: 1000,
    urgency: 'all',
    category: 'all',
    verified: false,
    insurance: false,
    dateFrom: '',
    dateTo: '',
    minRating: 0
  });

  const searchInputRef = useRef(null);

  // Géolocalisation de l'utilisateur
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setUserLocation({
            lat: 45.7640,
            lng: 4.8357,
            accuracy: 10000
          });
        }
      );
    }
  }, []);

  // Recherche automatique de villes - CORRIGÉE pour utiliser l'API GeoNames
const handleCitySearch = async (value) => {
  setSearchQuery(value);
  
  if (value.length < 2) {
    setFilteredCities([]);
    setShowCityResults(false);
    return;
  }

  console.log('🔍 Recherche GeoNames pour:', value);

  try {
    const response = await fetch(`${API_URL}/cities/search?q=${encodeURIComponent(value)}&limit=8`);
    console.log('📥 Statut réponse:', response.status);
    
    const data = await response.json();
    console.log('📄 Données reçues:', data);

    if (data.success && data.cities && Array.isArray(data.cities)) {
      // Format de votre backend cities.js
      const formattedCities = data.cities.map(city => ({
        name: city.name,
        country: city.country,
        region: city.region,
        coords: [city.coordinates.lat, city.coordinates.lng],
        countryCode: city.countryCode
      }));
      console.log('✅ Villes formatées:', formattedCities);
      setFilteredCities(formattedCities);
      setShowCityResults(true);
    } else if (data.geonames && Array.isArray(data.geonames)) {
      // Format direct GeoNames (fallback)
      const formattedCities = data.geonames.map(city => ({
        name: city.name,
        country: city.countryName,
        region: city.adminName1,
        coords: [parseFloat(city.lat), parseFloat(city.lng)],
        countryCode: city.countryCode
      }));
      console.log('✅ Villes GeoNames directes:', formattedCities);
      setFilteredCities(formattedCities);
      setShowCityResults(true);
    } else {
  console.warn('⚠️ Aucune ville trouvée dans GeoNames');
  setFilteredCities([]);
  setShowCityResults(false);
}
} catch (error) {
console.error('❌ Erreur API cities:', error);
setFilteredCities([]);
setShowCityResults(false);
  }
};
// Sélection d'une ville
const selectCity = (city) => {
  setSelectedCity(city.name);
  setSearchQuery(city.name);
  setSelectedCityData(city); // Stocker toute la ville avec coordonnées
  setShowCityResults(false);
  setFilteredCities([]);
};

// Et ajoutez aussi cette fonction pour le calcul de distance :
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
  // Fonctions pour les favoris
  const toggleFavorite = async (itemId) => {
    try {
      if (favorites.has(itemId)) {
        // Retirer des favoris localement d'abord
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        
        try {
          await fetch(`${API_URL}/favorites/${itemId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          console.log('✅ Retiré des favoris');
        } catch (apiError) {
          console.warn('⚠️ API favoris non disponible, favoris géré localement');
        }
      } else {
        // Ajouter aux favoris localement d'abord
        setFavorites(prev => new Set([...prev, itemId]));
        
        try {
          await fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              itemId,
              itemType: searchType
            })
          });
          console.log('✅ Ajouté aux favoris');
        } catch (apiError) {
          console.warn('⚠️ API favoris non disponible, favoris géré localement');
        }
      }
    } catch (error) {
      console.error('❌ Erreur favoris:', error);
      // En cas d'erreur, on restaure l'état précédent
      if (favorites.has(itemId)) {
        setFavorites(prev => new Set([...prev, itemId]));
      } else {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    }
  };

  // Fonction pour contacter/proposer
  const handleContact = async (item, message) => {
    setContactLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverId: item.user.id,
          content: message,
          relatedItemId: item.id,
          itemType: searchType
        })
      });

      if (response.ok) {
        alert('Message envoyé avec succès !');
        setShowContactModal(null);
      } else if (response.status === 404) {
        alert('API de messages non disponible. Fonctionnalité en développement.');
        setShowContactModal(null);
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      alert('API de messages non disponible. Cette fonctionnalité sera bientôt disponible.');
      setShowContactModal(null);
    } finally {
      setContactLoading(false);
    }
  };

  // Recherche géographique
  const performSearch = async () => {
  setLoading(true);
  
  try {
    let baseLocation = null;
    
    if (searchMode === 'around' && userLocation) {
      baseLocation = { lat: userLocation.lat, lng: userLocation.lng };
   } else if (selectedCityData) {
  // Utiliser directement les coordonnées de la ville GeoNames sélectionnée
  baseLocation = { lat: selectedCityData.coords[0], lng: selectedCityData.coords[1] };
}

    if (!baseLocation) {
      alert('Veuillez sélectionner une ville ou activer la géolocalisation');
      setLoading(false);
      return;
    }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData = searchType === 'parcels' ? mockParcels : mockTrips;
      
      let filteredResults = mockData.filter(item => {
        let distance = 0;
        if (searchMode === 'around') {
          const distanceFrom = calculateDistance(
            baseLocation.lat, baseLocation.lng,
            item.from.coords[0], item.from.coords[1]
          );
          const distanceTo = calculateDistance(
            baseLocation.lat, baseLocation.lng,
            item.to.coords[0], item.to.coords[1]
          );
          distance = Math.min(distanceFrom, distanceTo);
        } else if (searchMode === 'from') {
          distance = calculateDistance(
            baseLocation.lat, baseLocation.lng,
            item.from.coords[0], item.from.coords[1]
          );
        } else if (searchMode === 'to') {
          distance = calculateDistance(
            baseLocation.lat, baseLocation.lng,
            item.to.coords[0], item.to.coords[1]
          );
        }

        if (distance > searchRadius) return false;

        if (searchType === 'parcels') {
          if (filters.category !== 'all' && item.category !== filters.category) return false;
          if (filters.urgency !== 'all' && item.urgency !== filters.urgency) return false;
          if (filters.maxPrice && item.maxPrice > filters.maxPrice) return false;
          if (filters.verified && !item.user.verified) return false;
          if (filters.insurance && !item.insurance) return false;
        } else {
          if (filters.maxPrice && item.pricePerKg > filters.maxPrice) return false;
          if (filters.verified && !item.user.verified) return false;
        }
        
        if (filters.minRating && item.user.rating < filters.minRating) return false;

        item.calculatedDistance = distance;
        return true;
      });

      filteredResults.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
      setResults(filteredResults);

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      maxDistance: 100,
      minPrice: 0,
      maxPrice: 1000,
      urgency: 'all',
      category: 'all',
      verified: false,
      insurance: false,
      dateFrom: '',
      dateTo: '',
      minRating: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">Recherche géographique</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userLocation && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Navigation className="w-4 h-4" />
                <span>Géolocalisé</span>
              </div>
            )}
          </div>
        </div>

        {/* Onglets Type de recherche */}
        <div className="flex bg-gray-100 rounded-lg p-1 mt-4 mb-4">
          <button
            onClick={() => setSearchType('parcels')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              searchType === 'parcels' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
            }`}
          >
            <Package className="w-4 h-4" />
            Colis à transporter
          </button>
          <button
            onClick={() => setSearchType('trips')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              searchType === 'trips' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
            }`}
          >
            <Plane className="w-4 h-4" />
            Voyages disponibles
          </button>
        </div>

        {/* Mode de recherche */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchMode('around')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              searchMode === 'around' 
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Target className="w-4 h-4" />
            Autour de moi
          </button>
          <button
            onClick={() => setSearchMode('from')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              searchMode === 'from'
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Au départ de
          </button>
          <button
            onClick={() => setSearchMode('to')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              searchMode === 'to'
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Route className="w-4 h-4" />
            À destination de
          </button>
        </div>

        {/* Champ de recherche de ville */}
        {searchMode !== 'around' && (
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleCitySearch(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setShowCityResults(true)}
                placeholder="Rechercher une ville..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            {/* Résultats autocomplete */}
            {showCityResults && filteredCities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => selectCity(city)}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <div className="font-medium">{city.name}</div>
                        <div className="text-sm text-gray-500">{city.region}, {city.country}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rayon de recherche et boutons */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Rayon:</label>
            <select 
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={200}>200 km</option>
              <option value={500}>500 km</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Sliders className="w-4 h-4" />
            Filtres
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={performSearch}
            disabled={loading || (searchMode !== 'around' && !selectedCity)}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Rechercher
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Prix maximum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {searchType === 'parcels' ? 'Budget max (€)' : 'Prix max /kg (€)'}
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>

            {/* Note minimale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note min.</label>
              <select 
                value={filters.minRating}
                onChange={(e) => setFilters({...filters, minRating: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>Toutes</option>
                <option value={3}>3+ ⭐</option>
                <option value={4}>4+ ⭐</option>
                <option value={4.5}>4.5+ ⭐</option>
              </select>
            </div>

            {/* Filtres spécifiques aux colis */}
            {searchType === 'parcels' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                  <select 
                    value={filters.urgency}
                    onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Toutes</option>
                    <option value="flexible">Flexible</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="express">Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select 
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Toutes</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Vêtements">Vêtements</option>
                    <option value="Livres">Livres</option>
                    <option value="Documents">Documents</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters({...filters, verified: e.target.checked})}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Utilisateurs vérifiés uniquement</span>
            </label>

            {searchType === 'parcels' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.insurance}
                  onChange={(e) => setFilters({...filters, insurance: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Avec assurance</span>
              </label>
            )}

            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Résultats */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
              <p className="text-gray-600">Recherche en cours...</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchMode === 'around' ? 'Autour de votre position' : `Depuis ${selectedCity}`}
              </p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
              <p className="text-gray-600 mb-4">
                Aucun {searchType === 'parcels' ? 'colis' : 'voyage'} trouvé dans cette zone.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Essayez d'augmenter le rayon de recherche</p>
                <p>• Modifiez vos filtres</p>
                <p>• Recherchez dans une autre ville</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {/* Header des résultats */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {results.length} {searchType === 'parcels' ? 'colis trouvés' : 'voyages trouvés'}
                </h2>
                <div className="text-sm text-gray-500">
                  {searchMode === 'around' && userLocation && 'Autour de votre position'}
                  {searchMode !== 'around' && selectedCity && `Depuis ${selectedCity}`}
                </div>
              </div>
            </div>

            {/* Liste des résultats */}
            <div className="p-4 space-y-4">
              {results.map((item) => (
                <div key={item.id}>
                  {searchType === 'parcels' ? (
                    <ParcelCard 
                      parcel={item} 
                      formatDate={formatDate}
                      isFavorite={favorites.has(item.id)}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                      onContact={() => setShowContactModal(item)}
                      onViewImages={() => setShowImagesModal(item)}
                    />
                  ) : (
                    <TripCard 
                      trip={item} 
                      formatDate={formatDate} 
                      formatTime={formatTime}
                      isFavorite={favorites.has(item.id)}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                      onContact={() => setShowContactModal(item)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de contact */}
      {showContactModal && (
        <ContactModal
          item={showContactModal}
          itemType={searchType}
          onSubmit={handleContact}
          onClose={() => setShowContactModal(null)}
          loading={contactLoading}
        />
      )}

      {/* Modal d'images */}
      {showImagesModal && (
        <ImagesModal
          item={showImagesModal}
          onClose={() => setShowImagesModal(null)}
        />
      )}
    </div>
  );
};

export default GeographicSearchSystem;